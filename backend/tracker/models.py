# Models for Maverick Aim Rush — created by Cursor AI
# === NUTRITION, ANALYTICS, SOCIAL, GAMIFICATION MODULES IMPROVED ===
# This file contains extensive improvements as requested in Nov 2025:
#  - Nutrition, Analytics, Social, Gamification models all refactored to add audit fields, uuid, privacy, and more.
#  - All changes are documented above each section.

from django.db import models
from django.contrib.auth.models import User
import uuid
from django.utils import timezone

# ==============================================================================
#                                NUTRITION MODULE
# ============================================================================== 
class NutritionLog(models.Model):
    """Log daily nutritional intake for a user."""
    uuid = models.UUIDField(unique=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='nutrition_logs')
    date = models.DateField()
    calories = models.FloatField()
    protein_g = models.FloatField()
    carbs_g = models.FloatField()
    fat_g = models.FloatField()
    fiber_g = models.FloatField(null=True, blank=True)
    is_public = models.BooleanField(default=False, help_text='Share this log with others?')
    notes = models.TextField(blank=True)

    def __str__(self):
        return f"{self.user.username} NutritionLog {self.date}"

class NutritionGoal(models.Model):
    """Goal for nutrition (macro/micro intake targets)."""
    uuid = models.UUIDField(unique=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='nutrition_goals')
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    calories_target = models.FloatField()
    protein_g_target = models.FloatField()
    carbs_g_target = models.FloatField()
    fat_g_target = models.FloatField()
    is_public = models.BooleanField(default=False)
    notes = models.TextField(blank=True)
    
    def __str__(self):
        return f"{self.user.username} NutritionGoal {self.start_date}"

class MacroTarget(models.Model):
    """Macro distribution targets for a user."""
    uuid = models.UUIDField(unique=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='macro_targets')
    calories = models.FloatField()
    protein_percent = models.FloatField()
    carbs_percent = models.FloatField()
    fat_percent = models.FloatField()
    notes = models.TextField(blank=True)
    is_public = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.user.username} MacroTarget"

class SupplementLog(models.Model):
    """Tracks supplement usage by day."""
    uuid = models.UUIDField(unique=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='supplement_logs')
    date = models.DateField()
    supplement_name = models.CharField(max_length=100)
    dose = models.CharField(max_length=50)
    time_taken = models.TimeField(null=True, blank=True)
    is_public = models.BooleanField(default=False)
    notes = models.TextField(blank=True)

    def __str__(self):
        return f"{self.user.username} SupplementLog {self.supplement_name}"

class MealPlan(models.Model):
    """Defined meal plans for users."""
    uuid = models.UUIDField(unique=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='meal_plans')
    plan_name = models.CharField(max_length=100)
    details = models.TextField()
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    is_public = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.user.username} MealPlan {self.plan_name}"

# ==============================================================================
#                                ANALYTICS MODULE
# ==============================================================================
class ProgressAnalytics(models.Model):
    """Aggregates progress over time from various logs."""
    uuid = models.UUIDField(unique=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='progress_analytics')
    analysis_date = models.DateField()
    summary = models.TextField()
    is_public = models.BooleanField(default=False)
    
    def __str__(self):
        return f"{self.user.username} ProgressAnalytics {self.analysis_date}"

class BodyAnalytics(models.Model):
    """Tracks and analyzes body measurement changes."""
    uuid = models.UUIDField(unique=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='body_analytics')
    metric = models.CharField(max_length=64)
    analysis_date = models.DateField()
    value = models.FloatField()
    is_public = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.user.username} BodyAnalytics {self.metric}"

class ProgressPrediction(models.Model):
    """Predictions based on analytics for a user."""
    uuid = models.UUIDField(unique=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='predictions')
    metric = models.CharField(max_length=64)
    predicted_value = models.FloatField()
    target_date = models.DateField()
    confidence = models.FloatField(blank=True, null=True)
    is_public = models.BooleanField(default=False)
    notes = models.TextField(blank=True)

    def __str__(self):
        return f"{self.user.username} ProgressPrediction {self.metric}"

class NutritionalAnalysis(models.Model):
    """Automated analytics on nutrition logs."""
    uuid = models.UUIDField(unique=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='nutritional_analyses')
    analysis_date = models.DateField()
    summary = models.TextField()
    is_public = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.user.username} NutritionalAnalysis {self.analysis_date}"

