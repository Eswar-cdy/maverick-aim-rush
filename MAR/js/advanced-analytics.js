// Advanced Analytics JavaScript for Maverick Aim Rush
// Created by Cursor AI

class AdvancedAnalyticsManager {
    constructor() {
        this.apiBaseUrl = 'http://localhost:8000';
        this.analyticsData = null;
        this.charts = {};
        this.init();
    }

    async init() {
        await this.loadAnalyticsData();
        this.setupEventListeners();
        this.renderAnalytics();
        this.createCharts();
    }

    async loadAnalyticsData() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/advanced-analytics/`);
            if (response.ok) {
                this.analyticsData = await response.json();
                console.log('Advanced analytics data loaded:', this.analyticsData);
            } else {
                console.error('Failed to load analytics data');
                this.showError('Failed to load analytics data');
            }
        } catch (error) {
            console.error('Error loading analytics data:', error);
            this.showError('Error loading analytics data');
        }
    }

    setupEventListeners() {
        // Body composition form
        const bodyCompositionForm = document.getElementById('body-composition-form');
        if (bodyCompositionForm) {
            bodyCompositionForm.addEventListener('submit', (e) => this.handleBodyCompositionSubmit(e));
        }

        // Muscle measurement form
        const muscleMeasurementForm = document.getElementById('muscle-measurement-form');
        if (muscleMeasurementForm) {
            muscleMeasurementForm.addEventListener('submit', (e) => this.handleMuscleMeasurementSubmit(e));
        }

        // Authentication forms
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        const registerForm = document.getElementById('register-form');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }

        // Auto-convert inches to cm
        const circumferenceCm = document.getElementById('circumference-cm');
        const circumferenceInches = document.getElementById('circumference-inches');
        
        if (circumferenceCm && circumferenceInches) {
            circumferenceCm.addEventListener('input', () => {
                const cm = parseFloat(circumferenceCm.value);
                if (!isNaN(cm)) {
                    circumferenceInches.value = (cm / 2.54).toFixed(2);
                }
            });

            circumferenceInches.addEventListener('input', () => {
                const inches = parseFloat(circumferenceInches.value);
                if (!isNaN(inches)) {
                    circumferenceCm.value = (inches * 2.54).toFixed(2);
                }
            });
        }
    }

    renderAnalytics() {
        if (!this.analyticsData) return;

        this.updateMetrics();
        this.renderMuscleGrowth();
        this.renderInsights();
    }

    updateMetrics() {
        const bodyComp = this.analyticsData.body_composition;
        const predictions = this.analyticsData.predictions;
        const symmetry = this.analyticsData.symmetry;

        // Update key metrics
        document.getElementById('current-weight').textContent = `${bodyComp.current_weight} kg`;
        document.getElementById('current-body-fat').textContent = `${bodyComp.current_body_fat}%`;
        document.getElementById('current-muscle-mass').textContent = `${bodyComp.current_muscle_mass} kg`;
        document.getElementById('symmetry-score').textContent = `${symmetry.symmetry_score}`;

        // Update changes
        const weightChange = bodyComp.weight_change_kg;
        const bodyFatChange = bodyComp.body_fat_change_percent;
        const muscleMassChange = bodyComp.muscle_mass_change_kg;

        document.getElementById('weight-change').textContent = `${weightChange > 0 ? '+' : ''}${weightChange} kg`;
        document.getElementById('weight-change').className = `metric-card__change ${weightChange < 0 ? 'positive' : weightChange > 0 ? 'negative' : 'neutral'}`;

        document.getElementById('body-fat-change').textContent = `${bodyFatChange > 0 ? '+' : ''}${bodyFatChange}%`;
        document.getElementById('body-fat-change').className = `metric-card__change ${bodyFatChange < 0 ? 'positive' : bodyFatChange > 0 ? 'negative' : 'neutral'}`;

        document.getElementById('muscle-mass-change').textContent = `${muscleMassChange > 0 ? '+' : ''}${muscleMassChange} kg`;
        document.getElementById('muscle-mass-change').className = `metric-card__change ${muscleMassChange > 0 ? 'positive' : muscleMassChange < 0 ? 'negative' : 'neutral'}`;

        document.getElementById('balance-score').textContent = `Balance: ${symmetry.balance_score}`;

        // Update predictions
        document.getElementById('predicted-weight').textContent = `${predictions.predicted_values.weight_kg} kg`;
        document.getElementById('predicted-body-fat').textContent = `${predictions.predicted_values.body_fat_percent}%`;
        document.getElementById('predicted-muscle-mass').textContent = `${predictions.predicted_values.muscle_mass_kg} kg`;
        document.getElementById('prediction-confidence').textContent = `${Math.round(predictions.confidence_level * 100)}%`;
    }

    renderMuscleGrowth() {
        const muscleGrowthGrid = document.getElementById('muscle-growth-grid');
        if (!muscleGrowthGrid) return;

        const muscleGroups = this.analyticsData.muscle_growth.muscle_groups;
        
        muscleGrowthGrid.innerHTML = Object.entries(muscleGroups).map(([key, muscle]) => `
            <div class="muscle-growth-card">
                <div class="muscle-growth-card__header">
                    <h3 class="muscle-growth-card__title">${muscle.display_name}</h3>
                    <span class="muscle-growth-card__trend trend--${muscle.trend}">${muscle.trend}</span>
                </div>
                <div class="muscle-growth-card__content">
                    <div class="muscle-growth-metric">
                        <span class="muscle-growth-label">Current Size:</span>
                        <span class="muscle-growth-value">${muscle.current_size_cm} cm</span>
                    </div>
                    <div class="muscle-growth-metric">
                        <span class="muscle-growth-label">Growth:</span>
                        <span class="muscle-growth-value ${muscle.growth_cm > 0 ? 'positive' : muscle.growth_cm < 0 ? 'negative' : 'neutral'}">${muscle.growth_cm > 0 ? '+' : ''}${muscle.growth_cm} cm</span>
                    </div>
                    <div class="muscle-growth-metric">
                        <span class="muscle-growth-label">Growth %:</span>
                        <span class="muscle-growth-value ${muscle.growth_percent > 0 ? 'positive' : muscle.growth_percent < 0 ? 'negative' : 'neutral'}">${muscle.growth_percent > 0 ? '+' : ''}${muscle.growth_percent}%</span>
                    </div>
                    <div class="muscle-growth-metric">
                        <span class="muscle-growth-label">Density:</span>
                        <span class="muscle-growth-value">${muscle.muscle_density}</span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderInsights() {
        const bodyCompInsights = document.getElementById('body-composition-insights');
        const muscleGrowthInsights = document.getElementById('muscle-growth-insights');
        const aiRecommendations = document.getElementById('ai-recommendations');

        if (bodyCompInsights) {
            bodyCompInsights.innerHTML = this.analyticsData.body_composition.insights.map(insight => 
                `<div class="insight-item">${insight}</div>`
            ).join('');
        }

        if (muscleGrowthInsights) {
            muscleGrowthInsights.innerHTML = this.analyticsData.muscle_growth.insights.map(insight => 
                `<div class="insight-item">${insight}</div>`
            ).join('');
        }

        if (aiRecommendations) {
            aiRecommendations.innerHTML = this.analyticsData.predictions.recommendations.map(rec => 
                `<div class="insight-item">${rec}</div>`
            ).join('');
        }
    }

