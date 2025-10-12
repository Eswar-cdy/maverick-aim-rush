// Enhanced AI-Powered Workout Suggestions
// Integrates real AI with the existing system

class EnhancedWorkoutSuggestionsAI extends WorkoutSuggestionsAI {
    constructor() {
        super();
        this.aiEngine = new AIEngine();
        this.useRealAI = false;
        this.initializeAI();
    }

    async initializeAI() {
        // Check if AI is available
        this.useRealAI = await this.aiEngine.initializeAI();
        
        if (this.useRealAI) {
            console.log('🤖 Real AI engine initialized successfully');
            this.showAIIndicator();
        } else {
            console.log('⚠️ Using fallback rule-based system');
            this.showFallbackIndicator();
        }
    }

    showAIIndicator() {
        // Add AI indicator to the UI
        const aiPanel = document.getElementById('ai-suggestions-panel');
        if (aiPanel) {
            const indicator = document.createElement('div');
            indicator.innerHTML = `
                <div style="position: absolute; top: 10px; right: 10px; background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 0.25rem 0.5rem; border-radius: 12px; font-size: 0.75rem; font-weight: 600;">
                    🤖 AI-Powered
                </div>
            `;
            aiPanel.style.position = 'relative';
            aiPanel.appendChild(indicator);
        }
    }

    showFallbackIndicator() {
        const aiPanel = document.getElementById('ai-suggestions-panel');
        if (aiPanel) {
            const indicator = document.createElement('div');
            indicator.innerHTML = `
                <div style="position: absolute; top: 10px; right: 10px; background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 0.25rem 0.5rem; border-radius: 12px; font-size: 0.75rem; font-weight: 600;">
                    📋 Template-Based
                </div>
            `;
            aiPanel.style.position = 'relative';
            aiPanel.appendChild(indicator);
        }
    }

    async generateSuggestions() {
        const suggestionsContent = document.getElementById('suggestions-content');
        if (!suggestionsContent) return;

        // Show enhanced loading state
        suggestionsContent.innerHTML = `
            <div class="loading-suggestions" style="text-align: center; padding: 2rem;">
                <div class="loading-spinner" style="width: 40px; height: 40px; border: 4px solid rgba(255,255,255,0.3); border-top: 4px solid white; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 1rem;"></div>
                <p>🧠 ${this.useRealAI ? 'AI is analyzing your data...' : 'Generating recommendations...'}</p>
                <p style="font-size: 0.875rem; opacity: 0.8;">
                    ${this.useRealAI ? 'Using advanced AI to create personalized workout suggestions' : 'Using template-based recommendations'}
                </p>
            </div>
        `;

        try {
            if (this.useRealAI) {
                // Use real AI
                await this.generateAISuggestions();
            } else {
                // Use fallback system
                await this.generateFallbackSuggestions();
            }
        } catch (error) {
            console.error('Error generating suggestions:', error);
            this.showErrorState();
        }
    }

    async generateAISuggestions() {
        // Collect user data for AI
        const userData = {
            userProfile: this.userProfile,
            workoutHistory: this.workoutHistory,
            goals: this.currentGoals,
            equipment: this.getAvailableEquipment(),
            contraindications: this.contraRules
        };

        // Call AI engine
        const aiSuggestions = await this.aiEngine.generateWorkoutSuggestions(
            userData.userProfile,
            userData.workoutHistory,
            userData.goals,
            userData.equipment,
            userData.contraindications
        );

        // Convert AI response to our format
        this.suggestions = aiSuggestions.map(suggestion => ({
            id: suggestion.id,
            title: suggestion.title,
            description: suggestion.description,
            type: suggestion.type,
            duration: suggestion.duration,
            difficulty: suggestion.difficulty,
            exercises: suggestion.exercises.map(ex => ex.name),
            calories: suggestion.calories,
            tags: [suggestion.type, suggestion.difficulty],
            reason: suggestion.reasoning,
            progression: suggestion.progression,
            aiGenerated: true
        }));

        this.renderSuggestions();
    }

