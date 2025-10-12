// Enhanced Nutrition System - World-Class Nutrition Tracking
// Integrates with the new comprehensive nutrition backend APIs

class EnhancedNutritionTracker {
    constructor() {
        this.currentTab = 'overview';
        this.today = new Date().toISOString().slice(0, 10);
        this.nutritionGoals = null;
        this.todaysLogs = [];
        this.mealPlans = [];
        this.recipes = [];
        this.waterIntake = parseInt(localStorage.getItem('waterIntake') || '0');
        this.supplements = [];
        this.analytics = null;
        
        this.initializeEventListeners();
        this.loadInitialData();
        this.initializeFormHandlers();
    }

    initializeEventListeners() {
        // Tab switching
        document.querySelectorAll('.nutrition-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Water intake buttons are now handled by onclick attributes

        // Recipe filters
        document.getElementById('recipe-filter-meal-type')?.addEventListener('change', () => {
            this.filterRecipes();
        });
        document.getElementById('recipe-filter-difficulty')?.addEventListener('change', () => {
            this.filterRecipes();
        });
        document.getElementById('recipe-search')?.addEventListener('input', () => {
            this.filterRecipes();
        });

        // Analytics timeframe
        document.getElementById('analytics-timeframe')?.addEventListener('change', () => {
            this.loadAnalytics();
        });

        // Tracking date
        document.getElementById('tracking-date')?.addEventListener('change', () => {
            this.loadFoodLog();
        });

        // Set today's date
        document.getElementById('tracking-date').value = this.today;
    }

    async loadInitialData() {
        try {
            await Promise.all([
                this.loadNutritionGoals(),
                this.loadTodaysLogs(),
                this.loadWaterIntake(),
                this.loadSupplements(),
                this.loadNutritionAnalytics(),
                this.loadMealPlans(),
                this.loadRecipes()
            ]);
            
            this.updateOverview();
        } catch (error) {
            console.error('Error loading initial data:', error);
            this.showError('Failed to load nutrition data. Please refresh the page.');
        }
    }

    async loadNutritionGoals() {
        try {
            const response = await apiFetch('/nutrition-goals/?is_active=true');
            if (response.ok) {
                const goals = await response.json();
                this.nutritionGoals = goals.results?.[0] || null;
                if (this.nutritionGoals) {
                    this.updateMacroTargets();
                }
            }
        } catch (error) {
            console.error('Error loading nutrition goals:', error);
        }
    }

    async loadTodaysLogs() {
        try {
            const response = await apiFetch(`/nutrition-logs/?date=${this.today}`);
            if (response.ok) {
            const data = await response.json();
                this.todaysLogs = data.results || data;
            }
        } catch (error) {
            console.error('Error loading today\'s logs:', error);
        }
    }

    async loadWaterIntake() {
        try {
            const response = await apiFetch(`/water-intake/?date=${this.today}`);
            if (response.ok) {
                const data = await response.json();
                const intakes = data.results || data;
                this.waterIntake = intakes.reduce((total, intake) => total + intake.amount_ml, 0);
            }
        } catch (error) {
            console.error('Error loading water intake:', error);
        }
    }

    async loadSupplements() {
        try {
            const response = await apiFetch(`/supplement-logs/?date=${this.today}`);
            if (response.ok) {
                const data = await response.json();
                this.supplements = data.results || data;
            }
        } catch (error) {
            console.error('Error loading supplements:', error);
        }
    }

    async loadNutritionAnalytics() {
        try {
            const response = await apiFetch('/nutrition-analytics/');
            if (response.ok) {
                this.analytics = await response.json();
            }
        } catch (error) {
            console.error('Error loading nutrition analytics:', error);
        }
    }

    async loadMealPlans() {
        try {
            const response = await apiFetch('/meal-plans/?is_active=true');
            if (response.ok) {
                const data = await response.json();
                this.mealPlans = data.results || data;
            }
        } catch (error) {
            console.error('Error loading meal plans:', error);
        }
    }

    async loadRecipes() {
        try {
            const response = await apiFetch('/recipes/?is_public=true');
            if (response.ok) {
                const data = await response.json();
                this.recipes = data.results || data;
            }
        } catch (error) {
            console.error('Error loading recipes:', error);
        }
    }

    switchTab(tabId) {
        // Update tab buttons
        document.querySelectorAll('.nutrition-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');

        // Update tab panes
        document.querySelectorAll('.nutrition-tab-pane').forEach(pane => {
            pane.classList.remove('active');
        });
        document.getElementById(tabId).classList.add('active');

        this.currentTab = tabId;

        // Load tab-specific data
        switch (tabId) {
            case 'meal-plan':
                this.loadMealPlanContent();
                break;
            case 'recipes':
                this.renderRecipes();
                break;
            case 'tracking':
                this.loadFoodLog();
                break;
            case 'analytics':
                this.loadAnalytics();
                break;
        }
    }

    updateMacroTargets() {
        if (!this.nutritionGoals) return;

        document.getElementById('calories-target').textContent = this.nutritionGoals.target_calories;
        document.getElementById('protein-target').textContent = this.nutritionGoals.target_protein_g;
        document.getElementById('carbs-target').textContent = this.nutritionGoals.target_carbs_g;
        document.getElementById('fat-target').textContent = this.nutritionGoals.target_fat_g;
        document.getElementById('water-target').textContent = this.nutritionGoals.target_water_liters * 1000;
    }

    updateOverview() {
        this.updateMacroProgress();
        this.updateWaterProgress();
        this.renderWaterPieChart();
        this.updateSupplementsList();
        this.updateRecommendations();
    }

    updateMacroProgress() {
        const consumed = { calories: 0, protein: 0, carbs: 0, fat: 0 };
        
        this.todaysLogs.forEach(log => {
            consumed.calories += log.calories || 0;
            consumed.protein += log.protein_g || 0;
            consumed.carbs += log.carbs_g || 0;
            consumed.fat += log.fat_g || 0;
        });

        // Update consumed values
        document.getElementById('calories-consumed').textContent = Math.round(consumed.calories);
        document.getElementById('protein-consumed').textContent = Math.round(consumed.protein);
        document.getElementById('carbs-consumed').textContent = Math.round(consumed.carbs);
        document.getElementById('fat-consumed').textContent = Math.round(consumed.fat);

        // Update progress bars
        this.updateProgressBar('calories', consumed.calories, this.nutritionGoals?.target_calories || 2000);
        this.updateProgressBar('protein', consumed.protein, this.nutritionGoals?.target_protein_g || 120);
        this.updateProgressBar('carbs', consumed.carbs, this.nutritionGoals?.target_carbs_g || 200);
        this.updateProgressBar('fat', consumed.fat, this.nutritionGoals?.target_fat_g || 78);
    }

    updateProgressBar(nutrient, consumed, target) {
        const percentage = target > 0 ? Math.min((consumed / target) * 100, 100) : 0;
        const progressBar = document.getElementById(`${nutrient}-progress`);
        if (progressBar) {
            progressBar.style.width = `${percentage}%`;
        }
    }

    updateWaterProgress() {
        const target = this.nutritionGoals?.target_water_liters * 1000 || 2500;
        
        document.getElementById('water-consumed').textContent = Math.round(this.waterIntake);
        document.getElementById('water-target').textContent = target;
    }

    renderWaterPieChart() {
        const canvas = document.getElementById('water-pie-chart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = 70; // Increased radius for larger chart
        
        const target = this.nutritionGoals?.target_water_liters * 1000 || 2500;
        const consumed = this.waterIntake;
        const percentage = Math.min((consumed / target) * 100, 100);
        const isExceeded = consumed > target;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw background circle
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.fillStyle = '#f1f5f9';
        ctx.fill();
        
        // Draw consumed portion
        if (consumed > 0) {
            const startAngle = -Math.PI / 2; // Start from top
            const endAngle = startAngle + (percentage / 100) * 2 * Math.PI;
            
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            ctx.lineTo(centerX, centerY);
            
            // Use different colors based on target status
            if (isExceeded) {
                ctx.fillStyle = '#ef4444'; // Red for exceeded
            } else if (percentage >= 80) {
                ctx.fillStyle = '#10b981'; // Green for almost complete
            } else {
                ctx.fillStyle = '#3b82f6'; // Blue for normal
            }
            ctx.fill();
        }
        
        // Draw inner circle for donut effect
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * 0.65, 0, 2 * Math.PI);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        
        // Update progress bar
        this.updateHydrationProgressBar(percentage, isExceeded);
        
        // Update status text
        this.updateHydrationStatus(percentage, isExceeded);
        
        // Update card styling based on target status
        this.updateHydrationCardStyling(isExceeded);
    }

    updateHydrationProgressBar(percentage, isExceeded) {
        const progressFill = document.getElementById('hydration-progress-fill');
        const percentageText = document.getElementById('hydration-percentage');
        
        if (progressFill) {
            progressFill.style.width = `${Math.min(percentage, 100)}%`;
        }
        
        if (percentageText) {
            percentageText.textContent = `${Math.round(percentage)}%`;
        }
    }

    updateHydrationStatus(percentage, isExceeded) {
        const statusElement = document.getElementById('hydration-status');
        if (!statusElement) return;
        
        const statusText = statusElement.querySelector('.status-text');
        if (!statusText) return;
        
        if (isExceeded) {
            statusText.textContent = 'Target Exceeded!';
            statusText.style.color = '#dc2626';
            statusText.style.background = '#fef2f2';
        } else if (percentage >= 100) {
            statusText.textContent = 'Goal Achieved!';
            statusText.style.color = '#059669';
            statusText.style.background = '#f0fdf4';
        } else if (percentage >= 80) {
            statusText.textContent = 'Almost There!';
            statusText.style.color = '#059669';
            statusText.style.background = '#f0fdf4';
        } else if (percentage >= 50) {
            statusText.textContent = 'Good Progress!';
            statusText.style.color = '#0891b2';
            statusText.style.background = '#f0f9ff';
        } else {
            statusText.textContent = 'Keep Hydrating!';
            statusText.style.color = '#64748b';
            statusText.style.background = '#f8fafc';
        }
    }

    updateHydrationCardStyling(isExceeded) {
        const hydrationCard = document.querySelector('.hydration-card');
        if (!hydrationCard) return;
        
        if (isExceeded) {
            hydrationCard.classList.add('hydration-exceeded');
        } else {
            hydrationCard.classList.remove('hydration-exceeded');
        }
    }

    updateSupplementsList() {
        const container = document.getElementById('supplements-list');
        if (!container) return;

        if (this.supplements.length === 0) {
            container.innerHTML = '<p class="no-supplements">No supplements logged today.</p>';
            return;
        }

        container.innerHTML = this.supplements.map(supplement => `
            <div class="supplement-item">
                <div class="supplement-info">
                    <strong>${supplement.supplement_name}</strong>
                    <span class="supplement-dosage">${supplement.dosage}</span>
                </div>
                <button class="remove-supplement-btn" onclick="nutritionTracker.removeSupplement(${supplement.id})">×</button>
            </div>
        `).join('');
    }

    updateRecommendations() {
        const container = document.getElementById('nutrition-recommendations');
        if (!container) return;

        if (!this.analytics || !this.analytics.recommendations) {
            container.innerHTML = '<p class="no-recommendations">No recommendations available.</p>';
            return;
        }

        container.innerHTML = this.analytics.recommendations.map(rec => `
            <div class="recommendation-item">
                <span class="recommendation-icon">💡</span>
                <span class="recommendation-text">${rec}</span>
            </div>
        `).join('');
    }

    async addWaterIntake(amount) {
        // Update local state immediately for better UX
        this.waterIntake += amount;
        localStorage.setItem('waterIntake', this.waterIntake.toString());
        this.updateWaterProgress();
        this.renderWaterPieChart();
        this.showToast(`Added ${amount}ml of water!`, 'success');

        // Try to sync with backend (optional)
        try {
            const response = await apiFetch('/water-intake/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date: this.today,
                    amount_ml: amount
                })
            });

