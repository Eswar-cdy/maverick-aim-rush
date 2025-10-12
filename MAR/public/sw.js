/**
 * Service Worker for Fitness Tracker
 * Handles background sync and caching
 */

const CACHE_NAME = 'fitness-tracker-v1';
const OFFLINE_QUEUE_SYNC = 'offline-queue-sync';

// Files to cache
const CACHE_URLS = [
    '/',
    '/index.html',
    '/about.html',
    '/contact.html',
    '/css/style.css',
    '/css/reset.css',
    '/js/script.js',
    '/js/api.js',
    '/js/workout.js',
    '/js/progress.js',
    '/js/websocket-client.js',
    '/js/offline-queue.js',
    '/Images/favicon.png'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
    console.log('Service Worker installing...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Caching app shell');
                return cache.addAll(CACHE_URLS);
            })
            .then(() => {
                console.log('Service Worker installed');
                return self.skipWaiting();
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('Service Worker activating...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME) {
                            console.log('Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('Service Worker activated');
                return self.clients.claim();
            })
    );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') {
        return;
    }
    
    // Skip API requests (let them fail for offline queue)
    if (event.request.url.includes('/api/')) {
        return;
    }
    
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Return cached version or fetch from network
                return response || fetch(event.request)
                    .then((fetchResponse) => {
                        // Cache successful responses
                        if (fetchResponse.status === 200) {
                            const responseClone = fetchResponse.clone();
                            caches.open(CACHE_NAME)
                                .then((cache) => {
                                    cache.put(event.request, responseClone);
                                });
                        }
                        return fetchResponse;
                    })
                    .catch(() => {
                        // Return offline page for navigation requests
                        if (event.request.destination === 'document') {
                            return caches.match('/index.html');
                        }
                    });
            })
    );
});

// Background sync event
self.addEventListener('sync', (event) => {
    console.log('Background sync event:', event.tag);
    
    if (event.tag === OFFLINE_QUEUE_SYNC) {
        event.waitUntil(syncOfflineQueue());
    }
});

// Sync offline queue
async function syncOfflineQueue() {
    try {
        console.log('Syncing offline queue...');
        
        // Notify all clients to flush their queues
        const clients = await self.clients.matchAll();
        clients.forEach((client) => {
            client.postMessage({
                type: 'SYNC_QUEUE'
            });
        });
        
        console.log('Offline queue sync completed');
    } catch (error) {
        console.error('Error syncing offline queue:', error);
    }
}

// Message event - handle messages from main thread
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'REGISTER_SYNC') {
        // Register background sync
        self.registration.sync.register(OFFLINE_QUEUE_SYNC)
            .then(() => {
                console.log('Background sync registered');
            })
            .catch((error) => {
                console.error('Failed to register background sync:', error);
            });
    }
});

// Push event - handle push notifications (for future use)
self.addEventListener('push', (event) => {
    if (event.data) {
        const data = event.data.json();
        
        const options = {
            body: data.body,
            icon: '/Images/favicon.png',
            badge: '/Images/favicon.png',
            vibrate: [100, 50, 100],
            data: {
                dateOfArrival: Date.now(),
                primaryKey: data.primaryKey
            },
            actions: [
                {
                    action: 'explore',
                    title: 'View Details',
                    icon: '/Images/favicon.png'
                },
                {
                    action: 'close',
                    title: 'Close',
                    icon: '/Images/favicon.png'
                }
            ]
        };
        
        event.waitUntil(
            self.registration.showNotification(data.title, options)
        );
    }
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    if (event.action === 'explore') {
        // Open the app
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});
