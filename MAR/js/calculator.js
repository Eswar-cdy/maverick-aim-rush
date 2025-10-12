// Calculator functionality for Maverick Aim Rush
// MAR/js/calculator.js

class Calculator {
    constructor() {
        this.userProfile = null;
        this.currentResults = null;
        this.init();
    }

    async init() {
        // Check authentication
        if (!getAccessToken()) {
            window.location.href = 'index.html';
            return;
        }

        // If calculator UI is not present on this page, skip initialization safely
        const hasCalculatorUI = !!document.getElementById('goal-type') || !!document.getElementById('calculate-btn');
        if (!hasCalculatorUI) {
            console.debug('Calculator UI not present on this page; skipping Calculator initialization');
            return;
        }

        // Load user profile
        await this.loadUserProfile();
        
        // Bind event listeners
        this.bindEventListeners();
        
        // Auto-calculate on page load
        await this.calculate();
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
        // Calculate button
        const calculateBtn = document.getElementById('calculate-btn');
        if (calculateBtn) {
            calculateBtn.addEventListener('click', () => this.calculate());
        }

        // Save macro targets button
        const saveMacroBtn = document.getElementById('save-macro-targets-btn');
        if (saveMacroBtn) {
            saveMacroBtn.addEventListener('click', () => this.saveMacroTargets());
        }

        // View history button
        const viewHistoryBtn = document.getElementById('view-history-btn');
        if (viewHistoryBtn) {
            viewHistoryBtn.addEventListener('click', () => this.showHistory());
        }

        // Close history button
        const closeHistoryBtn = document.getElementById('close-history-btn');
        if (closeHistoryBtn) {
            closeHistoryBtn.addEventListener('click', () => this.hideHistory());
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

    async calculate() {
        const calculateBtn = document.getElementById('calculate-btn');
        const goalTypeEl = document.getElementById('goal-type');
        const goalType = goalTypeEl ? goalTypeEl.value : 'maintenance';

        try {
            // Show loading state
            if (calculateBtn) {
                calculateBtn.textContent = 'Calculating...';
                calculateBtn.disabled = true;
            }

            // Call the calculator API
            const results = await calculateFitnessMetrics(goalType);
            
            if (results?.error) {
                this.showError(results.error);
                return;
            }

            this.currentResults = results;
            this.displayResults(results);
            this.showResults();

        } catch (error) {
            console.error('Calculation failed:', error);
            this.showError('Failed to calculate metrics. Please ensure you have logged your weight and height in the Progress page.');
        } finally {
            // Reset button state
            if (calculateBtn) {
                calculateBtn.textContent = 'Calculate';
                calculateBtn.disabled = false;
            }
        }
    }

    displayResults(results) {
        // Display BMI
        this.updateElement('bmi-value', results.bmi.bmi);
        this.updateElement('bmi-category', results.bmi.category);
        this.updateElement('bmi-weight', this.formatWeight(results.bmi.weight_kg));
        this.updateElement('bmi-height', this.formatHeight(results.bmi.height_cm));

        // Display BMR
        this.updateElement('bmr-value', Math.round(results.bmr.bmr));
        this.updateElement('bmr-age', results.bmr.age);
        this.updateElement('bmr-gender', results.bmr.gender);

        // Display TDEE
        this.updateElement('tdee-value', Math.round(results.tdee.tdee));
        this.updateElement('tdee-activity', this.formatActivityLevel(results.tdee.activity_level));
        this.updateElement('tdee-multiplier', results.tdee.multiplier);

        // Display Macros
        this.updateElement('macro-calories', Math.round(results.macros.calories));
        this.updateElement('macro-protein', results.macros.protein_g);
        this.updateElement('macro-carbs', results.macros.carbs_g);
        this.updateElement('macro-fat', results.macros.fat_g);
        this.updateElement('macro-goal', this.formatGoalType(results.macros.goal_type));
        this.updateElement('macro-protein-per-kg', `${results.macros.protein_per_kg}g/kg`);
    }

    updateElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }

    formatWeight(weightKg) {
        if (!this.userProfile || this.userProfile.unit_system === 'metric') {
            return `${weightKg} kg`;
        }
        const weightLb = Math.round(weightKg * 2.20462);
        return `${weightLb} lbs`;
    }

    formatHeight(heightCm) {
        if (!this.userProfile || this.userProfile.unit_system === 'metric') {
            return `${heightCm} cm`;
        }
        const feet = Math.floor(heightCm / 30.48);
        const inches = Math.round((heightCm % 30.48) / 2.54);
        return `${feet}'${inches}"`;
    }

    formatActivityLevel(activity) {
        const levels = {
            'sedentary': 'Sedentary',
            'light': 'Light Activity',
            'moderate': 'Moderate Activity',
            'active': 'Active',
            'very_active': 'Very Active'
        };
        return levels[activity] || activity;
    }

    formatGoalType(goal) {
        const goals = {
            'weight_loss': 'Weight Loss',
            'muscle_gain': 'Muscle Gain',
            'maintenance': 'Maintenance',
            'performance': 'Performance'
        };
        return goals[goal] || goal;
    }

    showResults() {
        const resultsSection = document.getElementById('results-section');
        if (resultsSection) {
            resultsSection.style.display = 'block';
            resultsSection.scrollIntoView({ behavior: 'smooth' });
        }
    }

    async saveMacroTargets() {
        if (!this.currentResults) {
            this.showError('Please calculate your metrics first.');
            return;
        }

        const saveBtn = document.getElementById('save-macro-targets-btn');
        const goalTypeEl = document.getElementById('goal-type');
        const goalType = goalTypeEl ? goalTypeEl.value : 'maintenance';

        try {
            if (saveBtn) {
                saveBtn.textContent = 'Saving...';
                saveBtn.disabled = true;
            }

            await createMacroTarget(goalType);
            this.showSuccess('Macro targets saved successfully!');

        } catch (error) {
            console.error('Failed to save macro targets:', error);
            this.showError('Failed to save macro targets. Please try again.');
        } finally {
            if (saveBtn) {
                saveBtn.textContent = 'Save Macro Targets';
                saveBtn.disabled = false;
            }
        }
    }

    async showHistory() {
        try {
            const history = await fetchCalculationHistory();
            this.displayHistory(history);
            
            const historySection = document.getElementById('history-section');
            if (historySection) {
                historySection.style.display = 'block';
                historySection.scrollIntoView({ behavior: 'smooth' });
            }
        } catch (error) {
            console.error('Failed to load history:', error);
            this.showError('Failed to load calculation history.');
        }
    }

    displayHistory(history) {
        const historyContent = document.getElementById('history-content');
        if (!historyContent) return;

        if (history.length === 0) {
            historyContent.innerHTML = '<p class="history-empty">No calculation history found.</p>';
            return;
        }

        const historyHTML = history.map(item => {
            const date = new Date(item.calculated_at).toLocaleDateString();
            const resultData = item.result_data;
            
            return `
                <div class="history-item">
                    <div class="history-item__header">
                        <span class="history-item__date">${date}</span>
                        <span class="history-item__type">${item.calculation_type.toUpperCase()}</span>
                    </div>
                    <div class="history-item__content">
                        ${resultData.bmi ? `
                            <div class="history-item__metric">
                                <strong>BMI:</strong> ${resultData.bmi.bmi} (${resultData.bmi.category})
                            </div>
                        ` : ''}
                        ${resultData.bmr ? `
                            <div class="history-item__metric">
                                <strong>BMR:</strong> ${Math.round(resultData.bmr.bmr)} cal/day
                            </div>
                        ` : ''}
                        ${resultData.tdee ? `
                            <div class="history-item__metric">
                                <strong>TDEE:</strong> ${Math.round(resultData.tdee.tdee)} cal/day
                            </div>
                        ` : ''}
                        ${resultData.macros ? `
                            <div class="history-item__metric">
                                <strong>Macros:</strong> ${Math.round(resultData.macros.calories)} cal, 
                                ${resultData.macros.protein_g}g protein, 
                                ${resultData.macros.carbs_g}g carbs, 
                                ${resultData.macros.fat_g}g fat
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');

        historyContent.innerHTML = historyHTML;
    }

    hideHistory() {
        const historySection = document.getElementById('history-section');
        if (historySection) {
            historySection.style.display = 'none';
        }
    }

    async toggleUnits() {
        if (!this.userProfile) return;

        try {
            const newUnitSystem = this.userProfile.unit_system === 'imperial' ? 'metric' : 'imperial';
            
            await updateUserProfile({ unit_system: newUnitSystem });
            this.userProfile.unit_system = newUnitSystem;
            
            this.updateUnitsDisplay();
            
            // Re-display results with new units if we have results
            if (this.currentResults) {
                this.displayResults(this.currentResults);
            }
            
        } catch (error) {
            console.error('Failed to update units:', error);
            this.showError('Failed to update units. Please try again.');
        }
    }

    async logout() {
        try {
            await logout();
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Logout failed:', error);
            // Force redirect even if logout fails
            window.location.href = 'index.html';
        }
    }

    showError(message) {
        // Simple error display - you could enhance this with a proper notification system
        alert(`Error: ${message}`);
    }

    showSuccess(message) {
        // Simple success display - you could enhance this with a proper notification system
        alert(`Success: ${message}`);
    }
}

// Initialize calculator when page loads
document.addEventListener('DOMContentLoaded', () => {
    new Calculator();
});