            if (!response.ok) {
                console.warn('Failed to sync water intake with server, but local data is saved');
            }
        } catch (error) {
            console.warn('Failed to sync water intake with server, but local data is saved:', error);
        }
    }

    async removeSupplement(supplementId) {
        try {
            const response = await apiFetch(`/supplement-logs/${supplementId}/`, {
                method: 'DELETE'
            });

            if (response.ok) {
                this.supplements = this.supplements.filter(s => s.id !== supplementId);
                this.updateSupplementsList();
                this.showToast('Supplement removed', 'success');
            }
        } catch (error) {
            console.error('Error removing supplement:', error);
            this.showToast('Failed to remove supplement', 'error');
        }
    }

    async loadMealPlanContent() {
        const container = document.getElementById('meal-plan-content');
        if (!container) return;

        if (this.mealPlans.length === 0) {
            container.innerHTML = `
                <div class="no-meal-plan">
                    <h4>No active meal plan found</h4>
                    <p>Generate a personalized meal plan based on your nutrition goals.</p>
                    <button class="btn-primary" onclick="generateMealPlan()">Generate Meal Plan</button>
                </div>
            `;
            return;
        }

        const activePlan = this.mealPlans[0];
        container.innerHTML = `
            <div class="meal-plan-info">
                <h4>${activePlan.name}</h4>
                <p>${activePlan.description}</p>
                <div class="meal-plan-stats">
                    <span>Target: ${activePlan.target_calories} cal</span>
                    <span>Protein: ${activePlan.target_protein_g}g</span>
                    <span>Carbs: ${activePlan.target_carbs_g}g</span>
                    <span>Fat: ${activePlan.target_fat_g}g</span>
                </div>
            </div>
            <div class="meal-plan-days">
                ${activePlan.days?.map(day => this.renderMealPlanDay(day)).join('') || '<p>No meals planned yet.</p>'}
            </div>
        `;
    }

    renderMealPlan(mealPlan) {
        if (!mealPlan || !mealPlan.days) {
            return '<div class="no-meal-plans">No meal plan data available.</div>';
        }

        return `
            <div class="meal-plan-details">
                <h4>${mealPlan.name}</h4>
                <p>${mealPlan.description}</p>
            </div>
            <div class="meal-plan-days">
                ${mealPlan.days.map(day => `
                    <div class="meal-plan-day">
                        <h5>${day.day}</h5>
                        <div class="day-meals">
                            ${day.meals.map(meal => `
                                <div class="meal-item">
                                    <div class="meal-header">
                                        <span class="meal-type">${meal.meal_type.charAt(0).toUpperCase() + meal.meal_type.slice(1)}</span>
                                        <span class="meal-calories">${meal.calories} cal</span>
                                    </div>
                                    <h6>${meal.name}</h6>
                                    <div class="meal-nutrition">
                                        <span>P: ${meal.protein}g</span>
                                        <span>C: ${meal.carbs}g</span>
                                        <span>F: ${meal.fat}g</span>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderMealPlanDay(day) {
        return `
            <div class="meal-plan-day">
                <h5>${day.day_name} - ${day.date}</h5>
                <div class="day-meals">
                    ${day.meals?.map(meal => this.renderMeal(meal)).join('') || '<p>No meals planned for this day.</p>'}
                </div>
            </div>
        `;
    }

    renderMeal(meal) {
        return `
            <div class="meal-item">
                <div class="meal-header">
                    <h6>${meal.meal_type}</h6>
                    <span class="meal-calories">${meal.calories} cal</span>
                </div>
                <div class="meal-macros">
                    <span>P: ${meal.protein_g}g</span>
                    <span>C: ${meal.carbs_g}g</span>
                    <span>F: ${meal.fat_g}g</span>
                </div>
                ${meal.recipe_name ? `<p class="meal-recipe">Recipe: ${meal.recipe_name}</p>` : ''}
            </div>
        `;
    }

    renderRecipes() {
        const container = document.getElementById('recipes-grid');
        if (!container) return;

        if (this.recipes.length === 0) {
            container.innerHTML = '<p class="no-recipes">No recipes available.</p>';
            return;
        }

        container.innerHTML = this.recipes.map(recipe => `
            <div class="recipe-card">
                <div class="recipe-image">
                    ${recipe.image_url ? `<img src="${recipe.image_url}" alt="${recipe.name}">` : '<div class="recipe-placeholder">🍽️</div>'}
                </div>
                <div class="recipe-info">
                    <h4>${recipe.name}</h4>
                    <p class="recipe-description">${recipe.description}</p>
                    <div class="recipe-meta">
                        <span class="recipe-difficulty">${recipe.difficulty}</span>
                        <span class="recipe-time">${recipe.prep_time_minutes + recipe.cook_time_minutes}min</span>
                        <span class="recipe-servings">${recipe.servings} servings</span>
                    </div>
                    <div class="recipe-nutrition">
                        <span>${recipe.calories_per_serving} cal</span>
                        <span>P: ${recipe.protein_g_per_serving}g</span>
                        <span>C: ${recipe.carbs_g_per_serving}g</span>
                        <span>F: ${recipe.fat_g_per_serving}g</span>
                    </div>
                    <button class="btn-secondary" onclick="viewRecipe(${recipe.id})">View Recipe</button>
                </div>
            </div>
        `).join('');
    }

    filterRecipes() {
        const mealTypeFilter = document.getElementById('recipe-filter-meal-type').value;
        const difficultyFilter = document.getElementById('recipe-filter-difficulty').value;
        const searchTerm = document.getElementById('recipe-search').value.toLowerCase();

        const filteredRecipes = this.recipes.filter(recipe => {
            const matchesMealType = !mealTypeFilter || recipe.meal_type === mealTypeFilter;
            const matchesDifficulty = !difficultyFilter || recipe.difficulty === difficultyFilter;
            const matchesSearch = !searchTerm || 
                recipe.name.toLowerCase().includes(searchTerm) ||
                recipe.description.toLowerCase().includes(searchTerm);

            return matchesMealType && matchesDifficulty && matchesSearch;
        });

        const container = document.getElementById('recipes-grid');
        if (filteredRecipes.length === 0) {
            container.innerHTML = '<p class="no-recipes">No recipes match your filters.</p>';
            return;
        }

        container.innerHTML = filteredRecipes.map(recipe => `
            <div class="recipe-card">
                <div class="recipe-image">
                    ${recipe.image_url ? `<img src="${recipe.image_url}" alt="${recipe.name}">` : '<div class="recipe-placeholder">🍽️</div>'}
                </div>
                <div class="recipe-info">
                    <h4>${recipe.name}</h4>
                    <p class="recipe-description">${recipe.description}</p>
                    <div class="recipe-meta">
                        <span class="recipe-difficulty">${recipe.difficulty}</span>
                        <span class="recipe-time">${recipe.prep_time_minutes + recipe.cook_time_minutes}min</span>
                        <span class="recipe-servings">${recipe.servings} servings</span>
                    </div>
                    <div class="recipe-nutrition">
                        <span>${recipe.calories_per_serving} cal</span>
                        <span>P: ${recipe.protein_g_per_serving}g</span>
                        <span>C: ${recipe.carbs_g_per_serving}g</span>
                        <span>F: ${recipe.fat_g_per_serving}g</span>
                    </div>
                    <button class="btn-secondary" onclick="viewRecipe(${recipe.id})">View Recipe</button>
                </div>
            </div>
        `).join('');
    }

    async loadFoodLog() {
        const date = document.getElementById('tracking-date').value || this.today;
        const container = document.getElementById('food-log-list');
        if (!container) return;

        try {
            const response = await apiFetch(`/nutrition-logs/?date=${date}`);
            if (response.ok) {
                const data = await response.json();
                const logs = data.results || data;

                if (logs.length === 0) {
                    container.innerHTML = '<p class="no-logs">No food logged for this date.</p>';
                    return;
                }

                container.innerHTML = logs.map(log => `
                    <div class="food-log-item">
                        <div class="food-info">
                            <h5>${log.food_item}</h5>
                            <span class="food-meal-type">${log.meal_type || 'Other'}</span>
                        </div>
                        <div class="food-nutrition">
                            <span>${log.calories || 0} cal</span>
                            <span>P: ${log.protein_g || 0}g</span>
                            <span>C: ${log.carbs_g || 0}g</span>
                            <span>F: ${log.fat_g || 0}g</span>
                        </div>
                        <button class="remove-food-btn" onclick="nutritionTracker.removeFoodLog(${log.id})">×</button>
                    </div>
                `).join('');
            }
        } catch (error) {
            console.error('Error loading food log:', error);
            container.innerHTML = '<p class="error">Failed to load food log.</p>';
        }
    }

    async removeFoodLog(logId) {
        try {
            const response = await apiFetch(`/nutrition-logs/${logId}/`, {
                method: 'DELETE'
            });

            if (response.ok) {
                this.todaysLogs = this.todaysLogs.filter(log => log.id !== logId);
                this.updateMacroProgress();
                this.loadFoodLog();
                this.showToast('Food item removed', 'success');
            }
        } catch (error) {
            console.error('Error removing food log:', error);
            this.showToast('Failed to remove food item', 'error');
        }
    }

    async loadAnalytics() {
        const timeframe = document.getElementById('analytics-timeframe').value;
        
        try {
            const response = await apiFetch(`/nutrition-analytics/?days=${timeframe}`);
            if (response.ok) {
                const analytics = await response.json();
                this.renderAnalyticsCharts(analytics);
            }
        } catch (error) {
            console.error('Error loading analytics:', error);
            this.renderAnalyticsCharts(null);
        }
    }

    renderAnalyticsCharts(analytics) {
        this.renderMacroTrendsChart(analytics);
        this.renderCalorieBalanceChart(analytics);
        this.renderNutritionScore(analytics);
    }

    renderMacroTrendsChart(analytics) {
        const ctx = document.getElementById('macro-trends-chart');
        if (!ctx) return;

        const data = analytics?.daily_totals || {};
        const dates = Object.keys(data).sort();
        
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: dates.map(date => new Date(date).toLocaleDateString()),
                datasets: [
                    {
                        label: 'Protein (g)',
                        data: dates.map(date => data[date]?.protein || 0),
                        borderColor: '#ff6b35',
                        backgroundColor: 'rgba(255, 107, 53, 0.1)',
                        tension: 0.4
                    },
                    {
                        label: 'Carbs (g)',
                        data: dates.map(date => data[date]?.carbs || 0),
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        tension: 0.4
                    },
                    {
                        label: 'Fat (g)',
                        data: dates.map(date => data[date]?.fat || 0),
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Macro Trends Over Time'
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

    renderCalorieBalanceChart(analytics) {
        const ctx = document.getElementById('calorie-balance-chart');
        if (!ctx) return;

        const weeklyAvg = analytics?.weekly_averages || {};
        const target = this.nutritionGoals?.target_calories || 2000;
        
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Consumed', 'Remaining'],
                datasets: [{
                    data: [weeklyAvg.calories || 0, Math.max(0, target - (weeklyAvg.calories || 0))],
                    backgroundColor: ['#ff6b35', '#e2e8f0'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Daily Calorie Balance'
                    },
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    renderNutritionScore(analytics) {
        const scoreFill = document.getElementById('nutrition-score-fill');
        const scoreValue = document.getElementById('nutrition-score-value');
        const scoreDetails = document.getElementById('nutrition-score-details');
        
        if (!scoreFill || !scoreValue || !scoreDetails) return;

        // Calculate nutrition score based on macro balance
        const weeklyAvg = analytics?.weekly_averages || {};
        const target = this.nutritionGoals;
        
        let score = 0;
        let details = [];
        
        if (target) {
            const calorieScore = Math.min(100, (weeklyAvg.calories / target.target_calories) * 100);
            const proteinScore = Math.min(100, (weeklyAvg.protein_g / target.target_protein_g) * 100);
            const carbScore = Math.min(100, (weeklyAvg.carbs_g / target.target_carbs_g) * 100);
            const fatScore = Math.min(100, (weeklyAvg.fat_g / target.target_fat_g) * 100);
            
            score = Math.round((calorieScore + proteinScore + carbScore + fatScore) / 4);
            
            details = [
                `Calories: ${Math.round(calorieScore)}%`,
                `Protein: ${Math.round(proteinScore)}%`,
                `Carbs: ${Math.round(carbScore)}%`,
                `Fat: ${Math.round(fatScore)}%`
            ];
                } else {
            score = 75; // Default score
            details = ['Set nutrition goals for personalized scoring'];
        }
        
        scoreValue.textContent = score;
        scoreDetails.innerHTML = details.map(detail => `<div>${detail}</div>`).join('');
        
        // Update circular progress
        const percentage = score;
        scoreFill.style.background = `conic-gradient(#48bb78 0deg, #48bb78 ${percentage * 3.6}deg, #e2e8f0 ${percentage * 3.6}deg)`;
    }

    initializeFormHandlers() {
        // Add Food Form
        document.getElementById('add-food-form')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.submitAddFoodForm();
        });

        // Add Supplement Form
        document.getElementById('add-supplement-form')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.submitAddSupplementForm();
        });

        // Restaurant Food Form
        document.getElementById('restaurant-food-form')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.submitRestaurantFoodForm();
        });

        // Food name autocomplete
        document.getElementById('food-name-input')?.addEventListener('input', (e) => {
            this.showFoodSuggestions(e.target.value);
        });

        // Restaurant name autocomplete
        document.getElementById('restaurant-name-input')?.addEventListener('input', (e) => {
            this.showRestaurantSuggestions(e.target.value);
        });

        // Close modals on outside click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });
        });
    }

    async submitAddFoodForm() {
        const formData = {
            food_item: document.getElementById('food-name-input').value,
            quantity: document.getElementById('food-quantity-input').value,
            meal_type: document.getElementById('food-meal-type').value,
            calories: parseFloat(document.getElementById('food-calories-input').value) || 0,
            protein_g: parseFloat(document.getElementById('food-protein-input').value) || 0,
            carbs_g: parseFloat(document.getElementById('food-carbs-input').value) || 0,
            fat_g: parseFloat(document.getElementById('food-fat-input').value) || 0,
            date: this.today
        };

        try {
            const response = await apiFetch('/nutrition-logs/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                this.showToast('Food logged successfully!', 'success');
                closeAddFoodModal();
                this.loadTodaysLogs();
                this.updateMacroProgress();
                this.loadFoodLog();
            }
        } catch (error) {
            console.error('Error logging food:', error);
            this.showToast('Failed to log food', 'error');
        }
    }

    async submitAddSupplementForm() {
        const formData = {
            supplement_name: document.getElementById('supplement-name-input').value,
            dosage: document.getElementById('supplement-dosage-input').value,
            time_taken: document.getElementById('supplement-time-input').value,
            notes: document.getElementById('supplement-notes-input').value,
            date: this.today
        };

        try {
            const response = await apiFetch('/supplement-logs/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                this.showToast('Supplement added successfully!', 'success');
                closeAddSupplementModal();
                this.loadSupplements();
                this.updateSupplementsList();
            }
        } catch (error) {
            console.error('Error adding supplement:', error);
            this.showToast('Failed to add supplement', 'error');
        }
    }

    async submitRestaurantFoodForm() {
        const formData = {
            restaurant_name: document.getElementById('restaurant-name-input').value,
            item_name: document.getElementById('restaurant-item-input').value,
            calories: parseFloat(document.getElementById('restaurant-calories-input').value) || 0,
            meal_type: document.getElementById('restaurant-meal-type').value,
            date: this.today
        };

        try {
            const response = await apiFetch('/restaurant-foods/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                this.showToast('Restaurant food logged successfully!', 'success');
                closeRestaurantFoodModal();
                this.loadTodaysLogs();
                this.updateMacroProgress();
                this.loadFoodLog();
            }
        } catch (error) {
            console.error('Error logging restaurant food:', error);
            this.showToast('Failed to log restaurant food', 'error');
        }
    }

    showFoodSuggestions(query) {
        if (!query || query.length < 2) {
            this.hideFoodSuggestions();
            return;
        }
        
        // Sample food suggestions
        const sampleFoods = [
            { name: 'Chicken Breast', calories: 165, protein: 31, carbs: 0, fat: 3.6 },
            { name: 'Salmon Fillet', calories: 208, protein: 25, carbs: 0, fat: 12 },
            { name: 'Brown Rice', calories: 111, protein: 2.6, carbs: 23, fat: 0.9 },
            { name: 'Broccoli', calories: 34, protein: 2.8, carbs: 7, fat: 0.4 },
            { name: 'Greek Yogurt', calories: 100, protein: 10, carbs: 6, fat: 0 },
            { name: 'Banana', calories: 89, protein: 1.1, carbs: 23, fat: 0.3 },
            { name: 'Almonds', calories: 579, protein: 21, carbs: 22, fat: 50 },
            { name: 'Eggs', calories: 155, protein: 13, carbs: 1.1, fat: 11 }
        ];
        
        const filtered = sampleFoods.filter(food => 
            food.name.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 5);
        
        const container = document.getElementById('food-suggestions');
        if (!container) return;
        
        if (filtered.length === 0) {
            container.innerHTML = '<div class="food-suggestion">No foods found</div>';
        } else {
            container.innerHTML = filtered.map(food => `
                <div class="food-suggestion" onclick="selectFoodSuggestion('${food.name}', ${food.calories}, ${food.protein}, ${food.carbs}, ${food.fat})">
                    <div class="food-suggestion-name">${food.name}</div>
                    <div class="food-suggestion-nutrition">
                        ${food.calories} cal, ${food.protein}g protein per 100g
                    </div>
                </div>
            `).join('');
        }
        
        container.classList.add('active');
    }

    hideFoodSuggestions() {
        const container = document.getElementById('food-suggestions');
        if (container) {
            container.classList.remove('active');
        }
    }

    showRestaurantSuggestions(query) {
        if (!query || query.length < 2) {
            this.hideRestaurantSuggestions();
            return;
        }
        
        // Sample restaurant suggestions
        const sampleRestaurants = [
            { restaurant: "McDonald's", item: "Big Mac", calories: 550 },
            { restaurant: "McDonald's", item: "Chicken McNuggets (10pc)", calories: 470 },
            { restaurant: "Subway", item: "Turkey Breast 6\"", calories: 280 },
            { restaurant: "Subway", item: "Chicken Teriyaki 6\"", calories: 370 },
            { restaurant: "Starbucks", item: "Grande Latte", calories: 190 },
            { restaurant: "Starbucks", item: "Blueberry Muffin", calories: 350 },
            { restaurant: "Chipotle", item: "Chicken Burrito Bowl", calories: 445 },
            { restaurant: "Chipotle", item: "Steak Salad", calories: 320 }
        ];
        
        const filtered = sampleRestaurants.filter(item => 
            item.item.toLowerCase().includes(query.toLowerCase()) ||
            item.restaurant.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 5);
        
        const container = document.getElementById('restaurant-suggestions');
        if (!container) return;
        
        if (filtered.length === 0) {
            container.innerHTML = '<div class="restaurant-suggestion">No items found</div>';
        } else {
            container.innerHTML = filtered.map(item => `
                <div class="restaurant-suggestion" onclick="selectRestaurantSuggestion('${item.restaurant}', '${item.item}', ${item.calories})">
                    <div class="restaurant-suggestion-name">${item.item} - ${item.restaurant}</div>
                    <div class="restaurant-suggestion-calories">${item.calories} calories</div>
            </div>
        `).join('');
    }
    
        container.classList.add('active');
    }

    hideRestaurantSuggestions() {
        const container = document.getElementById('restaurant-suggestions');
        if (container) {
            container.classList.remove('active');
        }
    }

    showToast(message, type = 'info') {
        // Simple toast notification
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    showError(message) {
        this.showToast(message, 'error');
    }
}

