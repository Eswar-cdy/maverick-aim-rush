# Models for Maverick Aim Rush — created by Cursor AI
from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

class Goal(models.Model):
    METRIC_CHOICES = [
        ('weight_kg', 'Body Weight (kg)'),
        ('body_fat', 'Body Fat (%)'),
        ('lift_kg', 'Lift (kg)'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='goals')
    goal_type = models.CharField(max_length=50, choices=[('weight_loss', 'Weight Loss'), ('muscle_gain', 'Muscle Gain'), ('performance', 'Performance')])
    metric = models.CharField(max_length=20, choices=METRIC_CHOICES, default='weight_kg')
    target_value = models.FloatField()
    # Optional when metric == 'lift_kg'
    exercise = models.ForeignKey('ExerciseCatalog', null=True, blank=True, on_delete=models.SET_NULL)
    notes = models.CharField(max_length=200, null=True, blank=True)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

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
    # Calipers (sum of sites in mm)
    skinfold_sum_mm = models.FloatField(null=True, blank=True)

    class Meta:
        unique_together = ('user', 'date')
        ordering = ['-date']

    def __str__(self):
        return f"Measurement for {self.user.username} on {self.date}"

    @property
    def bmi(self):
        try:
            if self.height_cm and self.weight_kg and self.height_cm > 0:
                h_m = float(self.height_cm) / 100.0
                return round(float(self.weight_kg) / (h_m * h_m), 2)
        except Exception:
            return None
        return None

class ExerciseCatalog(models.Model):
    name = models.CharField(max_length=100, unique=True)
    category = models.CharField(max_length=50, choices=[('strength', 'Strength'), ('cardio', 'Cardio'), ('flexibility', 'Flexibility'), ('bodyweight', 'Bodyweight')])
    equipment_needed = models.CharField(max_length=100, null=True, blank=True)
    target_muscle_groups = models.CharField(max_length=200, null=True, blank=True)
    difficulty_level = models.CharField(max_length=50, choices=[('beginner', 'Beginner'), ('intermediate', 'Intermediate'), ('advanced', 'Advanced')], null=True, blank=True)
    recommended_for_goal = models.CharField(max_length=50, choices=[('weight_loss', 'Weight Loss'), ('muscle_gain', 'Muscle Gain'), ('performance', 'Performance'), ('general_fitness', 'General Fitness')], null=True, blank=True)
    description = models.TextField(null=True, blank=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name

class Muscle(models.Model):
    """Represents a muscle or muscle group (e.g., Chest, Lats, Quads)."""
    name = models.CharField(max_length=80, unique=True)
    group = models.CharField(max_length=80, null=True, blank=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name

class Equipment(models.Model):
    name = models.CharField(max_length=80, unique=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name

class Tag(models.Model):
    name = models.CharField(max_length=60, unique=True)
    type = models.CharField(max_length=40, null=True, blank=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name

class ExerciseMuscle(models.Model):
    ROLE_CHOICES = (
        ('primary', 'Primary'),
        ('secondary', 'Secondary'),
    )
    exercise = models.ForeignKey(ExerciseCatalog, on_delete=models.CASCADE)
    muscle = models.ForeignKey(Muscle, on_delete=models.CASCADE)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='primary')

    class Meta:
        unique_together = ('exercise', 'muscle', 'role')

    def __str__(self):
        return f"{self.exercise.name} - {self.muscle.name} ({self.role})"

# Many-to-many relations (declared after through model to avoid forward refs)
ExerciseCatalog.add_to_class('muscles', models.ManyToManyField(Muscle, through=ExerciseMuscle, related_name='exercises', blank=True))
ExerciseCatalog.add_to_class('equipments', models.ManyToManyField(Equipment, related_name='exercises', blank=True))
ExerciseCatalog.add_to_class('tags', models.ManyToManyField(Tag, related_name='exercises', blank=True))

class FoodCatalog(models.Model):
    """Catalog of foods with nutrition per 100 grams for quick lookup/calculation."""
    name = models.CharField(max_length=120, unique=True)
    calories_per_100g = models.FloatField()
    protein_g_per_100g = models.FloatField(default=0.0)
    carbs_g_per_100g = models.FloatField(default=0.0)
    fat_g_per_100g = models.FloatField(default=0.0)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name

class WorkoutSession(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='workout_sessions')
    start_time = models.DateTimeField(null=True, blank=True)
    end_time = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(null=True, blank=True)

    class Meta:
        ordering = ['-start_time']

    def __str__(self):
        return f"Workout for {self.user.username} at {self.start_time}"

class StrengthSet(models.Model):
    session = models.ForeignKey(WorkoutSession, on_delete=models.CASCADE, related_name='strength_sets')
    exercise = models.ForeignKey(ExerciseCatalog, on_delete=models.CASCADE)
    set_number = models.IntegerField()
    reps = models.IntegerField()
    weight_kg = models.FloatField()

    def __str__(self):
        return f"Set {self.set_number} of {self.exercise.name} in session {self.session.id}"

class CardioEntry(models.Model):
    session = models.ForeignKey(WorkoutSession, on_delete=models.CASCADE, related_name='cardio_entries')
    exercise = models.ForeignKey(ExerciseCatalog, on_delete=models.CASCADE)
    duration_minutes = models.IntegerField(null=True, blank=True)
    distance_km = models.FloatField(null=True, blank=True)

    def __str__(self):
        return f"{self.exercise.name} in session {self.session.id}"

class NutritionLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='nutrition_logs')
    date = models.DateField()
    meal_type = models.CharField(max_length=20, null=True, blank=True, choices=[('breakfast', 'Breakfast'), ('lunch', 'Lunch'), ('dinner', 'Dinner'), ('snack', 'Snack')])
    food_item = models.CharField(max_length=100)
    quantity_grams = models.FloatField(null=True, blank=True)
    calories = models.FloatField()
    protein_g = models.FloatField(default=0.0)
    carbs_g = models.FloatField(default=0.0)
    fat_g = models.FloatField(default=0.0)

    class Meta:
        ordering = ['-date']

    def __str__(self):
        return f"{self.user.username}'s nutrition log for {self.date}"

class SleepLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sleep_logs')
    date = models.DateField()
    duration_hours = models.FloatField()
    quality = models.IntegerField(choices=[(1, 'Poor'), (2, 'Fair'), (3, 'Good'), (4, 'Excellent')])

    def __str__(self):
        return f"Sleep for {self.user.username} on {self.date}"

class InjuryLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='injury_logs')
    date = models.DateField()
    body_part = models.CharField(max_length=100)
    description = models.TextField()
    severity = models.IntegerField(choices=[(1, 'Low'), (2, 'Medium'), (3, 'High')])

    def __str__(self):
        return f"Injury: {self.body_part} for {self.user.username} on {self.date}"

class Plan(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='plans')
    name = models.CharField(max_length=100)
    start_date = models.DateField()
    end_date = models.DateField()

    def __str__(self):
        return f"Plan: {self.name} for {self.user.username}"

class PlannedExercise(models.Model):
    plan = models.ForeignKey(Plan, on_delete=models.CASCADE, related_name='planned_exercises')
    exercise = models.ForeignKey(ExerciseCatalog, on_delete=models.CASCADE)
    day_of_week = models.IntegerField(choices=[(0, 'Monday'), (1, 'Tuesday'), (2, 'Wednesday'), (3, 'Thursday'), (4, 'Friday'), (5, 'Saturday'), (6, 'Sunday')])
    sets = models.IntegerField(null=True, blank=True)
    reps = models.IntegerField(null=True, blank=True)

    def __str__(self):
        return f"{self.exercise.name} on {self.get_day_of_week_display()} for plan {self.plan.name}"

class MacroTarget(models.Model):
    """Daily macro targets for users based on their goals and current stats."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='macro_targets')
    date = models.DateField()
    calories = models.IntegerField()
    protein_g = models.FloatField()
    carbs_g = models.FloatField()
    fat_g = models.FloatField()
    # Goal context for this target
    goal_type = models.CharField(max_length=50, choices=[
        ('weight_loss', 'Weight Loss'),
        ('muscle_gain', 'Muscle Gain'),
        ('maintenance', 'Maintenance'),
        ('performance', 'Performance')
    ])
    # Current stats when target was calculated
    current_weight_kg = models.FloatField()
    current_height_cm = models.FloatField()
    age = models.IntegerField()
    activity_level = models.CharField(max_length=20, choices=[
        ('sedentary', 'Sedentary'),
        ('light', 'Light Activity'),
        ('moderate', 'Moderate Activity'),
        ('active', 'Active'),
        ('very_active', 'Very Active')
    ])
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'date')
        ordering = ['-date']

    def __str__(self):
        return f"Macro target for {self.user.username} on {self.date}"

class CalculatorResult(models.Model):
    """Store calculated results for BMI, BMR, TDEE, etc."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='calculator_results')
    calculation_type = models.CharField(max_length=20, choices=[
        ('bmi', 'BMI'),
        ('bmr', 'BMR'),
        ('tdee', 'TDEE'),
        ('macros', 'Macro Targets')
    ])
    input_data = models.JSONField()  # Store input parameters
    result_data = models.JSONField()  # Store calculated results
    calculated_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-calculated_at']

    def __str__(self):
        return f"{self.calculation_type.upper()} calculation for {self.user.username}"

# Advanced Analytics Models
class ProgressAnalytics(models.Model):
    """Store computed analytics for user progress tracking."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='progress_analytics')
    date = models.DateField()
    
    # Strength Analytics
    total_volume_kg = models.FloatField(default=0)  # Total weight lifted
    total_sets = models.IntegerField(default=0)
    total_reps = models.IntegerField(default=0)
    unique_exercises = models.IntegerField(default=0)
    
    # Cardio Analytics
    total_cardio_minutes = models.IntegerField(default=0)
    total_distance_km = models.FloatField(default=0)
    avg_heart_rate = models.FloatField(null=True, blank=True)
    
    # Nutrition Analytics
    total_calories = models.IntegerField(default=0)
    total_protein_g = models.FloatField(default=0)
    total_carbs_g = models.FloatField(default=0)
    total_fat_g = models.FloatField(default=0)
    macro_balance_score = models.FloatField(default=0)  # 0-100 score
    
    # Recovery Analytics
    sleep_hours = models.FloatField(null=True, blank=True)
    sleep_quality = models.IntegerField(null=True, blank=True)  # 1-4 scale
    recovery_score = models.FloatField(default=0)  # 0-100 score
    
    # Performance Metrics
    workout_intensity = models.FloatField(default=0)  # 0-100 scale
    consistency_score = models.FloatField(default=0)  # 0-100 scale
    overall_score = models.FloatField(default=0)  # 0-100 composite score
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'date')
        ordering = ['-date']

    def __str__(self):
        return f"Analytics for {self.user.username} on {self.date}"

class PersonalRecord(models.Model):
    """Track personal records for exercises."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='personal_records')
    exercise = models.ForeignKey(ExerciseCatalog, on_delete=models.CASCADE)
    
    # Record details
    weight_kg = models.FloatField()
    reps = models.IntegerField()
    date_achieved = models.DateField()
    
    # Record type
    record_type = models.CharField(max_length=20, choices=[
        ('max_weight', 'Max Weight'),
        ('max_reps', 'Max Reps'),
        ('max_volume', 'Max Volume'),
        ('one_rm', 'One Rep Max')
    ])
    
    # Additional context
    session = models.ForeignKey(WorkoutSession, on_delete=models.CASCADE, null=True, blank=True)
    notes = models.TextField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date_achieved']

    def __str__(self):
        return f"{self.user.username} - {self.exercise.name}: {self.weight_kg}kg x {self.reps}"

class WorkoutStreak(models.Model):
    """Track workout streaks and consistency."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='workout_streaks')
    
    # Streak details
    current_streak = models.IntegerField(default=0)
    longest_streak = models.IntegerField(default=0)
    last_workout_date = models.DateField(null=True, blank=True)
    
    # Weekly stats
    workouts_this_week = models.IntegerField(default=0)
    target_weekly_workouts = models.IntegerField(default=3)
    
    # Monthly stats
    workouts_this_month = models.IntegerField(default=0)
    total_workouts = models.IntegerField(default=0)
    
    # Consistency metrics
    consistency_percentage = models.FloatField(default=0)  # 0-100
    last_updated = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('user',)

    def __str__(self):
        return f"{self.user.username} - {self.current_streak} day streak"

# Social Features Models
class UserConnection(models.Model):
    """Friends/following relationships between users."""
    follower = models.ForeignKey(User, on_delete=models.CASCADE, related_name='following')
    following = models.ForeignKey(User, on_delete=models.CASCADE, related_name='followers')
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Connection type
    connection_type = models.CharField(max_length=20, choices=[
        ('friend', 'Friend'),
        ('follower', 'Follower'),
        ('trainer', 'Trainer'),
        ('trainee', 'Trainee')
    ], default='friend')
    
    # Privacy settings
    can_view_workouts = models.BooleanField(default=True)
    can_view_progress = models.BooleanField(default=True)
    can_view_nutrition = models.BooleanField(default=False)

    class Meta:
        unique_together = ('follower', 'following')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.follower.username} follows {self.following.username}"

class Challenge(models.Model):
    """Fitness challenges for users to participate in."""
    name = models.CharField(max_length=100)
    description = models.TextField()
    
    # Challenge details
    challenge_type = models.CharField(max_length=30, choices=[
        ('workout_frequency', 'Workout Frequency'),
        ('weight_loss', 'Weight Loss'),
        ('strength_gain', 'Strength Gain'),
        ('distance', 'Distance'),
        ('duration', 'Duration'),
        ('custom', 'Custom')
    ])
    
    # Duration
    start_date = models.DateField()
    end_date = models.DateField()
    
    # Target metrics
    target_value = models.FloatField()
    target_unit = models.CharField(max_length=20)
    
    # Challenge settings
    is_public = models.BooleanField(default=True)
    max_participants = models.IntegerField(null=True, blank=True)
    entry_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    prize_pool = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Creator
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_challenges')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} ({self.challenge_type})"

class ChallengeParticipation(models.Model):
    """User participation in challenges."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='challenge_participations')
    challenge = models.ForeignKey(Challenge, on_delete=models.CASCADE, related_name='participants')
    
    # Participation details
    joined_at = models.DateTimeField(auto_now_add=True)
    current_progress = models.FloatField(default=0)
    is_completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    # Ranking
    rank = models.IntegerField(null=True, blank=True)
    final_score = models.FloatField(null=True, blank=True)

    class Meta:
        unique_together = ('user', 'challenge')
        ordering = ['-final_score', 'joined_at']

    def __str__(self):
        return f"{self.user.username} in {self.challenge.name}"

class Leaderboard(models.Model):
    """Leaderboards for various metrics."""
    name = models.CharField(max_length=100)
    description = models.TextField()
    
    # Leaderboard type
    metric_type = models.CharField(max_length=30, choices=[
        ('total_volume', 'Total Volume'),
        ('workout_streak', 'Workout Streak'),
        ('weight_lost', 'Weight Lost'),
        ('strength_gained', 'Strength Gained'),
        ('consistency', 'Consistency'),
        ('challenge_wins', 'Challenge Wins')
    ])
    
    # Time period
    period_type = models.CharField(max_length=20, choices=[
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
        ('yearly', 'Yearly'),
        ('all_time', 'All Time')
    ])
    
    # Settings
    is_active = models.BooleanField(default=True)
    is_public = models.BooleanField(default=True)
    auto_update = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    last_updated = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} ({self.metric_type})"

class LeaderboardEntry(models.Model):
    """Individual entries in leaderboards."""
    leaderboard = models.ForeignKey(Leaderboard, on_delete=models.CASCADE, related_name='entries')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='leaderboard_entries')
    
    # Entry details
    rank = models.IntegerField()
    score = models.FloatField()
    period_start = models.DateField()
    period_end = models.DateField()
    
    # Additional data
    metadata = models.JSONField(default=dict)  # Store additional context
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('leaderboard', 'user', 'period_start')
        ordering = ['rank', '-score']

    def __str__(self):
        return f"#{self.rank} {self.user.username} - {self.score}"

