# Calculator services for Maverick Aim Rush
# BMI, BMR, TDEE, and Macro calculations

import math
from datetime import date
from typing import Dict, Any, Optional
from django.contrib.auth.models import User
from .models import MacroTarget, CalculatorResult, BodyMeasurement


class FitnessCalculator:
    """Service class for fitness-related calculations."""
    
    # Activity multipliers for TDEE calculation
    ACTIVITY_MULTIPLIERS = {
        'sedentary': 1.2,      # Little to no exercise
        'light': 1.375,        # Light exercise 1-3 days/week
        'moderate': 1.55,      # Moderate exercise 3-5 days/week
        'active': 1.725,       # Heavy exercise 6-7 days/week
        'very_active': 1.9     # Very heavy exercise, physical job
    }
    
    @staticmethod
    def calculate_bmi(weight_kg: float, height_cm: float) -> Dict[str, Any]:
        """Calculate BMI and category."""
        if height_cm <= 0 or weight_kg <= 0:
            return {'error': 'Invalid height or weight'}
        
        height_m = height_cm / 100.0
        bmi = weight_kg / (height_m * height_m)
        
        # BMI categories
        if bmi < 18.5:
            category = 'Underweight'
        elif bmi < 25:
            category = 'Normal weight'
        elif bmi < 30:
            category = 'Overweight'
        else:
            category = 'Obese'
        
        return {
            'bmi': round(bmi, 1),
            'category': category,
            'weight_kg': weight_kg,
            'height_cm': height_cm
        }
    
    @staticmethod
    def calculate_bmr(weight_kg: float, height_cm: float, age: int, gender: str) -> Dict[str, Any]:
        """Calculate Basal Metabolic Rate using Mifflin-St Jeor Equation."""
        if age <= 0 or weight_kg <= 0 or height_cm <= 0:
            return {'error': 'Invalid input parameters'}
        
        # Mifflin-St Jeor Equation
        if gender.lower() in ['male', 'm']:
            bmr = (10 * weight_kg) + (6.25 * height_cm) - (5 * age) + 5
        else:  # female
            bmr = (10 * weight_kg) + (6.25 * height_cm) - (5 * age) - 161
        
        return {
            'bmr': round(bmr, 0),
            'weight_kg': weight_kg,
            'height_cm': height_cm,
            'age': age,
            'gender': gender
        }
    
    @staticmethod
    def calculate_tdee(bmr: float, activity_level: str) -> Dict[str, Any]:
        """Calculate Total Daily Energy Expenditure."""
        if activity_level not in FitnessCalculator.ACTIVITY_MULTIPLIERS:
            return {'error': 'Invalid activity level'}
        
        multiplier = FitnessCalculator.ACTIVITY_MULTIPLIERS[activity_level]
        tdee = bmr * multiplier
        
        return {
            'tdee': round(tdee, 0),
            'bmr': bmr,
            'activity_level': activity_level,
            'multiplier': multiplier
        }
    
    @staticmethod
    def calculate_macro_targets(
        tdee: float, 
        goal_type: str, 
        weight_kg: float,
        activity_level: str = 'moderate'
    ) -> Dict[str, Any]:
        """Calculate macro targets based on goal and TDEE."""
        
        # Adjust calories based on goal
        if goal_type == 'weight_loss':
            # 20% deficit for weight loss
            target_calories = tdee * 0.8
        elif goal_type == 'muscle_gain':
            # 10% surplus for muscle gain
            target_calories = tdee * 1.1
        elif goal_type == 'performance':
            # 5% surplus for performance
            target_calories = tdee * 1.05
        else:  # maintenance
            target_calories = tdee
        
        # Protein: 1.6-2.2g per kg bodyweight (higher for muscle gain)
        if goal_type == 'muscle_gain':
            protein_per_kg = 2.2
        elif goal_type == 'weight_loss':
            protein_per_kg = 2.0  # Higher protein for weight loss to preserve muscle
        else:
            protein_per_kg = 1.8
        
        protein_g = weight_kg * protein_per_kg
        protein_calories = protein_g * 4  # 4 calories per gram
        
        # Fat: 20-35% of calories (higher for weight loss)
        if goal_type == 'weight_loss':
            fat_percentage = 0.30
        elif goal_type == 'muscle_gain':
            fat_percentage = 0.25
        else:
            fat_percentage = 0.28
        
        fat_calories = target_calories * fat_percentage
        fat_g = fat_calories / 9  # 9 calories per gram
        
        # Carbs: remaining calories
        carb_calories = target_calories - protein_calories - fat_calories
        carb_g = carb_calories / 4  # 4 calories per gram
        
        return {
            'calories': round(target_calories, 0),
            'protein_g': round(protein_g, 1),
            'carbs_g': round(carb_g, 1),
            'fat_g': round(fat_g, 1),
            'goal_type': goal_type,
            'tdee': tdee,
            'weight_kg': weight_kg,
            'activity_level': activity_level,
            'protein_per_kg': protein_per_kg,
            'fat_percentage': fat_percentage
        }
    
    @classmethod
    def calculate_all(cls, user: User, goal_type: str = 'maintenance') -> Dict[str, Any]:
        """Calculate BMI, BMR, TDEE, and macro targets for a user."""
        try:
            # Get latest measurement
            latest_measurement = BodyMeasurement.objects.filter(
                user=user
            ).order_by('-date').first()
            
            if not latest_measurement:
                return {'error': 'No body measurements found. Please log your weight and height first.'}
            
            weight_kg = latest_measurement.weight_kg
            height_cm = latest_measurement.height_cm
            
            if not weight_kg or not height_cm:
                return {'error': 'Weight and height are required for calculations.'}
            
            # Get user profile for age and gender
            try:
                from users.models import UserProfile
                profile = UserProfile.objects.get(user=user)
                age = profile.age or 30  # Default age if not set
                gender = profile.gender or 'male'  # Default gender
                activity_level = profile.fitness_level or 'moderate'
            except:
                age = 30
                gender = 'male'
                activity_level = 'moderate'
            
            # Calculate all metrics
            bmi_result = cls.calculate_bmi(weight_kg, height_cm)
            bmr_result = cls.calculate_bmr(weight_kg, height_cm, age, gender)
            tdee_result = cls.calculate_tdee(bmr_result['bmr'], activity_level)
            macro_result = cls.calculate_macro_targets(
                tdee_result['tdee'], goal_type, weight_kg, activity_level
            )
            
            # Store calculation result
            CalculatorResult.objects.create(
                user=user,
                calculation_type='macros',
                input_data={
                    'weight_kg': weight_kg,
                    'height_cm': height_cm,
                    'age': age,
                    'gender': gender,
                    'activity_level': activity_level,
                    'goal_type': goal_type
                },
                result_data={
                    'bmi': bmi_result,
                    'bmr': bmr_result,
                    'tdee': tdee_result,
                    'macros': macro_result
                }
            )
            
            return {
                'bmi': bmi_result,
                'bmr': bmr_result,
                'tdee': tdee_result,
                'macros': macro_result,
                'calculated_at': date.today().isoformat()
            }
            
        except Exception as e:
            return {'error': f'Calculation failed: {str(e)}'}
    
    @classmethod
    def create_or_update_macro_target(cls, user: User, goal_type: str = 'maintenance') -> Optional[MacroTarget]:
        """Create or update daily macro targets for a user."""
        try:
            calculation_result = cls.calculate_all(user, goal_type)
            
            if 'error' in calculation_result:
                return None
            
            macros = calculation_result['macros']
            
            # Create or update macro target for today
            macro_target, created = MacroTarget.objects.update_or_create(
                user=user,
                date=date.today(),
                defaults={
                    'calories': int(macros['calories']),
                    'protein_g': macros['protein_g'],
                    'carbs_g': macros['carbs_g'],
                    'fat_g': macros['fat_g'],
                    'goal_type': goal_type,
                    'current_weight_kg': calculation_result['bmr']['weight_kg'],
                    'current_height_cm': calculation_result['bmr']['height_cm'],
                    'age': calculation_result['bmr']['age'],
                    'activity_level': macros['activity_level']
                }
            )
            
            return macro_target
            
        except Exception as e:
            print(f"Error creating macro target: {e}")
            return None