    async generateFallbackSuggestions() {
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Use original method
        this.suggestions = this.createAISuggestions();
        this.renderSuggestions();
    }

    getAvailableEquipment() {
        const trainerConfig = getTrainerConfig();
        return (trainerConfig.equipment || 'Bodyweight').split(',').map(e => e.trim());
    }

    showErrorState() {
        const suggestionsContent = document.getElementById('suggestions-content');
        if (suggestionsContent) {
            suggestionsContent.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: #ef4444;">
                    <div style="font-size: 2rem; margin-bottom: 1rem;">⚠️</div>
                    <h3>Unable to generate suggestions</h3>
                    <p>Please try again or check your connection.</p>
                    <button onclick="window.workoutSuggestionsAI.generateSuggestions()" style="background: #3b82f6; color: white; border: none; padding: 0.5rem 1rem; border-radius: 8px; cursor: pointer; margin-top: 1rem;">
                        Try Again
                    </button>
                </div>
            `;
        }
    }

    async generateWeeklySchedule() {
        const scheduleContent = document.getElementById('schedule-content');
        const schedulePanel = document.getElementById('weekly-schedule-panel');
        
        if (!scheduleContent || !schedulePanel) return;

        // Show the schedule panel
        schedulePanel.style.display = 'block';

        // Show enhanced loading state
        scheduleContent.innerHTML = `
            <div class="loading-schedule" style="text-align: center; padding: 2rem;">
                <div class="loading-spinner" style="width: 40px; height: 40px; border: 4px solid rgba(255,255,255,0.3); border-top: 4px solid white; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 1rem;"></div>
                <p>🧠 ${this.useRealAI ? 'AI is creating your personalized program...' : 'Generating weekly schedule...'}</p>
                <p style="font-size: 0.875rem; opacity: 0.8;">
                    ${this.useRealAI ? 'Using advanced AI to optimize your 7-day fitness program' : 'Using template-based weekly schedule'}
                </p>
            </div>
        `;

        try {
            if (this.useRealAI) {
                await this.generateAISchedule();
            } else {
                await this.generateFallbackSchedule();
            }
        } catch (error) {
            console.error('Error generating schedule:', error);
            this.showScheduleError();
        }
    }

    async generateAISchedule() {
        const trainerConfig = getTrainerConfig();
        const userData = {
            userProfile: this.userProfile,
            preferences: trainerConfig,
            equipment: this.getAvailableEquipment(),
            goals: this.currentGoals
        };

        const aiSchedule = await this.aiEngine.generateWeeklySchedule(
            userData.userProfile,
            userData.preferences,
            userData.equipment,
            userData.goals
        );

        this.renderWeeklySchedule(aiSchedule);
    }

    async generateFallbackSchedule() {
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 2500));
        
        // Use original method
        const cfg = getTrainerConfig();
        const weeklySchedule = this.createWeeklySchedule(cfg);
        this.renderWeeklySchedule(weeklySchedule);
    }

    showScheduleError() {
        const scheduleContent = document.getElementById('schedule-content');
        if (scheduleContent) {
            scheduleContent.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: #ef4444;">
                    <div style="font-size: 2rem; margin-bottom: 1rem;">⚠️</div>
                    <h3>Unable to generate schedule</h3>
                    <p>Please try again or check your connection.</p>
                    <button onclick="window.workoutSuggestionsAI.generateWeeklySchedule()" style="background: #3b82f6; color: white; border: none; padding: 0.5rem 1rem; border-radius: 8px; cursor: pointer; margin-top: 1rem;">
                        Try Again
                    </button>
                </div>
            `;
        }
    }

