from django.db import models
from django.contrib.auth.models import User
import datetime

class NutritionLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    date = models.DateField(default=datetime.date.today)
    
    # Store the entire state from the frontend's NutritionTracker class
    daily_goals = models.JSONField(default=dict)
    consumed = models.JSONField(default=dict)
    meal_plan = models.JSONField(default=dict)
    extra_foods = models.JSONField(default=list)

    class Meta:
        # Ensure that each user can only have one nutrition log per day
        unique_together = ('user', 'date')

    def __str__(self):
        return f"Nutrition Log for {self.user.username} on {self.date}"

# A small change to trigger detection
