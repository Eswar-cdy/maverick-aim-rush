#!/usr/bin/env python
"""
Simple script to input basic sample data for user0
"""
import os
import sys
import django
from datetime import date, datetime

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth.models import User
from tracker.models import BodyMeasurement, Goal

def create_user0_basic_data():
    """Create basic sample data for user0"""
    
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
    
    print(f"\n🎉 Successfully created basic sample data for {user.username}!")
    print(f"📊 Summary:")
    print(f"  - Body measurements: {BodyMeasurement.objects.filter(user=user).count()}")
    print(f"  - Goals: {Goal.objects.filter(user=user).count()}")
    
    # Display the data
    print(f"\n📋 User Profile Summary:")
    print(f"  Username: {user.username}")
    print(f"  Email: {user.email}")
    print(f"  Name: {user.first_name} {user.last_name}")
    
    latest_measurement = BodyMeasurement.objects.filter(user=user).latest('date')
    print(f"\n📏 Latest Body Measurements:")
    print(f"  Height: {latest_measurement.height_cm}cm")
    print(f"  Weight: {latest_measurement.weight_kg}kg")
    print(f"  Body Fat: {latest_measurement.body_fat_percentage}%")
    print(f"  Muscle Mass: {latest_measurement.muscle_mass_kg}kg")
    print(f"  Chest: {latest_measurement.chest_cm}cm")
    print(f"  Waist: {latest_measurement.waist_cm}cm")
    print(f"  Hips: {latest_measurement.hips_cm}cm")
    
    latest_goal = Goal.objects.filter(user=user).latest('start_date')
    print(f"\n🎯 Latest Goal:")
    print(f"  Type: {latest_goal.goal_type}")
    print(f"  Metric: {latest_goal.metric}")
    print(f"  Target: {latest_goal.target_value}")
    print(f"  Start: {latest_goal.start_date}")
    print(f"  End: {latest_goal.end_date}")
    print(f"  Notes: {latest_goal.notes}")

if __name__ == '__main__':
    create_user0_basic_data()
