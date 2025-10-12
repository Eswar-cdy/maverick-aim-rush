/**
 * Real-time Social Features for Maverick Aim Rush
 * Handles WebSocket connections, live updates, and social interactions
 */

class SocialRealtimeManager {
    constructor() {
        this.websocket = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
        this.isConnected = false;
        this.heartbeatInterval = null;
        this.lastHeartbeat = Date.now();
        
        // Event handlers
        this.eventHandlers = {
            'social_data': this.handleSocialData.bind(this),
            'friend_activity': this.handleFriendActivity.bind(this),
            'challenge_update': this.handleChallengeUpdate.bind(this),
            'leaderboard_change': this.handleLeaderboardChange.bind(this),
            'achievement_unlock': this.handleAchievementUnlock.bind(this),
            'activity_liked': this.handleActivityLiked.bind(this),
            'activity_commented': this.handleActivityCommented.bind(this),
            'challenge_joined': this.handleChallengeJoined.bind(this),
            'error': this.handleError.bind(this)
        };
        
        this.init();
    }
    
    async init() {
        await this.setupWebSocket();
        this.setupEventListeners();
        this.startHeartbeat();
        this.loadInitialData();
    }
    
    async setupWebSocket() {
        try {
            // TEMPORARILY DISABLED: WebSocket connection
            console.log('WebSocket temporarily disabled for testing');
            this.updateConnectionStatus('disabled');
            return;
            
            // Get authentication token
            const token = this.getAuthToken();
            if (!token) {
                console.warn('No authentication token found, WebSocket connection will fail');
                this.updateConnectionStatus('disconnected');
                return;
            }
            
            // Create WebSocket connection with authentication
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            let wsUrl = `${protocol}//${window.location.host}/ws/social/`;
            
            // Add token to query string for authentication
            if (token) {
                wsUrl += `?token=${encodeURIComponent(token)}`;
            }
            
            console.log('Connecting to WebSocket with authentication...');
            this.updateConnectionStatus('connecting');
            
            this.websocket = new WebSocket(wsUrl);
            
            this.websocket.onopen = this.handleWebSocketOpen.bind(this);
            this.websocket.onmessage = this.handleWebSocketMessage.bind(this);
            this.websocket.onclose = this.handleWebSocketClose.bind(this);
            this.websocket.onerror = this.handleWebSocketError.bind(this);
            
        } catch (error) {
            console.error('Failed to setup WebSocket:', error);
            this.updateConnectionStatus('disconnected');
            this.showNotification('Connection failed', 'error');
        }
    }
    
    handleWebSocketOpen(event) {
        console.log('WebSocket connected');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.updateConnectionStatus('connected');
        this.showNotification('Connected to live updates', 'success');
    }
    
