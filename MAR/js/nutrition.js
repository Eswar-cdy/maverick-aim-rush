// MAR/js/nutrition.js - API-driven Nutrition Tracking System

class NutritionTracker {
    constructor() {
        // The meal plan structure is still defined on the frontend for now.
        this.mealPlanDetails = {
            breakfast: {
                title: 'Meal 1 - Breakfast',
                calories: 500,
                foods: [
                    { name: 'Rolled oats', quantity: '50g', calories: 190, protein: 6, carbs: 33, fat: 3 },
                    { name: 'Peanut butter', quantity: '1 tbsp (16g)', calories: 95, protein: 4, carbs: 3, fat: 8 },
                    { name: 'Whey protein', quantity: '1 scoop (25g)', calories: 110, protein: 20, carbs: 2, fat: 1 },
                    { name: 'Banana', quantity: '1 medium (~120g)', calories: 105, protein: 1, carbs: 27, fat: 0.5 },
                ]
            },
            'mid-morning': {
                title: 'Meal 2 - Mid-Morning Snack',
                calories: 300,
                foods: [
                    { name: 'Boiled eggs', quantity: '3 whole', calories: 210, protein: 18, carbs: 1, fat: 15 },
                    { name: 'Almonds', quantity: '10 pcs (15g)', calories: 90, protein: 3, carbs: 3, fat: 8 },
                ]
            },
            lunch: {
                title: 'Meal 3 - Lunch',
                calories: 465,
                foods: [
                    { name: 'Grilled chicken', quantity: '150g raw weight', calories: 250, protein: 38, carbs: 0, fat: 9 },
                    { name: 'Cooked white rice', quantity: '100g', calories: 130, protein: 2.5, carbs: 28, fat: 0.5 },
                    { name: 'Mixed vegetables', quantity: '100g', calories: 40, protein: 2, carbs: 7, fat: 0.5 },
                    { name: 'Ghee', quantity: '1 tsp (5g)', calories: 45, protein: 0, carbs: 0, fat: 5 },
                ]
            },
            'pre-workout': {
                title: 'Meal 4 - Pre-Workout Snack',
                calories: 244,
                foods: [
                    { name: 'Boiled egg', quantity: '1 whole', calories: 70, protein: 6, carbs: 0.5, fat: 5 },
                    { name: 'Egg whites', quantity: '2', calories: 34, protein: 8, carbs: 0.5, fat: 0 },
                    { name: 'Apple', quantity: '1 medium (~150g)', calories: 95, protein: 0.5, carbs: 25, fat: 0 },
                    { name: 'Walnuts', quantity: '1 tbsp (7g)', calories: 45, protein: 1, carbs: 1, fat: 4.5 },
                ]
            },
            'post-workout': {
                title: 'Meal 5 - Post-Workout',
                calories: 190,
                foods: [
                    { name: 'Whey protein', quantity: '1 scoop (25g)', calories: 110, protein: 20, carbs: 2, fat: 1 },
                    { name: 'Dates', quantity: '3 pcs (~20g)', calories: 80, protein: 1, carbs: 18, fat: 0.5 },
                ]
            }
        };

        this.dailyGoals = { calories: 2000, protein: 120, carbs: 200, fat: 78 };
        this.todaysLogs = []; // This will hold all log entries fetched from the server.
        
        this.initializeEventListeners();
        this.loadAndProcessNutritionData();
    }

