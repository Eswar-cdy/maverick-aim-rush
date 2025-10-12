/**
 * Service Worker for Maverick Aim Rush PWA
 * Provides offline functionality and caching
 */

const CACHE_NAME = 'maverick-aim-rush-v1';
const STATIC_CACHE = 'maverick-static-v1';
const DYNAMIC_CACHE = 'maverick-dynamic-v1';

// Files to cache for offline functionality
const STATIC_FILES = [
    '/MAR/index.html',
    '/MAR/social.html',
    '/MAR/gamification.html',
    '/MAR/about.html',
    '/MAR/services.html',
    '/MAR/contact.html',
    '/MAR/css/uno.css',
    '/MAR/css/modern-components.css',
    '/MAR/js/api.js',
    '/MAR/js/social-realtime.js',
    '/MAR/js/gamification.js',
    '/MAR/js/modern-components.js',
    '/MAR/Images/LOGO.png',
    '/MAR/Images/favicon.png',
    '/MAR/manifest.json'
];

// API endpoints to cache
const API_CACHE_PATTERNS = [
    /\/api\/v1\/gamification\/dashboard\/$/,
    /\/api\/v1\/gamification\/badges\/$/,
    /\/api\/v1\/gamification\/quests\/$/,
    /\/api\/v1\/social\/$/
];

// Install event - cache static files
self.addEventListener('install', (event) => {
    console.log('Service Worker installing...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => {
                console.log('Caching static files...');
                return cache.addAll(STATIC_FILES);
            })
            .then(() => {
                console.log('Static files cached successfully');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('Failed to cache static files:', error);
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
                        if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
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

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }
    
    // Handle different types of requests
    if (isStaticFile(request.url)) {
        event.respondWith(handleStaticFile(request));
    } else if (isApiRequest(request.url)) {
        event.respondWith(handleApiRequest(request));
    } else if (isHtmlRequest(request)) {
        event.respondWith(handleHtmlRequest(request));
    } else {
        event.respondWith(handleOtherRequest(request));
    }
});

// Handle static files (CSS, JS, images)
async function handleStaticFile(request) {
    try {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(STATIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        console.error('Failed to handle static file:', error);
        return new Response('Offline - Static file not available', { status: 503 });
    }
}

// Handle API requests
async function handleApiRequest(request) {
    try {
        // Try network first for API requests
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.log('Network failed, trying cache for API request:', request.url);
        
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Return offline response for API requests
        return new Response(
            JSON.stringify({ 
                error: 'Offline', 
                message: 'You are offline. Please check your connection.' 
            }),
            { 
                status: 503,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
}

// Handle HTML requests
async function handleHtmlRequest(request) {
    try {
        const networkResponse = await fetch(request);
        return networkResponse;
    } catch (error) {
        console.log('Network failed, serving offline page');
        
        // Serve offline page
        const offlineResponse = await caches.match('/MAR/index.html');
        if (offlineResponse) {
            return offlineResponse;
        }
        
        return new Response(
            `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Offline - Maverick Aim Rush</title>
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body { 
                        font-family: Arial, sans-serif; 
                        text-align: center; 
                        padding: 50px; 
                        background: #f5f5f5;
                    }
                    .offline-container {
                        max-width: 400px;
                        margin: 0 auto;
                        background: white;
                        padding: 40px;
                        border-radius: 10px;
                        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    }
                    .offline-icon {
                        font-size: 48px;
                        margin-bottom: 20px;
                    }
                    h1 { color: #ff6b35; margin-bottom: 20px; }
                    p { color: #666; margin-bottom: 30px; }
                    .retry-btn {
                        background: #ff6b35;
                        color: white;
                        border: none;
                        padding: 12px 24px;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 16px;
                    }
                    .retry-btn:hover { background: #e55a2b; }
                </style>
            </head>
            <body>
                <div class="offline-container">
                    <div class="offline-icon">📱</div>
                    <h1>You're Offline</h1>
                    <p>Maverick Aim Rush is not available offline. Please check your internet connection and try again.</p>
                    <button class="retry-btn" onclick="window.location.reload()">Retry</button>
                </div>
            </body>
            </html>
            `,
            { 
                status: 200,
                headers: { 'Content-Type': 'text/html' }
            }
        );
    }
}

// Handle other requests
async function handleOtherRequest(request) {
    try {
        return await fetch(request);
    } catch (error) {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        return new Response('Offline', { status: 503 });
    }
}

// Helper functions
function isStaticFile(url) {
    return url.includes('/css/') || 
           url.includes('/js/') || 
           url.includes('/Images/') ||
           url.includes('/fonts/') ||
           url.endsWith('.png') ||
           url.endsWith('.jpg') ||
           url.endsWith('.jpeg') ||
           url.endsWith('.gif') ||
           url.endsWith('.svg') ||
           url.endsWith('.ico');
}

function isApiRequest(url) {
    return url.includes('/api/') || API_CACHE_PATTERNS.some(pattern => pattern.test(url));
}

function isHtmlRequest(request) {
    return request.headers.get('accept')?.includes('text/html');
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
    console.log('Background sync triggered:', event.tag);
    
    if (event.tag === 'background-sync') {
        event.waitUntil(doBackgroundSync());
    }
});

async function doBackgroundSync() {
    try {
        // Sync offline data when connection is restored
        console.log('Performing background sync...');
        
        // Get offline actions from IndexedDB
        const offlineActions = await getOfflineActions();
        
        for (const action of offlineActions) {
            try {
                await fetch(action.url, {
                    method: action.method,
                    headers: action.headers,
                    body: action.body
                });
                
                // Remove successful action
                await removeOfflineAction(action.id);
            } catch (error) {
                console.error('Failed to sync action:', error);
            }
        }
        
        console.log('Background sync completed');
    } catch (error) {
        console.error('Background sync failed:', error);
    }
}

// Push notifications
self.addEventListener('push', (event) => {
    console.log('Push notification received:', event);
    
    const options = {
        body: event.data ? event.data.text() : 'New notification from Maverick Aim Rush',
        icon: '/MAR/Images/favicon.png',
        badge: '/MAR/Images/favicon.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'explore',
                title: 'View',
                icon: '/MAR/Images/favicon.png'
            },
            {
                action: 'close',
                title: 'Close',
                icon: '/MAR/Images/favicon.png'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification('Maverick Aim Rush', options)
    );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
    console.log('Notification clicked:', event);
    
    event.notification.close();
    
    if (event.action === 'explore') {
        event.waitUntil(
            clients.openWindow('/MAR/index.html')
        );
    }
});

// Helper functions for offline actions (would need IndexedDB implementation)
async function getOfflineActions() {
    // Implementation would use IndexedDB to get stored offline actions
    return [];
}

async function removeOfflineAction(id) {
    // Implementation would use IndexedDB to remove completed actions
    return;
}