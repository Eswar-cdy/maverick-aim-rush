// Real AI Engine for Maverick Aim Rush
// Integrates with OpenAI GPT-4, Anthropic Claude, or local LLMs

class AIEngine {
    constructor() {
        this.apiKey = null;
        this.model = 'gpt-4'; // or 'claude-3-sonnet', 'llama-2-70b'
        this.baseUrl = 'https://api.openai.com/v1'; // or Anthropic/other provider
        this.initializeAI();
    }

    async initializeAI() {
        // Load API key from environment or user settings
        this.apiKey = localStorage.getItem('ai_api_key') || process.env.OPENAI_API_KEY;
        
        if (!this.apiKey) {
            console.warn('AI API key not found. Using fallback rule-based system.');
            return false;
        }
        
        return true;
    }

    async generateWorkoutSuggestions(userProfile, workoutHistory, goals, equipment, contraindications) {
        const prompt = this.buildWorkoutPrompt(userProfile, workoutHistory, goals, equipment, contraindications);
        
        try {
            const response = await this.callLLM(prompt);
            return this.parseWorkoutResponse(response);
        } catch (error) {
            console.error('AI workout generation failed:', error);
            return this.getFallbackSuggestions(userProfile, goals);
        }
    }

    async generateWeeklySchedule(userProfile, preferences, equipment, goals) {
        const prompt = this.buildSchedulePrompt(userProfile, preferences, equipment, goals);
        
        try {
            const response = await this.callLLM(prompt);
            return this.parseScheduleResponse(response);
        } catch (error) {
            console.error('AI schedule generation failed:', error);
            return this.getFallbackSchedule(userProfile, preferences);
        }
    }

    async generateMealPlan(userProfile, dietaryRestrictions, goals, preferences) {
        const prompt = this.buildMealPlanPrompt(userProfile, dietaryRestrictions, goals, preferences);
        
        try {
            const response = await this.callLLM(prompt);
            return this.parseMealPlanResponse(response);
        } catch (error) {
            console.error('AI meal plan generation failed:', error);
            return this.getFallbackMealPlan(userProfile, goals);
        }
    }

    async analyzeProgress(userData, progressHistory) {
        const prompt = this.buildProgressAnalysisPrompt(userData, progressHistory);
        
        try {
            const response = await this.callLLM(prompt);
            return this.parseProgressAnalysis(response);
        } catch (error) {
            console.error('AI progress analysis failed:', error);
            return this.getFallbackAnalysis(userData);
        }
    }

    buildWorkoutPrompt(userProfile, workoutHistory, goals, equipment, contraindications) {
        return `You are an expert fitness trainer and exercise physiologist. Generate personalized workout suggestions based on the following user data:

USER PROFILE:
- Age: ${userProfile.age || 'Not specified'}
- Fitness Level: ${userProfile.experience_level || 'intermediate'}
- Primary Goal: ${goals.primary_goal || 'general_fitness'}
- Available Equipment: ${equipment.join(', ') || 'Bodyweight only'}
- Workout Frequency: ${userProfile.workout_frequency || 3} days/week
- Session Duration: ${userProfile.workout_duration || 60} minutes

RECENT WORKOUT HISTORY:
${workoutHistory.slice(0, 5).map(workout => 
    `- ${workout.start_time}: ${workout.exercises?.length || 0} exercises, ${workout.duration || 0} minutes`
).join('\n')}

CONTRAINDICATIONS/INJURIES:
${contraindications.map(c => `- Avoid: ${c.injury_keyword} (${c.notes || 'No specific notes'})`).join('\n')}

Please generate 3-4 personalized workout suggestions that:
1. Match the user's fitness level and goals
2. Use only available equipment
3. Respect contraindications and injuries
4. Provide variety and progression
5. Include specific exercises, sets, reps, and rest periods
6. Explain the reasoning behind each suggestion

Return the response in JSON format with this structure:
{
  "suggestions": [
    {
      "id": "unique-id",
      "title": "Workout Name",
      "description": "Detailed description",
      "type": "strength|cardio|flexibility|hiit",
      "duration": "45-60 minutes",
      "difficulty": "beginner|intermediate|advanced",
      "exercises": [
        {
          "name": "Exercise Name",
          "sets": 3,
          "reps": "8-12",
          "rest": "60-90 seconds",
          "notes": "Form tips or variations"
        }
      ],
      "calories": "300-500",
      "reasoning": "Why this workout is recommended",
      "progression": "How to progress this workout"
    }
  ]
}`;
    }

    buildSchedulePrompt(userProfile, preferences, equipment, goals) {
        return `You are an expert fitness coach. Create a personalized 7-day workout schedule based on:

USER PROFILE:
- Goal: ${goals.primary_goal}
- Level: ${userProfile.experience_level}
- Frequency: ${preferences.days_per_week} days/week
- Duration: ${preferences.session_duration} minutes/session
- Equipment: ${equipment.join(', ')}
- Split: ${preferences.split || 'PPL'}

Create a balanced weekly schedule that:
1. Matches the user's availability and preferences
2. Includes proper rest days
3. Provides progressive overload
4. Balances different muscle groups
5. Includes variety to prevent boredom

Return in JSON format:
{
  "schedule": {
    "goal": "user_goal",
    "level": "fitness_level",
    "frequency": 4,
    "days": [
      {
        "day": "Monday",
        "workout": true,
        "focus": "Push Day",
        "exercises": ["Exercise1", "Exercise2"],
        "duration": 60,
        "calories": 400,
        "notes": "Focus on progressive overload"
      }
    ]
  }
}`;
    }

