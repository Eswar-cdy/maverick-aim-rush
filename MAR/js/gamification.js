/**
 * Gamification System for Maverick Aim Rush
 * Handles XP, levels, badges, daily quests, and leaderboards
 */

class GamificationManager {
    constructor() {
        this.userStats = null;
        this.dailyQuests = [];
        this.badges = [];
        this.leaderboard = [];
        this.isInitialized = false;
        
        this.init();
    }
    
    async init() {
        await this.loadGamificationData();
        this.setupEventListeners();
        this.startPeriodicUpdates();
        this.isInitialized = true;
    }
    
    async loadGamificationData() {
        try {
            // Load dashboard data
            const dashboardResponse = await fetch('/api/v1/gamification/dashboard/');
            if (dashboardResponse.ok) {
                const dashboardData = await dashboardResponse.json();
                this.userStats = dashboardData;
                this.updateDashboard(dashboardData);
            }
            
            // Load badges
            const badgesResponse = await fetch('/api/v1/gamification/badges/');
            if (badgesResponse.ok) {
                const badgesData = await badgesResponse.json();
                this.badges = badgesData;
                this.updateBadgesDisplay(badgesData);
            }
            
            // Load daily quests
            const questsResponse = await fetch('/api/v1/gamification/quests/');
            if (questsResponse.ok) {
                const questsData = await questsResponse.json();
                this.dailyQuests = questsData.quests;
                this.updateDailyQuests(questsData);
            }
            
            // Load leaderboard
            await this.loadLeaderboard();
            
        } catch (error) {
            console.error('Failed to load gamification data:', error);
            this.showNotification('Failed to load gamification data', 'error');
        }
    }
    
    async loadLeaderboard(type = 'xp') {
        try {
            const response = await fetch(`/api/v1/gamification/leaderboard/?type=${type}&limit=10`);
            if (response.ok) {
                const leaderboardData = await response.json();
                this.leaderboard = leaderboardData;
                this.updateLeaderboard(leaderboardData);
            }
        } catch (error) {
            console.error('Failed to load leaderboard:', error);
        }
    }
    
    updateDashboard(data) {
        // Update level and XP display
        this.updateElement('user-level', data.stats.level);
        this.updateElement('user-xp', data.stats.xp.toLocaleString());
        this.updateElement('xp-to-next', data.stats.xp_to_next_level.toLocaleString());
        
        // Update level progress bar
        const progressBar = document.getElementById('level-progress-bar');
        if (progressBar) {
            progressBar.style.width = `${data.stats.level_progress}%`;
        }
        
        // Update streak display
        this.updateElement('current-streak', data.stats.current_streak);
        this.updateElement('longest-streak', data.stats.longest_streak);
        
        // Update stats
        this.updateElement('total-workouts', data.stats.total_workouts);
        this.updateElement('total-challenges', data.stats.total_challenges);
        this.updateElement('total-achievements', data.stats.total_achievements);
        this.updateElement('earned-badges', data.stats.earned_badges);
        
        // Update rank
        this.updateElement('user-rank', data.stats.rank);
        this.updateElement('total-users', data.stats.total_users);
        
        // Update recent activities
        this.updateRecentActivities(data.recent_activities);
    }
    
    updateBadgesDisplay(data) {
        const earnedContainer = document.getElementById('earned-badges');
        const availableContainer = document.getElementById('available-badges');
        
        if (earnedContainer) {
            earnedContainer.innerHTML = data.earned_badges.map(badge => `
                <div class="badge-item earned" data-rarity="${badge.badge.rarity}">
                    <div class="badge-icon">${badge.badge.icon}</div>
                    <div class="badge-info">
                        <h4>${badge.badge.name}</h4>
                        <p>${badge.badge.description}</p>
                        <span class="badge-rarity ${badge.badge.rarity}">${badge.badge.rarity_display}</span>
                    </div>
                    <div class="badge-date">${this.formatDate(badge.earned_at)}</div>
                </div>
            `).join('');
        }
        
        if (availableContainer) {
            availableContainer.innerHTML = data.available_badges.map(badge => `
                <div class="badge-item available" data-rarity="${badge.rarity}">
                    <div class="badge-icon">${badge.icon}</div>
                    <div class="badge-info">
                        <h4>${badge.name}</h4>
                        <p>${badge.description}</p>
                        <span class="badge-rarity ${badge.rarity}">${badge.rarity_display}</span>
                    </div>
                    <div class="badge-requirements">
                        ${this.getBadgeRequirements(badge)}
                    </div>
                </div>
            `).join('');
        }
    }
    
    updateDailyQuests(data) {
        const questsContainer = document.getElementById('daily-quests');
        if (!questsContainer) return;
        
        questsContainer.innerHTML = data.quests.map(quest => `
            <div class="quest-item ${quest.is_completed ? 'completed' : ''}" data-quest-id="${quest.id}">
                <div class="quest-header">
                    <h4>${quest.quest_name}</h4>
                    <span class="quest-difficulty ${quest.difficulty}">${quest.difficulty}</span>
                </div>
                <p class="quest-description">${quest.quest_description}</p>
                <div class="quest-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${quest.progress_percentage}%"></div>
                    </div>
                    <span class="progress-text">${quest.progress}/${quest.target}</span>
                </div>
                <div class="quest-rewards">
                    <span class="xp-reward">+${quest.xp_reward} XP</span>
                    ${quest.is_completed ? '<span class="completed-badge">✓ Completed</span>' : ''}
                </div>
                ${!quest.is_completed ? `
                    <button class="complete-quest-btn" onclick="gamificationManager.completeQuest(${quest.id})">
                        Complete Quest
                    </button>
                ` : ''}
            </div>
        `).join('');
        
        // Update quest summary
        const completedCount = data.quests.filter(q => q.is_completed).length;
        const totalCount = data.quests.length;
        this.updateElement('quests-completed', completedCount);
        this.updateElement('quests-total', totalCount);
    }
    