// Global functions for button clicks
window.generateMealPlan = async function() {
    const button = document.querySelector('.generate-meal-plan-btn');
    const originalText = button ? button.textContent : 'Generate Meal Plan';

    try {
        if (button) { button.disabled = true; button.textContent = 'Generating...'; }

        // Collect trainer macros from localStorage (fallback to 40/30/30)
        const trainerCfg = (() => { try { return JSON.parse(localStorage.getItem('trainerConfig') || '{}'); } catch(_) { return {}; } })();
        const macrosStr = trainerCfg.macros || '40/30/30';
        const parts = macrosStr.split('/').map(n => parseFloat(String(n).trim()));
        const proteinRatio = isFinite(parts[0]) ? parts[0] / 100 : 0.40;
        const carbsRatio = isFinite(parts[1]) ? parts[1] / 100 : 0.30;
        const fatRatio = isFinite(parts[2]) ? parts[2] / 100 : 0.30;

        // Use active nutrition goal for calories if available
        const goal = nutritionTracker?.nutritionGoals;
        const payload = {
            target_calories: goal?.target_calories || 2000,
            protein_ratio: proteinRatio,
            carbs_ratio: carbsRatio,
            fat_ratio: fatRatio,
            dietary_restrictions: goal?.dietary_restrictions || '',
            cuisine_preferences: goal?.cuisine_preferences || ''
        };

        // Call backend generator
        const resp = await apiFetch('/meal-plan-generator/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (resp.status === 401) {
            nutritionTracker.showToast('Please sign in to generate a meal plan.', 'error');
            return;
        }
        if (!resp.ok) {
            throw new Error(`Meal plan generation failed (status ${resp.status})`);
        }

        const result = await resp.json().catch(() => ({}));
        const plan = normalizeMealPlanResponse(result);

        if (!plan || !Array.isArray(plan.days) || plan.days.length === 0) {
            nutritionTracker.showToast('No meal plan returned.', 'error');
            return;
        }

        // Store and render
        nutritionTracker.mealPlans = [plan];
        // If user is not already on the meal-plan tab, switch and render
        nutritionTracker.switchTab('meal-plan');
        nutritionTracker.loadMealPlanContent();
        nutritionTracker.showToast('Meal plan generated successfully!', 'success');
    } catch (error) {
        console.error('Error generating meal plan:', error);
        nutritionTracker?.showToast('Failed to generate meal plan', 'error');
    } finally {
        if (button) { button.disabled = false; button.textContent = originalText; }
    }
};