# ==============================================================================
#                                SOCIAL MODULE
# ==============================================================================
class UserConnection(models.Model):
    """Tracks user connections/friends."""
    uuid = models.UUIDField(unique=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    from_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_connections')
    to_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_connections')
    status = models.CharField(max_length=16, choices=[('pending', 'Pending'), ('accepted', 'Accepted'), ('rejected', 'Rejected')], default='pending')
    is_visible = models.BooleanField(default=True)
    def __str__(self):
        return f"{self.from_user.username}→{self.to_user.username} {self.status}"

class Activity(models.Model):
    """Activity stream and events."""
    uuid = models.UUIDField(unique=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='activities')
    verb = models.CharField(max_length=255)
    target = models.CharField(max_length=255, blank=True, null=True)
    description = models.TextField(blank=True)
    privacy = models.CharField(max_length=20, default='public', choices=[('public','Public'),('friends','Friends'),('private','Private')])

    def __str__(self):
        return f"{self.user.username} {self.verb} {self.target or ''}"

class PushSubscription(models.Model):
    """Web push subscription for notifications."""
    uuid = models.UUIDField(unique=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='push_subscriptions')
    endpoint = models.URLField()
    auth_key = models.CharField(max_length=255)
    p256dh_key = models.CharField(max_length=255)
    is_active = models.BooleanField(default=True)
    privacy = models.CharField(max_length=20, default='private')
    
    def __str__(self):
        return f"PushSubscription for {self.user.username} ({'Active' if self.is_active else 'Inactive'})"

class NotificationLog(models.Model):
    """
    Notification logs for users. Audit fields and improved __str__.
    """
    uuid = models.UUIDField(unique=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    notification_type = models.CharField(max_length=50)
    sent_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)
    content = models.TextField()
    privacy = models.CharField(max_length=20, default='private')
    
    def __str__(self):
        return f"NotificationLog {self.notification_type} to {self.user.username}"

class UserAchievement(models.Model):
    """Achievements unlocked by a user."""
    uuid = models.UUIDField(unique=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='achievements')
    achievement = models.CharField(max_length=200)
    achieved_at = models.DateTimeField(default=timezone.now)
    notes = models.TextField(blank=True)
    is_public = models.BooleanField(default=True)
    
    def __str__(self):
        return f"{self.user.username} achieved {self.achievement}"

class Leaderboard(models.Model):
    """Leaderboard for challenges and gamification."""
    uuid = models.UUIDField(unique=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    is_public = models.BooleanField(default=True)

    def __str__(self):
        return f"Leaderboard {self.name}"

class Challenge(models.Model):
    """Social challenges and events, visible to some or all users."""
    uuid = models.UUIDField(unique=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    name = models.CharField(max_length=100)
    description = models.TextField(null=True, blank=True)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    is_public = models.BooleanField(default=True)

    def __str__(self):
        return f"Challenge {self.name}"

class Achievement(models.Model):
    """Possible achievements to be unlocked by users."""
    uuid = models.UUIDField(unique=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    name = models.CharField(max_length=255)
    description = models.TextField()
    is_public = models.BooleanField(default=True)
    
    def __str__(self):
        return f"Achievement {self.name}"

# ==============================================================================
#                                GAMIFICATION MODULE
# ==============================================================================
class GamificationProfile(models.Model):
    """Profile for user gamification (XP, levels, badges history)."""
    uuid = models.UUIDField(unique=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='gamification_profile')
    level = models.IntegerField(default=1)
    xp = models.IntegerField(default=0)
    is_public = models.BooleanField(default=True)
    audit_trail = models.TextField(blank=True)
    
    def __str__(self):
        return f"GamificationProfile for {self.user.username}" 

class Badge(models.Model):
    """Badges earned in the platform."""
    uuid = models.UUIDField(unique=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    name = models.CharField(max_length=100)
    description = models.TextField()
    is_public = models.BooleanField(default=True)

    def __str__(self):
        return f"Badge {self.name}"

class UserBadge(models.Model):
    """Badges granted to the users (with audit trail)."""
    uuid = models.UUIDField(unique=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='user_badges')
    badge = models.ForeignKey(Badge, on_delete=models.CASCADE, related_name='awarded_users')
    awarded_at = models.DateTimeField(default=timezone.now)
    audit_trail = models.TextField(blank=True)
    is_public = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.user.username} earned {self.badge.name}"

class DailyQuest(models.Model):
    """Daily challenges/quests system-wide."""
    uuid = models.UUIDField(unique=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    title = models.CharField(max_length=255)
    description = models.TextField()
    is_public = models.BooleanField(default=True)
    
    def __str__(self):
        return f"DailyQuest {self.title}"

class UserDailyQuest(models.Model):
    """Links users to their daily quests attempts and completions."""
    uuid = models.UUIDField(unique=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='daily_quests')
    quest = models.ForeignKey(DailyQuest, on_delete=models.CASCADE, related_name='user_quests')
    completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)
    audit_trail = models.TextField(blank=True)
    is_public = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.user.username} UserDailyQuest {self.quest.title}"

class StreakBonus(models.Model):
    """Tracks streak bonuses for users."""
    uuid = models.UUIDField(unique=True, default=uuid.uuid4, editable=False)
    created
