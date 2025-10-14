// Weekly Workout Schedule System
const API_URL = 'http://127.0.0.1:8000'; // Use main API base

class WeeklySchedule {
    constructor() {
        this.scheduleState = this.loadState() || {};
        this.currentDay = 'Day1';
        this.weeklyPlan = {};

        this.buildDefaultPlan();
        this.showDaySchedule('Day1');

        this.loadProgramPlan();
        this.initializeEventListeners();
    }
    
    saveState() {
        try {
            localStorage.setItem('weeklyScheduleState', JSON.stringify(this.scheduleState));
        } catch (e) {
            console.error("Failed to save schedule state:", e);
        }
    }

    loadState() {
        try {
            const state = localStorage.getItem('weeklyScheduleState');
            return state ? JSON.parse(state) : {};
        } catch (e) {
            console.error("Failed to load schedule state:", e);
            return {};
        }
    }

    updateSetState(day, exerciseId, setIndex, field, value) {
        if (!this.scheduleState[day]) {
            this.scheduleState[day] = {};
        }
        if (!this.scheduleState[day][exerciseId]) {
            this.scheduleState[day][exerciseId] = { sets: {} };
        }
        if (!this.scheduleState[day][exerciseId].sets[setIndex]) {
            this.scheduleState[day][exerciseId].sets[setIndex] = {};
        }
        
        if (field === 'done') {
            this.scheduleState[day][exerciseId].sets[setIndex][field] = value;
        } else {
            this.scheduleState[day][exerciseId].sets[setIndex][field] = value === '' ? null : Number(value);
        }
        
        this.saveState();
    }

