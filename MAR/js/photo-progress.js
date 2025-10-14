// Photo Progress JavaScript for Maverick Aim Rush
// Created by Cursor AI

class PhotoProgressManager {
    constructor() {
        this.apiBaseUrl = 'http://localhost:8000';
        this.photoData = null;
        this.init();
    }

    async init() {
        await this.loadPhotoProgressData();
        this.setupEventListeners();
        this.renderPhotoProgress();
    }

    async loadPhotoProgressData() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/photo-progress/`);
            if (response.ok) {
                this.photoData = await response.json();
                console.log('Photo progress data loaded:', this.photoData);
            } else {
                console.error('Failed to load photo progress data');
                this.showError('Failed to load photo progress data');
            }
        } catch (error) {
            console.error('Error loading photo progress data:', error);
            this.showError('Error loading photo progress data');
        }
    }

    setupEventListeners() {
        // Photo upload form
        const photoUploadForm = document.getElementById('photo-upload-form');
        if (photoUploadForm) {
            photoUploadForm.addEventListener('submit', (e) => this.handlePhotoUpload(e));
        }

        // Measurement form
        const measurementForm = document.getElementById('measurement-form');
        if (measurementForm) {
            measurementForm.addEventListener('submit', (e) => this.handleMeasurementSubmit(e));
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
        const measurementCm = document.getElementById('measurement-cm');
        const measurementInches = document.getElementById('measurement-inches');
        
        if (measurementCm && measurementInches) {
            measurementCm.addEventListener('input', () => {
                const cm = parseFloat(measurementCm.value);
                if (!isNaN(cm)) {
                    measurementInches.value = (cm / 2.54).toFixed(2);
                }
            });

            measurementInches.addEventListener('input', () => {
                const inches = parseFloat(measurementInches.value);
                if (!isNaN(inches)) {
                    measurementCm.value = (inches * 2.54).toFixed(2);
                }
            });
        }
    }

    renderPhotoProgress() {
        if (!this.photoData) return;

        this.updateStats();
        this.renderPhotoTimeline();
        this.renderComparisons();
        this.renderMeasurementsChart();
        this.renderMilestones();
    }

    updateStats() {
        const photos = this.photoData.photos || [];
        const comparisons = this.photoData.comparisons || [];
        const measurements = this.photoData.measurements || [];
        const milestones = this.photoData.milestones || [];

        // Update stats
        document.getElementById('total-photos').textContent = photos.length;
        document.getElementById('measurements').textContent = measurements.length;
        document.getElementById('milestones').textContent = milestones.length;

        // Calculate weight change
        if (photos.length >= 2) {
            const firstPhoto = photos[photos.length - 1]; // Oldest
            const lastPhoto = photos[0]; // Newest
            const weightChange = lastPhoto.weight_at_time - firstPhoto.weight_at_time;
            const changeText = weightChange > 0 ? `+${weightChange.toFixed(1)} kg` : `${weightChange.toFixed(1)} kg`;
            document.getElementById('weight-change').textContent = changeText;
        }
    }

    renderPhotoTimeline() {
        const timelineContainer = document.getElementById('photo-timeline');
        if (!timelineContainer) return;

        const photos = this.photoData.photos || [];
        
        if (photos.length === 0) {
            timelineContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state__icon">📸</div>
                    <h3>No Progress Photos Yet</h3>
                    <p>Start your transformation journey by uploading your first progress photo!</p>
                    <button class="btn btn--primary" onclick="showPhotoUpload()">Upload First Photo</button>
                </div>
            `;
            return;
        }

        timelineContainer.innerHTML = photos.map(photo => `
            <div class="timeline-item">
                <div class="timeline-item__date">
                    ${new Date(photo.date_taken).toLocaleDateString()}
                </div>
                <div class="timeline-item__content">
                    <div class="photo-card">
                        <div class="photo-card__image">
                            <img src="${photo.image_url}" alt="${photo.photo_type}" onerror="this.src='images/placeholder-photo.jpg'">
                            <div class="photo-card__overlay">
                                <span class="photo-card__type">${this.getPhotoTypeLabel(photo.photo_type)}</span>
                            </div>
                        </div>
                        <div class="photo-card__content">
                            <h4 class="photo-card__title">${this.getPhotoTypeLabel(photo.photo_type)}</h4>
                            <div class="photo-card__stats">
                                ${photo.weight_at_time ? `<span class="stat">⚖️ ${photo.weight_at_time} kg</span>` : ''}
                                ${photo.body_fat_at_time ? `<span class="stat">📊 ${photo.body_fat_at_time}%</span>` : ''}
                            </div>
                            ${photo.notes ? `<p class="photo-card__notes">${photo.notes}</p>` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderComparisons() {
        const comparisonsGrid = document.getElementById('comparisons-grid');
        if (!comparisonsGrid) return;

        const comparisons = this.photoData.comparisons || [];
        
        if (comparisons.length === 0) {
            comparisonsGrid.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state__icon">🔄</div>
                    <h3>No Comparisons Yet</h3>
                    <p>Create before/after comparisons to see your transformation!</p>
                </div>
            `;
            return;
        }

        comparisonsGrid.innerHTML = comparisons.map(comparison => `
            <div class="comparison-card">
                <div class="comparison-card__header">
                    <h3 class="comparison-card__title">${comparison.title}</h3>
                    <span class="comparison-card__time">${comparison.time_difference_days} days</span>
                </div>
                <div class="comparison-card__photos">
                    <div class="comparison-photo">
                        <img src="${comparison.before_photo_data.image_url}" alt="Before" onerror="this.src='images/placeholder-photo.jpg'">
                        <div class="comparison-photo__label">Before</div>
                    </div>
                    <div class="comparison-arrow">→</div>
                    <div class="comparison-photo">
                        <img src="${comparison.after_photo_data.image_url}" alt="After" onerror="this.src='images/placeholder-photo.jpg'">
                        <div class="comparison-photo__label">After</div>
                    </div>
                </div>
                <div class="comparison-card__stats">
                    ${comparison.weight_change ? `<div class="stat-item"><span class="stat-label">Weight:</span> <span class="stat-value ${comparison.weight_change > 0 ? 'positive' : 'negative'}">${comparison.weight_change > 0 ? '+' : ''}${comparison.weight_change} kg</span></div>` : ''}
                    ${comparison.body_fat_change ? `<div class="stat-item"><span class="stat-label">Body Fat:</span> <span class="stat-value ${comparison.body_fat_change > 0 ? 'positive' : 'negative'}">${comparison.body_fat_change > 0 ? '+' : ''}${comparison.body_fat_change}%</span></div>` : ''}
                </div>
                ${comparison.description ? `<p class="comparison-card__description">${comparison.description}</p>` : ''}
            </div>
        `).join('');
    }

    renderMeasurementsChart() {
        const chartContainer = document.getElementById('measurements-chart');
        if (!chartContainer) return;

        const measurements = this.photoData.measurements || [];
        
        if (measurements.length === 0) {
            chartContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state__icon">📊</div>
                    <h3>No Measurements Yet</h3>
                    <p>Start tracking your body measurements to see progress over time!</p>
                    <button class="btn btn--primary" onclick="showMeasurementForm()">Add First Measurement</button>
                </div>
            `;
            return;
        }

        // Group measurements by body part
        const measurementsByPart = {};
        measurements.forEach(measurement => {
            if (!measurementsByPart[measurement.body_part]) {
                measurementsByPart[measurement.body_part] = [];
            }
            measurementsByPart[measurement.body_part].push(measurement);
        });

        chartContainer.innerHTML = Object.entries(measurementsByPart).map(([bodyPart, partMeasurements]) => `
            <div class="measurement-chart">
                <h4 class="measurement-chart__title">${this.getBodyPartLabel(bodyPart)}</h4>
                <div class="measurement-chart__data">
                    ${partMeasurements.map(measurement => `
                        <div class="measurement-point">
                            <div class="measurement-point__date">${new Date(measurement.measurement_date).toLocaleDateString()}</div>
                            <div class="measurement-point__value">${measurement.measurement_cm} cm</div>
                            ${measurement.measurement_inches ? `<div class="measurement-point__value-inches">${measurement.measurement_inches} in</div>` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');
    }

    renderMilestones() {
        const milestonesGrid = document.getElementById('milestones-grid');
        if (!milestonesGrid) return;

        const milestones = this.photoData.milestones || [];
        
        if (milestones.length === 0) {
            milestonesGrid.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state__icon">🎯</div>
                    <h3>No Milestones Yet</h3>
                    <p>Celebrate your achievements and track your progress milestones!</p>
                </div>
            `;
            return;
        }

        milestonesGrid.innerHTML = milestones.map(milestone => `
            <div class="milestone-card">
                <div class="milestone-card__icon">${this.getMilestoneIcon(milestone.milestone_type)}</div>
                <div class="milestone-card__content">
                    <h3 class="milestone-card__title">${milestone.title}</h3>
                    <p class="milestone-card__description">${milestone.description}</p>
                    <div class="milestone-card__stats">
                        ${milestone.target_value ? `<span class="milestone-stat">Target: ${milestone.target_value}</span>` : ''}
                        ${milestone.achieved_value ? `<span class="milestone-stat">Achieved: ${milestone.achieved_value}</span>` : ''}
                    </div>
                    <div class="milestone-card__date">${new Date(milestone.achievement_date).toLocaleDateString()}</div>
                </div>
            </div>
        `).join('');
    }

    async handlePhotoUpload(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        
        try {
            const response = await fetch(`${this.apiBaseUrl}/progress-photos/`, {
                method: 'POST',
                body: formData,
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                }
            });

            if (response.ok) {
                this.showSuccess('Photo uploaded successfully!');
                hidePhotoUpload();
                await this.loadPhotoProgressData();
                this.renderPhotoProgress();
            } else {
                const error = await response.json();
                this.showError(error.detail || 'Failed to upload photo');
            }
        } catch (error) {
            console.error('Error uploading photo:', error);
            this.showError('Error uploading photo');
        }
    }

    async handleMeasurementSubmit(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const data = Object.fromEntries(formData.entries());
        
        try {
            const response = await fetch(`${this.apiBaseUrl}/body-measurements/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                this.showSuccess('Measurement added successfully!');
                hideMeasurementForm();
                await this.loadPhotoProgressData();
                this.renderPhotoProgress();
            } else {
                const error = await response.json();
                this.showError(error.detail || 'Failed to add measurement');
            }
        } catch (error) {
            console.error('Error adding measurement:', error);
            this.showError('Error adding measurement');
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
                await this.loadPhotoProgressData();
                this.renderPhotoProgress();
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

    // Helper methods
    getPhotoTypeLabel(type) {
        const labels = {
            'front': 'Front View',
            'side': 'Side View',
            'back': 'Back View',
            'flexed': 'Flexed',
            'relaxed': 'Relaxed',
            'before': 'Before Photo',
            'after': 'After Photo',
            'milestone': 'Milestone Photo'
        };
        return labels[type] || type;
    }

    getBodyPartLabel(part) {
        const labels = {
            'neck': 'Neck',
            'chest': 'Chest',
            'shoulders': 'Shoulders',
            'left_bicep': 'Left Bicep',
            'right_bicep': 'Right Bicep',
            'left_forearm': 'Left Forearm',
            'right_forearm': 'Right Forearm',
            'waist': 'Waist',
            'hips': 'Hips',
            'left_thigh': 'Left Thigh',
            'right_thigh': 'Right Thigh',
            'left_calf': 'Left Calf',
            'right_calf': 'Right Calf'
        };
        return labels[part] || part;
    }

    getMilestoneIcon(type) {
        const icons = {
            'weight_loss': '⚖️',
            'muscle_gain': '💪',
            'strength_gain': '🏋️',
            'endurance': '🏃',
            'consistency': '📅',
            'transformation': '🔄'
        };
        return icons[type] || '🎯';
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
function showPhotoUpload() {
    document.getElementById('photo-upload-modal').classList.add('modal--show');
}

function hidePhotoUpload() {
    document.getElementById('photo-upload-modal').classList.remove('modal--show');
}

function showMeasurementForm() {
    document.getElementById('measurement-modal').classList.add('modal--show');
}

function hideMeasurementForm() {
    document.getElementById('measurement-modal').classList.remove('modal--show');
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

// Initialize photo progress manager when page loads
document.addEventListener('DOMContentLoaded', () => {
    new PhotoProgressManager();
});
