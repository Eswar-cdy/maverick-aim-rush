// Social Features functionality for Maverick Aim Rush
// MAR/js/social.js

class SocialDashboard {
    constructor() {
        this.userProfile = null;
        this.currentSection = 'friends';
        this.init();
    }

    async init() {
        // Check authentication
        if (!getAccessToken()) {
            window.location.href = 'index.html';
            return;
        }

        // Load user profile
        await this.loadUserProfile();
        
        // Bind event listeners
        this.bindEventListeners();
        
        // Load initial data
        await this.loadSocialData();
    }

    async loadUserProfile() {
        try {
            this.userProfile = await fetchUserProfile();
            this.updateUnitsDisplay();
        } catch (error) {
            console.error('Failed to load user profile:', error);
        }
    }

    updateUnitsDisplay() {
        if (!this.userProfile) return;
        
        const unitsDisplay = document.getElementById('units-display');
        if (unitsDisplay) {
            unitsDisplay.textContent = this.userProfile.unit_system === 'imperial' ? 'lb/mi' : 'kg/km';
        }
    }

    bindEventListeners() {
        // Section tabs
        const socialTabs = document.querySelectorAll('.social-tab');
        socialTabs.forEach(tab => {
            tab.addEventListener('click', (e) => this.handleSectionChange(e.target.dataset.section));
        });

        // Action buttons
        const addFriendBtn = document.getElementById('add-friend-btn');
        if (addFriendBtn) {
            addFriendBtn.addEventListener('click', () => this.showAddFriendModal());
        }

        const createChallengeBtn = document.getElementById('create-challenge-btn');
        if (createChallengeBtn) {
            createChallengeBtn.addEventListener('click', () => this.showCreateChallengeModal());
        }

        // Logout button
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }

        // Units toggle
        const unitsToggle = document.getElementById('units-toggle');
        if (unitsToggle) {
            unitsToggle.addEventListener('click', () => this.toggleUnits());
        }

        // Filter changes
        const leaderboardPeriod = document.getElementById('leaderboard-period');
        if (leaderboardPeriod) {
            leaderboardPeriod.addEventListener('change', () => this.loadLeaderboards());
        }

