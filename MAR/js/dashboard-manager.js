// Dashboard Manager for Maverick Aim Rush
// Created by Cursor AI - Top-tier Senior Developer

class DashboardManager {
    constructor() {
        this.isInitialized = false;
        this.authState = 'checking';
        this.userData = null;
        this.apiBaseUrl = 'http://localhost:8000';
        // Don't auto-initialize, wait for explicit call
    }

    async init() {
        try {
            console.log('🚀 Initializing Dashboard Manager...');
            
            // Wait for DOM to be ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.initializeDashboard());
            } else {
                // Small delay to ensure all scripts are loaded
                setTimeout(() => this.initializeDashboard(), 100);
            }
        } catch (error) {
            console.error('Dashboard initialization error:', error);
            this.showError('Failed to initialize dashboard. Please refresh the page.');
        }
    }

    async initializeDashboard() {
        try {
            console.log('🔧 Starting dashboard initialization...');
            
            // Check authentication status
            await this.checkAuthenticationStatus();
            console.log('🔧 Auth check completed, state:', this.authState);
            
            // Setup event listeners
            this.setupEventListeners();
            console.log('🔧 Event listeners setup completed');
            
            // Initialize UI based on auth state
            this.initializeUI();
            console.log('🔧 UI initialization completed');
            
            // Load dashboard data if authenticated
            if (this.authState === 'authenticated') {
                console.log('🔧 Loading dashboard data...');
                await this.loadDashboardData();
                console.log('🔧 Dashboard data loaded');
            }
            
            this.isInitialized = true;
            console.log('✅ Dashboard Manager initialized successfully');
            
        } catch (error) {
            console.error('❌ Dashboard initialization error:', error);
            this.showError('Failed to initialize dashboard. Please refresh the page.');
        }
    }

    async checkAuthenticationStatus() {
        try {
            const token = localStorage.getItem('access_token') || localStorage.getItem('accessToken');
            console.log('🔍 Checking auth status, token found:', !!token);
            
            if (!token) {
                console.log('❌ No token found, user not authenticated');
                this.authState = 'unauthenticated';
                return;
            }

            // Verify token with backend (do not auto-refresh here to avoid 401 noise on login screen)
            console.log('🔍 Verifying token with backend...');
            const response = await fetch(`${this.apiBaseUrl}/api/v1/profile/me/`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('🔍 Backend response status:', response.status);

            if (response.ok) {
                this.userData = await response.json();
                this.authState = 'authenticated';
                console.log('✅ User authenticated successfully');
                
                // Start periodic token refresh
                if (window.api && window.api.startTokenRefresh) {
                    window.api.startTokenRefresh();
                    console.log('🔄 Started periodic token refresh');
                }
            } else {
                // Clear stale tokens and mark unauthenticated (avoid immediate refresh to reduce console 401s)
                this.authState = 'unauthenticated';
                this.clearTokens();
                console.log('❌ Invalid token - cleared tokens, user unauthenticated');
            }
        } catch (error) {
            console.error('❌ Authentication check error:', error);
            this.authState = 'unauthenticated';
        }
    }

    async refreshToken() {
        try {
            const refreshToken = localStorage.getItem('refresh_token') || localStorage.getItem('refreshToken');
            if (!refreshToken) return false;

            const response = await fetch(`${this.apiBaseUrl}/auth/refresh/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ refresh: refreshToken })
            });

            if (response.ok) {
                const tokens = await response.json();
                localStorage.setItem('access_token', tokens.access);
                localStorage.setItem('refresh_token', refreshToken);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Token refresh error:', error);
            return false;
        }
    }

    clearTokens() {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
    }

    setupEventListeners() {
        // Login form
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Register form
        const registerForm = document.getElementById('register-form');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }

        // Logout button
        const logoutButton = document.getElementById('logout-button');
        if (logoutButton) {
            logoutButton.addEventListener('click', () => this.handleLogout());
        }

        // Units toggle
        const unitsToggle = document.getElementById('toggle-units');
        if (unitsToggle) {
            unitsToggle.addEventListener('click', () => this.toggleUnits());
        }

        // Mobile menu toggle
        const mobileToggle = document.querySelector('.icon-menu');
        if (mobileToggle) {
            mobileToggle.addEventListener('click', (e) => {
                e.preventDefault();
                document.body.classList.toggle('menu-open');
            });
        }
    }

    initializeUI() {
        const authSection = document.getElementById('auth-section');
        const dashboardWrapper = document.getElementById('dashboard-wrapper');
        const userStatus = document.getElementById('user-status');
        const unitsToggle = document.getElementById('units-toggle');

        console.log('🎨 Initializing UI, auth state:', this.authState);
        console.log('🎨 Auth section found:', !!authSection);
        console.log('🎨 Dashboard wrapper found:', !!dashboardWrapper);

        if (this.authState === 'authenticated') {
            // Show dashboard, hide auth
            console.log('✅ Showing dashboard, hiding auth');
            if (authSection) authSection.classList.add('hidden');
            if (dashboardWrapper) dashboardWrapper.classList.remove('hidden');
            if (userStatus) userStatus.classList.remove('hidden');
            if (unitsToggle) unitsToggle.classList.remove('hidden');

            // Update welcome message
            const welcomeMessage = document.getElementById('welcome-message');
            if (welcomeMessage && this.userData) {
                welcomeMessage.textContent = `Welcome, ${this.userData.username || 'User'}!`;
            }
        } else {
            // Show auth, hide dashboard
            console.log('❌ Showing auth, hiding dashboard');
            if (authSection) authSection.classList.remove('hidden');
            if (dashboardWrapper) dashboardWrapper.classList.add('hidden');
            if (userStatus) userStatus.classList.add('hidden');
            if (unitsToggle) unitsToggle.classList.add('hidden');
        }
    }

    async handleLogin(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const data = {
            username: formData.get('username') || document.getElementById('login-username').value,
            password: formData.get('password') || document.getElementById('login-password').value
        };

        try {
            this.showLoading('login-form', true);
            
            const response = await fetch(`${this.apiBaseUrl}/auth/login/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                const tokens = await response.json();
                localStorage.setItem('access_token', tokens.access);
                localStorage.setItem('refresh_token', tokens.refresh);
                
                this.showSuccess('Login successful!');
                await this.checkAuthenticationStatus();
                this.initializeUI();
                await this.loadDashboardData();
                
                // Start periodic token refresh after successful login
                if (window.api && window.api.startTokenRefresh) {
                    window.api.startTokenRefresh();
                    console.log('🔄 Started periodic token refresh after login');
                }
            } else {
                const error = await response.json();
                this.showError(error.detail || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showError('Login failed. Please try again.');
        } finally {
            this.showLoading('login-form', false);
        }
    }

    async handleRegister(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const data = {
            username: formData.get('username') || document.getElementById('register-username').value,
            email: formData.get('email') || document.getElementById('register-email').value,
            password: formData.get('password') || document.getElementById('register-password').value,
            password_confirm: formData.get('password_confirm') || document.getElementById('register-password-confirm').value
        };

        // Validate required fields
        if (!data.username || !data.email || !data.password || !data.password_confirm) {
            this.showError('Please fill in all fields');
            return;
        }

        if (data.password !== data.password_confirm) {
            this.showError('Passwords do not match');
            return;
        }

        if (data.password.length < 8) {
            this.showError('Password must be at least 8 characters long');
            return;
        }

        try {
            this.showLoading('register-form', true);
            
            // Remove password_confirm before sending to backend
            const registrationData = {
                username: data.username,
                email: data.email,
                password: data.password
            };
            
            console.log('🚀 Attempting registration with data:', registrationData);
            console.log('🌐 API URL:', `${this.apiBaseUrl}/register/`);
            
            const response = await fetch(`${this.apiBaseUrl}/register/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(registrationData)
            });
            
            console.log('📡 Registration response status:', response.status);
            console.log('📡 Registration response headers:', response.headers);

            if (response.ok) {
                this.showSuccess('Registration successful! Please log in.');
                // Clear form
                event.target.reset();
                // Switch to login form
                this.showAuthForm('login');
            } else {
                console.log('❌ Registration failed with status:', response.status);
                let errorData;
                try {
                    errorData = await response.json();
                    console.error('Registration error response:', errorData);
                } catch (parseError) {
                    console.error('Failed to parse error response:', parseError);
                    errorData = { detail: `Server error (${response.status})` };
                }
                
                // Handle different error formats
                let errorMessage = 'Registration failed. Please try again.';
                if (errorData.detail) {
                    errorMessage = errorData.detail;
                } else if (errorData.username) {
                    errorMessage = `Username: ${errorData.username[0]}`;
                } else if (errorData.email) {
                    errorMessage = `Email: ${errorData.email[0]}`;
                } else if (errorData.password) {
                    errorMessage = `Password: ${errorData.password[0]}`;
                } else if (typeof errorData === 'string') {
                    errorMessage = errorData;
                }
                
                this.showError(errorMessage);
            }
        } catch (error) {
            console.error('Registration error:', error);
            this.showError('Registration failed. Please check your connection and try again.');
        } finally {
            this.showLoading('register-form', false);
        }
    }

    handleLogout() {
        this.clearTokens();
        this.authState = 'unauthenticated';
        this.userData = null;
        
        // Stop periodic token refresh
        if (window.api && window.api.stopTokenRefresh) {
            window.api.stopTokenRefresh();
            console.log('🛑 Stopped periodic token refresh');
        }
        
        this.initializeUI();
        this.showSuccess('Logged out successfully');
    }

    toggleUnits() {
        const currentUnits = localStorage.getItem('units') || 'imperial';
        const newUnits = currentUnits === 'imperial' ? 'metric' : 'imperial';
        localStorage.setItem('units', newUnits);
        
        const unitsDisplay = document.getElementById('units-display');
        if (unitsDisplay) {
            unitsDisplay.textContent = newUnits === 'imperial' ? 'lb/mi' : 'kg/km';
        }
        
        this.showSuccess(`Units changed to ${newUnits}`);
    }

    async loadDashboardData() {
        try {
            console.log('📊 Loading dashboard data...');
            
            // Load various dashboard components
            await Promise.all([
                this.loadUserProfile(),
                this.loadRecentActivity(),
                this.loadProgressStats(),
                this.loadRecommendations()
            ]);
            
        } catch (error) {
            console.error('Dashboard data loading error:', error);
            // Don't show error to user for background data loading
        }
    }

    async loadUserProfile() {
        try {
            const token = localStorage.getItem('access_token') || localStorage.getItem('accessToken');
            const response = await fetch(`${this.apiBaseUrl}/api/v1/profile/me/`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                this.userData = await response.json();
                this.updateUserProfileDisplay();
            }
        } catch (error) {
            console.error('Profile loading error:', error);
        }
    }

    async loadRecentActivity() {
        // Placeholder for recent activity loading
        console.log('📈 Loading recent activity...');
    }

    async loadProgressStats() {
        // Placeholder for progress stats loading
        console.log('📊 Loading progress stats...');
    }

    async loadRecommendations() {
        // Placeholder for recommendations loading
        console.log('🤖 Loading recommendations...');
    }

    updateUserProfileDisplay() {
        if (!this.userData) return;

        const welcomeMessage = document.getElementById('welcome-message');
        if (welcomeMessage) {
            welcomeMessage.textContent = `Welcome, ${this.userData.username || 'User'}!`;
        }
    }

    showLoading(formId, isLoading) {
        const form = document.getElementById(formId);
        if (!form) return;

        const button = form.querySelector('button[type="submit"]');
        const spinner = form.querySelector('.spinner');
        const buttonText = button.querySelector('span');
        
        if (button && spinner && buttonText) {
            if (isLoading) {
                button.disabled = true;
                spinner.classList.remove('hidden');
                buttonText.textContent = 'Loading...';
            } else {
                button.disabled = false;
                spinner.classList.add('hidden');
                buttonText.textContent = formId === 'login-form' ? 'Sign In' : 'Create Account';
            }
        }
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showAuthForm(formType) {
        const loginContainer = document.getElementById('login-form-container');
        const registerContainer = document.getElementById('register-form-container');
        
        // Clear any existing messages
        this.clearFormMessages();
        
        if (formType === 'login') {
            if (loginContainer) loginContainer.classList.remove('hidden');
            if (registerContainer) registerContainer.classList.add('hidden');
        } else if (formType === 'register') {
            if (loginContainer) loginContainer.classList.add('hidden');
            if (registerContainer) registerContainer.classList.remove('hidden');
        }
    }

    clearFormMessages() {
        const loginMessage = document.getElementById('login-message');
        const registerMessage = document.getElementById('register-message');
        
        if (loginMessage) {
            loginMessage.textContent = '';
            loginMessage.className = 'auth-message';
        }
        if (registerMessage) {
            registerMessage.textContent = '';
            registerMessage.className = 'auth-message';
        }
    }

    showNotification(message, type = 'info') {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.notification-toast');
        existingNotifications.forEach(notification => notification.remove());

        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification-toast notification-toast--${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
                <span class="notification-message">${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            background: ${type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : '#2196f3'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            max-width: 400px;
            animation: slideInRight 0.3s ease-out;
        `;
        
        // Add to page
        document.body.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.style.animation = 'slideOutRight 0.3s ease-in';
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);
    }
}

// Initialize Dashboard Manager when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.dashboardManager = new DashboardManager();
});

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    .notification-content {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    
    .notification-icon {
        font-size: 1.2rem;
    }
    
    .notification-message {
        flex: 1;
    }
    
    .notification-close {
        background: none;
        border: none;
        color: white;
        font-size: 1.5rem;
        cursor: pointer;
        padding: 0;
        margin-left: 0.5rem;
    }
    
    .notification-close:hover {
        opacity: 0.8;
    }
`;
document.head.appendChild(style);
