# Models for Maverick Aim Rush — created by Cursor AI
from django.db import models
from django.contrib.auth.models import User

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
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sessions')
    date = models.DateField()
    duration_minutes = models.IntegerField()
    notes = models.TextField(null=True, blank=True)

    def __str__(self):
        return f"Workout for {self.user.username} on {self.date}"

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
    meal_type = models.CharField(max_length=50)
    food_item = models.CharField(max_length=100)
    calories = models.IntegerField()
    quantity_grams = models.FloatField(null=True, blank=True)
    protein_g = models.FloatField(null=True, blank=True)
    carbs_g = models.FloatField(null=True, blank=True)
    fat_g = models.FloatField(null=True, blank=True)

    def __str__(self):
        return f"{self.food_item} for {self.user.username} on {self.date}"

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
