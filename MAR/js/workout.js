// Workout Tracking System (Local-only reset)

class WorkoutTracker {
    constructor() {
        this.exercisesByCategory = { strength: [], cardio: [], flexibility: [], bodyweight: [] };

        this.currentWorkout = { startTime: null, exercises: [], totalCalories: 0, duration: 0 };
        this.workoutHistory = this.loadLocal('workoutHistory') || [];
        this.personalRecords = this.loadLocal('personalRecords') || {};
        
        this.currentPage = 1;
        this.currentCategory = null;

        this.renderHistory();
        this.initializeEventListeners();
        this.loadExercises();
        // Also try to load history from backend (if logged in)
        this.loadBackendHistory();
    }

    notify(message) {
        let el = document.getElementById('toast-notification');
        if (!el) {
            el = document.createElement('div');
            el.id = 'toast-notification';
            el.style.cssText = 'position:fixed;bottom:2rem;right:2rem;background:#00B16A;color:white;padding:1rem 1.5rem;border-radius:8px;z-index:9999;font-size:1rem;font-weight:600;box-shadow:0 4px 12px rgba(0,0,0,0.15);opacity:0;transition:opacity .3s, transform .3s;transform:translateY(20px);';
            document.body.appendChild(el);
        }
        el.textContent = message;
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
        setTimeout(() => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(20px)';
        }, 3000);
    }

    addSet(exerciseIndex) {
        const exercise = this.currentWorkout.exercises[exerciseIndex];
        exercise.sets.push({ reps: '', weight: '' });
        this.updateActiveWorkout();
    }

    updateSet(exerciseIndex, setIndex, field, value) {
        const exercise = this.currentWorkout.exercises[exerciseIndex];
        const set = exercise.sets[setIndex];
        set[field] = value ? Number(value) : '';
        this.updateActiveWorkout();
        if (this.sessionId && field === 'weight' && set.reps && set.weight && exercise.id) {
            const setNumber = setIndex + 1;
            createStrengthSet(this.sessionId, exercise.id, setNumber, set.reps, set.weight).catch(()=>{});
        }
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

    async showExercises(category) {
        // If category changes, reset filters and page
        if (this.currentCategory !== category) {
            this.currentPage = 1;
            this.currentCategory = category;
            this._resetFilters(false); // don't re-trigger showExercises
        }

        const exerciseList = document.getElementById('exercise-list');
        const exerciseGrid = document.getElementById('exercise-grid');
        const exerciseListTitle = document.getElementById('exercise-list-title');
        const categoriesSection = document.querySelector('.exercise-categories');
        if (categoriesSection) categoriesSection.style.display = 'none';
        if (exerciseList) exerciseList.style.display = 'block';
        if (exerciseListTitle) exerciseListTitle.textContent = `${category.charAt(0).toUpperCase() + category.slice(1)} Exercises`;
        const key = (category || 'strength').toLowerCase();
        if (exerciseGrid) exerciseGrid.innerHTML = '<p>Loading…</p>';
        this.renderPaginationControls(null); // Clear old controls

        // Always fetch fresh list for the chosen category to avoid stale buckets
        let categoryExercises = [];
        try {
            const params = this.collectFilters();
            params.category = key;
            const data = await fetchExercises(params);
            
            // data is now the full paginated response object
            categoryExercises = data.results || [];
            this.renderPaginationControls(data);

            // Render facets if present
            if (data && data.facets) {
                this.renderFacets(data.facets);
            }
        } catch (_) {
            // fallback to any cached list
            if (!this.allExercises || this.allExercises.length === 0) {
                await this.loadExercises();
            }
            categoryExercises = this.exercisesByCategory[key] || [];
        }
        if (exerciseGrid) exerciseGrid.innerHTML = categoryExercises.map(exercise => `
            <div class="exercise-item" data-exercise="${exercise.name}">
                <div class="exercise-item__header">
                    <h3 class="exercise-item__title">${exercise.name}</h3>
                    <div class="exercise-item__category">${(exercise.muscles?.primary||[]).join(', ')}</div>
                </div>
                <div class="exercise-item__details">
                    <span class="exercise-item__equipment">${(exercise.equipments||[]).join(', ')}</span>
                </div>
                <div class="exercise-item__actions">
                    <button class="exercise-item__add" onclick="workoutTracker.addToWorkout('${exercise.id}', '${exercise.name}')">Add to Workout</button>
                </div>
            </div>
        `).join('');
        if (exerciseGrid && categoryExercises.length === 0) {
            exerciseGrid.innerHTML = '<p>No exercises found in this category.</p>';
        }
        // Bind/refresh filter handlers after render
        this.bindFilterHandlers(key);
    }

    renderPaginationControls(data) {
        const container = document.getElementById('pagination-controls');
        if (!container) return;
        if (!data || data.count === undefined) {
            container.innerHTML = ''; return;
        }
        const total = data.count;
        const pageSize = 12; // Must match backend PAGE_SIZE
        const totalPages = Math.ceil(total / pageSize);
        if (totalPages <= 1) {
            container.innerHTML = ''; return;
        }

        const prevDisabled = this.currentPage === 1 ? 'disabled' : '';
        const nextDisabled = this.currentPage === totalPages ? 'disabled' : '';

        container.innerHTML = `
            <button id="page-prev" ${prevDisabled}>&lt; Prev</button>
            <span class="page-info">Page ${this.currentPage} of ${totalPages}</span>
            <button id="page-next" ${nextDisabled}>Next &gt;</button>
        `;
        const prevBtn = document.getElementById('page-prev');
        const nextBtn = document.getElementById('page-next');
        if (prevBtn) prevBtn.onclick = () => { if (this.currentPage > 1) { this.currentPage--; this.showExercises(this.currentCategory); } };
        if (nextBtn) nextBtn.onclick = () => { if (this.currentPage < totalPages) { this.currentPage++; this.showExercises(this.currentCategory); } };
    }

    renderFacets(facets) {
        const renderChips = (containerId, facetData, inputId) => {
            const container = document.getElementById(containerId);
            const input = document.getElementById(inputId);
            if (!container || !input) return;
            container.innerHTML = (facetData || []).slice(0, 5).map(item =>
                `<span class="facet-chip" data-value="${item.name}">${item.name} (${item.count})</span>`
            ).join('');
            // Add click handlers to chips
            container.querySelectorAll('.facet-chip').forEach(chip => {
                chip.onclick = () => {
                    input.value = chip.getAttribute('data-value');
                    this.showExercises(this.currentCategory);
                };
            });
        };
        renderChips('equipment-facets', facets.equipments, 'filter-equipment');
        renderChips('muscle-facets', facets.muscles, 'filter-muscle');
    }

    collectFilters() {
        const search = (document.getElementById('filter-search')?.value || '').trim();
        const difficulty = document.getElementById('filter-difficulty')?.value || '';
        const goal = document.getElementById('filter-goal')?.value || '';
        const equipment = (document.getElementById('filter-equipment')?.value || '').trim();
        const muscle = (document.getElementById('filter-muscle')?.value || '').trim();
        const muscleRole = document.getElementById('filter-muscle-role')?.value || 'any';
        const params = {};
        if (search) params.search = search;
        if (difficulty) params.difficulty_level = difficulty;
        if (goal) params.recommended_for_goal = goal;
        if (equipment) params.equipment = equipment;
        if (muscle) {
            if (muscleRole === 'primary') params.primary_muscle = muscle;
            else if (muscleRole === 'secondary') params.secondary_muscle = muscle;
            else params.muscle = muscle; // any role
        }
        if (this.currentPage > 1) {
            params.page = this.currentPage;
        }
        return params;
    }

    _resetFilters(triggerShow = true) {
        ['filter-search','filter-difficulty','filter-goal','filter-equipment','filter-muscle'].forEach(id => {
            const el = document.getElementById(id); if (!el) return; if (el.tagName === 'SELECT') el.selectedIndex = 0; else el.value='';
        });
        const roleEl = document.getElementById('filter-muscle-role');
        if (roleEl) roleEl.selectedIndex = 0;
        
        this.currentPage = 1;

        if (triggerShow) {
            this.showExercises(this.currentCategory);
        }
    }

    bindFilterHandlers(categoryKey) {
        const applyBtn = document.getElementById('filter-apply');
        const resetBtn = document.getElementById('filter-reset');
        
        if (applyBtn) applyBtn.onclick = () => { this.currentPage = 1; this.showExercises(categoryKey); };
        if (resetBtn) resetBtn.onclick = () => this._resetFilters();

        // debounce search
        const searchEl = document.getElementById('filter-search');
        if (searchEl) {
            let t; searchEl.oninput = () => { clearTimeout(t); t = setTimeout(() => { this.currentPage = 1; this.showExercises(categoryKey); }, 300); };
        }
    }

    async loadExercises() {
        try {
            // Initial load is now just for populating the allExercises cache for addToWorkout
            const data = await fetchExercises({ page_size: 200 }); // Fetch a large batch for local cache
            this.allExercises = data.results || data; // Handle both paginated and non-paginated
            // Bucket by category used in UI
            this.exercisesByCategory = { strength: [], cardio: [], flexibility: [], bodyweight: [] };
            (this.allExercises || []).forEach(ex => {
                const catLower = (ex.category || 'strength').toLowerCase();
                if (!this.exercisesByCategory[catLower]) this.exercisesByCategory[catLower] = [];
                this.exercisesByCategory[catLower].push(ex);
            });
        } catch (e) {
            console.error('Failed to load exercises', e);
            this.allExercises = [];
        }
    }

    hideExercises() {
        const categoriesSection = document.querySelector('.exercise-categories');
        const listSection = document.getElementById('exercise-list');
        if (categoriesSection) categoriesSection.style.display = 'block';
        if (listSection) listSection.style.display = 'none';
    }

    addToWorkout(exerciseId, exerciseName) {
        const exercise = this.allExercises.find(e => String(e.id) === String(exerciseId));
        if (!exercise) return;
        this.currentWorkout.exercises.push({
            id: exercise.id,
            name: exercise.name,
            category: exercise.category,
            muscles: exercise.muscles,
            equipments: exercise.equipments,
            sets: [],
            startTime: new Date(),
            duration: 0,
            completed: false
        });
        if (!this.currentWorkout.startTime) this.startWorkout();
        this.updateActiveWorkout();
        this.showActiveWorkout();
        // Auto-minimize the list and jump to Active Workout for faster set entry
        this.hideExercises();
        const active = document.getElementById('active-workout');
        if (active && active.scrollIntoView) {
            active.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    startWorkout() {
        this.currentWorkout.startTime = new Date();
        this.startTimer();
        // If we haven't opened a backend session yet, create one lazily
        if (!this.sessionId) {
            const today = new Date().toISOString().slice(0,10);
            createSession(today, 0).then(s => { this.sessionId = s.id; }).catch(() => {});
        }
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
                    <div class="active-exercise__category">${(exercise.muscles?.primary||[]).join(', ')}</div>
                </div>
                <div class="active-exercise__sets">
                    <h4>Sets:</h4>
                    <div class="sets-list" id="sets-${index}">
                        ${exercise.sets.map((set, setIndex) => `
                            <div class="set-item">
                                <span class=\"set-number\">Set ${setIndex + 1}:</span>
                                <input type=\"number\" class=\"set-reps\" placeholder=\"Reps\" value=\"${set.reps || ''}\" onchange=\"workoutTracker.updateSet(${index}, ${setIndex}, 'reps', this.value)\">
                                <input type=\"number\" class=\"set-weight\" placeholder=\"Weight (kg)\" value=\"${set.weight || ''}\" onchange=\"workoutTracker.updateSet(${index}, ${setIndex}, 'weight', this.value)\">
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
        `).join('');
    }

    removeSet(exerciseIndex, setIndex) {
        const exercise = this.currentWorkout.exercises[exerciseIndex];
        exercise.sets.splice(setIndex, 1);
        this.updateActiveWorkout();
    }

    removeExercise(index) {
        this.currentWorkout.exercises.splice(index, 1);
        this.updateActiveWorkout();
    }

    completeExercise(index) {
        const ex = this.currentWorkout.exercises[index];
        if (ex) ex.completed = true;
        this.updateActiveWorkout();
    }

    endWorkout() {
        this.stopTimer();
        const duration = this.currentWorkout.duration || 0;
        const summary = {
            date: new Date().toISOString().slice(0,10),
            duration,
            exercises: this.currentWorkout.exercises.map(e => ({ name: e.name, sets: e.sets, muscles: e.muscles, category: e.category, performedAt: e.startTime }))
        };
        // Persist duration to backend session if available (minutes rounded)
        if (this.sessionId) {
            const minutes = Math.round(duration / 60);
            updateSession(this.sessionId, { duration_minutes: minutes }).catch(()=>{});
        }
        this.workoutHistory.unshift(summary);
        this.saveLocal('workoutHistory', this.workoutHistory);
        this.renderHistory();
        this.currentWorkout = { startTime: null, exercises: [], totalCalories: 0, duration: 0 };
        const el = document.getElementById('active-workout'); if (el) el.style.display='none';
    }

    updateOverview() {
        const elapsed = this.currentWorkout.duration || 0;
        const minutes = Math.floor(elapsed / 60).toString().padStart(2,'0');
        const seconds = (elapsed % 60).toString().padStart(2,'0');
        const totalTimeEl = document.getElementById('total-time');
        if (totalTimeEl) totalTimeEl.textContent = `${minutes}:${seconds}`;
        const totalExercisesEl = document.getElementById('total-exercises');
        if (totalExercisesEl) totalExercisesEl.textContent = String(this.currentWorkout.exercises.length);
    }

    renderHistory() {
        const container = document.getElementById('workout-history');
        if (!container) return;
        if (!this.workoutHistory || this.workoutHistory.length === 0) {
            container.innerHTML = '<p>No recent workouts yet.</p>';
            return;
        }
        const fmtSet = (s, idx) => {
            const r = s.reps ? `${s.reps} reps` : '';
            const w = s.weight ? ` @ ${s.weight} kg` : '';
            return `<span class=\"history-set\">Set ${idx+1}: ${r}${w}</span>`;
        };
        const fmtExercise = (ex) => {
            const primary = (ex.muscles && ex.muscles.primary && ex.muscles.primary[0]) ? ex.muscles.primary[0] : '';
            const setsHtml = (ex.sets && ex.sets.length) ? ex.sets.map(fmtSet).join(' · ') : '<span class=\"history-set\">No sets logged</span>';
            const when = ex.performedAt ? new Date(ex.performedAt) : null;
            const whenStr = when ? ` (${when.toLocaleDateString()} ${when.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})})` : '';
            return `<div class=\"history-exercise\"><div class=\"history-exercise__name\"><strong>${ex.name}</strong>${primary ? ` — <em>${primary}</em>` : ''}${whenStr}</div><div class=\"history-exercise__sets\">${setsHtml}</div></div>`;
        };
        container.innerHTML = this.workoutHistory.slice(0,5).map(w => {
            const mins = Math.max(0, Math.round((w.duration||0)/60));
            const body = (w.exercises||[]).map(fmtExercise).join('');
            return `<div class=\"history-item\"><div class=\"history-item__header\"><strong>${w.date}</strong> — ${mins} min · ${w.exercises.length} exercises</div><div class=\"history-item__body\">${body}</div></div>`;
        }).join('');
    }

    async loadBackendHistory() {
        // Try to fetch sessions for the logged-in user; silent fallback on failure
        try {
            const sessions = await fetchSessions();
            if (!sessions || !Array.isArray(sessions) || sessions.length === 0) return;
            // Build a map of exerciseId -> name for rendering sets
            if (!this.allExercises || this.allExercises.length === 0) {
                try { this.allExercises = await fetchExercises({}); } catch(_) {}
            }
            const idToEx = new Map();
            (this.allExercises || []).forEach(ex => idToEx.set(String(ex.id), ex));

            const backendHistory = sessions
                .sort((a,b) => (a.date < b.date ? 1 : -1))
                .slice(0,5)
                .map(s => {
                    // Group sets by exercise
                    const setsByEx = (s.strength_sets || []).reduce((acc, ss) => {
                        const exId = String(ss.exercise_id);
                        if (!acc[exId]) acc[exId] = [];
                        acc[exId].push({ reps: ss.reps, weight: ss.weight_kg });
                        return acc;
                    }, {});
                    const exercises = Object.keys(setsByEx).map(exId => {
                        const ex = idToEx.get(exId);
                        return {
                            name: ex ? ex.name : `Exercise #${exId}`,
                            muscles: ex ? ex.muscles : { primary: [] },
                            sets: setsByEx[exId]
                        };
                    });
                    return {
                        date: s.date,
                        duration: (s.duration_minutes || 0) * 60,
                        exercises
                    };
                });
            // Render backend history in place of local history
            const container = document.getElementById('workout-history');
            if (!container) return;
            container.innerHTML = backendHistory.map(w => {
                const mins = Math.max(0, Math.round((w.duration||0)/60));
                const body = (w.exercises||[]).map(ex => {
                    const setsHtml = (ex.sets||[]).map((s,i)=>`<span class=\"history-set\">Set ${i+1}: ${s.reps||''} reps${s.weight?` @ ${s.weight} kg`:''}</span>`).join(' · ');
                    return `<div class=\"history-exercise\"><div class=\"history-exercise__name\"><strong>${ex.name}</strong></div><div class=\"history-exercise__sets\">${setsHtml}</div></div>`;
                }).join('');
                return `<div class=\"history-item\"><div class=\"history-item__header\"><strong>${w.date}</strong> — ${mins} min · ${w.exercises.length} exercises</div><div class=\"history-item__body\">${body}</div></div>`;
            }).join('');
        } catch(_) {
            // Not logged in or API unavailable; keep local history display
        }
    }
}

// Global instance and helpers for inline handlers
let workoutTracker;
document.addEventListener('DOMContentLoaded', () => {
    // Always create the tracker so other modules (weekly schedule) can interact with it
    if (!workoutTracker) {
        workoutTracker = new WorkoutTracker();
        window.workoutTracker = workoutTracker;
    }
    window.showExercises = (category) => workoutTracker.showExercises(category);
    window.hideExercises = () => workoutTracker.hideExercises();
    window.endWorkout = () => workoutTracker.endWorkout();
});