// Normalize backend meal plan response to tracker format
function normalizeMealPlanResponse(serverData) {
    if (!serverData) return null;
    // Accept either {plan: {...}} or direct plan object
    const raw = serverData.plan || serverData;

    // Expected output shape for UI:
    // { id, name, description, target_calories, target_protein_g, target_carbs_g, target_fat_g, days: [ { day_name, date, meals: [ { meal_type, name, calories, protein_g, carbs_g, fat_g, recipe_name? } ] } ] }

    const name = raw.name || '7-Day Meal Plan';
    const description = raw.description || 'Personalized plan generated from your goals and trainer settings.';
    const target_calories = raw.target_calories || raw.calories || 2000;
    const target_protein_g = raw.target_protein_g || raw.protein_g || 0;
    const target_carbs_g = raw.target_carbs_g || raw.carbs_g || 0;
    const target_fat_g = raw.target_fat_g || raw.fat_g || 0;

    // Normalize days
    const daysSrc = Array.isArray(raw.days) ? raw.days : Array.isArray(raw.week) ? raw.week : [];
    const days = daysSrc.map((d, idx) => {
        const dayName = d.day_name || d.day || `Day ${idx + 1}`;
        const date = d.date || '';
        const mealsSrc = Array.isArray(d.meals) ? d.meals : [];
        const meals = mealsSrc.map(m => ({
            meal_type: m.meal_type || m.type || 'meal',
            name: m.name || m.title || 'Meal',
            calories: m.calories ?? m.kcal ?? 0,
            protein_g: m.protein_g ?? m.protein ?? 0,
            carbs_g: m.carbs_g ?? m.carbs ?? 0,
            fat_g: m.fat_g ?? m.fat ?? 0,
            recipe_name: m.recipe_name || m.recipe || ''
        }));
        return { day_name: dayName, date, meals };
    });

    return { id: raw.id || null, name, description, target_calories, target_protein_g, target_carbs_g, target_fat_g, days };
}