class Achievement(models.Model):
    """Achievements/badges users can earn."""
    name = models.CharField(max_length=100)
    description = models.TextField()
    icon = models.CharField(max_length=50, default='🏆')  # Emoji or icon class
    
    # Achievement criteria
    achievement_type = models.CharField(max_length=30, choices=[
        ('workout_count', 'Workout Count'),
        ('streak', 'Streak'),
        ('weight_loss', 'Weight Loss'),
        ('strength_gain', 'Strength Gain'),
        ('consistency', 'Consistency'),
        ('social', 'Social'),
        ('challenge', 'Challenge')
    ])
    
    # Requirements
    required_value = models.FloatField()
    required_unit = models.CharField(max_length=20, default='')
    
    # Rarity
    rarity = models.CharField(max_length=20, choices=[
        ('common', 'Common'),
        ('uncommon', 'Uncommon'),
        ('rare', 'Rare'),
        ('epic', 'Epic'),
        ('legendary', 'Legendary')
    ], default='common')
    
    # Settings
    is_active = models.BooleanField(default=True)
    points_value = models.IntegerField(default=10)  # Points awarded
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['rarity', 'points_value']

    def __str__(self):
        return f"{self.icon} {self.name}"

class UserAchievement(models.Model):
    """User's earned achievements."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='achievements')
    achievement = models.ForeignKey(Achievement, on_delete=models.CASCADE, related_name='users')
    
    # Achievement details
    earned_at = models.DateTimeField(auto_now_add=True)
    progress_value = models.FloatField(default=0)  # Current progress toward achievement
    
    # Display settings
    is_displayed = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)  # Show on profile

    class Meta:
        unique_together = ('user', 'achievement')
        ordering = ['-earned_at']

    def __str__(self):
        return f"{self.user.username} earned {self.achievement.name}"

# --- New: Minimal user profile to support recommendations and preferences ---
class UserProfile(models.Model):
    UNIT_CHOICES = (
        ('imperial', 'Imperial (lb/mi)'),
        ('metric', 'Metric (kg/km)')
    )
    DISTANCE_CHOICES = (
        ('mi', 'Miles'),
        ('km', 'Kilometers')
    )
    GOAL_CHOICES = (
        ('weight_loss', 'Weight Loss'),
        ('muscle_gain', 'Muscle Gain'),
        ('maintenance', 'Maintenance'),
        ('performance', 'Performance'),
        ('general_fitness', 'General Fitness'),
    )
    WORKOUT_TIME_CHOICES = (
        ('morning', 'Morning'),
        ('midday', 'Midday'),
        ('evening', 'Evening')
    )

    # Use a unique related_name to avoid clashes with any other app's profile
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='tracker_profile')
    unit_system = models.CharField(max_length=16, choices=UNIT_CHOICES, default='imperial')
    distance_unit = models.CharField(max_length=2, choices=DISTANCE_CHOICES, default='mi')
    timezone = models.CharField(max_length=64, default='America/New_York')

    # Preferences used by recommendations
    primary_goal = models.CharField(max_length=32, choices=GOAL_CHOICES, default='general_fitness', blank=True)
    available_equipment = models.TextField(null=True, blank=True)  # comma-separated list
    preferred_workout_time = models.CharField(max_length=16, choices=WORKOUT_TIME_CHOICES, null=True, blank=True)
    workout_frequency = models.IntegerField(null=True, blank=True)  # target workouts/week
    fitness_level = models.CharField(max_length=24, default='beginner', blank=True)
    age = models.IntegerField(null=True, blank=True)

    # Onboarding state (account-level, cross-device)
    completed_onboarding_at = models.DateTimeField(null=True, blank=True)
    onboarding_version = models.CharField(max_length=16, default='v1')
    onboarding_state = models.JSONField(null=True, blank=True)
    onboarding_answers = models.JSONField(null=True, blank=True)

    def __str__(self) -> str:
        return f"Profile of {self.user.username}"


# Trainer configuration persisted for plan generation
class TrainerProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='trainer_profile')
    split = models.CharField(max_length=20, default='PPL')
    days_per_week = models.IntegerField(default=4)
    session_duration = models.IntegerField(default=60)
    level = models.CharField(max_length=20, default='intermediate')
    primary_goal = models.CharField(max_length=32, default='general_fitness')
    intensity_model = models.CharField(max_length=20, default='standard')  # standard|high|deload
    rest_between_sets_sec = models.IntegerField(default=90)
    equipment = models.TextField(blank=True, default='Barbell,Dumbbells,Bench')
    emphasis = models.CharField(max_length=50, blank=True, default='balanced')
    kcal_strategy = models.CharField(max_length=20, default='maintain')  # maintain|cut|bulk
    macros = models.CharField(max_length=20, default='40/30/30')

    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"TrainerProfile for {self.user.username}"


class ExerciseContraindication(models.Model):
    RULE_CHOICES = (
        ('avoid', 'Avoid'),
        ('modify', 'Modify'),
        ('limit', 'Limit'),
    )
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='exercise_contras')
    injury_keyword = models.CharField(max_length=100)
    exercise = models.ForeignKey(ExerciseCatalog, on_delete=models.SET_NULL, null=True, blank=True)
    rule = models.CharField(max_length=10, choices=RULE_CHOICES, default='avoid')
    note = models.CharField(max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        ex = self.exercise.name if self.exercise else '*'
        return f"{self.user.username}: {self.injury_keyword} -> {ex} ({self.rule})"

class ProgressPhoto(models.Model):
    """Model for storing progress photos with metadata."""
    PHOTO_TYPES = [
        ('front', 'Front View'),
        ('side', 'Side View'),
        ('back', 'Back View'),
        ('flexed', 'Flexed'),
        ('relaxed', 'Relaxed'),
        ('before', 'Before Photo'),
        ('after', 'After Photo'),
        ('milestone', 'Milestone Photo'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='progress_photos')
    photo_type = models.CharField(max_length=20, choices=PHOTO_TYPES)
    image = models.ImageField(upload_to='progress_photos/%Y/%m/%d/')
    thumbnail = models.ImageField(upload_to='progress_thumbnails/%Y/%m/%d/', null=True, blank=True)
    
    # Metadata
    date_taken = models.DateTimeField(auto_now_add=True)
    weight_at_time = models.FloatField(null=True, blank=True, help_text="Weight when photo was taken")
    body_fat_at_time = models.FloatField(null=True, blank=True, help_text="Body fat % when photo was taken")
    notes = models.TextField(blank=True, help_text="User notes about this photo")
    
    # Photo Analysis (for future AI features)
    is_analyzed = models.BooleanField(default=False)
    analysis_data = models.JSONField(default=dict, blank=True)
    
    # Privacy Settings
    is_public = models.BooleanField(default=False)
    allow_comparisons = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.user.username} - {self.get_photo_type_display()} ({self.date_taken.date()})"
    
    class Meta:
        ordering = ['-date_taken']
        verbose_name = "Progress Photo"
        verbose_name_plural = "Progress Photos"


class PhotoComparison(models.Model):
    """Model for storing photo comparisons."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='photo_comparisons')
    before_photo = models.ForeignKey(ProgressPhoto, on_delete=models.CASCADE, related_name='before_comparisons')
    after_photo = models.ForeignKey(ProgressPhoto, on_delete=models.CASCADE, related_name='after_comparisons')
    
    # Comparison metadata
    comparison_type = models.CharField(max_length=20, choices=[
        ('before_after', 'Before/After'),
        ('progress', 'Progress Timeline'),
        ('milestone', 'Milestone Comparison'),
    ])
    
    # Analysis results
    time_difference_days = models.IntegerField(null=True, blank=True)
    weight_change = models.FloatField(null=True, blank=True)
    body_fat_change = models.FloatField(null=True, blank=True)
    
    # User notes
    title = models.CharField(max_length=100, blank=True)
    description = models.TextField(blank=True)
    
    # Visibility
    is_public = models.BooleanField(default=False)
    is_featured = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.user.username} - {self.title or 'Photo Comparison'}"
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = "Photo Comparison"
        verbose_name_plural = "Photo Comparisons"