    handleWebSocketMessage(event) {
        try {
            const data = JSON.parse(event.data);
            const handler = this.eventHandlers[data.type];
            
            if (handler) {
                handler(data);
            } else {
                console.warn('Unknown message type:', data.type);
            }
            
            this.lastHeartbeat = Date.now();
        } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
        }
    }
    
    handleWebSocketClose(event) {
        console.log('WebSocket disconnected');
        this.isConnected = false;
        this.updateConnectionStatus('disconnected');
        
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect();
        } else {
            this.showNotification('Connection lost', 'error');
        }
    }
    
    handleWebSocketError(error) {
        console.error('WebSocket error:', error);
        this.updateConnectionStatus('disconnected');
        
        // Check if it's an authentication error
        const token = this.getAuthToken();
        if (!token) {
            this.showNotification('Please log in to enable real-time features', 'warning');
        } else {
            this.showNotification('Connection error - check your internet connection', 'error');
        }
    }
    
    scheduleReconnect() {
        this.reconnectAttempts++;
        const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
        
        console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
        
        setTimeout(() => {
            this.setupWebSocket();
        }, delay);
    }
    
    startHeartbeat() {
        this.heartbeatInterval = setInterval(() => {
            if (this.isConnected) {
                const timeSinceLastHeartbeat = Date.now() - this.lastHeartbeat;
                if (timeSinceLastHeartbeat > 30000) { // 30 seconds
                    console.warn('No heartbeat received, reconnecting...');
                    this.websocket.close();
                }
            }
        }, 10000); // Check every 10 seconds
    }
    
    // Event Handlers
    handleSocialData(data) {
        console.log('Received social data:', data);
        this.updateSocialDashboard(data.data);
    }
    
    handleFriendActivity(data) {
        console.log('Friend activity:', data);
        this.addActivityToFeed(data.data);
        this.showNotification(`${data.data.username} completed a workout!`, 'info');
    }
    
    handleChallengeUpdate(data) {
        console.log('Challenge update:', data);
        this.updateChallengeProgress(data.data);
        this.showNotification('Challenge progress updated!', 'info');
    }
    
    handleLeaderboardChange(data) {
        console.log('Leaderboard change:', data);
        this.updateLeaderboard(data.data);
        this.showNotification('Leaderboard updated!', 'info');
    }
    
    handleAchievementUnlock(data) {
        console.log('Achievement unlocked:', data);
        this.showAchievementNotification(data.data);
    }
    
    handleActivityLiked(data) {
        console.log('Activity liked:', data);
        this.updateActivityLikes(data.data);
        this.showNotification(`${data.data.liked_by} liked your activity!`, 'success');
    }
    
    handleActivityCommented(data) {
        console.log('Activity commented:', data);
        this.addCommentToActivity(data.data);
        this.showNotification(`${data.data.commented_by} commented on your activity!`, 'info');
    }
    
    handleChallengeJoined(data) {
        console.log('Challenge joined:', data);
        this.updateChallengeList(data.data);
        this.showNotification(`You joined ${data.data.challenge_name}!`, 'success');
    }
    
    handleError(data) {
        console.error('WebSocket error:', data);
        this.showNotification(data.message || 'An error occurred', 'error');
    }
    
    // UI Update Methods
    updateSocialDashboard(data) {
        if (data.friends) {
            this.updateFriendsList(data.friends);
        }
        if (data.challenges) {
            this.updateChallengesList(data.challenges);
        }
        if (data.achievements) {
            this.updateAchievementsList(data.achievements);
        }
        if (data.community_stats) {
            this.updateCommunityStats(data.community_stats);
        }
    }
    
    updateFriendsList(friends) {
        const friendsContainer = document.getElementById('friends-list');
        if (!friendsContainer) return;
        
        friendsContainer.innerHTML = friends.map(friend => `
            <div class="friend-card bg-white rounded-lg p-4 shadow-sm border">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                        <span class="text-orange-600 font-semibold">${friend.username.charAt(0).toUpperCase()}</span>
                    </div>
                    <div>
                        <h3 class="font-semibold text-gray-900">${friend.username}</h3>
                        <p class="text-sm text-gray-500">${friend.status || 'Online'}</p>
                    </div>
                </div>
                <div class="mt-3 flex gap-2">
                    <button class="flex-1 bg-orange-50 text-orange-600 px-3 py-1.5 rounded-lg text-sm hover:bg-orange-100">
                        View Profile
                    </button>
                    <button class="flex-1 bg-gray-50 text-gray-600 px-3 py-1.5 rounded-lg text-sm hover:bg-gray-100">
                        Challenge
                    </button>
                </div>
            </div>
        `).join('');
    }
    
    updateChallengesList(challenges) {
        const challengesContainer = document.getElementById('challenges-list');
        if (!challengesContainer) return;
        
        challengesContainer.innerHTML = challenges.map(challenge => `
            <div class="challenge-card bg-white rounded-lg p-4 shadow-sm border">
                <div class="flex items-start justify-between mb-3">
                    <div>
                        <h3 class="font-semibold text-gray-900">${challenge.name}</h3>
                        <p class="text-sm text-gray-500">${challenge.description}</p>
                    </div>
                    <span class="px-2 py-1 bg-orange-100 text-orange-600 text-xs rounded-full">
                        ${challenge.participants || 0} participants
                    </span>
                </div>
                <div class="mb-3">
                    <div class="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Progress</span>
                        <span>${challenge.progress || 0}%</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-2">
                        <div class="bg-orange-600 h-2 rounded-full" style="width: ${challenge.progress || 0}%"></div>
                    </div>
                </div>
                <button class="w-full bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-500" 
                        onclick="socialManager.joinChallenge(${challenge.id})">
                    ${challenge.is_participant ? 'View Progress' : 'Join Challenge'}
                </button>
            </div>
        `).join('');
    }
    
    updateAchievementsList(achievements) {
        const achievementsContainer = document.getElementById('achievements-list');
        if (!achievementsContainer) return;
        
        achievementsContainer.innerHTML = achievements.map(achievement => `
            <div class="achievement-card bg-white rounded-lg p-4 shadow-sm border">
                <div class="flex items-center gap-3">
                    <div class="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                        <span class="text-orange-600 text-xl">🏆</span>
                    </div>
                    <div>
                        <h3 class="font-semibold text-gray-900">${achievement.name}</h3>
                        <p class="text-sm text-gray-500">${achievement.description}</p>
                    </div>
                </div>
                <div class="mt-3">
                    <span class="px-2 py-1 bg-green-100 text-green-600 text-xs rounded-full">
                        ${achievement.is_unlocked ? 'Unlocked' : 'Locked'}
                    </span>
                </div>
            </div>
        `).join('');
    }
    
    updateCommunityStats(stats) {
        const statsContainer = document.getElementById('community-stats');
        if (!statsContainer) return;
        
        statsContainer.innerHTML = `
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div class="bg-white rounded-lg p-4 text-center shadow-sm border">
                    <div class="text-2xl font-bold text-orange-600">${stats.total_users || 0}</div>
                    <div class="text-sm text-gray-500">Total Users</div>
                </div>
                <div class="bg-white rounded-lg p-4 text-center shadow-sm border">
                    <div class="text-2xl font-bold text-orange-600">${stats.active_challenges || 0}</div>
                    <div class="text-sm text-gray-500">Active Challenges</div>
                </div>
                <div class="bg-white rounded-lg p-4 text-center shadow-sm border">
                    <div class="text-2xl font-bold text-orange-600">${stats.workouts_today || 0}</div>
                    <div class="text-sm text-gray-500">Workouts Today</div>
                </div>
                <div class="bg-white rounded-lg p-4 text-center shadow-sm border">
                    <div class="text-2xl font-bold text-orange-600">${stats.total_achievements || 0}</div>
                    <div class="text-sm text-gray-500">Achievements</div>
                </div>
            </div>
        `;
    }
    
    addActivityToFeed(activity) {
        const feedContainer = document.getElementById('activity-feed');
        if (!feedContainer) return;
        
        const activityElement = document.createElement('div');
        activityElement.className = 'activity-item bg-white rounded-lg p-4 shadow-sm border mb-4';
        activityElement.innerHTML = `
            <div class="flex items-start gap-3">
                <div class="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                    <span class="text-orange-600 font-semibold">${activity.username.charAt(0).toUpperCase()}</span>
                </div>
                <div class="flex-1">
                    <div class="flex items-center gap-2 mb-1">
                        <span class="font-semibold text-gray-900">${activity.username}</span>
                        <span class="text-sm text-gray-500">${this.formatTimeAgo(activity.timestamp)}</span>
                    </div>
                    <p class="text-gray-700">${activity.description}</p>
                    <div class="flex items-center gap-4 mt-3">
                        <button class="flex items-center gap-1 text-gray-500 hover:text-orange-600" 
                                onclick="socialManager.likeActivity(${activity.id})">
                            <span>👍</span>
                            <span class="text-sm">${activity.likes || 0}</span>
                        </button>
                        <button class="flex items-center gap-1 text-gray-500 hover:text-orange-600" 
                                onclick="socialManager.commentActivity(${activity.id})">
                            <span>💬</span>
                            <span class="text-sm">${activity.comments || 0}</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        feedContainer.insertBefore(activityElement, feedContainer.firstChild);
    }
    
    updateActivityLikes(data) {
        const activityElement = document.querySelector(`[data-activity-id="${data.activity_id}"]`);
        if (activityElement) {
            const likesElement = activityElement.querySelector('.likes-count');
            if (likesElement) {
                const currentLikes = parseInt(likesElement.textContent) || 0;
                likesElement.textContent = currentLikes + 1;
            }
        }
    }
    
    addCommentToActivity(data) {
        const activityElement = document.querySelector(`[data-activity-id="${data.activity_id}"]`);
        if (activityElement) {
            const commentsContainer = activityElement.querySelector('.comments-container');
            if (commentsContainer) {
                const commentElement = document.createElement('div');
                commentElement.className = 'comment bg-gray-50 rounded-lg p-3 mt-2';
                commentElement.innerHTML = `
                    <div class="flex items-center gap-2 mb-1">
                        <span class="font-semibold text-gray-900">${data.commented_by}</span>
                        <span class="text-sm text-gray-500">${this.formatTimeAgo(data.timestamp)}</span>
                    </div>
                    <p class="text-gray-700">${data.comment}</p>
                `;
                commentsContainer.appendChild(commentElement);
            }
        }
    }
    
    showAchievementNotification(achievement) {
        const notification = document.createElement('div');
        notification.className = 'achievement-notification fixed top-4 right-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4 rounded-lg shadow-lg z-50';
        notification.innerHTML = `
            <div class="flex items-center gap-3">
                <div class="text-2xl">🏆</div>
                <div>
                    <div class="font-semibold">Achievement Unlocked!</div>
                    <div class="text-sm opacity-90">${achievement.name}</div>
                </div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }
    
    // Action Methods
    async likeActivity(activityId) {
        if (!this.isConnected) {
            this.showNotification('Not connected to server', 'error');
            return;
        }
        
        this.sendMessage({
            type: 'like_activity',
            activity_id: activityId
        });
    }
    
    async commentActivity(activityId) {
        const comment = prompt('Enter your comment:');
        if (!comment) return;
        
        if (!this.isConnected) {
            this.showNotification('Not connected to server', 'error');
            return;
        }
        
        this.sendMessage({
            type: 'comment_activity',
            activity_id: activityId,
            comment: comment
        });
    }
    
    async joinChallenge(challengeId) {
        if (!this.isConnected) {
            this.showNotification('Not connected to server', 'error');
            return;
        }
        
        this.sendMessage({
            type: 'join_challenge',
            challenge_id: challengeId
        });
    }
    
    // Utility Methods
    sendMessage(message) {
        if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
            this.websocket.send(JSON.stringify(message));
            return true;
        } else {
            console.warn('WebSocket not connected, cannot send message');
            
            // Check if user is authenticated
            const token = this.getAuthToken();
            if (!token) {
                this.showNotification('Please log in to use real-time features', 'warning');
            } else {
                this.showNotification('Connection lost, attempting to reconnect...', 'warning');
                this.setupWebSocket(); // Try to reconnect
            }
            return false;
        }
    }
    
    getAuthToken() {
        // Try to get token from cookies or localStorage
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
            const [name, value] = cookie.trim().split('=');
            if (name === 'access_token') {
                return value;
            }
        }
        
        // Fallback to localStorage
        return localStorage.getItem('access_token');
    }
    
    updateConnectionStatus(status) {
        const statusElement = document.getElementById('connection-status');
        if (statusElement) {
            statusElement.className = `connection-status ${status}`;
            statusElement.textContent = status === 'connected' ? '🟢 Connected' : '🔴 Disconnected';
        }
    }
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification fixed top-4 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-lg shadow-lg z-50 ${
            type === 'error' ? 'bg-red-500 text-white' :
            type === 'success' ? 'bg-green-500 text-white' :
            type === 'info' ? 'bg-blue-500 text-white' :
            'bg-gray-500 text-white'
        }`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
    
    formatTimeAgo(timestamp) {
        const now = new Date();
        const time = new Date(timestamp);
        const diffInSeconds = Math.floor((now - time) / 1000);
        
        if (diffInSeconds < 60) return 'just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        return `${Math.floor(diffInSeconds / 86400)}d ago`;
    }
    
    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.social-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const section = e.target.dataset.section;
                this.switchTab(section);
            });
        });
        
        // Request updates button
        const refreshBtn = document.getElementById('refresh-social');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.sendMessage({ type: 'request_update' });
            });
        }
    }
    
    switchTab(section) {
        // Update tab states
        document.querySelectorAll('.social-tab').forEach(tab => {
            tab.dataset.active = tab.dataset.section === section;
        });
        
        // Show/hide sections
        document.querySelectorAll('.social-section').forEach(sectionEl => {
            sectionEl.style.display = sectionEl.id === section ? 'block' : 'none';
        });
    }
    
    async loadInitialData() {
        try {
            const response = await fetch('/api/v1/social/');
            if (response.ok) {
                const data = await response.json();
                this.updateSocialDashboard(data);
            }
        } catch (error) {
            console.error('Failed to load initial social data:', error);
        }
    }
    
    destroy() {
        if (this.websocket) {
            this.websocket.close();
        }
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.socialManager = new SocialRealtimeManager();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.socialManager) {
        window.socialManager.destroy();
    }
});