    buildMealPlanPrompt(userProfile, dietaryRestrictions, goals, preferences) {
        return `You are a registered dietitian and nutrition expert. Create a personalized 7-day meal plan based on:

USER PROFILE:
- Age: ${userProfile.age}
- Weight: ${userProfile.weight} kg
- Height: ${userProfile.height} cm
- Activity Level: ${userProfile.activity_level}
- Goal: ${goals.primary_goal}

DIETARY RESTRICTIONS:
${dietaryRestrictions.join(', ') || 'None'}

NUTRITION TARGETS:
- Target Calories: ${preferences.target_calories || 2000} (AI-suggested based on goals)
- Current Intake: ${preferences.current_calories || 2000} (user's baseline)
- Protein: ${preferences.protein_ratio || 0.3} (${(preferences.target_calories * preferences.protein_ratio / 4).toFixed(0)}g)
- Carbs: ${preferences.carbs_ratio || 0.4} (${(preferences.target_calories * preferences.carbs_ratio / 4).toFixed(0)}g)
- Fat: ${preferences.fat_ratio || 0.3} (${(preferences.target_calories * preferences.fat_ratio / 9).toFixed(0)}g)

Create a meal plan that:
1. Meets macro and calorie targets
2. Respects dietary restrictions
3. Includes variety and flavor
4. Provides practical meal prep options
5. Includes snacks and hydration

Return in JSON format with detailed meal plans for each day.`;
    }

    async callLLM(prompt) {
        const response = await fetch(`${this.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: this.model,
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert fitness trainer and nutritionist. Provide detailed, personalized recommendations in JSON format.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 2000
            })
        });

        if (!response.ok) {
            throw new Error(`LLM API error: ${response.status}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }

    parseWorkoutResponse(response) {
        try {
            const parsed = JSON.parse(response);
            return parsed.suggestions || [];
        } catch (error) {
            console.error('Failed to parse AI response:', error);
            return this.getFallbackSuggestions();
        }
    }

    parseScheduleResponse(response) {
        try {
            const parsed = JSON.parse(response);
            return parsed.schedule || {};
        } catch (error) {
            console.error('Failed to parse AI response:', error);
            return this.getFallbackSchedule();
        }
    }

    parseMealPlanResponse(response) {
        try {
            const parsed = JSON.parse(response);
            return parsed.mealPlan || {};
        } catch (error) {
            console.error('Failed to parse AI response:', error);
            return this.getFallbackMealPlan();
        }
    }

    // Fallback methods for when AI is unavailable
    getFallbackSuggestions(userProfile, goals) {
        // Return the current rule-based suggestions
        return [
            {
                id: 'fallback-workout',
                title: '💪 Balanced Strength Training',
                description: 'A well-rounded workout focusing on major muscle groups.',
                type: 'strength',
                duration: '45-60 minutes',
                difficulty: userProfile?.experience_level || 'intermediate',
                exercises: ['Push-ups', 'Squats', 'Planks', 'Lunges'],
                calories: '300-400',
                reasoning: 'Fallback workout based on your fitness level',
                progression: 'Increase reps or add resistance'
            }
        ];
    }

    getFallbackSchedule(userProfile, preferences) {
        // Return basic schedule structure
        return {
            goal: preferences.primary_goal || 'general_fitness',
            level: userProfile?.experience_level || 'intermediate',
            frequency: preferences.days_per_week || 3,
            days: [
                { day: 'Monday', workout: true, focus: 'Upper Body', exercises: ['Push-ups', 'Rows'], duration: 45, calories: 300 },
                { day: 'Tuesday', workout: false, focus: 'Rest Day', exercises: [], duration: 0, calories: 0 },
                { day: 'Wednesday', workout: true, focus: 'Lower Body', exercises: ['Squats', 'Lunges'], duration: 45, calories: 350 },
                { day: 'Thursday', workout: false, focus: 'Rest Day', exercises: [], duration: 0, calories: 0 },
                { day: 'Friday', workout: true, focus: 'Full Body', exercises: ['Burpees', 'Planks'], duration: 50, calories: 400 },
                { day: 'Saturday', workout: false, focus: 'Rest Day', exercises: [], duration: 0, calories: 0 },
                { day: 'Sunday', workout: false, focus: 'Rest Day', exercises: [], duration: 0, calories: 0 }
            ]
        };
    }

    getFallbackMealPlan(userProfile, goals) {
        return {
            goal: goals.primary_goal || 'general_fitness',
            calories: 2000,
            macros: { protein: 150, carbs: 200, fat: 67 },
            days: [
                {
                    day: 'Monday',
                    meals: [
                        { name: 'Breakfast', items: ['Oatmeal', 'Banana', 'Almonds'], calories: 400 },
                        { name: 'Lunch', items: ['Grilled Chicken', 'Quinoa', 'Vegetables'], calories: 600 },
                        { name: 'Dinner', items: ['Salmon', 'Sweet Potato', 'Broccoli'], calories: 700 },
                        { name: 'Snack', items: ['Greek Yogurt', 'Berries'], calories: 300 }
                    ]
                }
            ]
        };
    }
}

// Export for use in other modules
window.AIEngine = AIEngine;