    initializeEventListeners() {
        document.querySelectorAll('.cardio-details input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const cardioId = e.target.getAttribute('cardio-id');
                this.toggleCardio(cardioId);
            });
        });
    }

    async loadProgramPlan() {
        const accessToken = getAccessToken(); // Use the helper from api.js
        if (!accessToken) { return; }
        try {
            // Use the apiFetch helper which handles auth and token refresh
            const resp = await apiFetch(`${API_URL}/weekly-plan/`);
            
            if (resp.status === 204) {
                // No plan yet
                const contentContainer = document.getElementById('schedule-content');
                if (contentContainer) {
                    contentContainer.innerHTML = '<p class="no-plan">No plan yet. <a href="/questionnaire.html">Generate your plan</a>.</p>';
                }
                return;
            }
            if (!resp.ok) return;
            const data = await resp.json();
            if (data && data.plan && data.plan.weekly_schedule) {
                this.buildPlanFromGenerator(data);
                this.showDaySchedule('Day1');
            }
        } catch (e) {
            console.error('Failed to load program plan', e);
        }
    }

    showDaySchedule(day) {
        this.currentDay = day;
        document.querySelectorAll('.schedule-tab').forEach(tab => tab.classList.remove('active'));
        const activeTab = document.querySelector(`[data-day="${day}"]`);
        if (activeTab) activeTab.classList.add('active');
        this.loadDayContent(day);
    }

    loadDayContent(day) {
        const dayData = this.weeklyPlan[day];
        const contentContainer = document.getElementById('schedule-content');
        if (!contentContainer) return;
        if (!dayData) {
            contentContainer.innerHTML = '<p class="no-plan">No plan available for this day.</p>';
            return;
        }
        let html = `
            <div class="day-schedule active" data-day="${day}">
                <h2 class="day-schedule__title">${dayData.title}</h2>
        `;
        if (dayData.exercises && dayData.exercises.length > 0) {
            html += `
                <div class="day-schedule__section">
                    <h3>Strength Exercises</h3>
                    <div class="exercise-grid">
            `;
            dayData.exercises.forEach(exercise => {
                const exerciseId = exercise.id;
                html += `
                    <div class="exercise-card" data-day="${day}" data-exercise-id="${exerciseId}">
                        <div class="exercise-card__header">
                            <div class="exercise-card__name">${exercise.name}</div>
                            <div class="exercise-card__target">Target: ${exercise.sets} sets of ${exercise.reps} reps</div>
                        </div>
                        <div class="exercise-card__sets-table">
                `;
                
                const numSets = parseInt(exercise.sets, 10);
                if (!isNaN(numSets)) {
                    for (let i = 1; i <= numSets; i++) {
                        const setState = this.scheduleState[day]?.[exerciseId]?.sets?.[i] || {};
                        const repsVal = setState.reps ?? '';
                        const weightVal = setState.weight ?? '';
                        const doneChecked = setState.done ? 'checked' : '';

                        html += `
                            <div class="set-row">
                                <div class="set-row__label">Set ${i}</div>
                                <div class="set-row__input">
                                    <input type="number" placeholder="Reps" value="${repsVal}" 
                                        onchange="weeklySchedule.updateSetState('${day}', '${exerciseId}', ${i}, 'reps', this.value)">
                                </div>
                                <div class="set-row__input">
                                    <input type="number" placeholder="Weight (kg)" value="${weightVal}"
                                        onchange="weeklySchedule.updateSetState('${day}', '${exerciseId}', ${i}, 'weight', this.value)">
                                </div>
                                <div class="set-row__done">
                                    <input type="checkbox" ${doneChecked}
                                        onchange="weeklySchedule.updateSetState('${day}', '${exerciseId}', ${i}, 'done', this.checked)">
                                </div>
                            </div>
                        `;
                    }
                } else {
                    // Handle non-numeric sets like "To Failure"
                    html += `<div class="set-row-static">${exercise.name}: ${exercise.sets} of ${exercise.reps}</div>`;
                }

                html += `</div></div>`;
            });
            html += `</div>
                <div style="display:flex; justify-content:center; margin-top:1rem;">
                    <button id="save-day-btn" class="button" style="background:#3b82f6;">Save Day's Workout</button>
                </div>
            </div>`;
        }
        html += `</div>`;
        contentContainer.innerHTML = html;

        const saveBtn = document.getElementById('save-day-btn');
        if (saveBtn) {
            saveBtn.onclick = () => this.saveDayToBackend(day);
        }
    }

    async ensureExerciseMap() {
        if (this.exerciseNameToId) return;
        try {
            const data = await fetchExercises({ page_size: 300 });
            const list = data.results || data || [];
            this.exerciseNameToId = new Map();
            list.forEach(ex => this.exerciseNameToId.set((ex.name || '').toLowerCase(), ex.id));
        } catch (e) {
            this.exerciseNameToId = new Map();
        }
    }

    async saveDayToBackend(day) {
        try {
            await this.ensureExerciseMap();
            const dayData = this.weeklyPlan[day];
            if (!dayData) return;

            // Create session for today (duration 0 for now)
            const today = new Date().toISOString().slice(0,10);
            const session = await createSession(today, 0);
            const sessionId = session.id;

            // Iterate exercises and sets from state
            const tasks = [];
            (dayData.exercises || []).forEach(ex => {
                const exKey = ex.id;
                const stateForExercise = this.scheduleState[day]?.[exKey]?.sets || {};
                const backendExerciseId = this.exerciseNameToId.get((ex.name || '').toLowerCase());
                if (!backendExerciseId) return; // skip if not found

                const numSets = parseInt(ex.sets, 10);
                if (isNaN(numSets)) return;

                for (let i = 1; i <= numSets; i++) {
                    const s = stateForExercise[i];
                    if (!s) continue;
                    const reps = Number(s.reps || 0);
                    const weight = Number(s.weight || 0);
                    const hasData = (reps > 0 || weight > 0 || s.done);
                    if (!hasData) continue;
                    tasks.push(createStrengthSet(sessionId, backendExerciseId, i, reps || 0, weight || 0));
                }
            });

            await Promise.all(tasks);

            // Use new toast notification and refresh history
            if (window.workoutTracker) {
                window.workoutTracker.notify("Workout saved for " + (dayData.title || day));
                window.workoutTracker.loadBackendHistory();
            } else {
                alert("Workout saved to backend for " + (dayData.title || day));
            }
        } catch (e) {
            console.error('Failed to save day to backend', e);
            alert('Failed to save workout. Please ensure you are logged in.');
        }
    }

    buildPlanFromGenerator(program) {
        const generatedPlan = {};
        if (!program || !program.plan || !program.plan.weekly_schedule) {
            console.error("Weekly schedule data is missing or malformed", program);
            return;
        }
        const days = Object.keys(program.plan.weekly_schedule);
        days.forEach((day, index) => {
            const dayKey = `Day${index + 1}`;
            const dayData = program.plan.weekly_schedule[day];
            generatedPlan[dayKey] = {
                title: day.replace(/_/g, ' '),
                exercises: dayData.exercises.map(ex => ({
                    name: ex.name,
                    sets: ex.sets,
                    reps: ex.reps,
                    id: ex.name.toLowerCase().replace(/\s/g, '-')
                }))
            };
        });
        this.weeklyPlan = generatedPlan;
        this.updateDayTabs(days.map((day, i) => ({ key: `Day${i + 1}`, title: day.replace(/_/g, ' ') })));
    }

    updateDayTabs(days) {
        const tabsContainer = document.querySelector('.schedule-tabs, .weekly-schedule__tabs');
        if (!tabsContainer) return;
        if (!Array.isArray(days) || days.length === 0) return;

        // Normalize input to objects of shape { key, title }
        const normalized = days.map((d, idx) => {
            if (typeof d === 'string') {
                const key = d;
                const title = d.replace(/Day(\d+)/i, (_, n) => `Day ${n}`) || d;
                return { key, title };
            }
            const key = d.key || `Day${idx + 1}`;
            const title = d.title || key.replace(/Day(\d+)/i, (_, n) => `Day ${n}`);
            return { key, title };
        });

        let tabsHtml = '';
        normalized.forEach((dayInfo, index) => {
            tabsHtml += `<button class="schedule-tab ${index === 0 ? 'active' : ''}" data-day="${dayInfo.key}" onclick="showDaySchedule('${dayInfo.key}')">${dayInfo.title}</button>`;
        });
        tabsContainer.innerHTML = tabsHtml;
    }

    buildDefaultPlan() {
        this.weeklyPlan = { Day1: { title: 'Your plan will appear here after generation', exercises: [] } };
        // Provide a well-formed day tab so the label never shows as "undefined"
        this.updateDayTabs([ { key: 'Day1', title: 'Day 1' } ]);
        // Ensure placeholder content renders
        this.showDaySchedule('Day1');
    }
}

let weeklySchedule;
function showDaySchedule(day) { if (weeklySchedule) weeklySchedule.showDaySchedule(day); }

document.addEventListener('DOMContentLoaded', () => { 
    if (document.querySelector('.weekly-schedule')) {
        weeklySchedule = new WeeklySchedule(); 
    }
}); 