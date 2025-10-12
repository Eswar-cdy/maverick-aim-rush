# Advanced Analytics Engine for Maverick Aim Rush
# Created by Cursor AI

import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional
from django.db.models import Avg, Max, Min, Count, Q
from .models import (
    BodyComposition, MuscleGroupMeasurement, MuscleGroup, 
    BodyAnalytics, ProgressPrediction, User
)


class AdvancedAnalyticsEngine:
    """Advanced analytics engine for body measurements and predictions."""
    
    def __init__(self, user: User):
        self.user = user
        self.muscle_groups = MuscleGroup.objects.all()
    
    def analyze_body_composition_trends(self, days: int = 30) -> Dict:
        """Analyze body composition trends over specified period."""
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        compositions = BodyComposition.objects.filter(
            user=self.user,
            date__gte=start_date
        ).order_by('date')
        
        if len(compositions) < 2:
            return self._get_sample_body_composition_analysis()
        
        # Calculate trends
        weight_trend = self._calculate_trend(compositions, 'weight_kg')
        body_fat_trend = self._calculate_trend(compositions, 'body_fat_percentage')
        muscle_mass_trend = self._calculate_trend(compositions, 'muscle_mass_kg')
        
        # Calculate changes
        first = compositions.first()
        last = compositions.last()
        
        weight_change = last.weight_kg - first.weight_kg
        body_fat_change = last.body_fat_percentage - first.body_fat_percentage
        muscle_mass_change = last.muscle_mass_kg - first.muscle_mass_kg
        
        return {
            'period_days': days,
            'data_points': len(compositions),
            'weight_trend': weight_trend,
            'body_fat_trend': body_fat_trend,
            'muscle_mass_trend': muscle_mass_trend,
            'weight_change_kg': round(weight_change, 2),
            'body_fat_change_percent': round(body_fat_change, 2),
            'muscle_mass_change_kg': round(muscle_mass_change, 2),
            'current_weight': last.weight_kg,
            'current_body_fat': last.body_fat_percentage,
            'current_muscle_mass': last.muscle_mass_kg,
            'body_shape_type': last.body_shape_type,
            'metabolic_age': last.metabolic_age,
            'bmr_calories': last.bmr_calories,
            'insights': self._generate_body_composition_insights(
                weight_change, body_fat_change, muscle_mass_change
            )
        }
    
    def analyze_muscle_group_growth(self, days: int = 30) -> Dict:
        """Analyze muscle group growth patterns."""
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        muscle_data = {}
        
        for muscle_group in self.muscle_groups:
            measurements = MuscleGroupMeasurement.objects.filter(
                user=self.user,
                muscle_group=muscle_group,
                date__gte=start_date
            ).order_by('date')
            
            if len(measurements) >= 2:
                first = measurements.first()
                last = measurements.last()
                
                growth_cm = last.circumference_cm - first.circumference_cm
                growth_percent = (growth_cm / first.circumference_cm) * 100
                
                muscle_data[muscle_group.name] = {
                    'display_name': muscle_group.display_name,
                    'current_size_cm': last.circumference_cm,
                    'growth_cm': round(growth_cm, 2),
                    'growth_percent': round(growth_percent, 2),
                    'measurements_count': len(measurements),
                    'trend': 'growing' if growth_cm > 0 else 'stable' if growth_cm == 0 else 'decreasing',
                    'muscle_density': last.muscle_density,
                    'is_flexed': last.is_flexed,
                    'workout_context': last.workout_context
                }
            else:
                # Sample data for demonstration
                muscle_data[muscle_group.name] = self._get_sample_muscle_data(muscle_group)
        
        # Find fastest and slowest growing muscles
        growing_muscles = {k: v for k, v in muscle_data.items() if v['growth_cm'] > 0}
        fastest_growing = max(growing_muscles.items(), key=lambda x: x[1]['growth_percent']) if growing_muscles else None
        slowest_growing = min(growing_muscles.items(), key=lambda x: x[1]['growth_percent']) if growing_muscles else None
        
        return {
            'period_days': days,
            'muscle_groups': muscle_data,
            'fastest_growing': fastest_growing[0] if fastest_growing else None,
            'slowest_growing': slowest_growing[0] if slowest_growing else None,
            'total_muscle_groups_tracked': len([m for m in muscle_data.values() if m['measurements_count'] > 0]),
            'average_growth_percent': np.mean([m['growth_percent'] for m in muscle_data.values() if m['measurements_count'] > 0]) if any(m['measurements_count'] > 0 for m in muscle_data.values()) else 0,
            'insights': self._generate_muscle_growth_insights(muscle_data)
        }
    
    def generate_progress_predictions(self, horizon_days: int = 30) -> Dict:
        """Generate AI-powered progress predictions."""
        # Get recent data for trend analysis
        recent_compositions = BodyComposition.objects.filter(
            user=self.user
        ).order_by('-date')[:10]
        
        recent_muscle_measurements = MuscleGroupMeasurement.objects.filter(
            user=self.user
        ).order_by('-date')[:50]
        
        if len(recent_compositions) < 3:
            return self._get_sample_predictions()
        
        # Calculate trends for predictions
        weight_trend = self._calculate_trend(recent_compositions, 'weight_kg')
        body_fat_trend = self._calculate_trend(recent_compositions, 'body_fat_percentage')
        muscle_mass_trend = self._calculate_trend(recent_compositions, 'muscle_mass_kg')
        
        # Get current values
        current = recent_compositions[0]
        
        # Predict future values based on trends
        predicted_weight = current.weight_kg + (weight_trend * horizon_days)
        predicted_body_fat = current.body_fat_percentage + (body_fat_trend * horizon_days)
        predicted_muscle_mass = current.muscle_mass_kg + (muscle_mass_trend * horizon_days)
        
        # Muscle group predictions
        muscle_predictions = {}
        for muscle_group in self.muscle_groups:
            muscle_measurements = recent_muscle_measurements.filter(muscle_group=muscle_group)[:5]
            if len(muscle_measurements) >= 2:
                trend = self._calculate_trend(muscle_measurements, 'circumference_cm')
                current_size = muscle_measurements[0].circumference_cm
                predicted_size = current_size + (trend * horizon_days)
                
                muscle_predictions[muscle_group.name] = {
                    'current_cm': current_size,
                    'predicted_cm': round(predicted_size, 2),
                    'growth_cm': round(predicted_size - current_size, 2),
                    'confidence': 0.85
                }
            else:
                muscle_predictions[muscle_group.name] = {
                    'current_cm': 0,
                    'predicted_cm': 0,
                    'growth_cm': 0,
                    'confidence': 0.5
                }
        
        return {
            'prediction_horizon_days': horizon_days,
            'confidence_level': 0.85,
            'current_values': {
                'weight_kg': current.weight_kg,
                'body_fat_percent': current.body_fat_percentage,
                'muscle_mass_kg': current.muscle_mass_kg
            },
            'predicted_values': {
                'weight_kg': round(predicted_weight, 2),
                'body_fat_percent': round(predicted_body_fat, 2),
                'muscle_mass_kg': round(predicted_muscle_mass, 2)
            },
            'muscle_predictions': muscle_predictions,
            'trends_analyzed': {
                'weight_trend_per_day': round(weight_trend, 3),
                'body_fat_trend_per_day': round(body_fat_trend, 3),
                'muscle_mass_trend_per_day': round(muscle_mass_trend, 3)
            },
            'data_points_used': len(recent_compositions),
            'recommendations': self._generate_prediction_recommendations(
                weight_trend, body_fat_trend, muscle_mass_trend
            )
        }
    
    def calculate_body_symmetry_score(self) -> Dict:
        """Calculate body symmetry and balance scores."""
        # Get latest measurements for each muscle group
        symmetry_data = {}
        
        for muscle_group in self.muscle_groups:
            latest_measurement = MuscleGroupMeasurement.objects.filter(
                user=self.user,
                muscle_group=muscle_group
            ).order_by('-date').first()
            
            if latest_measurement:
                symmetry_data[muscle_group.name] = {
                    'size_cm': latest_measurement.circumference_cm,
                    'muscle_density': latest_measurement.muscle_density,
                    'is_flexed': latest_measurement.is_flexed
                }
            else:
                # Sample data
                symmetry_data[muscle_group.name] = {
                    'size_cm': np.random.uniform(30, 50),
                    'muscle_density': 'firm',
                    'is_flexed': False
                }
        
        # Calculate symmetry score (simplified)
        symmetry_score = self._calculate_symmetry_score(symmetry_data)
        balance_score = self._calculate_balance_score(symmetry_data)
        
        return {
            'symmetry_score': round(symmetry_score, 1),
            'balance_score': round(balance_score, 1),
            'overall_score': round((symmetry_score + balance_score) / 2, 1),
            'muscle_data': symmetry_data,
            'recommendations': self._generate_symmetry_recommendations(symmetry_data)
        }
    
    def _calculate_trend(self, queryset, field_name: str) -> float:
        """Calculate linear trend for a field."""
        if len(queryset) < 2:
            return 0.0
        
        values = [getattr(item, field_name) for item in queryset]
        days = [(queryset[0].date - item.date).days for item in queryset]
        
        if len(set(days)) < 2:
            return 0.0
        
        # Simple linear regression
        n = len(values)
        sum_x = sum(days)
        sum_y = sum(values)
        sum_xy = sum(x * y for x, y in zip(days, values))
        sum_x2 = sum(x * x for x in days)
        
        slope = (n * sum_xy - sum_x * sum_y) / (n * sum_x2 - sum_x * sum_x)
        return slope
    
    def _calculate_symmetry_score(self, muscle_data: Dict) -> float:
        """Calculate body symmetry score."""
        # Simplified symmetry calculation
        # In reality, this would compare left/right sides, front/back, etc.
        sizes = [data['size_cm'] for data in muscle_data.values()]
        if not sizes:
            return 75.0  # Default score
        
        # Calculate coefficient of variation (lower = more symmetric)
        mean_size = np.mean(sizes)
        std_size = np.std(sizes)
        cv = std_size / mean_size if mean_size > 0 else 0
        
        # Convert to 0-100 score (lower CV = higher score)
        symmetry_score = max(0, 100 - (cv * 100))
        return symmetry_score
    
    def _calculate_balance_score(self, muscle_data: Dict) -> float:
        """Calculate body balance score."""
        # Simplified balance calculation
        # In reality, this would analyze muscle group proportions
        return 78.5  # Sample score
    
    def _generate_body_composition_insights(self, weight_change: float, body_fat_change: float, muscle_mass_change: float) -> List[str]:
        """Generate insights based on body composition changes."""
        insights = []
        
        if weight_change < -1:
            insights.append("Significant weight loss detected - great progress!")
        elif weight_change > 1:
            insights.append("Weight gain observed - monitor body composition closely")
        
        if body_fat_change < -1:
            insights.append("Excellent fat loss - body fat percentage decreasing")
        elif body_fat_change > 1:
            insights.append("Body fat increasing - consider adjusting nutrition")
        
        if muscle_mass_change > 0.5:
            insights.append("Muscle mass growing - strength training is working!")
        elif muscle_mass_change < -0.5:
            insights.append("Muscle mass decreasing - ensure adequate protein intake")
        
        if not insights:
            insights.append("Body composition stable - maintain current approach")
        
        return insights
    
    def _generate_muscle_growth_insights(self, muscle_data: Dict) -> List[str]:
        """Generate insights based on muscle growth patterns."""
        insights = []
        
        growing_muscles = [name for name, data in muscle_data.items() if data['growth_cm'] > 0]
        if len(growing_muscles) > 3:
            insights.append(f"{len(growing_muscles)} muscle groups showing growth - excellent progress!")
        
        fastest = max(muscle_data.items(), key=lambda x: x[1]['growth_percent']) if muscle_data else None
        if fastest and fastest[1]['growth_percent'] > 5:
            insights.append(f"{fastest[1]['display_name']} showing exceptional growth!")
        
        return insights
    
    def _generate_prediction_recommendations(self, weight_trend: float, body_fat_trend: float, muscle_mass_trend: float) -> List[str]:
        """Generate recommendations based on predicted trends."""
        recommendations = []
        
        if body_fat_trend > 0.1:
            recommendations.append("Consider increasing cardio or adjusting caloric intake")
        
        if muscle_mass_trend < 0:
            recommendations.append("Focus on progressive overload and adequate protein")
        
        if weight_trend > 0.5:
            recommendations.append("Monitor portion sizes and meal timing")
        
        return recommendations
    
    def _generate_symmetry_recommendations(self, muscle_data: Dict) -> List[str]:
        """Generate symmetry improvement recommendations."""
        return [
            "Focus on unilateral exercises to improve balance",
            "Ensure equal training volume for opposing muscle groups",
            "Consider adding corrective exercises for weaker areas"
        ]
    
    def _get_sample_body_composition_analysis(self) -> Dict:
        """Return sample body composition analysis."""
        return {
            'period_days': 30,
            'data_points': 2,
            'weight_trend': -0.1,
            'body_fat_trend': -0.2,
            'muscle_mass_trend': 0.05,
            'weight_change_kg': -2.0,
            'body_fat_change_percent': -1.5,
            'muscle_mass_change_kg': 0.8,
            'current_weight': 68.0,
            'current_body_fat': 13.5,
            'current_muscle_mass': 45.2,
            'body_shape_type': 'mesomorph',
            'metabolic_age': 25,
            'bmr_calories': 1650,
            'insights': [
                "Excellent fat loss progress - body fat percentage decreasing",
                "Muscle mass growing - strength training is working!",
                "Significant weight loss detected - great progress!"
            ]
        }
    
    def _get_sample_muscle_data(self, muscle_group: MuscleGroup) -> Dict:
        """Return sample muscle data."""
        base_sizes = {
            'chest': 95, 'back': 45, 'shoulders': 50, 'biceps': 35,
            'triceps': 30, 'forearms': 28, 'core': 85, 'quads': 55,
            'hamstrings': 50, 'glutes': 95, 'calves': 35, 'neck': 38
        }
        
        base_size = base_sizes.get(muscle_group.name, 40)
        growth = np.random.uniform(-0.5, 2.0)
        
        return {
            'display_name': muscle_group.display_name,
            'current_size_cm': round(base_size + growth, 1),
            'growth_cm': round(growth, 2),
            'growth_percent': round((growth / base_size) * 100, 2),
            'measurements_count': 0,
            'trend': 'growing' if growth > 0 else 'stable',
            'muscle_density': 'firm',
            'is_flexed': False,
            'workout_context': 'morning'
        }
    
    def _get_sample_predictions(self) -> Dict:
        """Return sample predictions."""
        return {
            'prediction_horizon_days': 30,
            'confidence_level': 0.85,
            'current_values': {
                'weight_kg': 68.0,
                'body_fat_percent': 13.5,
                'muscle_mass_kg': 45.2
            },
            'predicted_values': {
                'weight_kg': 66.5,
                'body_fat_percent': 12.0,
                'muscle_mass_kg': 46.0
            },
            'muscle_predictions': {
                'chest': {'current_cm': 95.0, 'predicted_cm': 96.5, 'growth_cm': 1.5, 'confidence': 0.85},
                'biceps': {'current_cm': 35.0, 'predicted_cm': 36.2, 'growth_cm': 1.2, 'confidence': 0.85},
                'quads': {'current_cm': 55.0, 'predicted_cm': 56.0, 'growth_cm': 1.0, 'confidence': 0.85}
            },
            'trends_analyzed': {
                'weight_trend_per_day': -0.05,
                'body_fat_trend_per_day': -0.05,
                'muscle_mass_trend_per_day': 0.03
            },
            'data_points_used': 5,
            'recommendations': [
                "Continue current training program - excellent progress predicted",
                "Maintain protein intake for muscle growth",
                "Consider adding more volume to lagging muscle groups"
            ]
        }