window.createGroceryList = function() {
    const modal = document.getElementById('grocery-list-modal');
    modal.classList.add('active');
    generateGroceryList();
};

window.logRestaurantFood = function() {
    const modal = document.getElementById('restaurant-food-modal');
    modal.classList.add('active');
    document.getElementById('restaurant-name-input').focus();
};

window.viewNutritionAnalytics = function() {
    nutritionTracker.switchTab('analytics');
};

window.regenerateMealPlan = function() {
    generateMealPlan();
};

window.showAddFoodModal = function() {
    const modal = document.getElementById('add-food-modal');
    modal.classList.add('active');
    document.getElementById('food-name-input').focus();
};

window.showAddSupplementModal = function() {
    const modal = document.getElementById('add-supplement-modal');
    modal.classList.add('active');
    document.getElementById('supplement-name-input').focus();
};

window.viewRecipe = function(recipeId) {
    const recipe = nutritionTracker.recipes.find(r => r.id === recipeId);
    if (!recipe) {
        nutritionTracker.showToast('Recipe not found', 'error');
        return;
    }
    
    const modal = document.getElementById('recipe-detail-modal');
    const title = document.getElementById('recipe-detail-title');
    const content = document.getElementById('recipe-detail-content');
    
    title.textContent = recipe.name;
    content.innerHTML = renderRecipeDetail(recipe);
    
    modal.classList.add('active');
};

