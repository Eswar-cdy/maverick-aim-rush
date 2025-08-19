// Nutrition Tracking System
const API_URL = 'http://127.0.0.1:8000/api/tracker';

class NutritionTracker {
    constructor() {
        this.dailyGoals = {};
        this.consumed = {};
        this.mealPlan = {};
        this.extraFoods = [];
        this.initializeEventListeners();
        this.loadDataFromServer();
    }

    async loadDataFromServer() {
        const accessToken = localStorage.getItem('accessToken');
        if (!accessToken) {
            console.error("No access token found. User might not be logged in.");
            // Redirect to login or show auth modal
            document.getElementById('auth-modal').style.display = 'block';
            return;
        }

        try {
            const response = await fetch(`${API_URL}/nutrition-log/`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to load nutrition data.');
            }

            const data = await response.json();
            
            // Check if the server returned default/empty data
            if (Object.keys(data.daily_goals).length === 0) {
                this.initializeDefaultData();
            } else {
                this.dailyGoals = data.daily_goals;
                this.consumed = data.consumed;
                this.mealPlan = data.meal_plan;
                this.extraFoods = data.extra_foods || [];
            }
            
            this.updateProgressDisplay();
            this.updateExtraFoodsList();

        } catch (error) {
            console.error('Error loading data from server:', error);
            // Handle error, e.g., token expiration
        }
    }