    initializeEventListeners() {
        document.querySelectorAll('.meal-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const mealId = e.target.closest('.meal-card').dataset.meal;
                this.toggleMealCompletion(mealId, e.target.checked);
            });
        });

        // The addExtraFood function is now bound to the window for the inline onclick
        window.addExtraFood = this.addExtraFood.bind(this);
    }

    async loadAndProcessNutritionData() {
        try {
            const logs = await fetchNutritionLogs();
            const today = new Date().toISOString().slice(0, 10);
            
            this.todaysLogs = logs.filter(log => log.date === today);
            
            this.recalculateTotalsAndRender();

        } catch (error) {
            console.error('Error loading nutrition data:', error);
            // If fetching fails, render an empty state.
            this.recalculateTotalsAndRender();
        }
    }
    
    recalculateTotalsAndRender() {
        const consumed = { calories: 0, protein: 0, carbs: 0, fat: 0 };
        const extraFoods = [];
        
        for (const log of this.todaysLogs) {
            consumed.calories += log.calories || 0;
            consumed.protein += log.protein_g || 0;
            consumed.carbs += log.carbs_g || 0;
            consumed.fat += log.fat_g || 0;

            if (log.meal_type === 'Extra') {
                extraFoods.push(log);
            }
        }
        
        this.updateProgressDisplay(consumed);
        this.updateCheckboxes();
        this.updateExtraFoodsList(extraFoods);
    }

    updateProgressDisplay(consumed) {
        document.getElementById('calories-consumed').textContent = Math.round(consumed.calories);
        document.getElementById('protein-consumed').textContent = Math.round(consumed.protein);
        document.getElementById('carbs-consumed').textContent = Math.round(consumed.carbs);
        document.getElementById('fat-consumed').textContent = Math.round(consumed.fat);

        this.updateProgressBar('calories', consumed.calories, this.dailyGoals.calories);
        this.updateProgressBar('protein', consumed.protein, this.dailyGoals.protein);
        this.updateProgressBar('carbs', consumed.carbs, this.dailyGoals.carbs);
        this.updateProgressBar('fat', consumed.fat, this.dailyGoals.fat);
    }

    updateProgressBar(nutrient, consumed, goal) {
        const percentage = goal > 0 ? Math.min((consumed / goal) * 100, 100) : 0;
        const progressBar = document.querySelector(`#${nutrient}-consumed`).closest('.nutrition-stat').querySelector('.progress-bar__fill');
        if(progressBar) {
            progressBar.style.width = `${percentage}%`;
        }
    }

    updateCheckboxes() {
        Object.keys(this.mealPlanDetails).forEach(mealId => {
            const mealFoods = this.mealPlanDetails[mealId].foods;
            const mealLogs = this.todaysLogs.filter(log => log.meal_type === mealId);
            
            const isCompleted = mealFoods.length > 0 && mealLogs.length >= mealFoods.length;
            
            const checkbox = document.querySelector(`.meal-card[data-meal="${mealId}"] .meal-checkbox`);
            if (checkbox) {
                checkbox.checked = isCompleted;
            }
        });
    }

    async toggleMealCompletion(mealId, isCompleted) {
        const meal = this.mealPlanDetails[mealId];
        if (!meal) return;

        if (isCompleted) {
            // Add all food items for this meal as new logs
            const today = new Date().toISOString().slice(0, 10);
            const logPromises = meal.foods.map(food => {
                return createNutritionLog({
                    date: today,
                    meal_type: mealId,
                    food_item: food.name,
                    calories: food.calories,
                    protein_g: food.protein,
                    carbs_g: food.carbs,
                    fat_g: food.fat,
                });
            });
            await Promise.all(logPromises);

        } else {
            // Find and delete all logs for this meal for today
            const logsToDelete = this.todaysLogs.filter(log => log.meal_type === mealId);
            const deletePromises = logsToDelete.map(log => deleteNutritionLog(log.id));
            await Promise.all(deletePromises);
        }

        // Refresh data from server to ensure consistency
        this.loadAndProcessNutritionData();
    }

    async addExtraFood() {
        const name = document.getElementById('food-name').value.trim();
        const quantity = document.getElementById('food-quantity').value.trim();
        const calories = parseFloat(document.getElementById('food-calories').value) || 0;
        const protein = parseFloat(document.getElementById('food-protein').value) || 0;
        const carbs = parseFloat(document.getElementById('food-carbs').value) || 0;
        const fat = parseFloat(document.getElementById('food-fat').value) || 0;
        
        if (!name || !quantity) {
            alert('Please fill in the food name and quantity.');
            return;
        }
        
        const today = new Date().toISOString().slice(0, 10);
        // Try to extract grams if user typed like "120g" or "120 g"
        let quantityGrams = null;
        const gramsMatch = quantity.toLowerCase().match(/(\d+(?:\.\d+)?)\s*(g|gram|grams|kg)?/);
        if (gramsMatch) {
            quantityGrams = parseFloat(gramsMatch[1]);
            const unit = gramsMatch[2] || 'g';
            if (unit === 'kg') quantityGrams *= 1000;
        }
        try {
            await createNutritionLog({
                date: today,
                meal_type: 'Extra',
                food_item: name,
                calories,
                protein_g: protein,
                carbs_g: carbs,
                fat_g: fat,
                // Send both raw quantity and parsed grams so backend can compute
                quantity,
                quantity_grams: quantityGrams,
            });
            
            // Clear form
            document.getElementById('food-name').value = '';
            document.getElementById('food-quantity').value = '';
            document.getElementById('food-calories').value = '';
            document.getElementById('food-protein').value = '';
            document.getElementById('food-carbs').value = '';
            document.getElementById('food-fat').value = '';

            // Refresh data
            this.loadAndProcessNutritionData();

        } catch (error) {
            console.error('Failed to add extra food:', error);
            alert('Could not log the extra food. Please try again.');
        }
    }
    
    async removeExtraFood(logId) {
        try {
            await deleteNutritionLog(logId);
            // Refresh data from server
            this.loadAndProcessNutritionData();
        } catch(error) {
            console.error('Failed to remove extra food:', error);
            alert('Could not remove the food item. Please try again.');
        }
    }

    updateExtraFoodsList(extraFoods) {
        const container = document.getElementById('extra-foods-container');
        if (!container) return;
        
        if (!extraFoods || extraFoods.length === 0) {
            container.innerHTML = '<p class="no-extra-foods">No additional foods logged today.</p>';
            return;
        }
        
        container.innerHTML = extraFoods.map(log => `
            <div class="extra-food-item" data-food-id="${log.id}">
                <div class="extra-food-info">
                    <strong>${log.food_item}</strong>
                    <span class="extra-food-nutrients">
                        ${log.calories || 0} cal | ${log.protein_g || 0}g protein | 
                        ${log.carbs_g || 0}g carbs | ${log.fat_g || 0}g fat
                    </span>
                </div>
                <button class="remove-food-btn" onclick="nutritionTracker.removeExtraFood(${log.id})">×</button>
            </div>
        `).join('');
    }
}

// Global instance
let nutritionTracker;

document.addEventListener('DOMContentLoaded', () => {
    // We only initialize the tracker if we are on the services page
    if (document.querySelector('.page__nutrition-overview')) {
        nutritionTracker = new NutritionTracker();
    }
});