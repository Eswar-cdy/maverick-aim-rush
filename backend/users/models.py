from django.db import models
from django.contrib.auth.models import User


class UserProfile(models.Model):
    """Stores per-user preferences and demographics used for personalization.

    Defaults to imperial units (lb/mi) and America/New_York timezone; users can change later.
    """

    UNIT_CHOICES = (
        ("imperial", "Imperial (lb/mi)"),
        ("metric", "Metric (kg/km)"),
    )

    DISTANCE_UNIT_CHOICES = (
        ("mi", "Miles"),
        ("km", "Kilometers"),
    )

    SEX_CHOICES = (
        ("male", "Male"),
        ("female", "Female"),
        ("other", "Other"),
    )

    GOAL_CHOICES = (
        ("cut", "Cut (Fat Loss)"),
        ("recomp", "Recomposition"),
        ("muscle_gain", "Muscle Gain"),
        ("performance", "Performance"),
    )

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")

    unit_system = models.CharField(max_length=10, choices=UNIT_CHOICES, default="imperial")
    distance_unit = models.CharField(max_length=2, choices=DISTANCE_UNIT_CHOICES, default="mi")
    timezone = models.CharField(max_length=64, default="America/New_York")

    age = models.IntegerField(null=True, blank=True)
    sex = models.CharField(max_length=10, choices=SEX_CHOICES, null=True, blank=True)
    height_cm = models.FloatField(null=True, blank=True)

    primary_goal = models.CharField(max_length=20, choices=GOAL_CHOICES, null=True, blank=True)
    days_per_week = models.IntegerField(default=3)

    # Comma-separated equipment list (e.g., "barbell,dumbbell,bench")
    equipment = models.TextField(blank=True, default="")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:
        return f"Profile for {self.user.username}"

    @property
    def equipment_list(self) -> list:
        raw = (self.equipment or "").strip()
        if not raw:
            return []
        return [item.strip() for item in raw.split(",") if item.strip()]

    def set_equipment_list(self, items: list) -> None:
        self.equipment = ",".join(sorted({str(i).strip() for i in items if str(i).strip()}))

# Create your models here.
