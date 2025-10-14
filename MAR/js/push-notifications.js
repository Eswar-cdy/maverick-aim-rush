/**
 * Push Notifications Manager for Maverick Aim Rush
 * Handles subscription, preferences, and notification display
 */

class PushNotificationManager {
    constructor() {
        this.isSupported = 'serviceWorker' in navigator && 'PushManager' in window;
        this.registration = null;
        this.subscription = null;
        this.vapidPublicKey = null;
        
        this.init();
    }
    
    async init() {
        if (!this.isSupported) {
            console.log('Push notifications not supported');
            return;
        }
        
        try {
            // Get VAPID public key
            await this.getVapidPublicKey();
            
            // Register service worker
            await this.registerServiceWorker();
            
            // Check existing subscription
            await this.checkExistingSubscription();
            
            // Set up notification click handlers
            this.setupNotificationHandlers();
            
            console.log('Push notification manager initialized');
        } catch (error) {
            console.error('Failed to initialize push notifications:', error);
        }
    }
    
    async getVapidPublicKey() {
        try {
            const response = await fetch('http://localhost:8000/api/v1/notifications/vapid-key/');
            const data = await response.json();
            this.vapidPublicKey = data.vapid_public_key;
        } catch (error) {
            console.error('Failed to get VAPID key:', error);
        }
    }
    
    async registerServiceWorker() {
        try {
            this.registration = await navigator.serviceWorker.register('/sw.js');
            console.log('Service worker registered:', this.registration);
        } catch (error) {
            console.error('Service worker registration failed:', error);
        }
    }
    
    async checkExistingSubscription() {
        try {
            this.subscription = await this.registration.pushManager.getSubscription();
            
            if (this.subscription) {
                console.log('Existing subscription found');
                this.updateSubscriptionStatus(true);
            } else {
                console.log('No existing subscription');
                this.updateSubscriptionStatus(false);
            }
        } catch (error) {
            console.error('Failed to check subscription:', error);
        }
    }
    
