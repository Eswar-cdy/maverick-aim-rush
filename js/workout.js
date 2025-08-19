// Workout Tracking System (Local-only reset)

class WorkoutTracker {
    constructor() {
        this.exercises = {
            strength: [
                { name: "Bench Press", category: "strength", muscle: "Chest", equipment: "Barbell", caloriesPerMin: 8 },
                { name: "Squats", category: "strength", muscle: "Legs", equipment: "Barbell", caloriesPerMin: 10 },
                { name: "Deadlift", category: "strength", muscle: "Back", equipment: "Barbell", caloriesPerMin: 12 },
                { name: "Overhead Press", category: "strength", muscle: "Shoulders", equipment: "Barbell", caloriesPerMin: 7 },
                { name: "Bent Over Rows", category: "strength", muscle: "Back", equipment: "Barbell", caloriesPerMin: 8 },
                { name: "Lunges", category: "strength", muscle: "Legs", equipment: "Dumbbells", caloriesPerMin: 6 },
                { name: "Pull-ups", category: "strength", muscle: "Back", equipment: "Bodyweight", caloriesPerMin: 5 },
                { name: "Push-ups", category: "strength", muscle: "Chest", equipment: "Bodyweight", caloriesPerMin: 4 },
                { name: "Dumbbell Curls", category: "strength", muscle: "Arms", equipment: "Dumbbells", caloriesPerMin: 3 },
                { name: "Tricep Dips", category: "strength", muscle: "Arms", equipment: "Bodyweight", caloriesPerMin: 4 }
            ],
            cardio: [
                { name: "Running", category: "cardio", muscle: "Full Body", equipment: "None", caloriesPerMin: 15 },
                { name: "Cycling", category: "cardio", muscle: "Legs", equipment: "Bike", caloriesPerMin: 12 },
                { name: "Jump Rope", category: "cardio", muscle: "Full Body", equipment: "Rope", caloriesPerMin: 13 },
                { name: "Rowing", category: "cardio", muscle: "Full Body", equipment: "Rowing Machine", caloriesPerMin: 14 },
                { name: "Elliptical", category: "cardio", muscle: "Full Body", equipment: "Elliptical", caloriesPerMin: 11 },
                { name: "Swimming", category: "cardio", muscle: "Full Body", equipment: "Pool", caloriesPerMin: 16 },
                { name: "High Knees", category: "cardio", muscle: "Full Body", equipment: "None", caloriesPerMin: 10 },
                { name: "Burpees", category: "cardio", muscle: "Full Body", equipment: "None", caloriesPerMin: 12 },
                { name: "Mountain Climbers", category: "cardio", muscle: "Full Body", equipment: "None", caloriesPerMin: 9 },
                { name: "Jumping Jacks", category: "cardio", muscle: "Full Body", equipment: "None", caloriesPerMin: 8 }
            ],
            flexibility: [
                { name: "Stretching", category: "flexibility", muscle: "Full Body", equipment: "None", caloriesPerMin: 2 },
                { name: "Yoga", category: "flexibility", muscle: "Full Body", equipment: "Mat", caloriesPerMin: 4 },
                { name: "Pilates", category: "flexibility", muscle: "Core", equipment: "Mat", caloriesPerMin: 5 },
                { name: "Foam Rolling", category: "flexibility", muscle: "Full Body", equipment: "Foam Roller", caloriesPerMin: 1 }
            ],
            bodyweight: [
                { name: "Push-ups", category: "bodyweight", muscle: "Chest", equipment: "None", caloriesPerMin: 4 },
                { name: "Pull-ups", category: "bodyweight", muscle: "Back", equipment: "Bar", caloriesPerMin: 5 },
                { name: "Squats", category: "bodyweight", muscle: "Legs", equipment: "None", caloriesPerMin: 6 },
                { name: "Lunges", category: "bodyweight", muscle: "Legs", equipment: "None", caloriesPerMin: 5 },
                { name: "Planks", category: "bodyweight", muscle: "Core", equipment: "None", caloriesPerMin: 3 }
            ]
        };

        this.currentWorkout = { startTime: null, exercises: [], totalCalories: 0, duration: 0 };
        this.workoutHistory = this.loadLocal('workoutHistory') || [];
        this.personalRecords = this.loadLocal('personalRecords') || {};

        this.renderHistory();
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        const startBtn = document.getElementById('start-workout-btn');
        const endBtn = document.getElementById('end-workout-btn');
        if (startBtn) startBtn.addEventListener('click', () => { this.startWorkout(); this.showActiveWorkout(); if (startBtn) startBtn.style.display='none'; if (endBtn) endBtn.style.display='inline-block'; });
        if (endBtn) endBtn.addEventListener('click', () => this.endWorkout());

        // Ensure View Exercises buttons work even if inline onclick is ignored
        document.querySelectorAll('.exercise-category__button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const card = btn.closest('.exercise-category');
                const category = card ? card.getAttribute('data-category') : null;
                if (category) this.showExercises(category);
            });
        });
    }

    loadLocal(key) {
        try { return JSON.parse(localStorage.getItem(key)); } catch(_) { return null; }
    }
    saveLocal(key, value) {
        try { localStorage.setItem(key, JSON.stringify(value)); } catch(_) {}
    }

    showExercises(category) {
        const exerciseList = document.getElementById('exercise-list');
        const exerciseGrid = document.getElementById('exercise-grid');
        const exerciseListTitle = document.getElementById('exercise-list-title');
        const categoriesSection = document.querySelector('.exercise-categories');
        if (categoriesSection) categoriesSection.style.display = 'none';
        if (exerciseList) exerciseList.style.display = 'block';
        if (exerciseListTitle) exerciseListTitle.textContent = `${category.charAt(0).toUpperCase() + category.slice(1)} Exercises`;
        const categoryExercises = this.exercises[category] || [];
        if (exerciseGrid) exerciseGrid.innerHTML = categoryExercises.map(exercise => `
            <div class="exercise-item" data-exercise="${exercise.name}">
                <div class="exercise-item__header">
                    <h3 class="exercise-item__title">${exercise.name}</h3>
                    <div class="exercise-item__category">${exercise.muscle}</div>
                </div>
                <div class="exercise-item__details">
                    <span class="exercise-item__equipment">${exercise.equipment}</span>
                    <span class="exercise-item__calories">${exercise.caloriesPerMin} cal/min</span>
                </div>
                <div class="exercise-item__actions">
                    <button class="exercise-item__add" onclick="workoutTracker.addToWorkout('${exercise.name}')">Add to Workout</button>
                    <button class="exercise-item__info" onclick="showExerciseInfo('${exercise.name}')">Info</button>
                </div>
            </div>
        `).join('');
    }

    hideExercises() {
        const categoriesSection = document.querySelector('.exercise-categories');
        const listSection = document.getElementById('exercise-list');
        if (categoriesSection) categoriesSection.style.display = 'block';
        if (listSection) listSection.style.display = 'none';
    }

    findExercise(name) {
        for (const category in this.exercises) {
            const exercise = this.exercises[category].find(ex => ex.name === name);
            if (exercise) return exercise;
        }
        return null;
    }

    addToWorkout(exerciseName) {
        const exercise = this.findExercise(exerciseName);
        if (!exercise) return;
        this.currentWorkout.exercises.push({
            name: exercise.name,
            category: exercise.category,
            muscle: exercise.muscle,
            equipment: exercise.equipment,
            caloriesPerMin: exercise.caloriesPerMin,
            sets: [],
            startTime: new Date(),
            duration: 0,
            completed: false
        });
        if (!this.currentWorkout.startTime) this.startWorkout();
        this.updateActiveWorkout();
        this.showActiveWorkout();
    }

    startWorkout() {
        this.currentWorkout.startTime = new Date();
        this.startTimer();
    }

    startTimer() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.timerInterval = setInterval(() => {
            if (this.currentWorkout.startTime) {
                const elapsed = Math.floor((new Date() - this.currentWorkout.startTime) / 1000);
                const minutes = Math.floor(elapsed / 60);
                const seconds = elapsed % 60;
                const timerEl = document.getElementById('workout-timer');
                if (timerEl) timerEl.textContent = `${minutes.toString().padStart(2,'0')}:${seconds.toString().padStart(2,'0')}`;
                this.currentWorkout.duration = elapsed;
                this.updateOverview();
            }
        }, 1000);
    }

    stopTimer() { if (this.timerInterval) { clearInterval(this.timerInterval); this.timerInterval = null; } }

    showActiveWorkout() { const el = document.getElementById('active-workout'); if (el) el.style.display='block'; }

    updateActiveWorkout() {
        const activeExercises = document.getElementById('active-exercises');
        if (!activeExercises) return;
        activeExercises.innerHTML = this.currentWorkout.exercises.map((exercise, index) => `
            <div class="active-exercise" data-exercise-index="${index}">
                <div class="active-exercise__header">
                    <h3 class="active-exercise__title">${exercise.name}</h3>
                    <div class="active-exercise__category">${exercise.muscle}</div>
                </div>
                <div class="active-exercise__sets">
                    <h4>Sets:</h4>
                    <div class="sets-list" id="sets-${index}">
                        ${exercise.sets.map((set, setIndex) => `
                            <div class="set-item">
                                <span class="set-number">Set ${setIndex + 1}:</span>
                                <input type="number" class="set-reps" placeholder="Reps" value="${set.reps || ''}" onchange="workoutTracker.updateSet(${index}, ${setIndex}, 'reps', this.value)">
                                <input type="number" class="set-weight" placeholder="Weight (kg)" value="${set.weight || ''}" onchange="workoutTracker.updateSet(${index}, ${setIndex}, 'weight', this.value)">
                                <button class="set-remove" onclick="workoutTracker.removeSet(${index}, ${setIndex})">×</button>
                            </div>
                        `).join('')}
                    </div>
                    <button class="add-set-btn" onclick="workoutTracker.addSet(${index})">+ Add Set</button>
                </div>
                <div class="active-exercise__actions">
                    <button class="exercise-complete" onclick="workoutTracker.completeExercise(${index})">Complete Exercise</button>
                    <button class="exercise-remove" onclick="workoutTracker.removeExercise(${index})">Remove</button>
                </div>
            </div>
        `