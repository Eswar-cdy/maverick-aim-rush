"""
Fitness metrics calculation utilities
"""
import math


def epley_e1rm(weight, reps):
    """
    Calculate estimated 1-rep max using Epley formula
    
    Args:
        weight (float): Weight lifted in kg
        reps (int): Number of repetitions performed
        
    Returns:
        float: Estimated 1-rep max in kg
    """
    if weight <= 0:
        return 0.0
    
    if reps <= 0:
        return weight
    
    # Epley formula: e1RM = weight * (1 + reps/30)
    return weight * (1 + reps / 30.0)


def brzycki_e1rm(weight, reps):
    """
    Calculate estimated 1-rep max using Brzycki formula
    
    Args:
        weight (float): Weight lifted in kg
        reps (int): Number of repetitions performed
        
    Returns:
        float: Estimated 1-rep max in kg
    """
    if weight <= 0:
        return 0.0
    
    if reps <= 0:
        return weight
    
    if reps == 1:
        return weight
    
    # Brzycki formula: e1RM = weight * (36 / (37 - reps))
    return weight * (36 / (37 - reps))


def coarse_trimp(heart_rate, age=30):
    """
    Calculate coarse TRIMP (Training Impulse) based on heart rate zones
    
    Args:
        heart_rate (int): Current heart rate in BPM
        age (int): Athlete's age in years
        
    Returns:
        int: TRIMP zone (1-5)
    """
    if heart_rate <= 0 or age <= 0:
        return 1
    
    # Calculate max HR using 220 - age formula
    max_hr = 220 - age
    
    # Calculate HR reserve
    resting_hr = max_hr * 0.6  # Approximation
    hr_reserve = heart_rate - resting_hr
    
    if hr_reserve <= 0:
        return 1  # Recovery zone
    elif hr_reserve <= max_hr * 0.1:
        return 2  # Aerobic base
    elif hr_reserve <= max_hr * 0.2:
        return 3  # Aerobic threshold
    elif hr_reserve <= max_hr * 0.3:
        return 4  # Lactate threshold
    else:
        return 5  # VO2 max


def mifflin_st_jeor_bmr(weight_kg, height_cm, age, gender):
    """
    Calculate Basal Metabolic Rate using Mifflin-St Jeor equation
    
    Args:
        weight_kg (float): Weight in kg
        height_cm (float): Height in cm
        age (int): Age in years
        gender (str): 'male' or 'female'
        
    Returns:
        float: BMR in calories per day
    """
    if weight_kg <= 0 or height_cm <= 0 or age <= 0:
        return 0.0
    
    if gender.lower() == 'male':
        bmr = (10 * weight_kg) + (6.25 * height_cm) - (5 * age) + 5
    else:  # female
        bmr = (10 * weight_kg) + (6.25 * height_cm) - (5 * age) - 161
    
    return max(0, bmr)


def calculate_hrr_zones(resting_hr, max_hr):
    """
    Calculate Heart Rate Reserve zones
    
    Args:
        resting_hr (int): Resting heart rate
        max_hr (int): Maximum heart rate
        
    Returns:
        dict: HRR zones as percentages
    """
    if resting_hr >= max_hr or max_hr <= 0:
        return {}
    
    hrr = max_hr - resting_hr
    
    return {
        'recovery': (resting_hr, resting_hr + hrr * 0.6),
        'aerobic_base': (resting_hr + hrr * 0.6, resting_hr + hrr * 0.7),
        'aerobic_threshold': (resting_hr + hrr * 0.7, resting_hr + hrr * 0.8),
        'lactate_threshold': (resting_hr + hrr * 0.8, resting_hr + hrr * 0.9),
        'vo2_max': (resting_hr + hrr * 0.9, max_hr)
    }