    async subscribe() {
        if (!this.isSupported) {
            this.showNotification('Push notifications not supported in this browser', 'error');
            return false;
        }
        
        try {
            // Request notification permission
            const permission = await Notification.requestPermission();
            
            if (permission !== 'granted') {
                this.showNotification('Notification permission denied', 'error');
                return false;
            }
            
            // Create push subscription
            this.subscription = await this.registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey)
            });
            
            // Send subscription to server
            const success = await this.sendSubscriptionToServer(this.subscription);
            
            if (success) {
                this.updateSubscriptionStatus(true);
                this.showNotification('Successfully subscribed to notifications!', 'success');
                return true;
            } else {
                this.showNotification('Failed to subscribe to notifications', 'error');
                return false;
            }
            
        } catch (error) {
            console.error('Subscription failed:', error);
            this.showNotification('Failed to subscribe to notifications', 'error');
            return false;
        }
    }
    
    async unsubscribe() {
        try {
            if (this.subscription) {
                await this.subscription.unsubscribe();
                
                // Notify server
                await this.removeSubscriptionFromServer(this.subscription);
                
                this.subscription = null;
                this.updateSubscriptionStatus(false);
                this.showNotification('Unsubscribed from notifications', 'info');
                return true;
            }
        } catch (error) {
            console.error('Unsubscription failed:', error);
            this.showNotification('Failed to unsubscribe from notifications', 'error');
            return false;
        }
    }
    
    async sendSubscriptionToServer(subscription) {
        try {
            const response = await fetch('/api/v1/notifications/subscribe/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAccessToken()}`
                },
                body: JSON.stringify({
                    endpoint: subscription.endpoint,
                    p256dh_key: this.arrayBufferToBase64(subscription.getKey('p256dh')),
                    auth_key: this.arrayBufferToBase64(subscription.getKey('auth')),
                    device_type: this.getDeviceType()
                })
            });
            
            return response.ok;
        } catch (error) {
            console.error('Failed to send subscription to server:', error);
            return false;
        }
    }
    
    async removeSubscriptionFromServer(subscription) {
        try {
            await fetch('/api/v1/notifications/unsubscribe/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAccessToken()}`
                },
                body: JSON.stringify({
                    endpoint: subscription.endpoint
                })
            });
        } catch (error) {
            console.error('Failed to remove subscription from server:', error);
        }
    }
    
    updateSubscriptionStatus(isSubscribed) {
        const button = document.getElementById('notification-toggle');
        if (button) {
            button.textContent = isSubscribed ? '🔔 Notifications On' : '🔕 Notifications Off';
            button.className = isSubscribed ? 'btn btn-success' : 'btn btn-secondary';
        }
        
        // Update notification settings
        const settings = document.getElementById('notification-settings');
        if (settings) {
            settings.style.display = isSubscribed ? 'block' : 'none';
        }
    }
    
    setupNotificationHandlers() {
        // Handle notification clicks
        self.addEventListener('notificationclick', (event) => {
            event.notification.close();
            
            const data = event.notification.data;
            const action = event.action;
            
            if (action === 'view' || !action) {
                // Open the app
                event.waitUntil(
                    clients.openWindow('/MAR/index.html')
                );
            } else if (action === 'accept') {
                // Handle friend request acceptance
                this.handleFriendRequest(data, true);
            } else if (action === 'decline') {
                // Handle friend request decline
                this.handleFriendRequest(data, false);
            } else if (action === 'cheer') {
                // Handle cheering friend
                this.handleCheerFriend(data);
            }
        });
        
        // Handle notification close
        self.addEventListener('notificationclose', (event) => {
            console.log('Notification closed:', event.notification.tag);
        });
    }
    
    async handleFriendRequest(data, accept) {
        try {
            const response = await fetch(`/api/v1/social/friend-request/${data.from_user_id}/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAccessToken()}`
                },
                body: JSON.stringify({
                    action: accept ? 'accept' : 'decline'
                })
            });
            
            if (response.ok) {
                this.showNotification(
                    accept ? 'Friend request accepted!' : 'Friend request declined',
                    'success'
                );
            }
        } catch (error) {
            console.error('Failed to handle friend request:', error);
        }
    }
    
    async handleCheerFriend(data) {
        try {
            const response = await fetch(`/api/v1/social/cheer/${data.activity_id}/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.getAccessToken()}`
                }
            });
            
            if (response.ok) {
                this.showNotification('Cheered for your friend!', 'success');
            }
        } catch (error) {
            console.error('Failed to cheer friend:', error);
        }
    }
    
    async getNotificationPreferences() {
        try {
            const response = await fetch('/api/v1/notifications/preferences/', {
                headers: {
                    'Authorization': `Bearer ${this.getAccessToken()}`
                }
            });
            
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.error('Failed to get notification preferences:', error);
        }
        return null;
    }
    
    async updateNotificationPreferences(preferences) {
        try {
            const response = await fetch('/api/v1/notifications/preferences/', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAccessToken()}`
                },
                body: JSON.stringify(preferences)
            });
            
            return response.ok;
        } catch (error) {
            console.error('Failed to update notification preferences:', error);
            return false;
        }
    }
    
    async getNotificationHistory() {
        try {
            const response = await fetch('/api/v1/notifications/history/', {
                headers: {
                    'Authorization': `Bearer ${this.getAccessToken()}`
                }
            });
            
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.error('Failed to get notification history:', error);
        }
        return [];
    }
    
    async getNotificationStats() {
        try {
            const response = await fetch('/api/v1/notifications/stats/', {
                headers: {
                    'Authorization': `Bearer ${this.getAccessToken()}`
                }
            });
            
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.error('Failed to get notification stats:', error);
        }
        return null;
    }
    
    async sendTestNotification() {
        try {
            const response = await fetch('/api/v1/notifications/test/', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.getAccessToken()}`
                }
            });
            
            if (response.ok) {
                this.showNotification('Test notification sent!', 'success');
            } else {
                this.showNotification('Failed to send test notification', 'error');
            }
        } catch (error) {
            console.error('Failed to send test notification:', error);
            this.showNotification('Failed to send test notification', 'error');
        }
    }
    
    showNotification(message, type = 'info') {
        if (window.modernComponents) {
            window.modernComponents.showNotification(message, type);
        } else {
            // Fallback notification
            alert(message);
        }
    }
    
    getAccessToken() {
        return localStorage.getItem('access_token');
    }
    
    getDeviceType() {
        const userAgent = navigator.userAgent;
        if (/Mobile|Android|iPhone|iPad/.test(userAgent)) {
            return 'mobile';
        } else if (/Tablet|iPad/.test(userAgent)) {
            return 'tablet';
        } else {
            return 'desktop';
        }
    }
    
    urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/-/g, '+')
            .replace(/_/g, '/');
        
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }
    
    arrayBufferToBase64(buffer) {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    }
}

// Initialize push notification manager
document.addEventListener('DOMContentLoaded', () => {
    window.pushNotificationManager = new PushNotificationManager();
});