// Modal close functions
window.closeAddFoodModal = function() {
    const modal = document.getElementById('add-food-modal');
    modal.classList.remove('active');
    document.getElementById('add-food-form').reset();
};

window.closeAddSupplementModal = function() {
    const modal = document.getElementById('add-supplement-modal');
    modal.classList.remove('active');
    document.getElementById('add-supplement-form').reset();
};

window.closeRecipeDetailModal = function() {
    const modal = document.getElementById('recipe-detail-modal');
    modal.classList.remove('active');
};

window.closeGroceryListModal = function() {
    const modal = document.getElementById('grocery-list-modal');
    modal.classList.remove('active');
};

window.closeRestaurantFoodModal = function() {
    const modal = document.getElementById('restaurant-food-modal');
    modal.classList.remove('active');
    document.getElementById('restaurant-food-form').reset();
};

// Recipe detail rendering
function renderRecipeDetail(recipe) {
    return `
        <div class="recipe-detail-header">
            <div class="recipe-detail-image">
                ${recipe.image_url ? `<img src="${recipe.image_url}" alt="${recipe.name}">` : '<div class="recipe-placeholder">🍽️</div>'}
            </div>
            <div class="recipe-detail-info">
                <h4>${recipe.name}</h4>
                <p>${recipe.description}</p>
                <div class="recipe-detail-meta">
                    <span>${recipe.difficulty}</span>
                    <span>${recipe.prep_time_minutes + recipe.cook_time_minutes} min</span>
                    <span>${recipe.servings} servings</span>
                    <span>${recipe.cuisine_type}</span>
                </div>
            </div>
        </div>
        
        <div class="recipe-detail-nutrition">
            <div class="nutrition-item">
                <div class="nutrition-item-value">${recipe.calories_per_serving}</div>
                <div class="nutrition-item-label">Calories</div>
            </div>
            <div class="nutrition-item">
                <div class="nutrition-item-value">${recipe.protein_g_per_serving}g</div>
                <div class="nutrition-item-label">Protein</div>
            </div>
            <div class="nutrition-item">
                <div class="nutrition-item-value">${recipe.carbs_g_per_serving}g</div>
                <div class="nutrition-item-label">Carbs</div>
            </div>
            <div class="nutrition-item">
                <div class="nutrition-item-value">${recipe.fat_g_per_serving}g</div>
                <div class="nutrition-item-label">Fat</div>
            </div>
        </div>
        
        <div class="recipe-sections">
            <div class="recipe-section">
                <h5>Ingredients</h5>
                <ul class="ingredient-list">
                    ${recipe.ingredients ? recipe.ingredients.map(ingredient => `
                        <li class="ingredient-item">
                            <strong>${ingredient.quantity}</strong> ${ingredient.food_item.name}
                        </li>
                    `).join('') : '<li class="ingredient-item">No ingredients available</li>'}
                </ul>
            </div>
            <div class="recipe-section">
                <h5>Instructions</h5>
                <ol class="instruction-list">
                    ${recipe.instructions ? recipe.instructions.map(instruction => `
                        <li class="instruction-item">${instruction.step_text}</li>
                    `).join('') : '<li class="instruction-item">No instructions available</li>'}
                </ol>
            </div>
        </div>
    `;
}