    async saveData() {
        const accessToken = localStorage.getItem('accessToken');
        if (!accessToken) {
            console.error("Cannot save data. No access token found.");
            return;
        }

        const payload = {
            daily_goals: this.dailyGoals,
            consumed: this.consumed,
            meal_plan: this.mealPlan,
            extra_foods: this.extraFoods,
        };

        try {
            const response = await fetch(`${API_URL}/nutrition-log/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error('Failed to save nutrition data.');
            }
            console.log('Data saved successfully.');

        } catch (error) {
            console.error('Error saving data to server:', error);
        }
    }

    initializeDefaultData() {
        // This is the default state for a new user/new day
        this.dailyGoals = { calories: 2000, protein: 120, carbs: 200, fat: 78 };
        this.consumed = { calories: 0, protein: 0, carbs: 0, fat: 0 };
        this.mealPlan = {
            breakfast: {
                calories: 500,
                protein: 30,
                fat: 13.5,
                carbs: 65,
                completed: false
            },
            'mid-morning': {
                calories: 300,
                protein: 21,
                fat: 22,
                carbs: 2,
                completed: false
            },
            lunch: {
                calories: 465,
                protein: 39.5,
                fat: 11,
                carbs: 36,
                completed: false
            },
            'pre-workout': {
                calories: 244,
                protein: 14.5,
                fat: 9.5,
                carbs: 28,
                completed: false
            },
            'post-workout': {
                calories: 190,
                protein: 21,
                fat: 1.5,
                carbs: 20,
                completed: false
            }
        };
        this.extraFoods = [];
        this.saveData(); // Save the initial state to the server
    }
    
    initializeEventListeners() {
        // Meal completion checkboxes
        document.querySelectorAll('.meal-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const mealId = e.target.id.replace('-complete', '');
                this.toggleMealCompletion(mealId, e.target.checked);
            });
        });
        
        // Load saved meal states
        Object.keys(this.mealPlan).forEach(meal => {
            const checkbox = document.getElementById(`${meal}-complete`);
            if (checkbox && this.mealPlan[meal].completed) {
                checkbox.checked = true;
            }
        });
    }
    
    toggleMealCompletion(mealId, isCompleted) {
        if (this.mealPlan[mealId]) {
            const wasCompleted = this.mealPlan[mealId].completed;
            this.mealPlan[mealId].completed = isCompleted;
            
            if (isCompleted && !wasCompleted) {
                // Add meal nutrients to consumed totals
                this.consumed.calories += this.mealPlan[mealId].calories;
                this.consumed.protein += this.mealPlan[mealId].protein;
                this.consumed.carbs += this.mealPlan[mealId].carbs;
                this.consumed.fat += this.mealPlan[mealId].fat;
            } else if (!isCompleted && wasCompleted) {
                // Remove meal nutrients from consumed totals
                this.consumed.calories -= this.mealPlan[mealId].calories;
                this.consumed.protein -= this.mealPlan[mealId].protein;
                this.consumed.carbs -= this.mealPlan[mealId].carbs;
                this.consumed.fat -= this.mealPlan[mealId].fat;
            }
            
            this.updateProgressDisplay();
            this.saveData();
        }
    }
    
    updateProgressDisplay() {
        // Update consumed numbers
        document.getElementById('calories-consumed').textContent = Math.round(this.consumed.calories);
        document.getElementById('protein-consumed').textContent = Math.round(this.consumed.protein * 10) / 10;
        document.getElementById('carbs-consumed').textContent = Math.round(this.consumed.carbs * 10) / 10;
        document.getElementById('fat-consumed').textContent = Math.round(this.consumed.fat * 10) / 10;
        
        // Update progress bars
        this.updateProgressBar('calories', this.consumed.calories, this.dailyGoals.calories);
        this.updateProgressBar('protein', this.consumed.protein, this.dailyGoals.protein);
        this.updateProgressBar('carbs', this.consumed.carbs, this.dailyGoals.carbs);
        this.updateProgressBar('fat', this.consumed.fat, this.dailyGoals.fat);
    }
    
    updateProgressBar(nutrient, consumed, goal) {
        const percentage = Math.min((consumed / goal) * 100, 100);
        const progressBars = document.querySelectorAll('.nutrition-stat');
        
        progressBars.forEach(bar => {
            if (bar.querySelector('.nutrition-stat__label').textContent.toLowerCase() === nutrient.toLowerCase()) {
                const progressFill = bar.querySelector('.progress-bar__fill');
                progressFill.style.width = `${percentage}%`;
                progressFill.setAttribute('data-progress', percentage);
                
                // Change color based on progress
                if (percentage >= 90) {
                    progressFill.style.background = 'linear-gradient(45deg, #4CAF50, #45a049)';
                } else if (percentage >= 70) {
                    progressFill.style.background = 'linear-gradient(45deg, #ff9800, #f57c00)';
                } else {
                    progressFill.style.background = 'linear-gradient(45deg, #ff6b35, #f7931e)';
                }
            }
        });
    }
    
    addExtraFood(foodData) {
        this.extraFoods.push({
            ...foodData,
            id: Date.now(),
            timestamp: new Date().toISOString()
        });
        
        // Add to consumed totals
        this.consumed.calories += foodData.calories || 0;
        this.consumed.protein += foodData.protein || 0;
        this.consumed.carbs += foodData.carbs || 0;
        this.consumed.fat += foodData.fat || 0;
        
        this.updateProgressDisplay();
        this.updateExtraFoodsList();
        this.saveData();
    }
    
    removeExtraFood(foodId) {
        const foodIndex = this.extraFoods.findIndex(food => food.id === foodId);
        if (foodIndex !== -1) {
            const food = this.extraFoods[foodIndex];
            
            // Remove from consumed totals
            this.consumed.calories -= food.calories || 0;
            this.consumed.protein -= food.protein || 0;
            this.consumed.carbs -= food.carbs || 0;
            this.consumed.fat -= food.fat || 0;
            
            this.extraFoods.splice(foodIndex, 1);
            this.updateProgressDisplay();
            this.updateExtraFoodsList();
            this.saveData();
        }
    }
    
    updateExtraFoodsList() {
        const container = document.getElementById('extra-foods-container');
        if (!container) return;
        
        if (this.extraFoods.length === 0) {
            container.innerHTML = '<p class="no-extra-foods">No additional foods logged today.</p>';
            return;
        }
        
        container.innerHTML = this.extraFoods.map(food => `
            <div class="extra-food-item" data-food-id="${food.id}">
                <div class="extra-food-info">
                    <strong>${food.name}</strong> - ${food.quantity}
                    <span class="extra-food-nutrients">
                        ${food.calories || 0} cal | ${food.protein || 0}g protein | 
                        ${food.carbs || 0}g carbs | ${food.fat || 0}g fat
                    </span>
                </div>
                <button class="remove-food-btn" onclick="nutritionTracker.removeExtraFood(${food.id})">×</button>
            </div>
        `).join('');
    }
    
    resetDay() {
        this.consumed = { calories: 0, protein: 0, carbs: 0, fat: 0 };
        Object.keys(this.mealPlan).forEach(meal => {
            this.mealPlan[meal].completed = false;
        });
        this.extraFoods = [];
        
        // Reset UI
        document.querySelectorAll('.meal-checkbox').forEach(checkbox => {
            checkbox.checked = false;
        });
        
        this.updateProgressDisplay();
        this.updateExtraFoodsList();
        this.saveData();
    }
}

// Portion adjustment functionality
function adjustPortion(mealId, foodId, button) {
    const modal = createPortionModal(mealId, foodId);
    document.body.appendChild(modal);
    modal.style.display = 'flex';
}

function createPortionModal(mealId, foodId) {
    const modal = document.createElement('div');
    modal.className = 'portion-modal';
    modal.innerHTML = `
        <div class="portion-modal__content">
            <h3>Adjust Portion</h3>
            <p>Adjust the portion size for this food item:</p>
            <div class="portion-controls">
                <button onclick="adjustPortionAmount(-0.5)">-50%</button>
                <button onclick="adjustPortionAmount(-0.25)">-25%</button>
                <span id="current-portion">100%</span>
                <button onclick="adjustPortionAmount(0.25)">+25%</button>
                <button onclick="adjustPortionAmount(0.5)">+50%</button>
            </div>
            <div class="modal-actions">
                <button onclick="closePortionModal()" class="button">Cancel</button>
                <button onclick="applyPortionChange('${mealId}', '${foodId}')" class="button">Apply</button>
            </div>
        </div>
    `;
    return modal;
}

let currentPortionMultiplier = 1;

function adjustPortionAmount(change) {
    currentPortionMultiplier = Math.max(0.25, currentPortionMultiplier + change);
    document.getElementById('current-portion').textContent = `${Math.round(currentPortionMultiplier * 100)}%`;
}

function applyPortionChange(mealId, foodId) {
    // Here you would implement the logic to adjust the meal's nutritional values
    console.log(`Adjusting ${foodId} in ${mealId} by ${currentPortionMultiplier}x`);
    closePortionModal();
}

function closePortionModal() {
    const modal = document.querySelector('.portion-modal');
    if (modal) {
        modal.remove();
    }
    currentPortionMultiplier = 1;
}

// Extra food logging
function addExtraFood() {
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
    
    nutritionTracker.addExtraFood({
        name,
        quantity,
        calories,
        protein,
        carbs,
        fat
    });
    
    // Clear form
    document.getElementById('food-name').value = '';
    document.getElementById('food-quantity').value = '';
    document.getElementById('food-calories').value = '';
    document.getElementById('food-protein').value = '';
    document.getElementById('food-carbs').value = '';
    document.getElementById('food-fat').value = '';
}

// Initialize nutrition tracker when page loads
let nutritionTracker;
document.addEventListener('DOMContentLoaded', () => {
    nutritionTracker = new NutritionTracker();
});

// Add reset button functionality (for development/testing)
function resetNutritionDay() {
    if (confirm('Are you sure you want to reset today\'s nutrition data?')) {
        nutritionTracker.resetDay();
    }
}