    // Enhanced suggestion rendering with AI indicators
    renderSuggestions() {
        const suggestionsContent = document.getElementById('suggestions-content');
        if (!suggestionsContent) return;

        // Filter exercises in each suggestion by equipment and contraindications
        const cfg = getTrainerConfig();
        const allowedEquip = (cfg.equipment || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
        const avoidExact = new Set((this.contraRules || []).filter(r => r.rule === 'avoid' && r.exercise && r.exercise.name).map(r => r.exercise.name.toLowerCase()));
        const avoidKeywords = (this.contraRules || []).filter(r => r.rule === 'avoid' && r.injury_keyword).map(r => r.injury_keyword.toLowerCase());

        const filterName = (name) => {
            const n = String(name || '').toLowerCase();
            const needs = ['barbell','dumbbell','bench','machine','kettlebell'].filter(k => n.includes(k));
            if (needs.length && !needs.some(k => allowedEquip.some(a => a.includes(k)))) return false;
            if (avoidExact.has(n)) return false;
            if (avoidKeywords.some(k => n.includes(k))) return false;
            return true;
        };

        // Map and drop suggestions that become empty
        const filtered = (this.suggestions || []).map(s => ({
            ...s,
            exercises: (s.exercises || []).filter(filterName)
        })).filter(s => s.exercises && s.exercises.length > 0);

        if (filtered.length === 0) {
            suggestionsContent.innerHTML = `
                <div style="text-align: center; padding: 2rem;">
                    <p>No safe suggestions available based on your current contraindications/equipment.</p>
                </div>
            `;
            return;
        }

        suggestionsContent.innerHTML = filtered.map(suggestion => `
            <div class="suggestion-card" data-suggestion-id="${suggestion.id}" style="position: relative;">
                ${suggestion.aiGenerated ? `
                    <div style="position: absolute; top: 10px; right: 10px; background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 0.25rem 0.5rem; border-radius: 12px; font-size: 0.75rem; font-weight: 600;">
                        🤖 AI
                    </div>
                ` : `
                    <div style="position: absolute; top: 10px; right: 10px; background: linear-gradient(135deg, #6b7280, #4b5563); color: white; padding: 0.25rem 0.5rem; border-radius: 12px; font-size: 0.75rem; font-weight: 600;">
                        📋 Template
                    </div>
                `}
                <div class="suggestion-title">
                    ${suggestion.title}
                </div>
                <div class="suggestion-description">
                    ${suggestion.description}
                </div>
                <div class="suggestion-meta">
                    <span class="suggestion-tag">⏱️ ${suggestion.duration}</span>
                    <span class="suggestion-tag">🔥 ${suggestion.calories} cal</span>
                    <span class="suggestion-tag">📊 ${suggestion.difficulty}</span>
                    <span class="suggestion-tag">🎯 ${suggestion.type}</span>
                </div>
                <div style="margin-bottom: 1rem;">
                    <strong>Why this workout:</strong> ${suggestion.reason}
                </div>
                ${suggestion.progression ? `
                    <div style="margin-bottom: 1rem;">
                        <strong>Progression:</strong> ${suggestion.progression}
                    </div>
                ` : ''}
                <div style="margin-bottom: 1rem;">
                    <strong>Exercises:</strong> ${suggestion.exercises.join(', ')}
                </div>
                <div class="suggestion-actions">
                    <button class="suggestion-btn accept-btn" onclick="workoutSuggestionsAI.acceptSuggestion('${suggestion.id}')">
                        ✅ Accept & Start
                    </button>
                    <button class="suggestion-btn reject-btn" onclick="workoutSuggestionsAI.rejectSuggestion('${suggestion.id}')">
                        ❌ Not Today
                    </button>
                    <button class="suggestion-btn primary-btn" onclick="workoutSuggestionsAI.customizeSuggestion('${suggestion.id}')">
                        ⚙️ Customize
                    </button>
                </div>
            </div>
        `).join('');

        // Show start suggested workout button
        const startBtn = document.getElementById('start-suggested-workout-btn');
        if (startBtn) {
            startBtn.style.display = 'inline-block';
        }
    }
}

// Export for use
window.EnhancedWorkoutSuggestionsAI = EnhancedWorkoutSuggestionsAI;
