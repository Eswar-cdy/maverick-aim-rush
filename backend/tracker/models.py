# Models for Maverick Aim Rush — created by Cursor AI
from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
import uuid

# Refactored enums/constants for Goal model choices
class GoalType:
    WEIGHT_LOSS = 'weight_loss'
    MUSCLE_GAIN = 'muscle_gain'
    PERFORMANCE = 'performance'
    
    CHOICES = [
        (WEIGHT_LOSS, 'Weight Loss'),
        (MUSCLE_GAIN, 'Muscle Gain'),
        (PERFORMANCE, 'Performance'),
    ]

class GoalMetric:
    WEIGHT_KG = 'weight_kg'
    BODY_FAT = 'body_fat'
    LIFT_KG = 'lift_kg'
    
    CHOICES = [
        (WEIGHT_KG, 'Body Weight (kg)'),
        (BODY_FAT, 'Body Fat (%)'),
        (LIFT_KG, 'Lift (kg)'),
    ]

class Goal(models.Model):
    # Added uuid field for unique identification
    uuid = models.UUIDField(unique=True, default=uuid.uuid4, editable=False)
    
    # Timestamp fields for tracking record creation and updates
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='goals')
    
    # Refactored to use enum constants
    goal_type = models.CharField(max_length=50, choices=GoalType.CHOICES)
    metric = models.CharField(max_length=20, choices=GoalMetric.CHOICES, default=GoalMetric.WEIGHT_KG)
    
    target_value = models.FloatField()
    
    # Optional when metric == 'lift_kg'
    exercise = models.ForeignKey('ExerciseCatalog', null=True, blank=True, on_delete=models.SET_NULL)
    notes = models.CharField(max_length=200, null=True, blank=True)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    
    # Added is_public field for sharing goals
    is_public = models.BooleanField(default=False)
    
    def __str__(self):
        return f"{self.user.username}'s {self.get_goal_type_display()} Goal"
    
    class Meta:
        ordering = ['-start_date']

class BodyMeasurement(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='measurements')
    date = models.DateField()
    weight_kg = models.FloatField(null=True, blank=True)
    body_fat_percentage = models.FloatField(null=True, blank=True)
    muscle_mass_kg = models.FloatField(null=True, blank=True)
    height_cm = models.FloatField(null=True, blank=True)
    photo_url = models.URLField(null=True, blank=True)
    
    # Circumferences (cm)
    neck_cm = models.FloatField(null=True, blank=True)
    chest_cm = models.FloatField(null=True, blank=True)
    shoulder_cm = models.FloatField(null=True, blank=True)
    l_bicep_cm = models.FloatField(null=True, blank=True)
    r_bicep_cm = models.FloatField(null=True, blank=True)
    l_forearm_cm = models.FloatField(null=True, blank=True)
    r_forearm_cm = models.FloatField(null=True, blank=True)
    waist_cm = models.FloatField(null=True, blank=True)
    hips_cm = models.FloatField(null=True, blank=True)
    l_thigh_cm = models.FloatField(null=True, blank=True)
    r_thigh_cm = models.FloatField(null=True, blank=True)
    l_calf_cm = models.FloatField(null=True, blank=True)
    r_calf_cm = models.FloatField(null=True, blank=True)

# Refactored enums/constants for ExerciseCatalog model
class MuscleGroup:
    CHEST = 'chest'
    BACK = 'back'
    SHOULDERS = 'shoulders'
    ARMS = 'arms'
    LEGS = 'legs'
    CORE = 'core'
    CARDIO = 'cardio'
    FULL_BODY = 'full_body'
    
    CHOICES = [
        (CHEST, 'Chest'),
        (BACK, 'Back'),
        (SHOULDERS, 'Shoulders'),
        (ARMS, 'Arms'),
        (LEGS, 'Legs'),
        (CORE, 'Core'),
        (CARDIO, 'Cardio'),
        (FULL_BODY, 'Full Body'),
    ]

class ExerciseCatalog(models.Model):
    # Added uuid field for unique identification
    uuid = models.UUIDField(unique=True, default=uuid.uuid4, editable=False)
    
    # Timestamp fields for tracking record creation and updates
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    
    # Refactored to use enum constants
    muscle_group = models.CharField(max_length=20, choices=MuscleGroup.CHOICES)
    
    difficulty_level = models.IntegerField(default=1)
    video_url = models.URLField(null=True, blank=True)
    
    # Added __str__ method for admin clarity
    def __str__(self):
        return f"{self.name} ({self.get_muscle_group_display()})"

# Refactored enums/constants for WorkoutSession model
class WorkoutVisibility:
    PRIVATE = 'private'
    PUBLIC = 'public'
    FRIENDS = 'friends'
    
    CHOICES = [
        (PRIVATE, 'Private'),
        (PUBLIC, 'Public'),
        (FRIENDS, 'Friends Only'),
    ]

class WorkoutSession(models.Model):
    # Added uuid field for unique identification
    uuid = models.UUIDField(unique=True, default=uuid.uuid4, editable=False)
    
    # Timestamp fields for tracking record creation and updates
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='workout_sessions')
    date = models.DateField()
    duration_minutes = models.IntegerField()
    calories_burned = models.FloatField(null=True, blank=True)
    notes = models.TextField(blank=True)
    
    # Added visibility field for controlling who can see the workout
    visibility = models.CharField(max_length=20, choices=WorkoutVisibility.CHOICES, default=WorkoutVisibility.PRIVATE)
    
    # Added is_public field for quick public/private toggle
    is_public = models.BooleanField(default=False)
    
    # Added __str__ method for admin clarity
    def __str__(self):
        return f"{self.user.username}'s workout on {self.date}"
    
    class Meta:
        ordering = ['-date']

class ExerciseSet(models.Model):
    workout = models.ForeignKey(WorkoutSession, on_delete=models.CASCADE, related_name='exercise_sets')
    exercise = models.ForeignKey(ExerciseCatalog, on_delete=models.CASCADE)
    set_number = models.IntegerField()
    reps = models.IntegerField()
    weight_kg = models.FloatField(null=True, blank=True)
    duration_seconds = models.IntegerField(null=True, blank=True)
    rest_seconds = models.IntegerField(null=True, blank=True)

class ProgressPhoto(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='progress_photos')
    date = models.DateField()
    photo_url = models.URLField()
    notes = models.TextField(blank=True)
    weight_kg = models.FloatField(null=True, blank=True)

class NotificationLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    notification_type = models.CharField(max_length=50)
    sent_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)
    content = models.TextField()
