# Smart Recommendations Engine for Maverick Aim Rush
# AI-powered workout and nutrition recommendations

import math
from datetime import date, timedelta
from typing import Dict, List, Any, Optional
from django.contrib.auth.models import User
from django.db.models import Avg, Count, Max, Q
from .models import (
    WorkoutSession, StrengthSet, NutritionLog, BodyMeasurement,
    Goal, ExerciseCatalog, MacroTarget, UserProfile
)
from .calculators import FitnessCalculator


class SmartRecommendations:
    """AI-powered recommendation engine for workouts and nutrition."""
    
    def __init__(self, user: Optional[User]):
        self.user = user
        self.user_profile = self._get_user_profile() if user else None
        self.recent_sessions = self._get_recent_sessions() if user else []
        self.recent_nutrition = self._get_recent_nutrition() if user else []
        self.current_goals = self._get_current_goals() if user else []
    
    def _get_user_profile(self) -> Optional[UserProfile]:
        """Get user profile with preferences."""
        try:
            return UserProfile.objects.get(user=self.user)
        except Exception:
            return None
    
    def _get_recent_sessions(self, days: int = 30) -> List[WorkoutSession]:
        """Get recent workout sessions."""
        cutoff_date = date.today() - timedelta(days=days)
        return WorkoutSession.objects.filter(
            user=self.user,
            start_time__date__gte=cutoff_date
        ).order_by('-start_time')
    
    def _get_recent_nutrition(self, days: int = 7) -> List[NutritionLog]:
        """Get recent nutrition logs."""
        cutoff_date = date.today() - timedelta(days=days)
        return NutritionLog.objects.filter(
            user=self.user,
            date__gte=cutoff_date
        )
    
    def _get_current_goals(self) -> List[Goal]:
        """Get active goals."""
        return Goal.objects.filter(user=self.user, is_active=True)
    
    def get_workout_recommendations(self) -> Dict[str, Any]:
        """Generate personalized workout recommendations."""
        recommendations = {
            'next_workout': self._recommend_next_workout(),
            'exercise_suggestions': self._suggest_exercises(),
            'intensity_adjustment': self._suggest_intensity_adjustment(),
            'rest_recommendations': self._suggest_rest_days(),
            'form_tips': self._suggest_form_improvements()
        }
        
        return recommendations
    
    def get_nutrition_recommendations(self) -> Dict[str, Any]:
        """Generate personalized nutrition recommendations."""
        recommendations = {
            'macro_balance': self._analyze_macro_balance(),
            'meal_timing': self._suggest_meal_timing(),
            'hydration': self._suggest_hydration(),
            'supplements': self._suggest_supplements(),
            'food_suggestions': self._suggest_foods()
        }
        
        return recommendations
    
    def get_progress_recommendations(self) -> Dict[str, Any]:
        """Generate progress-based recommendations."""
        recommendations = {
            'goal_adjustments': self._suggest_goal_adjustments(),
            'plateau_breaking': self._suggest_plateau_breaking(),
            'consistency_tips': self._suggest_consistency_improvements(),
            'recovery_optimization': self._suggest_recovery_optimization()
        }
        
        return recommendations
    
    def _recommend_next_workout(self) -> Dict[str, Any]:
        """Recommend the next workout based on recent activity."""
        if not self.recent_sessions:
            return self._get_beginner_workout()
        
        last_workout = self.recent_sessions.first()
        days_since_last = (date.today() - last_workout.start_time.date()).days
        
        # Analyze last workout to determine next
        last_exercises = StrengthSet.objects.filter(session=last_workout)
        muscle_groups_worked = set()
        
        for set_obj in last_exercises:
            exercise = set_obj.exercise
            # Get primary muscles for this exercise
            primary_muscles = exercise.muscles.filter(exercisemuscle__role='primary')
            muscle_groups_worked.update([m.name for m in primary_muscles])
        
        # Recommend complementary workout
        if 'Chest' in muscle_groups_worked:
            return {
                'type': 'Back and Biceps',
                'focus': 'Pull movements to balance push',
                'exercises': ['Barbell Row', 'Lat Pulldown', 'Bicep Curls'],
                'reasoning': 'Balancing your chest workout with back exercises'
            }
        elif 'Back' in muscle_groups_worked:
            return {
                'type': 'Chest and Triceps',
                'focus': 'Push movements',
                'exercises': ['Bench Press', 'Incline Press', 'Tricep Dips'],
                'reasoning': 'Following up back day with chest and triceps'
            }
        else:
            return {
                'type': 'Full Body',
                'focus': 'Compound movements',
                'exercises': ['Squats', 'Deadlifts', 'Overhead Press'],
                'reasoning': 'Full body workout for overall strength'
            }
    
    def _suggest_exercises(self) -> List[Dict[str, Any]]:
        """Suggest specific exercises based on user goals and equipment."""
        suggestions = []
        
        if not self.user_profile:
            return suggestions
        
        # Get user's available equipment
        available_equipment = self.user_profile.available_equipment.split(',') if self.user_profile.available_equipment else []
        
        # Filter exercises based on equipment and goals
        exercises = ExerciseCatalog.objects.all()
        
        if available_equipment:
            equipment_filter = Q()
            for equipment in available_equipment:
                equipment = equipment.strip()
                if equipment == 'bodyweight':
                    equipment_filter |= Q(equipment_needed__icontains='bodyweight') | Q(equipment_needed__isnull=True)
                else:
                    equipment_filter |= Q(equipment_needed__icontains=equipment)
            exercises = exercises.filter(equipment_filter)
        
        # Filter by primary goal
        if self.user_profile.primary_goal:
            exercises = exercises.filter(recommended_for_goal=self.user_profile.primary_goal)
        
        # Get top 5 exercises
        for exercise in exercises[:5]:
            suggestions.append({
                'name': exercise.name,
                'category': exercise.category,
                'difficulty': exercise.difficulty_level,
                'reason': f'Matches your {self.user_profile.primary_goal} goal',
                'equipment': exercise.equipment_needed
            })
        
        return suggestions
    
    def _suggest_intensity_adjustment(self) -> Dict[str, Any]:
        """Suggest intensity adjustments based on recent performance."""
        if not self.recent_sessions:
            return {'adjustment': 'start_light', 'reason': 'Begin with moderate intensity'}
        
        # Analyze recent performance trends
        recent_sets = StrengthSet.objects.filter(
            session__in=self.recent_sessions[:7]  # Last 7 sessions
        ).order_by('session__start_time')
        
        if not recent_sets:
            return {'adjustment': 'maintain', 'reason': 'Continue current intensity'}
        
        # Calculate average weight progression
        exercise_weights = {}
        for set_obj in recent_sets:
            exercise_name = set_obj.exercise.name
            if exercise_name not in exercise_weights:
                exercise_weights[exercise_name] = []
            exercise_weights[exercise_name].append(set_obj.weight_kg)
        
        # Analyze trends
        improving_exercises = 0
        total_exercises = len(exercise_weights)
        
        for exercise, weights in exercise_weights.items():
            if len(weights) >= 3:
                recent_avg = sum(weights[-3:]) / 3
                older_avg = sum(weights[:-3]) / len(weights[:-3]) if len(weights) > 3 else recent_avg
                if recent_avg > older_avg * 1.05:  # 5% improvement
                    improving_exercises += 1
        
        improvement_ratio = improving_exercises / total_exercises if total_exercises > 0 else 0
        
        if improvement_ratio > 0.7:
            return {
                'adjustment': 'increase',
                'reason': 'Great progress! Consider increasing weight or reps',
                'suggestion': 'Add 2.5-5kg to your main lifts'
            }
        elif improvement_ratio < 0.3:
            return {
                'adjustment': 'decrease',
                'reason': 'Consider reducing intensity to prevent overtraining',
                'suggestion': 'Reduce weight by 10% and focus on form'
            }
        else:
            return {
                'adjustment': 'maintain',
                'reason': 'Steady progress, maintain current intensity',
                'suggestion': 'Keep current weights and focus on consistency'
            }
    
    def _suggest_rest_days(self) -> Dict[str, Any]:
        """Suggest rest day recommendations."""
        if not self.recent_sessions:
            return {'rest_needed': False, 'reason': 'No recent workouts'}
        
        # Count workouts in last 7 days
        week_ago = date.today() - timedelta(days=7)
        recent_count = self.recent_sessions.filter(start_time__date__gte=week_ago).count()
        
        if recent_count >= 5:
            return {
                'rest_needed': True,
                'reason': 'High workout frequency detected',
                'suggestion': 'Take 1-2 rest days to allow recovery',
                'days_since_last': (date.today() - self.recent_sessions.first().start_time.date()).days
            }
        elif recent_count == 0:
            return {
                'rest_needed': False,
                'reason': 'No workouts this week',
                'suggestion': 'Time to get back to training!'
            }
        else:
            return {
                'rest_needed': False,
                'reason': 'Good workout frequency',
                'suggestion': 'Continue current schedule'
            }
    
    def _suggest_form_improvements(self) -> List[Dict[str, Any]]:
        """Suggest form improvements based on exercise patterns."""
        suggestions = []
        
        # Analyze exercise patterns for potential form issues
        recent_sets = StrengthSet.objects.filter(
            session__in=self.recent_sessions[:5]
        ).values('exercise__name').annotate(
            avg_reps=Avg('reps'),
            avg_weight=Avg('weight_kg')
        )
        
        for exercise_data in recent_sets:
            exercise_name = exercise_data['exercise__name']
            avg_reps = exercise_data['avg_reps']
            avg_weight = exercise_data['avg_weight']
            
            # Suggest form tips based on exercise type
            if 'squat' in exercise_name.lower():
                if avg_reps > 15:
                    suggestions.append({
                        'exercise': exercise_name,
                        'tip': 'Consider adding weight and reducing reps to 8-12 for strength',
                        'reason': 'High reps with low weight may indicate form focus over strength'
                    })
            elif 'deadlift' in exercise_name.lower():
                if avg_reps > 8:
                    suggestions.append({
                        'exercise': exercise_name,
                        'tip': 'Deadlifts are best performed with 1-5 reps for strength',
                        'reason': 'High reps can compromise form and safety'
                    })
        
        return suggestions[:3]  # Return top 3 suggestions
    
    def _analyze_macro_balance(self) -> Dict[str, Any]:
        """Analyze macro balance and provide recommendations."""
        if not self.recent_nutrition:
            return {'status': 'no_data', 'message': 'Log some meals to get macro recommendations'}
        
        # Calculate recent macro averages
        total_calories = sum(log.calories for log in self.recent_nutrition)
        total_protein = sum(log.protein_g or 0 for log in self.recent_nutrition)
        total_carbs = sum(log.carbs_g or 0 for log in self.recent_nutrition)
        total_fat = sum(log.fat_g or 0 for log in self.recent_nutrition)
        
        if total_calories == 0:
            return {'status': 'no_data', 'message': 'No calorie data available'}
        
        # Calculate percentages
        protein_pct = (total_protein * 4) / total_calories * 100
        carbs_pct = (total_carbs * 4) / total_calories * 100
        fat_pct = (total_fat * 9) / total_calories * 100
        
        # Get target macros
        try:
            latest_target = MacroTarget.objects.filter(user=self.user).order_by('-date').first()
            if latest_target:
                target_protein_pct = (latest_target.protein_g * 4) / latest_target.calories * 100
                target_carbs_pct = (latest_target.carbs_g * 4) / latest_target.calories * 100
                target_fat_pct = (latest_target.fat_g * 9) / latest_target.calories * 100
            else:
                target_protein_pct = 25
                target_carbs_pct = 45
                target_fat_pct = 30
        except:
            target_protein_pct = 25
            target_carbs_pct = 45
            target_fat_pct = 30
        
        # Analyze deviations
        recommendations = []
        
        if protein_pct < target_protein_pct - 5:
            recommendations.append({
                'macro': 'protein',
                'status': 'low',
                'current': f'{protein_pct:.1f}%',
                'target': f'{target_protein_pct:.1f}%',
                'suggestion': 'Increase protein intake with lean meats, eggs, or protein powder'
            })
        elif protein_pct > target_protein_pct + 5:
            recommendations.append({
                'macro': 'protein',
                'status': 'high',
                'current': f'{protein_pct:.1f}%',
                'target': f'{target_protein_pct:.1f}%',
                'suggestion': 'Consider reducing protein slightly to balance macros'
            })
        
        if carbs_pct < target_carbs_pct - 10:
            recommendations.append({
                'macro': 'carbs',
                'status': 'low',
                'current': f'{carbs_pct:.1f}%',
                'target': f'{target_carbs_pct:.1f}%',
                'suggestion': 'Add more complex carbs like rice, oats, or sweet potatoes'
            })
        
        if fat_pct < target_fat_pct - 5:
            recommendations.append({
                'macro': 'fat',
                'status': 'low',
                'current': f'{fat_pct:.1f}%',
                'target': f'{target_fat_pct:.1f}%',
                'suggestion': 'Include healthy fats like avocado, nuts, or olive oil'
            })
        
        return {
            'status': 'analyzed',
            'current': {
                'protein': f'{protein_pct:.1f}%',
                'carbs': f'{carbs_pct:.1f}%',
                'fat': f'{fat_pct:.1f}%'
            },
            'target': {
                'protein': f'{target_protein_pct:.1f}%',
                'carbs': f'{target_carbs_pct:.1f}%',
                'fat': f'{target_fat_pct:.1f}%'
            },
            'recommendations': recommendations
        }
    
    def _suggest_meal_timing(self) -> Dict[str, Any]:
        """Suggest optimal meal timing based on workout schedule."""
        if not self.user_profile or not getattr(self.user_profile, 'preferred_workout_time', None):
            return {'suggestion': 'Eat every 3-4 hours for consistent energy'}
        
        workout_time = self.user_profile.preferred_workout_time
        
        if workout_time == 'morning':
            return {
                'pre_workout': 'Light meal 1-2 hours before (banana + protein)',
                'post_workout': 'Full breakfast within 1 hour',
                'reasoning': 'Morning workouts need quick energy and recovery'
            }
        elif workout_time == 'evening':
            return {
                'pre_workout': 'Lunch 3-4 hours before, light snack 1 hour before',
                'post_workout': 'Dinner within 2 hours',
                'reasoning': 'Evening workouts allow for proper meal spacing'
            }
        else:
            return {
                'pre_workout': 'Meal 2-3 hours before workout',
                'post_workout': 'Meal within 1-2 hours after',
                'reasoning': 'Midday workouts need balanced meal timing'
            }
    
    def _suggest_hydration(self) -> Dict[str, Any]:
        """Suggest hydration recommendations."""
        # Basic hydration calculation (simplified)
        if self.user_profile and getattr(self.user_profile, 'age', None):
            base_water = 35  # ml per kg body weight
            # This is a simplified calculation
            return {
                'daily_target': f'{base_water * 70:.0f}ml',  # Assuming 70kg average
                'pre_workout': '500ml 2-3 hours before',
                'during_workout': '150-250ml every 15-20 minutes',
                'post_workout': '500ml within 1 hour',
                'tip': 'Monitor urine color - should be pale yellow'
            }
        else:
            return {
                'daily_target': '2.5-3.5 liters',
                'pre_workout': '500ml 2-3 hours before',
                'during_workout': '150-250ml every 15-20 minutes',
                'post_workout': '500ml within 1 hour'
            }
    
    def _suggest_supplements(self) -> List[Dict[str, Any]]:
        """Suggest supplements based on goals and diet."""
        suggestions = []
        
        if not self.user_profile:
            return suggestions
        
        # Basic supplement recommendations based on goals
        if self.user_profile.primary_goal == 'muscle_gain':
            suggestions.extend([
                {
                    'name': 'Whey Protein',
                    'reason': 'Convenient protein source for muscle building',
                    'timing': 'Post-workout or between meals'
                },
                {
                    'name': 'Creatine',
                    'reason': 'Improves strength and muscle mass',
                    'timing': '3-5g daily, any time'
                }
            ])
        
        if self.user_profile.primary_goal == 'weight_loss':
            suggestions.append({
                'name': 'Green Tea Extract',
                'reason': 'May support fat burning and metabolism',
                'timing': 'Before meals or workouts'
            })
        
        # Universal recommendations
        suggestions.extend([
            {
                'name': 'Multivitamin',
                'reason': 'Fill nutritional gaps in diet',
                'timing': 'With breakfast'
            },
            {
                'name': 'Omega-3',
                'reason': 'Support heart health and recovery',
                'timing': 'With meals'
            }
        ])
        
        return suggestions
    
    def _suggest_foods(self) -> List[Dict[str, Any]]:
        """Suggest specific foods based on goals and preferences."""
        suggestions = []
        
        if not self.user_profile:
            return suggestions
        
        if self.user_profile.primary_goal == 'muscle_gain':
            suggestions.extend([
                {
                    'food': 'Chicken Breast',
                    'reason': 'High protein, low fat',
                    'serving': '150g provides ~45g protein'
                },
                {
                    'food': 'Sweet Potato',
                    'reason': 'Complex carbs for energy',
                    'serving': '200g provides ~40g carbs'
                },
                {
                    'food': 'Greek Yogurt',
                    'reason': 'Protein and probiotics',
                    'serving': '200g provides ~20g protein'
                }
            ])
        elif self.user_profile.primary_goal == 'weight_loss':
            suggestions.extend([
                {
                    'food': 'Leafy Greens',
                    'reason': 'Low calorie, high fiber',
                    'serving': 'Unlimited for volume eating'
                },
                {
                    'food': 'Lean Fish',
                    'reason': 'High protein, low calorie',
                    'serving': '150g provides ~35g protein'
                },
                {
                    'food': 'Berries',
                    'reason': 'Antioxidants, low sugar',
                    'serving': '100g provides ~15g carbs'
                }
            ])
        
        return suggestions
    
    def _suggest_goal_adjustments(self) -> List[Dict[str, Any]]:
        """Suggest goal adjustments based on progress."""
        suggestions = []
        
        for goal in self.current_goals:
            if goal.goal_type == 'weight_loss':
                # Check if weight loss is too fast/slow
                recent_measurements = BodyMeasurement.objects.filter(
                    user=self.user,
                    date__gte=date.today() - timedelta(days=30)
                ).order_by('-date')
                
                if len(recent_measurements) >= 2:
                    weight_change = recent_measurements[0].weight_kg - recent_measurements[-1].weight_kg
                    weeks = (recent_measurements[0].date - recent_measurements[-1].date).days / 7
                    weekly_loss = weight_change / weeks if weeks > 0 else 0
                    
                    if weekly_loss > 1.0:  # More than 1kg per week
                        suggestions.append({
                            'goal': goal.goal_type,
                            'issue': 'Weight loss too fast',
                            'suggestion': 'Increase calories by 200-300 per day',
                            'reason': 'Rapid weight loss can cause muscle loss'
                        })
                    elif weekly_loss < 0.2:  # Less than 0.2kg per week
                        suggestions.append({
                            'goal': goal.goal_type,
                            'issue': 'Weight loss too slow',
                            'suggestion': 'Reduce calories by 200-300 per day',
                            'reason': 'Slow progress may need calorie adjustment'
                        })
        
        return suggestions
    
    def _suggest_plateau_breaking(self) -> List[Dict[str, Any]]:
        """Suggest strategies to break through plateaus."""
        suggestions = []
        
        # Analyze strength progression
        recent_sets = StrengthSet.objects.filter(
            session__in=self.recent_sessions[:10]
        ).values('exercise__name').annotate(
            max_weight=Max('weight_kg'),
            avg_reps=Avg('reps')
        )
        
        plateau_exercises = []
        for exercise_data in recent_sets:
            # Check if weight has plateaued (simplified logic)
            exercise_name = exercise_data['exercise__name']
            max_weight = exercise_data['max_weight']
            avg_reps = exercise_data['avg_reps']
            
            if avg_reps > 12:  # High reps might indicate plateau
                plateau_exercises.append(exercise_name)
        
        if plateau_exercises:
            suggestions.append({
                'strategy': 'Change Rep Ranges',
                'exercises': plateau_exercises,
                'suggestion': 'Try 3-5 reps with heavier weight',
                'reason': 'High reps may indicate need for strength focus'
            })
        
        suggestions.extend([
            {
                'strategy': 'Deload Week',
                'suggestion': 'Reduce weights by 20% for one week',
                'reason': 'Allow recovery and prevent overtraining'
            },
            {
                'strategy': 'Exercise Variation',
                'suggestion': 'Try different variations of your main lifts',
                'reason': 'New movement patterns can break plateaus'
            }
        ])
        
        return suggestions
    
    def _suggest_consistency_improvements(self) -> List[Dict[str, Any]]:
        """Suggest ways to improve workout consistency."""
        suggestions = []
        
        # Analyze workout frequency
        if self.user_profile and getattr(self.user_profile, 'workout_frequency', None):
            target_frequency = int(self.user_profile.workout_frequency)
            actual_frequency = len(self.recent_sessions) / 4  # Last 4 weeks
            
            if actual_frequency < target_frequency * 0.8:
                suggestions.append({
                    'area': 'Frequency',
                    'issue': 'Missing workouts',
                    'suggestion': f'You\'re averaging {actual_frequency:.1f} workouts/week vs {target_frequency} target',
                    'tips': [
                        'Schedule workouts like appointments',
                        'Start with shorter sessions if needed',
                        'Find a workout buddy for accountability'
                    ]
                })
        
        # Analyze workout timing
        if self.user_profile and getattr(self.user_profile, 'preferred_workout_time', None):
            preferred_time = self.user_profile.preferred_workout_time
            suggestions.append({
                'area': 'Timing',
                'suggestion': f'Stick to {preferred_time} workouts for consistency',
                'tip': 'Consistent timing helps build habits'
            })
        
        return suggestions
    
    def _suggest_recovery_optimization(self) -> List[Dict[str, Any]]:
        """Suggest recovery optimization strategies."""
        suggestions = []
        
        # Analyze workout intensity and frequency
        if len(self.recent_sessions) > 4:
            avg_duration = sum(s.duration_minutes for s in self.recent_sessions[:5]) / 5
            
            if avg_duration > 90:
                suggestions.append({
                    'area': 'Workout Duration',
                    'issue': 'Long workouts detected',
                    'suggestion': 'Consider shorter, more intense sessions',
                    'reason': 'Longer workouts may impact recovery'
                })
        
        suggestions.extend([
            {
                'area': 'Sleep',
                'suggestion': 'Aim for 7-9 hours of quality sleep',
                'reason': 'Sleep is crucial for muscle recovery and growth'
            },
            {
                'area': 'Nutrition',
                'suggestion': 'Eat protein within 2 hours post-workout',
                'reason': 'Optimizes muscle protein synthesis'
            },
            {
                'area': 'Active Recovery',
                'suggestion': 'Include light cardio or stretching on rest days',
                'reason': 'Promotes blood flow and reduces soreness'
            }
        ])
        
        return suggestions
    
    def _get_beginner_workout(self) -> Dict[str, Any]:
        """Get a beginner-friendly workout recommendation."""
        return {
            'type': 'Beginner Full Body',
            'focus': 'Learning proper form',
            'exercises': [
                'Bodyweight Squats',
                'Push-ups (knee or wall)',
                'Plank',
                'Walking Lunges'
            ],
            'reasoning': 'Perfect for beginners - focus on form over intensity'
        }
    
    def get_comprehensive_recommendations(self) -> Dict[str, Any]:
        """Get all recommendations in one comprehensive response."""
        # Check if user has any data
        has_workout_data = self.recent_sessions.exists()
        has_nutrition_data = self.recent_nutrition.exists()
        
        if not has_workout_data and not has_nutrition_data:
            # Return sample recommendations for new users
            return self._get_sample_recommendations()
        
        return {
            'workout': self.get_workout_recommendations(),
            'nutrition': self.get_nutrition_recommendations(),
            'progress': self.get_progress_recommendations(),
            'generated_at': date.today().isoformat(),
            'user_goals': [goal.goal_type for goal in self.current_goals],
            'fitness_level': self.user_profile.fitness_level if self.user_profile else 'unknown'
        }
    
    def _get_sample_recommendations(self) -> Dict[str, Any]:
        """Get sample recommendations for new users."""
        return {
            'workout': {
                'next_workout': {
                    'type': 'Beginner Full Body',
                    'focus': 'Building a foundation',
                    'exercises': ['Bodyweight Squats', 'Push-ups', 'Plank', 'Walking Lunges'],
                    'reasoning': 'Perfect for beginners - focus on form and building consistency'
                },
                'exercise_suggestions': [
                    {
                        'name': 'Bodyweight Squats',
                        'category': 'Strength',
                        'difficulty': 'Beginner',
                        'reason': 'Great for building leg strength and mobility',
                        'equipment': 'None'
                    },
                    {
                        'name': 'Push-ups',
                        'category': 'Strength',
                        'difficulty': 'Beginner',
                        'reason': 'Excellent upper body exercise',
                        'equipment': 'None'
                    }
                ],
                'intensity_adjustment': {
                    'adjustment': 'start_light',
                    'reason': 'Begin with moderate intensity to build consistency',
                    'suggestion': 'Start with 2-3 sets of 8-12 reps for each exercise'
                },
                'rest_recommendations': {
                    'rest_needed': False,
                    'reason': 'No recent workouts detected',
                    'suggestion': 'Start with 3 workouts per week with rest days between'
                }
            },
            'nutrition': {
                'macro_balance': {
                    'status': 'no_data',
                    'message': 'Log some meals to get macro recommendations'
                },
                'meal_timing': {
                    'pre_workout': 'Light meal 1-2 hours before (banana + protein)',
                    'post_workout': 'Full meal within 1 hour',
                    'reasoning': 'Proper meal timing supports workout performance and recovery'
                },
                'hydration': {
                    'daily_target': '2.5-3.5 liters',
                    'pre_workout': '500ml 2-3 hours before',
                    'during_workout': '150-250ml every 15-20 minutes',
                    'post_workout': '500ml within 1 hour'
                },
                'supplements': [
                    {
                        'name': 'Multivitamin',
                        'reason': 'Fill nutritional gaps in diet',
                        'timing': 'With breakfast'
                    }
                ]
            },
            'progress': {
                'goal_adjustments': [],
                'plateau_breaking': [
                    {
                        'strategy': 'Start Small',
                        'suggestion': 'Begin with 2-3 workouts per week',
                        'reason': 'Consistency is more important than intensity when starting'
                    }
                ],
                'consistency_tips': [
                    {
                        'area': 'Getting Started',
                        'suggestion': 'Schedule workouts like appointments',
                        'tips': [
                            'Choose specific days and times',
                            'Start with shorter sessions (20-30 minutes)',
                            'Focus on building the habit first'
                        ]
                    }
                ],
                'recovery_optimization': [
                    {
                        'area': 'Sleep',
                        'suggestion': 'Aim for 7-9 hours of quality sleep',
                        'reason': 'Sleep is crucial for muscle recovery and growth'
                    }
                ]
            },
            'generated_at': date.today().isoformat(),
            'user_goals': ['getting_started'],
            'fitness_level': 'beginner',
            'is_sample': True
        }