    updateLeaderboard(data) {
        const leaderboardContainer = document.getElementById('leaderboard-list');
        if (!leaderboardContainer) return;
        
        leaderboardContainer.innerHTML = data.leaderboard.map(entry => `
            <div class="leaderboard-entry ${entry.rank <= 3 ? 'top-three' : ''}">
                <div class="rank">#${entry.rank}</div>
                <div class="user-info">
                    <div class="username">${entry.username}</div>
                    <div class="user-stats">
                        Level ${entry.level} • ${entry.xp.toLocaleString()} XP
                    </div>
                </div>
                <div class="entry-stats">
                    <div class="stat">
                        <span class="stat-value">${entry.streak}</span>
                        <span class="stat-label">Streak</span>
                    </div>
                    <div class="stat">
                        <span class="stat-value">${entry.total_workouts}</span>
                        <span class="stat-label">Workouts</span>
                    </div>
                </div>
            </div>
        `).join('');
        
        // Update user's rank
        this.updateElement('user-leaderboard-rank', data.user_rank);
    }
    
    updateRecentActivities(activities) {
        const activitiesContainer = document.getElementById('recent-activities');
        if (!activitiesContainer) return;
        
        activitiesContainer.innerHTML = activities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon">${this.getActivityIcon(activity.type)}</div>
                <div class="activity-content">
                    <h5>${activity.title}</h5>
                    <p>${activity.description}</p>
                    <span class="activity-time">${this.formatTimeAgo(activity.created_at)}</span>
                </div>
                ${activity.data.xp_gained ? `
                    <div class="activity-xp">+${activity.data.xp_gained} XP</div>
                ` : ''}
            </div>
        `).join('');
    }
    
    getBadgeRequirements(badge) {
        const requirements = [];
        
        if (badge.xp_required > 0) {
            requirements.push(`${badge.xp_required.toLocaleString()} XP`);
        }
        if (badge.level_required > 0) {
            requirements.push(`Level ${badge.level_required}`);
        }
        if (badge.streak_required > 0) {
            requirements.push(`${badge.streak_required} day streak`);
        }
        if (badge.workouts_required > 0) {
            requirements.push(`${badge.workouts_required} workouts`);
        }
        if (badge.challenges_required > 0) {
            requirements.push(`${badge.challenges_required} challenges`);
        }
        
        return requirements.length > 0 ? requirements.join(' • ') : 'Complete activities';
    }
    
    getActivityIcon(activityType) {
        const icons = {
            'workout_completion': '💪',
            'strength_pr': '🏋️',
            'challenge_completion': '🎯',
            'achievement_unlocked': '🏆',
            'level_up': '⭐',
            'daily_quest': '📋',
            'social_interaction': '👥',
        };
        return icons[activityType] || '🎉';
    }
    
    async completeQuest(questId) {
        try {
            const response = await fetch('/api/v1/gamification/complete-quest/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ quest_id: questId })
            });
            
            if (response.ok) {
                const result = await response.json();
                this.showNotification(`Quest completed! +${result.xp_gained} XP`, 'success');
                await this.loadGamificationData(); // Refresh data
            } else {
                this.showNotification('Failed to complete quest', 'error');
            }
        } catch (error) {
            console.error('Failed to complete quest:', error);
            this.showNotification('Failed to complete quest', 'error');
        }
    }
    
    async awardXP(activityType, amount = null) {
        try {
            const response = await fetch('/api/v1/gamification/award-xp/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    activity_type: activityType,
                    amount: amount
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                if (result.result.leveled_up) {
                    this.showLevelUpNotification(result.result.new_level);
                }
                await this.loadGamificationData(); // Refresh data
                return result.result;
            }
        } catch (error) {
            console.error('Failed to award XP:', error);
        }
    }
    
    showLevelUpNotification(newLevel) {
        const notification = document.createElement('div');
        notification.className = 'level-up-notification';
        notification.innerHTML = `
            <div class="level-up-content">
                <div class="level-up-icon">⭐</div>
                <div class="level-up-text">
                    <h3>Level Up!</h3>
                    <p>You reached level ${newLevel}!</p>
                </div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }
    
    setupEventListeners() {
        // Leaderboard type switching
        document.querySelectorAll('.leaderboard-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const type = e.target.dataset.type;
                this.loadLeaderboard(type);
                
                // Update active tab
                document.querySelectorAll('.leaderboard-tab').forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
            });
        });
        
        // Refresh button
        const refreshBtn = document.getElementById('refresh-gamification');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.loadGamificationData();
            });
        }
    }
    
    startPeriodicUpdates() {
        // Update data every 30 seconds
        setInterval(() => {
            if (this.isInitialized) {
                this.loadGamificationData();
            }
        }, 30000);
    }
    
    updateElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }
    
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString();
    }
    
    formatTimeAgo(dateString) {
        const now = new Date();
        const date = new Date(dateString);
        const diffInSeconds = Math.floor((now - date) / 1000);
        
        if (diffInSeconds < 60) return 'just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        return `${Math.floor(diffInSeconds / 86400)}d ago`;
    }
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.gamificationManager = new GamificationManager();
});
