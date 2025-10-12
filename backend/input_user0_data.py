#!/usr/bin/env python
"""
Script to input sample data for user0
"""
import os
import sys
import django
from datetime import date, datetime

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth.models import User
from tracker.models import (
    BodyMeasurement, Goal, NutritionGoal, WaterIntake, 
    SupplementLog, MealRating, FoodCategory, Recipe
)

def create_user0_data():
    """Create sample data for user0"""
    
    # Get or create user0
    user, created = User.objects.get_or_create(
        username='user0',
        defaults={
            'email': 'user0@example.com',
            'first_name': 'John',
            'last_name': 'Doe'
        }
    )
    
    if created:
        user.set_password('password123')
        user.save()
        print(f"✅ Created user: {user.username}")
    else:
        print(f"✅ Found existing user: {user.username}")
    
    # 1. BODY MEASUREMENTS
    print("\n📏 Adding body measurements...")
    
    # Create body measurements - using the correct field names
    measurement, created = BodyMeasurement.objects.get_or_create(
        user=user,
        date=date.today(),
        defaults={
            'height_cm': 178,
            'weight_kg': 74,
            'body_fat_percentage': 17,
            'muscle_mass_kg': 37,
            'neck_cm': 39,
            'shoulder_cm': 48,
            'chest_cm': 95,
            'waist_cm': 82,
            'hips_cm': 100,
            'l_bicep_cm': 33,
            'r_bicep_cm': 34,
            'l_forearm_cm': 27,
            'r_forearm_cm': 28,
            'l_thigh_cm': 54,
            'r_thigh_cm': 55,
            'l_calf_cm': 38,
            'r_calf_cm': 38,
        }
    )
    
    if created:
        print(f"  ✅ Created body measurement record with all data")
        print(f"    Height: {measurement.height_cm}cm, Weight: {measurement.weight_kg}kg")
        print(f"    Body Fat: {measurement.body_fat_percentage}%, Muscle Mass: {measurement.muscle_mass_kg}kg")
    else:
        print(f"  ⚠️  Body measurement already exists for today")
    
    # 2. FITNESS GOALS
    print("\n🎯 Adding fitness goals...")
    
    goal, created = Goal.objects.get_or_create(
        user=user,
        goal_type='muscle_gain',
        metric='weight_kg',
        defaults={
            'target_value': 80.0,
            'start_date': date.today(),
            'end_date': date(2025, 3, 21),  # 6 months from now
            'notes': 'Gain 6kg of muscle mass in 6 months. Focus on strength training and proper nutrition.'
        }
    )
    
    if created:
        print(f"  ✅ Created goal: {goal.goal_type} - {goal.metric}")
    else:
        print(f"  ⚠️  Goal already exists: {goal.goal_type} - {goal.metric}")
    
    # 3. NUTRITION GOALS
    print("\n🥗 Adding nutrition goals...")
    
    # Calculate BMR and TDEE (simplified calculation)
    # BMR = 88.362 + (13.397 × weight in kg) + (4.799 × height in cm) - (5.677 × age in years)
    bmr = 88.362 + (13.397 * 74) + (4.799 * 178) - (5.677 * 29)
    tdee = bmr * 1.55  # Moderate activity level
    target_calories = tdee + 300  # Surplus for muscle gain
    
    nutrition_goal, created = NutritionGoal.objects.get_or_create(
        user=user,
        is_active=True,
        defaults={
            'goal_type': 'muscle_gain',
            'target_calories': int(target_calories),
            'target_protein_g': int(74 * 2.2),  # 2.2g per kg body weight
            'target_carbs_g': int(target_calories * 0.45 / 4),  # 45% of calories
            'target_fat_g': int(target_calories * 0.25 / 9),  # 25% of calories
            'target_fiber_g': 35,
            'target_water_ml': 3000,
            'dietary_restrictions': 'None',
            'food_allergies': 'Peanuts',
            'preferred_meals_per_day': 4,
            'notes': 'Muscle gain nutrition plan with peanut allergy consideration'
        }
    )
    
    if created:
        print(f"  ✅ Created nutrition goal: {nutrition_goal.goal_type}")
        print(f"    Target calories: {nutrition_goal.target_calories}")
        print(f"    Target protein: {nutrition_goal.target_protein_g}g")
    else:
        print(f"  ⚠️  Nutrition goal already exists")
    
    # 4. WATER INTAKE (sample for today)
    print("\n💧 Adding water intake...")
    
    water_intake, created = WaterIntake.objects.get_or_create(
        user=user,
        date=date.today(),
        defaults={
            'amount_ml': 2000,
            'notes': 'Sample water intake for today'
        }
    )
    
    if created:
        print(f"  ✅ Added water intake: {water_intake.amount_ml}ml")
    else:
        print(f"  ⚠️  Water intake already exists for today")
    
    # 5. SUPPLEMENTS
    print("\n💊 Adding supplements...")
    
    supplements_data = [
        ('Whey Protein', '30g', 'Post-workout'),
        ('Creatine', '5g', 'Daily'),
        ('Multivitamin', '1 tablet', 'Morning'),
    ]
    
    for supplement_name, dosage, timing in supplements_data:
        supplement, created = SupplementLog.objects.get_or_create(
            user=user,
            supplement_name=supplement_name,
            date=date.today(),
            defaults={
                'dosage': dosage,
                'timing': timing,
                'notes': f'Sample {supplement_name} log'
            }
        )
        if created:
            print(f"  ✅ Added supplement: {supplement_name}")
        else:
            print(f"  ⚠️  {supplement_name} already logged today")
    
    print(f"\n🎉 Successfully created sample data for {user.username}!")
    print(f"📊 Summary:")
    print(f"  - Body measurements: {BodyMeasurement.objects.filter(user=user).count()}")
    print(f"  - Goals: {Goal.objects.filter(user=user).count()}")
    print(f"  - Nutrition goals: {NutritionGoal.objects.filter(user=user).count()}")
    print(f"  - Water intake: {WaterIntake.objects.filter(user=user).count()}")
    print(f"  - Supplements: {SupplementLog.objects.filter(user=user).count()}")

if __name__ == '__main__':
    create_user0_data()