    createCharts() {
        this.createBodyCompositionChart();
        this.createMusclePredictionsChart();
    }

    createBodyCompositionChart() {
        const ctx = document.getElementById('bodyCompositionChart');
        if (!ctx) return;

        const bodyComp = this.analyticsData.body_composition;
        
        this.charts.bodyComposition = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['30 days ago', '15 days ago', 'Today'],
                datasets: [
                    {
                        label: 'Weight (kg)',
                        data: [
                            bodyComp.current_weight - (bodyComp.weight_change_kg * 2),
                            bodyComp.current_weight - bodyComp.weight_change_kg,
                            bodyComp.current_weight
                        ],
                        borderColor: '#ff6b35',
                        backgroundColor: 'rgba(255, 107, 53, 0.1)',
                        tension: 0.4
                    },
                    {
                        label: 'Body Fat %',
                        data: [
                            bodyComp.current_body_fat - (bodyComp.body_fat_change_percent * 2),
                            bodyComp.current_body_fat - bodyComp.body_fat_change_percent,
                            bodyComp.current_body_fat
                        ],
                        borderColor: '#dc3545',
                        backgroundColor: 'rgba(220, 53, 69, 0.1)',
                        tension: 0.4
                    },
                    {
                        label: 'Muscle Mass (kg)',
                        data: [
                            bodyComp.current_muscle_mass - (bodyComp.muscle_mass_change_kg * 2),
                            bodyComp.current_muscle_mass - bodyComp.muscle_mass_change_kg,
                            bodyComp.current_muscle_mass
                        ],
                        borderColor: '#28a745',
                        backgroundColor: 'rgba(40, 167, 69, 0.1)',
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Body Composition Trends (30 Days)'
                    },
                    legend: {
                        position: 'top',
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false
                    }
                }
            }
        });
    }

    createMusclePredictionsChart() {
        const ctx = document.getElementById('musclePredictionsChart');
        if (!ctx) return;

        const predictions = this.analyticsData.predictions.muscle_predictions;
        
        this.charts.musclePredictions = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: Object.keys(predictions).map(key => this.getMuscleDisplayName(key)),
                datasets: [
                    {
                        label: 'Current Size (cm)',
                        data: Object.values(predictions).map(p => p.current_cm),
                        backgroundColor: 'rgba(255, 107, 53, 0.8)',
                        borderColor: '#ff6b35',
                        borderWidth: 1
                    },
                    {
                        label: 'Predicted Size (cm)',
                        data: Object.values(predictions).map(p => p.predicted_cm),
                        backgroundColor: 'rgba(40, 167, 69, 0.8)',
                        borderColor: '#28a745',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Muscle Growth Predictions (30 Days)'
                    },
                    legend: {
                        position: 'top',
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    getMuscleDisplayName(key) {
        const names = {
            'chest': 'Chest',
            'biceps': 'Biceps',
            'quads': 'Quads',
            'back': 'Back',
            'shoulders': 'Shoulders',
            'triceps': 'Triceps',
            'forearms': 'Forearms',
            'core': 'Core',
            'hamstrings': 'Hamstrings',
            'glutes': 'Glutes',
            'calves': 'Calves',
            'neck': 'Neck'
        };
        return names[key] || key;
    }

    async handleBodyCompositionSubmit(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const data = Object.fromEntries(formData.entries());
        
        try {
            const response = await fetch(`${this.apiBaseUrl}/body-compositions/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                this.showSuccess('Body composition data added successfully!');
                hideBodyCompositionForm();
                await this.loadAnalyticsData();
                this.renderAnalytics();
                this.createCharts();
            } else {
                const error = await response.json();
                this.showError(error.detail || 'Failed to add body composition data');
            }
        } catch (error) {
            console.error('Error adding body composition:', error);
            this.showError('Error adding body composition data');
        }
    }

    async handleMuscleMeasurementSubmit(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const data = Object.fromEntries(formData.entries());
        
        try {
            const response = await fetch(`${this.apiBaseUrl}/muscle-group-measurements/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                this.showSuccess('Muscle measurement added successfully!');
                hideMuscleMeasurementForm();
                await this.loadAnalyticsData();
                this.renderAnalytics();
                this.createCharts();
            } else {
                const error = await response.json();
                this.showError(error.detail || 'Failed to add muscle measurement');
            }
        } catch (error) {
            console.error('Error adding muscle measurement:', error);
            this.showError('Error adding muscle measurement');
        }
    }

    async handleLogin(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const data = Object.fromEntries(formData.entries());
        
        try {
            const response = await fetch(`${this.apiBaseUrl}/auth/login/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                const result = await response.json();
                localStorage.setItem('access_token', result.access);
                localStorage.setItem('refresh_token', result.refresh);
                this.showSuccess('Login successful!');
                hideLogin();
                await this.loadAnalyticsData();
                this.renderAnalytics();
                this.createCharts();
            } else {
                const error = await response.json();
                this.showError(error.detail || 'Login failed');
            }
        } catch (error) {
            console.error('Error logging in:', error);
            this.showError('Error logging in');
        }
    }

    async handleRegister(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const data = Object.fromEntries(formData.entries());
        
        if (data.password !== data.password_confirm) {
            this.showError('Passwords do not match');
            return;
        }
        
        delete data.password_confirm;
        
        try {
            const response = await fetch(`${this.apiBaseUrl}/register/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                this.showSuccess('Registration successful! Please log in.');
                hideRegister();
                showLogin();
            } else {
                const error = await response.json();
                this.showError(error.detail || 'Registration failed');
            }
        } catch (error) {
            console.error('Error registering:', error);
            this.showError('Error registering');
        }
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification--${type}`;
        notification.textContent = message;
        
        // Add to page
        document.body.appendChild(notification);
        
        // Show notification
        setTimeout(() => notification.classList.add('notification--show'), 100);
        
        // Hide after 3 seconds
        setTimeout(() => {
            notification.classList.remove('notification--show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Modal functions
function showBodyCompositionForm() {
    document.getElementById('body-composition-modal').classList.add('modal--show');
}

function hideBodyCompositionForm() {
    document.getElementById('body-composition-modal').classList.remove('modal--show');
}

function showMuscleMeasurementForm() {
    document.getElementById('muscle-measurement-modal').classList.add('modal--show');
}

function hideMuscleMeasurementForm() {
    document.getElementById('muscle-measurement-modal').classList.remove('modal--show');
}

function showLogin() {
    document.getElementById('login-modal').classList.add('modal--show');
}

function hideLogin() {
    document.getElementById('login-modal').classList.remove('modal--show');
}

function showRegister() {
    document.getElementById('register-modal').classList.add('modal--show');
}

function hideRegister() {
    document.getElementById('register-modal').classList.remove('modal--show');
}

// Close modals when clicking outside
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('modal--show');
    }
});

// Initialize advanced analytics manager when page loads
document.addEventListener('DOMContentLoaded', () => {
    new AdvancedAnalyticsManager();
});
