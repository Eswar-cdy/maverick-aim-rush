// Weekly Workout Schedule System
const API_URL = 'http://127.0.0.1:8000/api/tracker';

class WeeklySchedule {
    constructor() {
        this.scheduleState = {};
        this.currentDay = 'Day1';
        this.weeklyPlan = {};

        this.buildDefaultPlan();
        this.showDaySchedule('Day1');

        this.loadProgramPlan();
        this.initializeEventListeners();
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
        const accessToken = localStorage.getItem('accessToken');
        if (!accessToken) { return; }
        try {
            const resp = await fetch(`${API_URL}/program/`, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
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
                this.buildPlanFromGenerator(data.plan);
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
                        <div class="exercise-card__info">
                            <div class="exercise-card__name">${exercise.name}</div>
                            <div class="exercise-card__details">Sets: ${exercise.sets}, Reps: ${exercise.reps}</div>
                        </div>
                    </div>
                `;
            });
            html += `</div></div>`;
        }
        html += `</div>`;
        contentContainer.innerHTML = html;
    }

    buildPlanFromGenerator(program) {
        const generatedPlan = {};
        const days = Object.keys(program.weekly_schedule);
        days.forEach((day, index) => {
            const dayKey = `Day${index + 1}`;
            const dayData = program.weekly_schedule[day];
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
        this.updateDayTabs(days.map((_, i) => `Day${i + 1}`));
    }

    updateDayTabs(days) {
        const tabsContainer = document.querySelector('.schedule-tabs, .weekly-schedule__tabs');
        if (!tabsContainer) return;
        let tabsHtml = '';
        days.forEach((day, index) => {
            tabsHtml += `<button class="schedule-tab ${index === 0 ? 'active' : ''}" data-day="${day}" onclick="showDaySchedule('${day}')">${day}</button>`;
        });
        tabsContainer.innerHTML = tabsHtml;
    }

    buildDefaultPlan() {
        this.weeklyPlan = { Day1: { title: 'Your plan will appear here after generation', exercises: [] } };
        this.updateDayTabs(['Day1']);
    }
}

let weeklySchedule;
function showDaySchedule(day) { if (weeklySchedule) weeklySchedule.showDaySchedule(day); }

document.addEventListener('DOMContentLoaded', () => { weeklySchedule = new WeeklySchedule(); }); 