        const achievementFilter = document.getElementById('achievement-filter');
        if (achievementFilter) {
            achievementFilter.addEventListener('change', () => this.loadAchievements());
        }
    }

    handleSectionChange(section) {
        this.currentSection = section;
        
        // Update active tab
        document.querySelectorAll('.social-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-section="${section}"]`).classList.add('active');
        
        // Show/hide sections
        document.querySelectorAll('.social-section').forEach(sec => {
            sec.style.display = 'none';
        });
        document.getElementById(`${section}-section`).style.display = 'block';
        
        // Load section-specific data
        this.loadSectionData(section);
    }

    async loadSectionData(section) {
        switch (section) {
            case 'friends':
                await this.loadFriends();
                break;
            case 'challenges':
                await this.loadChallenges();
                break;
            case 'leaderboards':
                await this.loadLeaderboards();
                break;
            case 'achievements':
                await this.loadAchievements();
                break;
            case 'community':
                await this.loadCommunityStats();
                break;
        }
    }

    async loadSocialData() {
        this.showLoading();
        
        try {
            // Load initial section data
            await this.loadSectionData(this.currentSection);
            this.hideLoading();
        } catch (error) {
            console.error('Failed to load social data:', error);
            this.hideLoading();
        }
    }

    async loadFriends() {
        try {
            const response = await apiFetch('/social/?feature=friends');
            const friends = await response.json();
            
            this.renderFriends(friends);
        } catch (error) {
            console.error('Failed to load friends:', error);
        }
    }

    renderFriends(friends) {
        const friendsGrid = document.querySelector('.friends-grid');
        if (!friendsGrid) return;

        // Clear existing friends (keep the add friend card)
        const addFriendCard = friendsGrid.querySelector('.friend-card--add');
        friendsGrid.innerHTML = '';

        // Render friends
        friends.forEach(friend => {
            const friendCard = this.createFriendCard(friend);
            friendsGrid.appendChild(friendCard);
        });

        // Add the add friend card back
        if (addFriendCard) {
            friendsGrid.appendChild(addFriendCard);
        }
    }

    createFriendCard(friend) {
        const card = document.createElement('div');
        card.className = 'friend-card';
        card.innerHTML = `
            <div class="friend-avatar">👤</div>
            <div class="friend-info">
                <h3 class="friend-name">${friend.username}</h3>
                <p class="friend-stats">Connected since ${new Date(friend.connected_since).toLocaleDateString()}</p>
                <div class="friend-actions">
                    <button class="btn btn--small" onclick="socialDashboard.viewFriendActivity(${friend.id})">View Activity</button>
                    <button class="btn btn--small btn--secondary" onclick="socialDashboard.messageFriend(${friend.id})">Message</button>
                </div>
            </div>
        `;
        return card;
    }

    async loadChallenges() {
        try {
            const [availableResponse, myResponse] = await Promise.all([
                apiFetch('/social/?feature=challenges'),
                apiFetch('/social/?feature=my_challenges')
            ]);
            
            const availableChallenges = await availableResponse.json();
            const myChallenges = await myResponse.json();
            
            this.renderChallenges(availableChallenges, myChallenges);
        } catch (error) {
            console.error('Failed to load challenges:', error);
        }
    }

    renderChallenges(availableChallenges, myChallenges) {
        const challengesGrid = document.querySelector('.challenges-grid');
        if (!challengesGrid) return;

        challengesGrid.innerHTML = '';

        // Render my challenges first
        myChallenges.forEach(challenge => {
            const challengeCard = this.createChallengeCard(challenge, true);
            challengesGrid.appendChild(challengeCard);
        });

        // Render available challenges
        availableChallenges.forEach(challenge => {
            const challengeCard = this.createChallengeCard(challenge, false);
            challengesGrid.appendChild(challengeCard);
        });
    }

    createChallengeCard(challenge, isMyChallenge) {
        const card = document.createElement('div');
        card.className = 'challenge-card';
        
        if (isMyChallenge) {
            card.classList.add('challenge-card--active');
        }

        const progressPercentage = challenge.progress_percentage || 0;
        const badgeClass = isMyChallenge ? 'challenge-badge--active' : 'challenge-badge';
        const badgeText = isMyChallenge ? 'Active' : 'Available';

        card.innerHTML = `
            <div class="challenge-header">
                <h3 class="challenge-name">${challenge.challenge_name || challenge.name}</h3>
                <span class="challenge-badge ${badgeClass}">${badgeText}</span>
            </div>
            <p class="challenge-description">${challenge.description}</p>
            ${isMyChallenge ? `
                <div class="challenge-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progressPercentage}%"></div>
                    </div>
                    <span class="progress-text">${challenge.current_progress}/${challenge.target_value} ${challenge.target_unit} (${Math.round(progressPercentage)}%)</span>
                </div>
                <div class="challenge-stats">
                    <div class="stat">
                        <span class="stat-label">Your Rank</span>
                        <span class="stat-value">#${challenge.rank || 'N/A'}</span>
                    </div>
                </div>
            ` : `
                <div class="challenge-details">
                    <div class="detail">
                        <span class="detail-label">Starts:</span>
                        <span class="detail-value">${new Date(challenge.start_date).toLocaleDateString()}</span>
                    </div>
                    <div class="detail">
                        <span class="detail-label">Duration:</span>
                        <span class="detail-value">${Math.ceil((new Date(challenge.end_date) - new Date(challenge.start_date)) / (1000 * 60 * 60 * 24))} days</span>
                    </div>
                </div>
                <button class="btn btn--primary btn--full" onclick="socialDashboard.joinChallenge(${challenge.id})">Join Challenge</button>
            `}
        `;
        
        return card;
    }

    async loadLeaderboards() {
        try {
            const response = await apiFetch('/social/?feature=leaderboards');
            const leaderboards = await response.json();
            
            this.renderLeaderboards(leaderboards);
        } catch (error) {
            console.error('Failed to load leaderboards:', error);
        }
    }

    renderLeaderboards(leaderboards) {
        const leaderboardsGrid = document.querySelector('.leaderboards-grid');
        if (!leaderboardsGrid) return;

        leaderboardsGrid.innerHTML = '';

        leaderboards.forEach(leaderboard => {
            const leaderboardCard = this.createLeaderboardCard(leaderboard);
            leaderboardsGrid.appendChild(leaderboardCard);
        });
    }

    createLeaderboardCard(leaderboard) {
        const card = document.createElement('div');
        card.className = 'leaderboard-card';
        
        card.innerHTML = `
            <div class="leaderboard-header">
                <h3 class="leaderboard-name">${leaderboard.name}</h3>
                <span class="leaderboard-period">${leaderboard.period_type}</span>
            </div>
            <div class="leaderboard-list">
                <div class="loading-text">Loading leaderboard...</div>
            </div>
        `;
        
        // Load leaderboard entries
        this.loadLeaderboardEntries(leaderboard.id, card);
        
        return card;
    }

    async loadLeaderboardEntries(leaderboardId, card) {
        try {
            const response = await apiFetch(`/leaderboards/${leaderboardId}/`);
            const leaderboard = await response.json();
            
            const list = card.querySelector('.leaderboard-list');
            list.innerHTML = '';

            leaderboard.entries.forEach((entry, index) => {
                const entryElement = this.createLeaderboardEntry(entry, index + 1);
                list.appendChild(entryElement);
            });

            // Add user's rank if available
            if (leaderboard.user_rank) {
                const userEntry = this.createLeaderboardEntry(leaderboard.user_rank, leaderboard.user_rank.rank, true);
                list.appendChild(userEntry);
            }
        } catch (error) {
            console.error('Failed to load leaderboard entries:', error);
            const list = card.querySelector('.leaderboard-list');
            list.innerHTML = '<div class="error-text">Failed to load leaderboard</div>';
        }
    }

    createLeaderboardEntry(entry, rank, isCurrentUser = false) {
        const entryElement = document.createElement('div');
        entryElement.className = 'leaderboard-entry';
        
        if (isCurrentUser) {
            entryElement.classList.add('leaderboard-entry--current');
        } else if (rank === 1) {
            entryElement.classList.add('leaderboard-entry--first');
        } else if (rank === 2) {
            entryElement.classList.add('leaderboard-entry--second');
        } else if (rank === 3) {
            entryElement.classList.add('leaderboard-entry--third');
        }

        const avatar = isCurrentUser ? 'You' : this.getRandomAvatar();
        const username = isCurrentUser ? 'You' : entry.username;

        entryElement.innerHTML = `
            <div class="rank">${rank}</div>
            <div class="user-info">
                <div class="user-avatar">${avatar}</div>
                <span class="username">${username}</span>
            </div>
            <div class="score">${this.formatScore(entry.score, entry.metadata)}</div>
        `;
        
        return entryElement;
    }

    getRandomAvatar() {
        const avatars = ['👑', '💪', '🔥', '⚡', '🏋️', '💥', '👤', '👩', '👨'];
        return avatars[Math.floor(Math.random() * avatars.length)];
    }

    formatScore(score, metadata) {
        if (metadata && metadata.total_sets) {
            return `${Math.round(score)} kg`;
        }
        return Math.round(score);
    }

    async loadAchievements() {
        try {
            const response = await apiFetch('/social/?feature=achievements');
            const achievements = await response.json();
            
            this.renderAchievements(achievements);
        } catch (error) {
            console.error('Failed to load achievements:', error);
        }
    }

    renderAchievements(achievements) {
        const achievementsGrid = document.querySelector('.achievements-grid');
        if (!achievementsGrid) return;

        achievementsGrid.innerHTML = '';

        achievements.achievements.forEach(achievement => {
            const achievementCard = this.createAchievementCard(achievement);
            achievementsGrid.appendChild(achievementCard);
        });
    }

    createAchievementCard(achievement) {
        const card = document.createElement('div');
        card.className = 'achievement-card achievement-card--earned';
        
        const rarityClass = `rarity-${achievement.rarity}`;

        card.innerHTML = `
            <div class="achievement-icon">${achievement.icon}</div>
            <div class="achievement-info">
                <h3 class="achievement-name">${achievement.name}</h3>
                <p class="achievement-description">${achievement.description}</p>
                <div class="achievement-rarity ${rarityClass}">${achievement.rarity}</div>
            </div>
            <div class="achievement-status">
                <span class="earned-date">Earned ${new Date(achievement.earned_at).toLocaleDateString()}</span>
            </div>
        `;
        
        return card;
    }

    async loadCommunityStats() {
        try {
            const response = await apiFetch('/social/?feature=community_stats');
            const stats = await response.json();
            
            this.renderCommunityStats(stats);
        } catch (error) {
            console.error('Failed to load community stats:', error);
        }
    }

    renderCommunityStats(stats) {
        const statCards = document.querySelectorAll('.stat-card');
        
        if (statCards.length >= 4) {
            statCards[0].querySelector('.stat-number').textContent = stats.total_users.toLocaleString();
            statCards[1].querySelector('.stat-number').textContent = stats.community_activity.workouts_today.toLocaleString();
            statCards[2].querySelector('.stat-number').textContent = stats.active_challenges.toLocaleString();
            statCards[3].querySelector('.stat-number').textContent = '89.2%'; // This would come from stats
        }
    }

    // Action methods
    async joinChallenge(challengeId) {
        try {
            const response = await apiFetch('/social/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'join_challenge',
                    challenge_id: challengeId
                })
            });

            const result = await response.json();
            
            if (result.success) {
                alert('Successfully joined challenge!');
                this.loadChallenges(); // Refresh challenges
            } else {
                alert(result.error || 'Failed to join challenge');
            }
        } catch (error) {
            console.error('Failed to join challenge:', error);
            alert('Failed to join challenge. Please try again.');
        }
    }

    async viewFriendActivity(friendId) {
        try {
            const response = await apiFetch(`/friends/${friendId}/activity/`);
            const activity = await response.json();
            
            if (activity.error) {
                alert(activity.error);
                return;
            }
            
            // Show friend activity in a modal or new page
            this.showFriendActivityModal(activity);
        } catch (error) {
            console.error('Failed to load friend activity:', error);
            alert('Failed to load friend activity');
        }
    }

    showFriendActivityModal(activity) {
        // Create a simple modal to show friend activity
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${activity.friend_username}'s Activity</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <p>Total workouts: ${activity.total_workouts}</p>
                    <p>Last workout: ${activity.last_workout ? new Date(activity.last_workout).toLocaleDateString() : 'No recent workouts'}</p>
                    <div class="workout-list">
                        ${activity.workouts.map(workout => `
                            <div class="workout-item">
                                <strong>${new Date(workout.date).toLocaleDateString()}</strong>
                                <span>${workout.duration_minutes} minutes, ${workout.exercises_count} exercises</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    messageFriend(friendId) {
        // Placeholder for messaging functionality
        alert('Messaging feature coming soon!');
    }

    showAddFriendModal() {
        const username = prompt('Enter username to add as friend:');
        if (username) {
            this.sendFriendRequest(username);
        }
    }

    async sendFriendRequest(username) {
        try {
            // First, find the user by username
            // This would require a user search endpoint
            alert('Friend request feature coming soon!');
        } catch (error) {
            console.error('Failed to send friend request:', error);
            alert('Failed to send friend request');
        }
    }

    showCreateChallengeModal() {
        alert('Create challenge feature coming soon!');
    }

    showLoading() {
        const loadingSection = document.getElementById('loading-section');
        if (loadingSection) {
            loadingSection.style.display = 'block';
        }
    }

    hideLoading() {
        const loadingSection = document.getElementById('loading-section');
        if (loadingSection) {
            loadingSection.style.display = 'none';
        }
    }

    async toggleUnits() {
        if (!this.userProfile) return;

        try {
            const newUnitSystem = this.userProfile.unit_system === 'imperial' ? 'metric' : 'imperial';
            
            await updateUserProfile({ unit_system: newUnitSystem });
            this.userProfile.unit_system = newUnitSystem;
            
            this.updateUnitsDisplay();
            
        } catch (error) {
            console.error('Failed to update units:', error);
            alert('Failed to update units. Please try again.');
        }
    }

    async logout() {
        try {
            await logout();
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Logout failed:', error);
            window.location.href = 'index.html';
        }
    }
}

// Initialize social dashboard when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.socialDashboard = new SocialDashboard();
});
