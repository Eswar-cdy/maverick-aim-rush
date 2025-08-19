from django.db import models
from django.contrib.auth.models import User
import datetime
from django.db.models.signals import post_save
from django.dispatch import receiver

class NutritionLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    date = models.DateField(default=datetime.date.today)
    daily_goals = models.JSONField(default=dict)
    consumed = models.JSONField(default=dict)
    meal_plan = models.JSONField(default=dict)
    extra_foods = models.JSONField(default=list)

    class Meta:
        unique_together = ('user', 'date')

    def __str__(self):
        return f"Nutrition Log for {self.user.username} on {self.date}"

class Workout(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    date = models.DateTimeField(auto_now_add=True)
    duration_seconds = models.IntegerField(default=0)

    def __str__(self):
        return f"Workout for {self.user.username} on {self.date.strftime('%Y-%m-%d %H:%M')}"

class ExerciseLog(models.Model):
    workout = models.ForeignKey(Workout, related_name='exercises', on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    category = models.CharField(max_length=50)
    sets = models.JSONField(default=list)
    personal_record = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.name} in workout {self.workout.id}"

class ScheduleState(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, primary_key=True)
    # Stores the state of the user's weekly schedule, including weights, notes, and completion status
    schedule_data = models.JSONField(default=dict)
    last_updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Schedule state for {self.user.username}"

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, primary_key=True)
    
    # Personalization fields
    fitness_goal = models.CharField(max_length=50, blank=True, null=True, choices=[
        ('weight_loss', 'Weight Loss'),
        ('hypertrophy', 'Hypertrophy (Muscle Gain)'),
        ('endurance', 'Endurance'),
        ('rehab', 'Rehab'),
        ('sport_specific', 'Sport Specific')
    ])
    fitness_level = models.CharField(max_length=50, blank=True, null=True, choices=[
        ('beginner', 'Beginner'),
        ('intermediate', 'Intermediate'),
        ('advanced', 'Advanced')
    ])
    days_per_week = models.IntegerField(blank=True, null=True)
    equipment_access = models.CharField(max_length=50, blank=True, null=True, choices=[
        ('none', 'None'),
        ('home_gym', 'Home Gym (dumbbells, bands)'),
        ('full_gym', 'Full Gym Access')
    ])
    # We can add more fields like injuries, preferences, etc. later

    def __str__(self):
        return f"Profile for {self.user.username}"

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    instance.userprofile.save()

class Exercise(models.Model):
    name = models.CharField(max_length=100)
    muscle_group = models.CharField(max_length=50, choices=[
        ('chest', 'Chest'),
        ('back', 'Back'),
        ('legs', 'Legs'),
        ('shoulders', 'Shoulders'),
        ('biceps', 'Biceps'),
        ('triceps', 'Triceps'),
        ('core', 'Core'),
        ('cardio', 'Cardio')
    ])
    equipment = models.CharField(max_length=50, choices=[
        ('barbell', 'Barbell'),
        ('dumbbell', 'Dumbbell'),
        ('machine', 'Machine'),
        ('bodyweight', 'Bodyweight'),
        ('kettlebell', 'Kettlebell'),
        ('bands', 'Bands'),
        ('cardio_machine', 'Cardio Machine')
    ])
    difficulty = models.CharField(max_length=20, choices=[
        ('beginner', 'Beginner'),
        ('intermediate', 'Intermediate'),
        ('advanced', 'Advanced')
    ])
    # We could add fields for video_url, instructions, etc. later

    def __str__(self):
        return self.name

class ProgramTemplate(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    # e.g., "3-Day Full Body", "5-Day Split"
    template_type = models.CharField(max_length=50) 
    
    # We could add a JSONField here to store the structure of the program,
    # e.g., {"Day1": ["chest", "triceps"], "Day2": ["back", "biceps"], ...}

    def __str__(self):
        return self.name

class ProgramPlan(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, primary_key=True)
    plan = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Program plan for {self.user.username}"
