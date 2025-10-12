# Advanced Analytics Service for Maverick Aim Rush
# Computes comprehensive fitness analytics and insights

import math
from datetime import date, timedelta, datetime
from typing import Dict, List, Any, Optional, Tuple
from django.contrib.auth.models import User
from django.db.models import Sum, Avg, Count, Max, Min, Q, F
from django.utils import timezone
from .models import (
    WorkoutSession, StrengthSet, CardioEntry, NutritionLog, BodyMeasurement,
    ProgressAnalytics, PersonalRecord, WorkoutStreak, UserConnection,
    Challenge, ChallengeParticipation, Leaderboard, LeaderboardEntry,
    Achievement, UserAchievement, ExerciseCatalog
)


class AdvancedAnalytics:
    """Advanced analytics engine for comprehensive fitness insights."""
    
    def __init__(self, user: User):
        self.user = user
        self.today = date.today()
    
    def compute_daily_analytics(self, target_date: date = None) -> Dict[str, Any]:
        """Compute comprehensive analytics for a specific day."""
        if target_date is None:
            target_date = self.today
        
        analytics = {
            'date': target_date,
            'strength': self._compute_strength_analytics(target_date),
            'cardio': self._compute_cardio_analytics(target_date),
            'nutrition': self._compute_nutrition_analytics(target_date),
            'recovery': self._compute_recovery_analytics(target_date),
            'performance': self._compute_performance_metrics(target_date),
            'personal_records': self._check_personal_records(target_date),
            'achievements': self._check_achievements(target_date)
        }
        
        # Compute overall score
        analytics['overall_score'] = self._compute_overall_score(analytics)
        
        # Save to database
        self._save_analytics(target_date, analytics)
        
        return analytics
    
    def _compute_strength_analytics(self, target_date: date) -> Dict[str, Any]:
        """Compute strength training analytics."""
        sessions = WorkoutSession.objects.filter(
            user=self.user,
            date=target_date
        )
        
        if not sessions.exists():
            return {
                'total_volume_kg': 0,
                'total_sets': 0,
                'total_reps': 0,
                'unique_exercises': 0,
                'avg_weight_per_set': 0,
                'intensity_score': 0
            }
        
        # Get all strength sets for the day
        strength_sets = StrengthSet.objects.filter(
            session__in=sessions
        )
        
        total_volume = sum(set_obj.weight_kg * set_obj.reps for set_obj in strength_sets)
        total_sets = strength_sets.count()
        total_reps = sum(set_obj.reps for set_obj in strength_sets)
        unique_exercises = strength_sets.values('exercise').distinct().count()
        
        avg_weight_per_set = total_volume / total_sets if total_sets > 0 else 0
        
        # Compute intensity score (0-100)
        intensity_score = min(100, (total_volume / 1000) * 10)  # Simplified calculation
        
        return {
            'total_volume_kg': round(total_volume, 2),
            'total_sets': total_sets,
            'total_reps': total_reps,
            'unique_exercises': unique_exercises,
            'avg_weight_per_set': round(avg_weight_per_set, 2),
            'intensity_score': round(intensity_score, 1)
        }
    
    def _compute_cardio_analytics(self, target_date: date) -> Dict[str, Any]:
        """Compute cardio analytics."""
        sessions = WorkoutSession.objects.filter(
            user=self.user,
            date=target_date
        )
        
        if not sessions.exists():
            return {
                'total_minutes': 0,
                'total_distance_km': 0,
                'avg_heart_rate': 0,
                'calories_burned': 0
            }
        
        cardio_entries = CardioEntry.objects.filter(
            session__in=sessions
        )
        
        total_minutes = sum(entry.duration_minutes or 0 for entry in cardio_entries)
        total_distance = sum(entry.distance_km or 0 for entry in cardio_entries)
        
        # Estimate calories burned (simplified)
        calories_burned = total_minutes * 8  # Rough estimate
        
        return {
            'total_minutes': total_minutes,
            'total_distance_km': round(total_distance, 2),
            'avg_heart_rate': 0,  # Would need heart rate data
            'calories_burned': calories_burned
        }
    
    def _compute_nutrition_analytics(self, target_date: date) -> Dict[str, Any]:
        """Compute nutrition analytics."""
        nutrition_logs = NutritionLog.objects.filter(
            user=self.user,
            date=target_date
        )
        
        if not nutrition_logs.exists():
            return {
                'total_calories': 0,
                'total_protein_g': 0,
                'total_carbs_g': 0,
                'total_fat_g': 0,
                'macro_balance_score': 0,
                'meals_logged': 0
            }
        
        total_calories = sum(log.calories for log in nutrition_logs)
        total_protein = sum(log.protein_g or 0 for log in nutrition_logs)
        total_carbs = sum(log.carbs_g or 0 for log in nutrition_logs)
        total_fat = sum(log.fat_g or 0 for log in nutrition_logs)
        meals_logged = nutrition_logs.values('meal_type').distinct().count()
        
        # Compute macro balance score
        macro_balance_score = self._compute_macro_balance_score(
            total_calories, total_protein, total_carbs, total_fat
        )
        
        return {
            'total_calories': total_calories,
            'total_protein_g': round(total_protein, 1),
            'total_carbs_g': round(total_carbs, 1),
            'total_fat_g': round(total_fat, 1),
            'macro_balance_score': round(macro_balance_score, 1),
            'meals_logged': meals_logged
        }
    
    def _compute_recovery_analytics(self, target_date: date) -> Dict[str, Any]:
        """Compute recovery analytics."""
        # Get sleep data (if available)
        sleep_logs = []  # Would need SleepLog model
        
        # Get previous day's workout intensity
        yesterday = target_date - timedelta(days=1)
        yesterday_sessions = WorkoutSession.objects.filter(
            user=self.user,
            date=yesterday
        )
        
        recovery_score = 100  # Default
        if yesterday_sessions.exists():
            # Simple recovery calculation based on rest time
            hours_since_last_workout = 24  # Simplified
            recovery_score = min(100, hours_since_last_workout * 4)
        
        return {
            'sleep_hours': 0,  # Would need sleep data
            'sleep_quality': 0,
            'recovery_score': round(recovery_score, 1),
            'hours_since_last_workout': 24
        }
    
    def _compute_performance_metrics(self, target_date: date) -> Dict[str, Any]:
        """Compute overall performance metrics."""
        # Get recent data for comparison
        week_ago = target_date - timedelta(days=7)
        
        # Workout frequency
        recent_workouts = WorkoutSession.objects.filter(
            user=self.user,
            date__gte=week_ago,
            date__lte=target_date
        ).count()
        
        # Consistency score
        consistency_score = min(100, (recent_workouts / 7) * 100)
        
        # Progress indicators
        progress_indicators = self._compute_progress_indicators(target_date)
        
        return {
            'consistency_score': round(consistency_score, 1),
            'workout_frequency_7d': recent_workouts,
            'progress_indicators': progress_indicators
        }
    
    def _compute_progress_indicators(self, target_date: date) -> Dict[str, Any]:
        """Compute progress indicators."""
        # Get recent measurements
        recent_measurements = BodyMeasurement.objects.filter(
            user=self.user,
            date__lte=target_date
        ).order_by('-date')[:2]
        
        if len(recent_measurements) < 2:
            return {'weight_change': 0, 'body_fat_change': 0}
        
        current = recent_measurements[0]
        previous = recent_measurements[1]
        
        weight_change = 0
        body_fat_change = 0
        
        if current.weight_kg and previous.weight_kg:
            weight_change = current.weight_kg - previous.weight_kg
        
        if current.body_fat_percentage and previous.body_fat_percentage:
            body_fat_change = current.body_fat_percentage - previous.body_fat_percentage
        
        return {
            'weight_change': round(weight_change, 2),
            'body_fat_change': round(body_fat_change, 2),
            'days_between_measurements': (current.date - previous.date).days
        }
    
    def _compute_macro_balance_score(self, calories: int, protein: float, carbs: float, fat: float) -> float:
        """Compute macro balance score (0-100)."""
        if calories == 0:
            return 0
        
        # Ideal macro ratios (simplified)
        ideal_protein_pct = 25
        ideal_carbs_pct = 45
        ideal_fat_pct = 30
        
        # Calculate actual percentages
        protein_pct = (protein * 4) / calories * 100
        carbs_pct = (carbs * 4) / calories * 100
        fat_pct = (fat * 9) / calories * 100
        
        # Calculate deviation from ideal
        protein_deviation = abs(protein_pct - ideal_protein_pct)
        carbs_deviation = abs(carbs_pct - ideal_carbs_pct)
        fat_deviation = abs(fat_pct - ideal_fat_pct)
        
        # Convert to score (lower deviation = higher score)
        total_deviation = protein_deviation + carbs_deviation + fat_deviation
        score = max(0, 100 - (total_deviation * 2))
        
        return score
    
    def _compute_overall_score(self, analytics: Dict[str, Any]) -> float:
        """Compute overall performance score."""
        strength_score = analytics['strength']['intensity_score']
        nutrition_score = analytics['nutrition']['macro_balance_score']
        recovery_score = analytics['recovery']['recovery_score']
        consistency_score = analytics['performance']['consistency_score']
        
        # Weighted average
        overall_score = (
            strength_score * 0.3 +
            nutrition_score * 0.25 +
            recovery_score * 0.25 +
            consistency_score * 0.2
        )
        
        return round(overall_score, 1)
    
    def _save_analytics(self, target_date: date, analytics: Dict[str, Any]):
        """Save analytics to database."""
        ProgressAnalytics.objects.update_or_create(
            user=self.user,
            date=target_date,
            defaults={
                'total_volume_kg': analytics['strength']['total_volume_kg'],
                'total_sets': analytics['strength']['total_sets'],
                'total_reps': analytics['strength']['total_reps'],
                'unique_exercises': analytics['strength']['unique_exercises'],
                'total_cardio_minutes': analytics['cardio']['total_minutes'],
                'total_distance_km': analytics['cardio']['total_distance_km'],
                'total_calories': analytics['nutrition']['total_calories'],
                'total_protein_g': analytics['nutrition']['total_protein_g'],
                'total_carbs_g': analytics['nutrition']['total_carbs_g'],
                'total_fat_g': analytics['nutrition']['total_fat_g'],
                'macro_balance_score': analytics['nutrition']['macro_balance_score'],
                'sleep_hours': analytics['recovery']['sleep_hours'],
                'sleep_quality': analytics['recovery']['sleep_quality'],
                'recovery_score': analytics['recovery']['recovery_score'],
                'workout_intensity': analytics['strength']['intensity_score'],
                'consistency_score': analytics['performance']['consistency_score'],
                'overall_score': analytics['overall_score']
            }
        )
    
    def _check_personal_records(self, target_date: date) -> List[Dict[str, Any]]:
        """Check for new personal records."""
        new_records = []
        
        # Get strength sets from the day
        sessions = WorkoutSession.objects.filter(
            user=self.user,
            date=target_date
        )
        
        strength_sets = StrengthSet.objects.filter(
            session__in=sessions
        )
        
        for set_obj in strength_sets:
            # Check for max weight record
            existing_max_weight = PersonalRecord.objects.filter(
                user=self.user,
                exercise=set_obj.exercise,
                record_type='max_weight'
            ).order_by('-weight_kg').first()
            
            if not existing_max_weight or set_obj.weight_kg > existing_max_weight.weight_kg:
                # New max weight record
                PersonalRecord.objects.update_or_create(
                    user=self.user,
                    exercise=set_obj.exercise,
                    record_type='max_weight',
                    defaults={
                        'weight_kg': set_obj.weight_kg,
                        'reps': set_obj.reps,
                        'date_achieved': target_date,
                        'session': set_obj.session
                    }
                )
                new_records.append({
                    'type': 'max_weight',
                    'exercise': set_obj.exercise.name,
                    'weight_kg': set_obj.weight_kg,
                    'reps': set_obj.reps
                })
        
        return new_records
    
    def _check_achievements(self, target_date: date) -> List[Dict[str, Any]]:
        """Check for new achievements."""
        new_achievements = []
        
        # Check workout count achievements
        total_workouts = WorkoutSession.objects.filter(user=self.user).count()
        
        workout_achievements = Achievement.objects.filter(
            achievement_type='workout_count',
            required_value__lte=total_workouts,
            is_active=True
        )
        
        for achievement in workout_achievements:
            user_achievement, created = UserAchievement.objects.get_or_create(
                user=self.user,
                achievement=achievement,
                defaults={'progress_value': total_workouts}
            )
            
            if created:
                new_achievements.append({
                    'name': achievement.name,
                    'description': achievement.description,
                    'icon': achievement.icon,
                    'rarity': achievement.rarity
                })
        
        return new_achievements
    
    def update_workout_streak(self) -> Dict[str, Any]:
        """Update workout streak information."""
        streak, created = WorkoutStreak.objects.get_or_create(
            user=self.user,
            defaults={
                'current_streak': 0,
                'longest_streak': 0,
                'target_weekly_workouts': 3
            }
        )
        
        # Get recent workouts
        recent_workouts = WorkoutSession.objects.filter(
            user=self.user
        ).order_by('-date')
        
        if not recent_workouts.exists():
            return {
                'current_streak': 0,
                'longest_streak': streak.longest_streak,
                'workouts_this_week': 0,
                'consistency_percentage': 0
            }
        
        # Calculate current streak
        current_streak = 0
        last_workout_date = recent_workouts.first().date
        
        for i, workout in enumerate(recent_workouts):
            if i == 0:
                current_streak = 1
            else:
                days_between = (last_workout_date - workout.date).days
                if days_between == 1:
                    current_streak += 1
                    last_workout_date = workout.date
                else:
                    break
        
        # Update longest streak
        if current_streak > streak.longest_streak:
            streak.longest_streak = current_streak
        
        # Calculate weekly stats
        week_start = self.today - timedelta(days=self.today.weekday())
        workouts_this_week = WorkoutSession.objects.filter(
            user=self.user,
            date__gte=week_start
        ).count()
        
        # Calculate consistency percentage
        total_days = (self.today - recent_workouts.last().date).days + 1
        workout_days = recent_workouts.values('date').distinct().count()
        consistency_percentage = (workout_days / total_days) * 100 if total_days > 0 else 0
        
        # Update streak
        streak.current_streak = current_streak
        streak.last_workout_date = last_workout_date
        streak.workouts_this_week = workouts_this_week
        streak.consistency_percentage = consistency_percentage
        streak.total_workouts = recent_workouts.count()
        streak.save()
        
        return {
            'current_streak': current_streak,
            'longest_streak': streak.longest_streak,
            'workouts_this_week': workouts_this_week,
            'consistency_percentage': round(consistency_percentage, 1),
            'last_workout_date': last_workout_date
        }
    
    def get_trend_analysis(self, days: int = 30) -> Dict[str, Any]:
        """Get trend analysis for the specified period."""
        start_date = self.today - timedelta(days=days)
        
        # Get analytics data
        analytics_data = ProgressAnalytics.objects.filter(
            user=self.user,
            date__gte=start_date
        ).order_by('date')
        
        if not analytics_data.exists():
            return {'error': 'No data available for trend analysis'}
        
        # Calculate trends
        trends = {
            'volume_trend': self._calculate_trend(analytics_data, 'total_volume_kg'),
            'consistency_trend': self._calculate_trend(analytics_data, 'consistency_score'),
            'nutrition_trend': self._calculate_trend(analytics_data, 'macro_balance_score'),
            'overall_trend': self._calculate_trend(analytics_data, 'overall_score'),
            'period_summary': self._get_period_summary(analytics_data)
        }
        
        return trends
    
    def _calculate_trend(self, data, field_name: str) -> Dict[str, Any]:
        """Calculate trend for a specific field."""
        values = [getattr(item, field_name) for item in data if getattr(item, field_name, 0) > 0]
        
        if len(values) < 2:
            return {'direction': 'stable', 'percentage': 0, 'data_points': len(values)}
        
        # Simple linear trend calculation
        first_half = values[:len(values)//2]
        second_half = values[len(values)//2:]
        
        first_avg = sum(first_half) / len(first_half)
        second_avg = sum(second_half) / len(second_half)
        
        if first_avg == 0:
            percentage = 0
        else:
            percentage = ((second_avg - first_avg) / first_avg) * 100
        
        direction = 'improving' if percentage > 5 else 'declining' if percentage < -5 else 'stable'
        
        return {
            'direction': direction,
            'percentage': round(percentage, 1),
            'data_points': len(values),
            'current_value': values[-1] if values else 0,
            'average_value': round(sum(values) / len(values), 2)
        }
    
    def _get_period_summary(self, data) -> Dict[str, Any]:
        """Get summary statistics for the period."""
        if not data.exists():
            return {}
        
        return {
            'total_workout_days': data.filter(total_sets__gt=0).count(),
            'total_volume': sum(item.total_volume_kg for item in data),
            'avg_consistency': round(sum(item.consistency_score for item in data) / data.count(), 1),
            'avg_overall_score': round(sum(item.overall_score for item in data) / data.count(), 1),
            'best_day': data.order_by('-overall_score').first().date if data.exists() else None
        }
    
    def get_personal_records_summary(self) -> Dict[str, Any]:
        """Get summary of personal records."""
        records = PersonalRecord.objects.filter(user=self.user).order_by('-date_achieved')
        
        if not records.exists():
            return {'total_records': 0, 'recent_records': [], 'by_exercise': {}}
        
        # Group by exercise
        by_exercise = {}
        for record in records:
            if record.exercise.name not in by_exercise:
                by_exercise[record.exercise.name] = []
            by_exercise[record.exercise.name].append({
                'type': record.record_type,
                'weight_kg': record.weight_kg,
                'reps': record.reps,
                'date': record.date_achieved
            })
        
        return {
            'total_records': records.count(),
            'recent_records': [
                {
                    'exercise': r.exercise.name,
                    'type': r.record_type,
                    'weight_kg': r.weight_kg,
                    'reps': r.reps,
                    'date': r.date_achieved
                }
                for r in records[:10]
            ],
            'by_exercise': by_exercise
        }
    
    def get_achievements_summary(self) -> Dict[str, Any]:
        """Get summary of achievements."""
        user_achievements = UserAchievement.objects.filter(
            user=self.user,
            is_displayed=True
        ).order_by('-earned_at')
        
        if not user_achievements.exists():
            return {'total_achievements': 0, 'recent_achievements': [], 'by_rarity': {}}
        
        # Group by rarity
        by_rarity = {}
        for achievement in user_achievements:
            rarity = achievement.achievement.rarity
            if rarity not in by_rarity:
                by_rarity[rarity] = []
            by_rarity[rarity].append({
                'name': achievement.achievement.name,
                'icon': achievement.achievement.icon,
                'earned_at': achievement.earned_at
            })
        
        return {
            'total_achievements': user_achievements.count(),
            'recent_achievements': [
                {
                    'name': a.achievement.name,
                    'icon': a.achievement.icon,
                    'rarity': a.achievement.rarity,
                    'earned_at': a.earned_at
                }
                for a in user_achievements[:10]
            ],
            'by_rarity': by_rarity
        }
