// Smart Recommendations functionality for Maverick Aim Rush
// MAR/js/recommendations.js

class RecommendationsDashboard {
    constructor() {
        this.userProfile = null;
        this.currentRecommendations = null;
        this.activeFilter = 'all';
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
        
        // Load initial recommendations
        await this.loadRecommendations();
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
        // Filter tabs
        const filterTabs = document.querySelectorAll('.filter-tab');
        filterTabs.forEach(tab => {
            tab.addEventListener('click', (e) => this.handleFilterChange(e.target.dataset.type));
        });

        // Refresh button
        const refreshBtn = document.getElementById('refresh-recommendations');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.loadRecommendations());
        }

        // Retry button
        const retryBtn = document.getElementById('retry-btn');
        if (retryBtn) {
            retryBtn.addEventListener('click', () => this.loadRecommendations());
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
    }

    handleFilterChange(filterType) {
        this.activeFilter = filterType;
        
        // Update active tab
        document.querySelectorAll('.filter-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-type="${filterType}"]`).classList.add('active');
        
        // Show/hide sections
        this.filterSections(filterType);
    }

    filterSections(filterType) {
        const sections = document.querySelectorAll('.recommendations-section');
        
        sections.forEach(section => {
            if (filterType === 'all') {
                section.style.display = 'block';
            } else {
                section.style.display = section.id === `${filterType}-section` ? 'block' : 'none';
            }
        });
    }

    async loadRecommendations() {
        this.showLoading();
        
        try {
            const response = await apiFetch('/recommendations/');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            this.currentRecommendations = await response.json();
            
            // Check if we have meaningful recommendations
            if (this.currentRecommendations && !this.currentRecommendations.error) {
                this.displayRecommendations();
                this.showContent();
            } else {
                this.showNoDataMessage();
            }
            
        } catch (error) {
            console.error('Failed to load recommendations:', error);
            this.showNoDataMessage();
        }
    }

    displayRecommendations() {
        if (!this.currentRecommendations) return;

        // Display workout recommendations
        this.displayWorkoutRecommendations();
        
        // Display nutrition recommendations
        this.displayNutritionRecommendations();
        
        // Display progress recommendations
        this.displayProgressRecommendations();
    }

    displayWorkoutRecommendations() {
        const workout = this.currentRecommendations.workout;
        if (!workout) return;

        // Next Workout
        this.updateElement('next-workout-content', this.renderNextWorkout(workout.next_workout));
        
        // Exercise Suggestions
        this.updateElement('exercise-suggestions-content', this.renderExerciseSuggestions(workout.exercise_suggestions));
        
        // Intensity Adjustment
        this.updateElement('intensity-adjustment-content', this.renderIntensityAdjustment(workout.intensity_adjustment));
        
        // Rest Recommendations
        this.updateElement('rest-recommendations-content', this.renderRestRecommendations(workout.rest_recommendations));
    }

    displayNutritionRecommendations() {
        const nutrition = this.currentRecommendations.nutrition;
        if (!nutrition) return;

        // Macro Balance
        this.updateElement('macro-balance-content', this.renderMacroBalance(nutrition.macro_balance));
        
        // Meal Timing
        this.updateElement('meal-timing-content', this.renderMealTiming(nutrition.meal_timing));
        
        // Hydration
        this.updateElement('hydration-content', this.renderHydration(nutrition.hydration));
        
        // Supplements
        this.updateElement('supplements-content', this.renderSupplements(nutrition.supplements));
    }

    displayProgressRecommendations() {
        const progress = this.currentRecommendations.progress;
        if (!progress) return;

        // Goal Adjustments
        this.updateElement('goal-adjustments-content', this.renderGoalAdjustments(progress.goal_adjustments));
        
        // Plateau Breaking
        this.updateElement('plateau-breaking-content', this.renderPlateauBreaking(progress.plateau_breaking));
        
        // Consistency Tips
        this.updateElement('consistency-tips-content', this.renderConsistencyTips(progress.consistency_tips));
        
        // Recovery Optimization
        this.updateElement('recovery-optimization-content', this.renderRecoveryOptimization(progress.recovery_optimization));
    }

    renderNextWorkout(nextWorkout) {
        if (!nextWorkout) return '<p>No workout recommendation available.</p>';
        
        return `
            <div class="workout-recommendation">
                <div class="workout-type">${nextWorkout.type}</div>
                <div class="workout-focus">${nextWorkout.focus}</div>
                <div class="workout-reasoning">${nextWorkout.reasoning}</div>
                <div class="workout-exercises">
                    <h4>Suggested Exercises:</h4>
                    <ul>
                        ${nextWorkout.exercises.map(exercise => `<li>${exercise}</li>`).join('')}
                    </ul>
                </div>
            </div>
        `;
    }

    renderExerciseSuggestions(suggestions) {
        if (!suggestions || suggestions.length === 0) {
            return '<p>No exercise suggestions available.</p>';
        }
        
        return `
            <div class="exercise-suggestions">
                ${suggestions.map(suggestion => `
                    <div class="exercise-suggestion">
                        <div class="exercise-name">${suggestion.name}</div>
                        <div class="exercise-details">
                            <span class="exercise-category">${suggestion.category}</span>
                            <span class="exercise-difficulty">${suggestion.difficulty}</span>
                        </div>
                        <div class="exercise-reason">${suggestion.reason}</div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderIntensityAdjustment(adjustment) {
        if (!adjustment) return '<p>No intensity adjustment available.</p>';
        
        const adjustmentClass = adjustment.adjustment === 'increase' ? 'increase' : 
                               adjustment.adjustment === 'decrease' ? 'decrease' : 'maintain';
        
        return `
            <div class="intensity-adjustment ${adjustmentClass}">
                <div class="adjustment-type">${adjustment.adjustment.toUpperCase()}</div>
                <div class="adjustment-reason">${adjustment.reason}</div>
                <div class="adjustment-suggestion">${adjustment.suggestion}</div>
            </div>
        `;
    }

    renderRestRecommendations(rest) {
        if (!rest) return '<p>No rest recommendations available.</p>';
        
        return `
            <div class="rest-recommendation">
                <div class="rest-status ${rest.rest_needed ? 'rest-needed' : 'rest-ok'}">
                    ${rest.rest_needed ? 'Rest Recommended' : 'Good Recovery'}
                </div>
                <div class="rest-reason">${rest.reason}</div>
                <div class="rest-suggestion">${rest.suggestion}</div>
            </div>
        `;
    }

    renderMacroBalance(macroBalance) {
        if (!macroBalance || macroBalance.status === 'no_data') {
            return `<p>${macroBalance?.message || 'No macro data available.'}</p>`;
        }
        
        return `
            <div class="macro-balance">
                <div class="macro-comparison">
                    <div class="macro-current">
                        <h4>Current Intake</h4>
                        <div class="macro-bars">
                            <div class="macro-bar">
                                <span class="macro-label">Protein</span>
                                <div class="macro-bar-fill" style="width: ${parseFloat(macroBalance.current.protein)}%"></div>
                                <span class="macro-value">${macroBalance.current.protein}</span>
                            </div>
                            <div class="macro-bar">
                                <span class="macro-label">Carbs</span>
                                <div class="macro-bar-fill" style="width: ${parseFloat(macroBalance.current.carbs)}%"></div>
                                <span class="macro-value">${macroBalance.current.carbs}</span>
                            </div>
                            <div class="macro-bar">
                                <span class="macro-label">Fat</span>
                                <div class="macro-bar-fill" style="width: ${parseFloat(macroBalance.current.fat)}%"></div>
                                <span class="macro-value">${macroBalance.current.fat}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="macro-recommendations">
                    ${macroBalance.recommendations.map(rec => `
                        <div class="macro-recommendation ${rec.status}">
                            <div class="macro-issue">${rec.macro.toUpperCase()} - ${rec.status.toUpperCase()}</div>
                            <div class="macro-suggestion">${rec.suggestion}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    renderMealTiming(timing) {
        if (!timing) return '<p>No meal timing recommendations available.</p>';
        
        return `
            <div class="meal-timing">
                <div class="timing-item">
                    <div class="timing-label">Pre-Workout</div>
                    <div class="timing-suggestion">${timing.pre_workout}</div>
                </div>
                <div class="timing-item">
                    <div class="timing-label">Post-Workout</div>
                    <div class="timing-suggestion">${timing.post_workout}</div>
                </div>
                <div class="timing-reasoning">${timing.reasoning}</div>
            </div>
        `;
    }

    renderHydration(hydration) {
        if (!hydration) return '<p>No hydration recommendations available.</p>';
        
        return `
            <div class="hydration-recommendations">
                <div class="hydration-target">
                    <div class="hydration-label">Daily Target</div>
                    <div class="hydration-value">${hydration.daily_target}</div>
                </div>
                <div class="hydration-schedule">
                    <div class="hydration-item">
                        <span class="hydration-time">Pre-Workout:</span>
                        <span class="hydration-amount">${hydration.pre_workout}</span>
                    </div>
                    <div class="hydration-item">
                        <span class="hydration-time">During Workout:</span>
                        <span class="hydration-amount">${hydration.during_workout}</span>
                    </div>
                    <div class="hydration-item">
                        <span class="hydration-time">Post-Workout:</span>
                        <span class="hydration-amount">${hydration.post_workout}</span>
                    </div>
                </div>
                ${hydration.tip ? `<div class="hydration-tip">💡 ${hydration.tip}</div>` : ''}
            </div>
        `;
    }

    renderSupplements(supplements) {
        if (!supplements || supplements.length === 0) {
            return '<p>No supplement recommendations available.</p>';
        }
        
        return `
            <div class="supplement-suggestions">
                ${supplements.map(supplement => `
                    <div class="supplement-item">
                        <div class="supplement-name">${supplement.name}</div>
                        <div class="supplement-reason">${supplement.reason}</div>
                        <div class="supplement-timing">⏰ ${supplement.timing}</div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderGoalAdjustments(adjustments) {
        if (!adjustments || adjustments.length === 0) {
            return '<p>Your goals are on track! No adjustments needed.</p>';
        }
        
        return `
            <div class="goal-adjustments">
                ${adjustments.map(adjustment => `
                    <div class="goal-adjustment">
                        <div class="adjustment-goal">${adjustment.goal.replace('_', ' ').toUpperCase()}</div>
                        <div class="adjustment-issue">${adjustment.issue}</div>
                        <div class="adjustment-suggestion">${adjustment.suggestion}</div>
                        <div class="adjustment-reason">${adjustment.reason}</div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderPlateauBreaking(strategies) {
        if (!strategies || strategies.length === 0) {
            return '<p>No plateau-breaking strategies available.</p>';
        }
        
        return `
            <div class="plateau-strategies">
                ${strategies.map(strategy => `
                    <div class="plateau-strategy">
                        <div class="strategy-name">${strategy.strategy}</div>
                        <div class="strategy-suggestion">${strategy.suggestion}</div>
                        <div class="strategy-reason">${strategy.reason}</div>
                        ${strategy.exercises ? `
                            <div class="strategy-exercises">
                                <strong>Affected Exercises:</strong> ${strategy.exercises.join(', ')}
                            </div>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderConsistencyTips(tips) {
        if (!tips || tips.length === 0) {
            return '<p>Great job staying consistent!</p>';
        }
        
        return `
            <div class="consistency-tips">
                ${tips.map(tip => `
                    <div class="consistency-tip">
                        <div class="tip-area">${tip.area}</div>
                        <div class="tip-issue">${tip.issue || ''}</div>
                        <div class="tip-suggestion">${tip.suggestion}</div>
                        ${tip.tips ? `
                            <div class="tip-details">
                                <ul>
                                    ${tip.tips.map(detail => `<li>${detail}</li>`).join('')}
                                </ul>
                            </div>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderRecoveryOptimization(optimizations) {
        if (!optimizations || optimizations.length === 0) {
            return '<p>No recovery optimization suggestions available.</p>';
        }
        
        return `
            <div class="recovery-optimizations">
                ${optimizations.map(opt => `
                    <div class="recovery-optimization">
                        <div class="optimization-area">${opt.area}</div>
                        <div class="optimization-suggestion">${opt.suggestion}</div>
                        <div class="optimization-reason">${opt.reason}</div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    updateElement(id, content) {
        const element = document.getElementById(id);
        if (element) {
            element.innerHTML = content;
        }
    }

    showLoading() {
        document.getElementById('loading-section').style.display = 'block';
        document.getElementById('recommendations-content').style.display = 'none';
        document.getElementById('error-section').style.display = 'none';
    }

    showContent() {
        document.getElementById('loading-section').style.display = 'none';
        document.getElementById('recommendations-content').style.display = 'block';
        document.getElementById('error-section').style.display = 'none';
    }

    showError() {
        document.getElementById('loading-section').style.display = 'none';
        document.getElementById('recommendations-content').style.display = 'none';
        document.getElementById('error-section').style.display = 'block';
    }

    showNoDataMessage() {
        document.getElementById('loading-section').style.display = 'none';
        document.getElementById('recommendations-content').style.display = 'none';
        
        // Update error message for no data scenario
        const errorSection = document.getElementById('error-section');
        const errorTitle = errorSection.querySelector('.error-title');
        const errorMessage = errorSection.querySelector('.error-message');
        
        errorTitle.textContent = 'No Data Available';
        errorMessage.textContent = 'To get personalized AI recommendations, please log some workouts and nutrition data first. Start by logging a workout or meal to see your personalized insights!';
        
        errorSection.style.display = 'block';
    }

    async toggleUnits() {
        if (!this.userProfile) return;

        try {
            const newUnitSystem = this.userProfile.unit_system === 'imperial' ? 'metric' : 'imperial';
            
            await updateUserProfile({ unit_system: newUnitSystem });
            this.userProfile.unit_system = newUnitSystem;
            
            this.updateUnitsDisplay();
            
            // Refresh recommendations to show updated units
            await this.loadRecommendations();
            
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

// Initialize recommendations dashboard when page loads
document.addEventListener('DOMContentLoaded', () => {
    new RecommendationsDashboard();
});
