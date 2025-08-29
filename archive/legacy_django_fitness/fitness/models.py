from django.db import models
from django.contrib.auth.models import User
import datetime

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