class BodyPartMeasurement(models.Model):
    """Detailed body part measurements with photo references."""
    BODY_PARTS = [
        ('neck', 'Neck'),
        ('chest', 'Chest'),
        ('shoulders', 'Shoulders'),
        ('left_bicep', 'Left Bicep'),
        ('right_bicep', 'Right Bicep'),
        ('left_forearm', 'Left Forearm'),
        ('right_forearm', 'Right Forearm'),
        ('waist', 'Waist'),
        ('hips', 'Hips'),
        ('left_thigh', 'Left Thigh'),
        ('right_thigh', 'Right Thigh'),
        ('left_calf', 'Left Calf'),
        ('right_calf', 'Right Calf'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='body_part_measurements')
    body_part = models.CharField(max_length=20, choices=BODY_PARTS)
    measurement_cm = models.FloatField()
    measurement_inches = models.FloatField(null=True, blank=True)
    
    # Photo reference
    progress_photo = models.ForeignKey(ProgressPhoto, on_delete=models.SET_NULL, null=True, blank=True)
    
    # Measurement context
    is_flexed = models.BooleanField(default=False)
    is_relaxed = models.BooleanField(default=True)
    measurement_date = models.DateTimeField(auto_now_add=True)
    
    # Notes
    notes = models.TextField(blank=True)
    
    def __str__(self):
        return f"{self.user.username} - {self.get_body_part_display()}: {self.measurement_cm}cm"
    
    class Meta:
        ordering = ['-measurement_date']
        verbose_name = "Body Part Measurement"
        verbose_name_plural = "Body Part Measurements"


class ProgressMilestone(models.Model):
    """Milestones tied to progress photos."""
    MILESTONE_TYPES = [
        ('weight_loss', 'Weight Loss'),
        ('muscle_gain', 'Muscle Gain'),
        ('strength_gain', 'Strength Gain'),
        ('endurance', 'Endurance'),
        ('consistency', 'Consistency'),
        ('transformation', 'Transformation'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='progress_milestones')
    milestone_type = models.CharField(max_length=20, choices=MILESTONE_TYPES)
    title = models.CharField(max_length=100)
    description = models.TextField()
    
    # Associated photos
    milestone_photos = models.ManyToManyField(ProgressPhoto, blank=True)
    
    # Achievement data
    target_value = models.FloatField(null=True, blank=True)
    achieved_value = models.FloatField(null=True, blank=True)
    achievement_date = models.DateTimeField(auto_now_add=True)
    
    # Celebration
    is_celebrated = models.BooleanField(default=False)
    celebration_notes = models.TextField(blank=True)
    
    def __str__(self):
        return f"{self.user.username} - {self.title}"
    
    class Meta:
        ordering = ['-achievement_date']
        verbose_name = "Progress Milestone"
        verbose_name_plural = "Progress Milestones"


class MuscleGroup(models.Model):
    """Model for tracking muscle groups and their development."""
    MUSCLE_GROUPS = [
        ('chest', 'Chest'),
        ('back', 'Back'),
        ('shoulders', 'Shoulders'),
        ('biceps', 'Biceps'),
        ('triceps', 'Triceps'),
        ('forearms', 'Forearms'),
        ('core', 'Core'),
        ('quads', 'Quadriceps'),
        ('hamstrings', 'Hamstrings'),
        ('glutes', 'Glutes'),
        ('calves', 'Calves'),
        ('neck', 'Neck'),
    ]
    
    name = models.CharField(max_length=20, choices=MUSCLE_GROUPS, unique=True)
    display_name = models.CharField(max_length=50)
    description = models.TextField(blank=True)
    
    def __str__(self):
        return self.display_name
    
    class Meta:
        verbose_name = "Muscle Group"
        verbose_name_plural = "Muscle Groups"


class BodyComposition(models.Model):
    """Advanced body composition tracking."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='body_compositions')
    date = models.DateTimeField(auto_now_add=True)
    
    # Body Composition Metrics
    weight_kg = models.FloatField()
    body_fat_percentage = models.FloatField()
    muscle_mass_kg = models.FloatField()
    bone_mass_kg = models.FloatField(null=True, blank=True)
    water_percentage = models.FloatField(null=True, blank=True)
    visceral_fat_level = models.IntegerField(null=True, blank=True)
    
    # Metabolic Metrics
    bmr_calories = models.IntegerField(null=True, blank=True)
    metabolic_age = models.IntegerField(null=True, blank=True)
    
    # Body Shape Analysis
    body_shape_type = models.CharField(max_length=20, choices=[
        ('ectomorph', 'Ectomorph'),
        ('mesomorph', 'Mesomorph'),
        ('endomorph', 'Endomorph'),
        ('balanced', 'Balanced'),
    ], null=True, blank=True)
    
    # Notes and Context
    measurement_method = models.CharField(max_length=20, choices=[
        ('scale', 'Smart Scale'),
        ('calipers', 'Skinfold Calipers'),
        ('dexa', 'DEXA Scan'),
        ('bodpod', 'BodPod'),
        ('manual', 'Manual Calculation'),
    ], default='scale')
    
    notes = models.TextField(blank=True)
    
    def __str__(self):
        return f"{self.user.username} - {self.date.date()} ({self.body_fat_percentage}% BF)"
    
    class Meta:
        ordering = ['-date']
        verbose_name = "Body Composition"
        verbose_name_plural = "Body Compositions"


class MuscleGroupMeasurement(models.Model):
    """Detailed muscle group measurements with growth tracking."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='muscle_measurements')
    muscle_group = models.ForeignKey(MuscleGroup, on_delete=models.CASCADE)
    date = models.DateTimeField(auto_now_add=True)
    
    # Measurements
    circumference_cm = models.FloatField()
    circumference_inches = models.FloatField(null=True, blank=True)
    
    # Muscle Quality Metrics
    muscle_density = models.CharField(max_length=20, choices=[
        ('soft', 'Soft'),
        ('firm', 'Firm'),
        ('hard', 'Hard'),
        ('very_hard', 'Very Hard'),
    ], null=True, blank=True)
    
    # Context
    is_flexed = models.BooleanField(default=False)
    is_pumped = models.BooleanField(default=False)
    workout_context = models.CharField(max_length=20, choices=[
        ('pre_workout', 'Pre-Workout'),
        ('post_workout', 'Post-Workout'),
        ('rest_day', 'Rest Day'),
        ('morning', 'Morning'),
        ('evening', 'Evening'),
    ], default='morning')
    
    # Associated Data
    body_composition = models.ForeignKey(BodyComposition, on_delete=models.SET_NULL, null=True, blank=True)
    progress_photo = models.ForeignKey(ProgressPhoto, on_delete=models.SET_NULL, null=True, blank=True)
    
    notes = models.TextField(blank=True)
    
    def __str__(self):
        return f"{self.user.username} - {self.muscle_group.display_name}: {self.circumference_cm}cm"
    
    class Meta:
        ordering = ['-date']
        verbose_name = "Muscle Group Measurement"
        verbose_name_plural = "Muscle Group Measurements"


class BodyAnalytics(models.Model):
    """Comprehensive body analytics and insights."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='body_analytics')
    analysis_date = models.DateTimeField(auto_now_add=True)
    
    # Growth Analysis
    total_muscle_growth_kg = models.FloatField(default=0)
    total_fat_loss_kg = models.FloatField(default=0)
    net_weight_change_kg = models.FloatField(default=0)
    
    # Muscle Group Analysis
    fastest_growing_muscle = models.ForeignKey(MuscleGroup, on_delete=models.SET_NULL, null=True, blank=True, related_name='fastest_growing')
    slowest_growing_muscle = models.ForeignKey(MuscleGroup, on_delete=models.SET_NULL, null=True, blank=True, related_name='slowest_growing')
    
    # Body Composition Trends
    body_fat_trend = models.CharField(max_length=20, choices=[
        ('decreasing', 'Decreasing'),
        ('stable', 'Stable'),
        ('increasing', 'Increasing'),
        ('fluctuating', 'Fluctuating'),
    ])
    
    muscle_mass_trend = models.CharField(max_length=20, choices=[
        ('increasing', 'Increasing'),
        ('stable', 'Stable'),
        ('decreasing', 'Decreasing'),
        ('fluctuating', 'Fluctuating'),
    ])
    
    # Performance Metrics
    symmetry_score = models.FloatField(null=True, blank=True)  # 0-100
    balance_score = models.FloatField(null=True, blank=True)   # 0-100
    progress_score = models.FloatField(null=True, blank=True)   # 0-100
    
    # Predictions
    predicted_body_fat_30_days = models.FloatField(null=True, blank=True)
    predicted_muscle_mass_30_days = models.FloatField(null=True, blank=True)
    predicted_weight_30_days = models.FloatField(null=True, blank=True)
    
    # Insights
    key_insights = models.JSONField(default=list, blank=True)
    recommendations = models.JSONField(default=list, blank=True)
    
    def __str__(self):
        return f"{self.user.username} - Analytics {self.analysis_date.date()}"
    
    class Meta:
        ordering = ['-analysis_date']
        verbose_name = "Body Analytics"
        verbose_name_plural = "Body Analytics"


class ProgressPrediction(models.Model):
    """AI-powered progress predictions."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='progress_predictions')
    prediction_date = models.DateTimeField(auto_now_add=True)
    
    # Prediction Parameters
    prediction_horizon_days = models.IntegerField(default=30)
    confidence_level = models.FloatField(default=0.85)  # 0-1
    
    # Predicted Values
    predicted_weight = models.FloatField()
    predicted_body_fat = models.FloatField()
    predicted_muscle_mass = models.FloatField()
    
    # Muscle Group Predictions
    muscle_predictions = models.JSONField(default=dict, blank=True)
    
    # Factors Considered
    current_trends = models.JSONField(default=dict, blank=True)
    historical_data_points = models.IntegerField(default=0)
    prediction_accuracy_score = models.FloatField(null=True, blank=True)
    
    # Status
    is_active = models.BooleanField(default=True)
    actual_vs_predicted = models.JSONField(default=dict, blank=True)
    
    def __str__(self):
        return f"{self.user.username} - Prediction ({self.prediction_horizon_days}d)"
    
    class Meta:
        ordering = ['-prediction_date']
        verbose_name = "Progress Prediction"
        verbose_name_plural = "Progress Predictions"


# ============================================================================
# ENHANCED NUTRITION SYSTEM MODELS
# ============================================================================

class FoodCategory(models.Model):
    """Categories for organizing foods (proteins, carbs, fats, vegetables, etc.)"""
    name = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True)
    color = models.CharField(max_length=7, default='#4A90E2')  # Hex color for UI
    icon = models.CharField(max_length=50, blank=True)  # Icon class name
    sort_order = models.IntegerField(default=0)
    
    class Meta:
        ordering = ['sort_order', 'name']
        verbose_name = "Food Category"
        verbose_name_plural = "Food Categories"
    
    def __str__(self):
        return self.name


class Recipe(models.Model):
    """Detailed recipes with ingredients and instructions"""
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    prep_time_minutes = models.IntegerField(null=True, blank=True)
    cook_time_minutes = models.IntegerField(null=True, blank=True)
    servings = models.IntegerField(default=1)
    difficulty = models.CharField(max_length=20, choices=[
        ('easy', 'Easy'),
        ('medium', 'Medium'),
        ('hard', 'Hard')
    ], default='easy')
    
    # Nutrition per serving (calculated from ingredients)
    calories_per_serving = models.FloatField(default=0.0)
    protein_g_per_serving = models.FloatField(default=0.0)
    carbs_g_per_serving = models.FloatField(default=0.0)
    fat_g_per_serving = models.FloatField(default=0.0)
    fiber_g_per_serving = models.FloatField(default=0.0)
    sugar_g_per_serving = models.FloatField(default=0.0)
    sodium_mg_per_serving = models.FloatField(default=0.0)
    
    # Recipe metadata
    cuisine_type = models.CharField(max_length=50, blank=True)
    meal_type = models.CharField(max_length=20, choices=[
        ('breakfast', 'Breakfast'),
        ('lunch', 'Lunch'),
        ('dinner', 'Dinner'),
        ('snack', 'Snack'),
        ('dessert', 'Dessert')
    ], blank=True)
    dietary_tags = models.JSONField(default=list, blank=True)  # ['vegan', 'gluten-free', 'keto']
    
    # User and sharing
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_recipes')
    is_public = models.BooleanField(default=False)
    image_url = models.URLField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = "Recipe"
        verbose_name_plural = "Recipes"
    
    def __str__(self):
        return self.name


class RecipeIngredient(models.Model):
    """Ingredients for recipes with quantities"""
    recipe = models.ForeignKey(Recipe, on_delete=models.CASCADE, related_name='ingredients')
    food = models.ForeignKey(FoodCatalog, on_delete=models.CASCADE)
    quantity = models.FloatField()  # Amount in grams
    unit = models.CharField(max_length=20, default='g')  # g, ml, cup, tbsp, etc.
    notes = models.CharField(max_length=200, blank=True)  # "chopped", "diced", etc.
    
    class Meta:
        ordering = ['id']
        verbose_name = "Recipe Ingredient"
        verbose_name_plural = "Recipe Ingredients"
    
    def __str__(self):
        return f"{self.quantity}{self.unit} {self.food.name}"


class RecipeInstruction(models.Model):
    """Step-by-step cooking instructions"""
    recipe = models.ForeignKey(Recipe, on_delete=models.CASCADE, related_name='instructions')
    step_number = models.IntegerField()
    instruction = models.TextField()
    duration_minutes = models.IntegerField(null=True, blank=True)
    temperature_celsius = models.IntegerField(null=True, blank=True)
    
    class Meta:
        ordering = ['step_number']
        verbose_name = "Recipe Instruction"
        verbose_name_plural = "Recipe Instructions"
    
    def __str__(self):
        return f"Step {self.step_number}: {self.instruction[:50]}..."


class MealPlan(models.Model):
    """Weekly/daily meal plans for users"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='meal_plans')
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    start_date = models.DateField()
    end_date = models.DateField()
    
    # Plan settings
    target_calories = models.IntegerField()
    target_protein_g = models.FloatField()
    target_carbs_g = models.FloatField()
    target_fat_g = models.FloatField()
    
    # Plan metadata
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = "Meal Plan"
        verbose_name_plural = "Meal Plans"
    
    def __str__(self):
        return f"{self.user.username}'s {self.name}"


class MealPlanDay(models.Model):
    """Individual days within a meal plan"""
    meal_plan = models.ForeignKey(MealPlan, on_delete=models.CASCADE, related_name='days')
    date = models.DateField()
    day_name = models.CharField(max_length=20)  # Monday, Tuesday, etc.
    
    # Daily targets (can override plan defaults)
    target_calories = models.IntegerField(null=True, blank=True)
    target_protein_g = models.FloatField(null=True, blank=True)
    target_carbs_g = models.FloatField(null=True, blank=True)
    target_fat_g = models.FloatField(null=True, blank=True)
    
    class Meta:
        ordering = ['date']
        unique_together = ['meal_plan', 'date']
        verbose_name = "Meal Plan Day"
        verbose_name_plural = "Meal Plan Days"
    
    def __str__(self):
        return f"{self.meal_plan.name} - {self.date}"


class MealPlanMeal(models.Model):
    """Individual meals within a meal plan day"""
    meal_plan_day = models.ForeignKey(MealPlanDay, on_delete=models.CASCADE, related_name='meals')
    meal_type = models.CharField(max_length=20, choices=[
        ('breakfast', 'Breakfast'),
        ('lunch', 'Lunch'),
        ('dinner', 'Dinner'),
        ('snack', 'Snack')
    ])
    meal_time = models.TimeField(null=True, blank=True)
    
    # Meal can be a recipe or custom food items
    recipe = models.ForeignKey(Recipe, on_delete=models.CASCADE, null=True, blank=True)
    custom_foods = models.JSONField(default=list, blank=True)  # List of food items with quantities
    
    # Calculated nutrition
    calories = models.FloatField(default=0.0)
    protein_g = models.FloatField(default=0.0)
    carbs_g = models.FloatField(default=0.0)
    fat_g = models.FloatField(default=0.0)
    
    notes = models.TextField(blank=True)
    
    class Meta:
        ordering = ['meal_time', 'meal_type']
        verbose_name = "Meal Plan Meal"
        verbose_name_plural = "Meal Plan Meals"
    
    def __str__(self):
        return f"{self.meal_plan_day.date} - {self.meal_type}"


class MealTemplate(models.Model):
    """Reusable meal templates for different goals and preferences"""
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    meal_type = models.CharField(max_length=20, choices=[
        ('breakfast', 'Breakfast'),
        ('lunch', 'Lunch'),
        ('dinner', 'Dinner'),
        ('snack', 'Snack')
    ])
    
    # Template settings
    target_calories = models.IntegerField()
    target_protein_g = models.FloatField()
    target_carbs_g = models.FloatField()
    target_fat_g = models.FloatField()
    
    # Template content
    recipe = models.ForeignKey(Recipe, on_delete=models.CASCADE, null=True, blank=True)
    food_items = models.JSONField(default=list, blank=True)  # List of food items with quantities
    
    # Template metadata
    goal_type = models.CharField(max_length=50, choices=[
        ('weight_loss', 'Weight Loss'),
        ('muscle_gain', 'Muscle Gain'),
        ('maintenance', 'Maintenance'),
        ('performance', 'Performance')
    ], blank=True)
    dietary_tags = models.JSONField(default=list, blank=True)
    
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_meal_templates')
    is_public = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = "Meal Template"
        verbose_name_plural = "Meal Templates"
    
    def __str__(self):
        return self.name


class NutritionGoal(models.Model):
    """User-specific nutrition objectives and targets"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='nutrition_goals')
    goal_type = models.CharField(max_length=50, choices=[
        ('weight_loss', 'Weight Loss'),
        ('muscle_gain', 'Muscle Gain'),
        ('maintenance', 'Maintenance'),
        ('performance', 'Performance'),
        ('body_recomposition', 'Body Recomposition')
    ])
    
    # Goal parameters
    target_weight_kg = models.FloatField(null=True, blank=True)
    target_body_fat_percentage = models.FloatField(null=True, blank=True)
    target_date = models.DateField(null=True, blank=True)
    
    # Daily targets
    target_calories = models.IntegerField()
    target_protein_g = models.FloatField()
    target_carbs_g = models.FloatField()
    target_fat_g = models.FloatField()
    target_fiber_g = models.FloatField(default=25.0)
    target_water_liters = models.FloatField(default=2.5)
    
    # Goal settings
    is_active = models.BooleanField(default=True)
    start_date = models.DateField()
    notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = "Nutrition Goal"
        verbose_name_plural = "Nutrition Goals"
    
    def __str__(self):
        return f"{self.user.username}'s {self.goal_type} goal"


class WaterIntake(models.Model):
    """Daily water/hydration tracking"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='water_intakes')
    date = models.DateField()
    amount_ml = models.FloatField()  # Amount in milliliters
    timestamp = models.DateTimeField(auto_now_add=True)
    notes = models.CharField(max_length=200, blank=True)
    
    class Meta:
        ordering = ['-timestamp']
        verbose_name = "Water Intake"
        verbose_name_plural = "Water Intakes"
    
    def __str__(self):
        return f"{self.user.username} - {self.amount_ml}ml on {self.date}"


class SupplementLog(models.Model):
    """Vitamin and supplement tracking"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='supplement_logs')
    date = models.DateField()
    supplement_name = models.CharField(max_length=200)
    dosage = models.CharField(max_length=100)  # "500mg", "1 tablet", etc.
    time_taken = models.TimeField(null=True, blank=True)
    notes = models.TextField(blank=True)
    
    class Meta:
        ordering = ['-date', '-time_taken']
        verbose_name = "Supplement Log"
        verbose_name_plural = "Supplement Logs"
    
    def __str__(self):
        return f"{self.user.username} - {self.supplement_name} on {self.date}"


class MealRating(models.Model):
    """User feedback on meals for AI recommendations"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='meal_ratings')
    meal_plan_meal = models.ForeignKey(MealPlanMeal, on_delete=models.CASCADE, related_name='ratings')
    rating = models.IntegerField(choices=[(1, 'Poor'), (2, 'Fair'), (3, 'Good'), (4, 'Very Good'), (5, 'Excellent')])
    taste_rating = models.IntegerField(choices=[(1, 'Poor'), (2, 'Fair'), (3, 'Good'), (4, 'Very Good'), (5, 'Excellent')])
    satiety_rating = models.IntegerField(choices=[(1, 'Not filling'), (2, 'Slightly filling'), (3, 'Moderately filling'), (4, 'Very filling'), (5, 'Extremely filling')])
    difficulty_rating = models.IntegerField(choices=[(1, 'Very easy'), (2, 'Easy'), (3, 'Moderate'), (4, 'Hard'), (5, 'Very hard')])
    
    feedback = models.TextField(blank=True)
    would_make_again = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = "Meal Rating"
        verbose_name_plural = "Meal Ratings"
    
    def __str__(self):
        return f"{self.user.username} rated {self.meal_plan_meal} - {self.rating}/5"


class GroceryList(models.Model):
    """Generated grocery lists from meal plans"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='grocery_lists')
    meal_plan = models.ForeignKey(MealPlan, on_delete=models.CASCADE, related_name='grocery_lists')
    name = models.CharField(max_length=200)
    week_start_date = models.DateField()
    week_end_date = models.DateField()
    
    # List items (JSON format for flexibility)
    items = models.JSONField(default=list)  # [{"food": "Chicken Breast", "quantity": 500, "unit": "g", "category": "Protein"}]
    
    # List status
    is_completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = "Grocery List"
        verbose_name_plural = "Grocery Lists"
    
    def __str__(self):
        return f"{self.user.username}'s grocery list for {self.week_start_date}"


class RestaurantFood(models.Model):
    """Database of restaurant and fast food items"""
    restaurant_name = models.CharField(max_length=200)
    item_name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    
    # Nutrition per serving
    serving_size = models.CharField(max_length=100)  # "1 burger", "1 large", etc.
    calories = models.FloatField()
    protein_g = models.FloatField(default=0.0)
    carbs_g = models.FloatField(default=0.0)
    fat_g = models.FloatField(default=0.0)
    fiber_g = models.FloatField(default=0.0)
    sugar_g = models.FloatField(default=0.0)
    sodium_mg = models.FloatField(default=0.0)
    
    # Item metadata
    category = models.CharField(max_length=100, blank=True)  # "Main Course", "Side", "Beverage"
    dietary_tags = models.JSONField(default=list, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['restaurant_name', 'item_name']
        unique_together = ['restaurant_name', 'item_name']
        verbose_name = "Restaurant Food"
        verbose_name_plural = "Restaurant Foods"
    
    def __str__(self):
        return f"{self.restaurant_name} - {self.item_name}"


class NutritionalAnalysis(models.Model):
    """AI-powered nutritional analysis and recommendations"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='nutritional_analyses')
    analysis_date = models.DateField()
    analysis_type = models.CharField(max_length=50, choices=[
        ('weekly', 'Weekly Analysis'),
        ('monthly', 'Monthly Analysis'),
        ('goal_progress', 'Goal Progress Analysis'),
        ('deficiency_check', 'Nutrient Deficiency Check')
    ])
    
    # Analysis results
    findings = models.JSONField(default=dict)  # Detailed analysis results
    recommendations = models.JSONField(default=list)  # List of recommendations
    nutrient_gaps = models.JSONField(default=list)  # Missing nutrients
    excess_nutrients = models.JSONField(default=list)  # Over-consumed nutrients
    
    # Scores and metrics
    overall_score = models.IntegerField(null=True, blank=True)  # 1-100
    variety_score = models.IntegerField(null=True, blank=True)
    balance_score = models.IntegerField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-analysis_date']
        verbose_name = "Nutritional Analysis"
        verbose_name_plural = "Nutritional Analyses"
    
    def __str__(self):
        return f"{self.user.username} - {self.analysis_type} on {self.analysis_date}"


# Real-time Social Activity Models
class Activity(models.Model):
    """User activities for social feed (workouts, achievements, etc.)"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='activities')
    
    # Activity details
    activity_type = models.CharField(max_length=30, choices=[
        ('workout_completed', 'Workout Completed'),
        ('personal_record', 'Personal Record'),
        ('achievement_unlocked', 'Achievement Unlocked'),
        ('challenge_joined', 'Challenge Joined'),
        ('challenge_completed', 'Challenge Completed'),
        ('goal_reached', 'Goal Reached'),
        ('streak_milestone', 'Streak Milestone'),
    ])
    
    title = models.CharField(max_length=200)
    description = models.TextField()
    
    # Related objects (optional)
    workout_session = models.ForeignKey('WorkoutSession', on_delete=models.SET_NULL, null=True, blank=True)
    challenge = models.ForeignKey('Challenge', on_delete=models.SET_NULL, null=True, blank=True)
    goal = models.ForeignKey('Goal', on_delete=models.SET_NULL, null=True, blank=True)
    
    # Activity data
    activity_data = models.JSONField(default=dict, blank=True)  # Store additional data
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Privacy
    is_public = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name_plural = "Activities"
    
    def __str__(self):
        return f"{self.user.username} - {self.title}"


class ActivityLike(models.Model):
    """Likes on user activities"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='activity_likes')
    activity = models.ForeignKey(Activity, on_delete=models.CASCADE, related_name='likes')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('user', 'activity')
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.username} likes {self.activity.title}"


class ActivityComment(models.Model):
    """Comments on user activities"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='activity_comments')
    activity = models.ForeignKey(Activity, on_delete=models.CASCADE, related_name='comments')
    comment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['created_at']
    
    def __str__(self):
        return f"{self.user.username} commented on {self.activity.title}"


# Gamification System Models
class GamificationProfile(models.Model):
    """Extended user profile with gamification data"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='gamification_profile')
    
    # XP and Level System
    total_xp = models.IntegerField(default=0)
    current_level = models.IntegerField(default=1)
    xp_to_next_level = models.IntegerField(default=1000)
    
    # Streak System
    current_streak = models.IntegerField(default=0)
    longest_streak = models.IntegerField(default=0)
    last_activity_date = models.DateField(null=True, blank=True)
    
    # Achievement Stats
    total_achievements = models.IntegerField(default=0)
    total_workouts = models.IntegerField(default=0)
    total_challenges_completed = models.IntegerField(default=0)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-total_xp']
    
    def __str__(self):
        return f"{self.user.username} - Level {self.current_level} ({self.total_xp} XP)"
    
    @property
    def level_progress_percentage(self):
        """Calculate progress to next level as percentage"""
        if self.xp_to_next_level == 0:
            return 100
        current_level_xp = self.total_xp - self.get_xp_for_level(self.current_level)
        return min(100, (current_level_xp / self.xp_to_next_level) * 100)
    
    @staticmethod
    def get_xp_for_level(level):
        """Calculate total XP required for a specific level"""
        return (level - 1) * 1000
    
    def add_xp(self, amount, activity_type='general'):
        """Add XP and check for level up"""
        self.total_xp += amount
        
        # Check for level up
        new_level = self.calculate_level()
        if new_level > self.current_level:
            old_level = self.current_level
            self.current_level = new_level
            self.xp_to_next_level = self.get_xp_for_level(new_level + 1) - self.total_xp
            
            # Create level up activity
            Activity.objects.create(
                user=self.user,
                activity_type='level_up',
                title=f'Level Up!',
                description=f'Reached level {new_level}!',
                activity_data={
                    'old_level': old_level,
                    'new_level': new_level,
                    'xp_gained': amount,
                    'activity_type': activity_type
                }
            )
            
            return True, new_level  # Level up occurred
        else:
            self.xp_to_next_level = self.get_xp_for_level(self.current_level + 1) - self.total_xp
            return False, self.current_level
    
    def calculate_level(self):
        """Calculate current level based on total XP"""
        level = 1
        while self.get_xp_for_level(level + 1) <= self.total_xp:
            level += 1
        return level


class Badge(models.Model):
    """Badges that users can earn"""
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField()
    icon = models.CharField(max_length=50, default='🏆')  # Emoji or icon class
    
    # Badge categories and rarity
    category = models.CharField(max_length=30, choices=[
        ('strength', 'Strength'),
        ('consistency', 'Consistency'),
        ('social', 'Social'),
        ('nutrition', 'Nutrition'),
        ('special', 'Special'),
        ('milestone', 'Milestone'),
    ])
    
    rarity = models.CharField(max_length=20, choices=[
        ('common', 'Common'),
        ('uncommon', 'Uncommon'),
        ('rare', 'Rare'),
        ('epic', 'Epic'),
        ('legendary', 'Legendary'),
    ], default='common')
    
    # Requirements
    xp_required = models.IntegerField(default=0)
    level_required = models.IntegerField(default=0)
    streak_required = models.IntegerField(default=0)
    workouts_required = models.IntegerField(default=0)
    challenges_required = models.IntegerField(default=0)
    
    # Special requirements (JSON field for complex conditions)
    special_requirements = models.JSONField(default=dict, blank=True)
    
    # Badge settings
    is_hidden = models.BooleanField(default=False)  # Hidden until unlocked
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['category', 'rarity', 'xp_required']
    
    def __str__(self):
        return f"{self.icon} {self.name} ({self.get_rarity_display()})"


class UserBadge(models.Model):
    """User's earned badges"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='earned_badges')
    badge = models.ForeignKey(Badge, on_delete=models.CASCADE, related_name='users')
    earned_at = models.DateTimeField(auto_now_add=True)
    
    # Additional data about how the badge was earned
    earned_data = models.JSONField(default=dict, blank=True)
    
    class Meta:
        unique_together = ('user', 'badge')
        ordering = ['-earned_at']
    
    def __str__(self):
        return f"{self.user.username} earned {self.badge.name}"


class DailyQuest(models.Model):
    """Daily quests for users to complete"""
    name = models.CharField(max_length=100)
    description = models.TextField()
    
    # Quest type and requirements
    quest_type = models.CharField(max_length=30, choices=[
        ('workout', 'Complete Workout'),
        ('social', 'Social Interaction'),
        ('challenge', 'Challenge Activity'),
        ('streak', 'Maintain Streak'),
        ('nutrition', 'Nutrition Goal'),
        ('custom', 'Custom Quest'),
    ])
    
    # Requirements (JSON field for flexibility)
    requirements = models.JSONField(default=dict)
    
    # Rewards
    xp_reward = models.IntegerField(default=10)
    badge_reward = models.ForeignKey(Badge, on_delete=models.SET_NULL, null=True, blank=True)
    
    # Quest settings
    is_active = models.BooleanField(default=True)
    difficulty = models.CharField(max_length=20, choices=[
        ('easy', 'Easy'),
        ('medium', 'Medium'),
        ('hard', 'Hard'),
    ], default='easy')
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['difficulty', 'xp_reward']
    
    def __str__(self):
        return f"{self.name} ({self.get_difficulty_display()})"


class UserDailyQuest(models.Model):
    """User's daily quest progress"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='daily_quests')
    quest = models.ForeignKey(DailyQuest, on_delete=models.CASCADE, related_name='user_progress')
    date = models.DateField()
    
    # Progress tracking
    progress = models.IntegerField(default=0)
    target = models.IntegerField(default=1)
    is_completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    # Rewards claimed
    xp_claimed = models.BooleanField(default=False)
    badge_claimed = models.BooleanField(default=False)
    
    class Meta:
        unique_together = ('user', 'quest', 'date')
        ordering = ['-date', 'quest__difficulty']
    
    def __str__(self):
        return f"{self.user.username} - {self.quest.name} ({self.date})"
    
    @property
    def progress_percentage(self):
        """Calculate progress as percentage"""
        if self.target == 0:
            return 100
        return min(100, (self.progress / self.target) * 100)


class StreakBonus(models.Model):
    """Streak bonuses for consecutive days"""
    streak_days = models.IntegerField(unique=True)
    xp_multiplier = models.FloatField(default=1.0)
    bonus_xp = models.IntegerField(default=0)
    badge_reward = models.ForeignKey(Badge, on_delete=models.SET_NULL, null=True, blank=True)
    
    description = models.CharField(max_length=200)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['streak_days']
    
    def __str__(self):
        return f"{self.streak_days} day streak bonus"


# Push Notifications Models
class PushSubscription(models.Model):
    """User's push notification subscriptions"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='push_subscriptions')
    
    # Subscription details
    endpoint = models.URLField(max_length=500)
    p256dh_key = models.CharField(max_length=200)
    auth_key = models.CharField(max_length=200)
    
    # Device information
    user_agent = models.TextField(blank=True)
    device_type = models.CharField(max_length=50, choices=[
        ('desktop', 'Desktop'),
        ('mobile', 'Mobile'),
        ('tablet', 'Tablet'),
    ], default='desktop')
    
    # Subscription status
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    last_used = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('user', 'endpoint')
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.device_type} subscription"


class NotificationPreference(models.Model):
    """User's notification preferences"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='notification_preferences')
    
    # General preferences
    notifications_enabled = models.BooleanField(default=True)
    email_notifications = models.BooleanField(default=True)
    push_notifications = models.BooleanField(default=True)
    
    # Specific notification types
    friend_requests = models.BooleanField(default=True)
    friend_activities = models.BooleanField(default=True)
    challenge_invites = models.BooleanField(default=True)
    challenge_updates = models.BooleanField(default=True)
    achievement_unlocks = models.BooleanField(default=True)
    level_ups = models.BooleanField(default=True)
    streak_reminders = models.BooleanField(default=True)
    daily_quests = models.BooleanField(default=True)
    leaderboard_changes = models.BooleanField(default=True)
    social_interactions = models.BooleanField(default=True)
    
    # Timing preferences
    quiet_hours_start = models.TimeField(null=True, blank=True)
    quiet_hours_end = models.TimeField(null=True, blank=True)
    timezone = models.CharField(max_length=50, default='UTC')
    
    # Frequency limits
    max_notifications_per_day = models.IntegerField(default=10)
    min_interval_minutes = models.IntegerField(default=5)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.user.username} notification preferences"


class NotificationLog(models.Model):
    """Log of sent notifications"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notification_logs')
    subscription = models.ForeignKey(PushSubscription, on_delete=models.CASCADE, null=True, blank=True)
    
    # Notification details
    notification_type = models.CharField(max_length=50)
    title = models.CharField(max_length=200)
    body = models.TextField()
    
    # Delivery status
    status = models.CharField(max_length=20, choices=[
        ('sent', 'Sent'),
        ('delivered', 'Delivered'),
        ('failed', 'Failed'),
        ('clicked', 'Clicked'),
    ], default='sent')
    
    # Additional data
    notification_data = models.JSONField(default=dict, blank=True)
    error_message = models.TextField(blank=True)
    
    # Timestamps
    sent_at = models.DateTimeField(auto_now_add=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    clicked_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-sent_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.notification_type} - {self.status}"