// Grocery list generation
function generateGroceryList() {
    const container = document.getElementById('grocery-list-content');
    
    // Sample grocery items based on common meal plan ingredients
    const sampleItems = [
        { name: 'Chicken Breast', quantity: '2 lbs', category: '🥩 Proteins' },
        { name: 'Salmon Fillet', quantity: '1 lb', category: '🥩 Proteins' },
        { name: 'Greek Yogurt', quantity: '32 oz', category: '🥛 Dairy' },
        { name: 'Eggs', quantity: '1 dozen', category: '🥛 Dairy' },
        { name: 'Broccoli', quantity: '2 heads', category: '🥬 Vegetables' },
        { name: 'Spinach', quantity: '1 bag', category: '🥬 Vegetables' },
        { name: 'Sweet Potatoes', quantity: '3 lbs', category: '🥬 Vegetables' },
        { name: 'Bananas', quantity: '1 bunch', category: '🍎 Fruits' },
        { name: 'Apples', quantity: '6 pieces', category: '🍎 Fruits' },
        { name: 'Brown Rice', quantity: '2 lbs', category: '🌾 Grains' },
        { name: 'Quinoa', quantity: '1 lb', category: '🌾 Grains' },
        { name: 'Olive Oil', quantity: '1 bottle', category: '🧂 Pantry' },
        { name: 'Almonds', quantity: '1 bag', category: '🧂 Pantry' }
    ];
    
    // Group by category
    const categories = {};
    sampleItems.forEach(item => {
        if (!categories[item.category]) {
            categories[item.category] = [];
        }
        categories[item.category].push(item);
    });
    
    container.innerHTML = `
        <div class="grocery-list-categories">
            ${Object.entries(categories).map(([categoryName, items]) => `
                <div class="grocery-category">
                    <h5>
                        <span class="grocery-category-icon">${categoryName.split(' ')[0]}</span>
                        ${categoryName.split(' ').slice(1).join(' ')}
                    </h5>
                    <div class="grocery-items">
                        ${items.map(item => `
                            <div class="grocery-item">
                                <span class="grocery-item-name">${item.name}</span>
                                <span class="grocery-item-quantity">${item.quantity}</span>
            </div>
                        `).join('')}
            </div>
                </div>
            `).join('')}
        </div>
    `;
}

window.exportGroceryList = function() {
    const content = document.getElementById('grocery-list-content').innerText;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'grocery-list.txt';
    a.click();
    URL.revokeObjectURL(url);
    nutritionTracker.showToast('Grocery list exported!', 'success');
};

// Global suggestion functions
window.selectFoodSuggestion = function(name, calories, protein, carbs, fat) {
    document.getElementById('food-name-input').value = name;
    document.getElementById('food-calories-input').value = calories;
    document.getElementById('food-protein-input').value = protein;
    document.getElementById('food-carbs-input').value = carbs;
    document.getElementById('food-fat-input').value = fat;
    nutritionTracker.hideFoodSuggestions();
};

window.selectRestaurantSuggestion = function(restaurant, item, calories) {
    document.getElementById('restaurant-name-input').value = restaurant;
    document.getElementById('restaurant-item-input').value = item;
    document.getElementById('restaurant-calories-input').value = calories;
    nutritionTracker.hideRestaurantSuggestions();
};

// Water intake function
window.addWater = function(amount) {
    if (nutritionTracker) {
        nutritionTracker.addWaterIntake(amount);
        nutritionTracker.showToast(`Added ${amount}ml of water`, 'success');
    }
};

// ============================================================================
// BARCODE SCANNER FUNCTIONALITY
// ============================================================================

let scannerStream = null;
let barcodeDetector = null;

window.openBarcodeScanner = function() {
    const modal = document.getElementById('barcode-scanner-modal');
    modal.classList.add('active');
    
    // Initialize barcode detector if supported
    if ('BarcodeDetector' in window) {
        barcodeDetector = new BarcodeDetector({
            formats: ['code_128', 'code_39', 'ean_13', 'ean_8', 'upc_a', 'upc_e']
        });
    }
};

window.closeBarcodeScanner = function() {
    const modal = document.getElementById('barcode-scanner-modal');
    modal.classList.remove('active');
    
    if (scannerStream) {
        scannerStream.getTracks().forEach(track => track.stop());
        scannerStream = null;
    }
    
    const video = document.getElementById('scanner-video');
    video.srcObject = null;
};

window.startBarcodeScan = async function() {
    try {
        scannerStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' }
        });
        
        const video = document.getElementById('scanner-video');
        video.srcObject = scannerStream;
        
        video.onloadedmetadata = () => {
            video.play();
            startBarcodeDetection();
        };
        
    } catch (error) {
        console.error('Error accessing camera:', error);
        nutritionTracker.showToast('Camera access denied or not available', 'error');
    }
};

function startBarcodeDetection() {
    const video = document.getElementById('scanner-video');
    const canvas = document.getElementById('scanner-canvas');
    const ctx = canvas.getContext('2d');
    
    function detectBarcode() {
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0);
            
            if (barcodeDetector) {
                barcodeDetector.detect(canvas)
                    .then(barcodes => {
                        if (barcodes.length > 0) {
                            const barcode = barcodes[0];
                            handleBarcodeDetected(barcode.rawValue);
                        } else {
                            requestAnimationFrame(detectBarcode);
                        }
                    })
                    .catch(error => {
                        console.error('Barcode detection error:', error);
                        requestAnimationFrame(detectBarcode);
                    });
            } else {
                // Fallback: simulate barcode detection
                setTimeout(() => {
                    handleBarcodeDetected('1234567890123');
                }, 2000);
            }
        } else {
            requestAnimationFrame(detectBarcode);
        }
    }
    
    detectBarcode();
}

function handleBarcodeDetected(barcode) {
    closeBarcodeScanner();
    
    // Look up product by barcode
    lookupProductByBarcode(barcode);
}

async function lookupProductByBarcode(barcode) {
    try {
        // In a real app, you would call a barcode lookup API
        // For demo purposes, we'll use sample data
        const sampleProducts = {
            '1234567890123': {
                name: 'Organic Chicken Breast',
                calories: 165,
                protein: 31,
                carbs: 0,
                fat: 3.6
            },
            '2345678901234': {
                name: 'Greek Yogurt Plain',
                calories: 100,
                protein: 10,
                carbs: 6,
                fat: 0
            },
            '3456789012345': {
                name: 'Brown Rice',
                calories: 111,
                protein: 2.6,
                carbs: 23,
                fat: 0.9
            }
        };
        
        const product = sampleProducts[barcode] || {
            name: `Product (${barcode})`,
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0
        };
        
        // Fill the form with detected product
        document.getElementById('food-name-input').value = product.name;
        document.getElementById('food-calories-input').value = product.calories;
        document.getElementById('food-protein-input').value = product.protein;
        document.getElementById('food-carbs-input').value = product.carbs;
        document.getElementById('food-fat-input').value = product.fat;
        
        nutritionTracker.showToast(`Product detected: ${product.name}`, 'success');
        
    } catch (error) {
        console.error('Error looking up product:', error);
        nutritionTracker.showToast('Failed to lookup product', 'error');
    }
}

