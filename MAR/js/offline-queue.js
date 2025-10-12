/**
 * Offline Queue Manager using IndexedDB
 * Queues POST/DELETE requests when offline and syncs when online
 */

class OfflineQueue {
    constructor() {
        this.dbName = 'FitnessTrackerOfflineQueue';
        this.dbVersion = 1;
        this.storeName = 'requests';
        this.db = null;
        this.isOnline = navigator.onLine;
        this.syncInProgress = false;
        
        this.init();
        this.setupEventListeners();
    }
    
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Create object store for queued requests
                if (!db.objectStoreNames.contains(this.storeName)) {
                    const store = db.createObjectStore(this.storeName, { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                    
                    // Index by timestamp for ordering
                    store.createIndex('timestamp', 'timestamp', { unique: false });
                    store.createIndex('method', 'method', { unique: false });
                    store.createIndex('url', 'url', { unique: false });
                }
            };
        });
    }
    
    setupEventListeners() {
        // Listen for online/offline events
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.flushQueue();
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
        });
        
        // Listen for service worker sync events
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('message', (event) => {
                if (event.data && event.data.type === 'SYNC_QUEUE') {
                    this.flushQueue();
                }
            });
        }
    }
    
    async queueRequest(method, url, data, headers = {}) {
        if (!this.db) {
            await this.init();
        }
        
        const request = {
            method: method.toUpperCase(),
            url: url,
            data: data,
            headers: headers,
            timestamp: Date.now(),
            retryCount: 0,
            maxRetries: 3
        };
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const addRequest = store.add(request);
            
            addRequest.onsuccess = () => {
                console.log(`Queued ${method} request to ${url}`);
                
                // Try to sync immediately if online
                if (this.isOnline) {
                    this.flushQueue();
                }
                
                resolve(addRequest.result);
            };
            
            addRequest.onerror = () => reject(addRequest.error);
        });
    }
    
    async flushQueue() {
        if (!this.db || this.syncInProgress || !this.isOnline) {
            return;
        }
        
        this.syncInProgress = true;
        
        try {
            const requests = await this.getQueuedRequests();
            
            for (const request of requests) {
                try {
                    await this.processRequest(request);
                    await this.removeRequest(request.id);
                } catch (error) {
                    console.error(`Failed to process queued request:`, error);
                    
                    // Increment retry count
                    request.retryCount++;
                    
                    if (request.retryCount >= request.maxRetries) {
                        console.error(`Max retries exceeded for request ${request.id}, removing from queue`);
                        await this.removeRequest(request.id);
                    } else {
                        // Update retry count in database
                        await this.updateRequest(request);
                    }
                }
            }
        } catch (error) {
            console.error('Error flushing queue:', error);
        } finally {
            this.syncInProgress = false;
        }
    }
    
    async getQueuedRequests() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const index = store.index('timestamp');
            const request = index.getAll();
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
    
    async processRequest(request) {
        const fetchOptions = {
            method: request.method,
            headers: {
                'Content-Type': 'application/json',
                ...request.headers
            }
        };
        
        // Add idempotency key for write operations
        if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
            fetchOptions.headers['Idempotency-Key'] = request.id;
        }
        
        if (request.data && (request.method === 'POST' || request.method === 'PUT' || request.method === 'PATCH')) {
            fetchOptions.body = JSON.stringify(request.data);
        }
        
        const response = await fetch(request.url, fetchOptions);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return response;
    }
    
    async removeRequest(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const deleteRequest = store.delete(id);
            
            deleteRequest.onsuccess = () => resolve();
            deleteRequest.onerror = () => reject(deleteRequest.error);
        });
    }
    
    async updateRequest(request) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const updateRequest = store.put(request);
            
            updateRequest.onsuccess = () => resolve();
            updateRequest.onerror = () => reject(updateRequest.error);
        });
    }
    
    async getQueueSize() {
        if (!this.db) return 0;
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const countRequest = store.count();
            
            countRequest.onsuccess = () => resolve(countRequest.result);
            countRequest.onerror = () => reject(countRequest.error);
        });
    }
    
    async clearQueue() {
        if (!this.db) return;
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const clearRequest = store.clear();
            
            clearRequest.onsuccess = () => resolve();
            clearRequest.onerror = () => reject(clearRequest.error);
        });
    }
}

// Global instance
window.offlineQueue = new OfflineQueue();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OfflineQueue;
}