// ============================================================================
// MEAL PHOTO UPLOAD FUNCTIONALITY
// ============================================================================

window.openMealPhotoUpload = function() {
    const modal = document.getElementById('meal-photo-modal');
    modal.classList.add('active');
    initializeMealPhotoUpload();
};

window.closeMealPhotoModal = function() {
    const modal = document.getElementById('meal-photo-modal');
    modal.classList.remove('active');
    resetMealPhotoModal();
};

function initializeMealPhotoUpload() {
    const dropzone = document.getElementById('meal-photo-dropzone');
    const fileInput = document.getElementById('meal-photo-input');
    
    // Drag and drop functionality
    dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('dragover');
    });
    
    dropzone.addEventListener('dragleave', () => {
        dropzone.classList.remove('dragover');
    });
    
    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleMealPhotoFile(files[0]);
        }
    });
    
    // File input change
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleMealPhotoFile(e.target.files[0]);
        }
    });
    
    // Click to upload
    dropzone.addEventListener('click', () => {
        fileInput.click();
    });
}

function handleMealPhotoFile(file) {
    if (!file.type.startsWith('image/')) {
        nutritionTracker.showToast('Please select an image file', 'error');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
        showMealPhotoPreview(e.target.result);
    };
    reader.readAsDataURL(file);
}

function showMealPhotoPreview(imageSrc) {
    const dropzone = document.getElementById('meal-photo-dropzone');
    const preview = document.getElementById('meal-photo-preview');
    const img = document.getElementById('meal-photo-img');
    
    img.src = imageSrc;
    dropzone.style.display = 'none';
    preview.style.display = 'block';
}

window.retakeMealPhoto = function() {
    const dropzone = document.getElementById('meal-photo-dropzone');
    const preview = document.getElementById('meal-photo-preview');
    const analysis = document.getElementById('meal-analysis-results');
    
    dropzone.style.display = 'block';
    preview.style.display = 'none';
    analysis.style.display = 'none';
    
    document.getElementById('meal-photo-input').value = '';
};

window.analyzeMealPhoto = async function() {
    const img = document.getElementById('meal-photo-img');
    const analysis = document.getElementById('meal-analysis-results');
    const detectedFoods = document.getElementById('detected-foods');
    
    // Show loading state
    detectedFoods.innerHTML = '<div class="loading">Analyzing meal photo...</div>';
    analysis.style.display = 'block';
    
    try {
        // Simulate AI analysis (in real app, call AI service)
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Sample detected foods
        const sampleDetectedFoods = [
            {
                name: 'Grilled Chicken Breast',
                confidence: 95,
                calories: 165,
                protein: 31,
                carbs: 0,
                fat: 3.6,
                quantity: '1 piece'
            },
            {
                name: 'Steamed Broccoli',
                confidence: 88,
                calories: 34,
                protein: 2.8,
                carbs: 7,
                fat: 0.4,
                quantity: '1 cup'
            },
            {
                name: 'Brown Rice',
                confidence: 92,
                calories: 111,
                protein: 2.6,
                carbs: 23,
                fat: 0.9,
                quantity: '1/2 cup'
            }
        ];
        
        detectedFoods.innerHTML = sampleDetectedFoods.map(food => `
            <div class="detected-food-item">
                <div class="detected-food-info">
                    <div class="detected-food-name">${food.name}</div>
                    <div class="detected-food-confidence">Confidence: ${food.confidence}%</div>
                    <div class="detected-food-nutrition">
                        ${food.calories} cal, ${food.protein}g protein, ${food.carbs}g carbs, ${food.fat}g fat
                    </div>
                </div>
                <div class="detected-food-actions">
                    <input type="text" class="food-quantity-input" value="${food.quantity}" placeholder="Quantity">
                    <button class="btn-secondary" onclick="removeDetectedFood(this)">Remove</button>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error analyzing meal photo:', error);
        detectedFoods.innerHTML = '<div class="error">Failed to analyze photo. Please try again.</div>';
    }
}

window.removeDetectedFood = function(button) {
    button.closest('.detected-food-item').remove();
};

window.logDetectedFoods = async function() {
    const detectedItems = document.querySelectorAll('.detected-food-item');
    let loggedCount = 0;
    
    for (const item of detectedItems) {
        const name = item.querySelector('.detected-food-name').textContent;
        const quantity = item.querySelector('.food-quantity-input').value;
        const nutrition = item.querySelector('.detected-food-nutrition').textContent;
        
        // Extract nutrition values (simplified)
        const calories = parseInt(nutrition.match(/(\d+) cal/)?.[1] || 0);
        const protein = parseFloat(nutrition.match(/(\d+(?:\.\d+)?)g protein/)?.[1] || 0);
        const carbs = parseFloat(nutrition.match(/(\d+(?:\.\d+)?)g carbs/)?.[1] || 0);
        const fat = parseFloat(nutrition.match(/(\d+(?:\.\d+)?)g fat/)?.[1] || 0);
        
        try {
            const response = await apiFetch('/nutrition-logs/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    food_item: name,
                    quantity: quantity,
                    meal_type: 'lunch',
                    calories: calories,
                    protein_g: protein,
                    carbs_g: carbs,
                    fat_g: fat,
                    date: nutritionTracker.today
                })
            });
            
            if (response.ok) {
                loggedCount++;
            }
        } catch (error) {
            console.error('Error logging food:', error);
        }
    }
    
    if (loggedCount > 0) {
        nutritionTracker.showToast(`Successfully logged ${loggedCount} food items!`, 'success');
        closeMealPhotoModal();
        nutritionTracker.loadTodaysLogs();
        nutritionTracker.updateMacroProgress();
        nutritionTracker.loadFoodLog();
    } else {
        nutritionTracker.showToast('Failed to log food items', 'error');
    }
};

function resetMealPhotoModal() {
    const dropzone = document.getElementById('meal-photo-dropzone');
    const preview = document.getElementById('meal-photo-preview');
    const analysis = document.getElementById('meal-analysis-results');
    
    dropzone.style.display = 'block';
    preview.style.display = 'none';
    analysis.style.display = 'none';
    
    document.getElementById('meal-photo-input').value = '';
}

// Global instance
let nutritionTracker;

document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.nutrition-dashboard')) {
        nutritionTracker = new EnhancedNutritionTracker();
    }
});