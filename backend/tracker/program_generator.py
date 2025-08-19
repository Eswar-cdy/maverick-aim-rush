import random
from .models import UserProfile, Exercise, ProgramTemplate

class ProgramGenerator:
    def __init__(self, user):
        self.user = user
        self.profile = UserProfile.objects.get(user=user)

    def generate_workout_plan(self):
        days_available = self.profile.days_per_week or 3 # Default to 3 days
        
        # 1. Select a program split based on days available
        if days_available <= 3:
            split = self.get_full_body_split(days_available)
            program_name = f"{days_available}-Day Full Body Program"
        else:
            split = self.get_push_pull_legs_split(days_available)
            program_name = f"{days_available}-Day Push/Pull/Legs Split"

        # 2. Build the workout for each day in the split
        weekly_schedule = {}
        for day, muscle_groups in split.items():
            weekly_schedule[day] = self.build_day_workout(muscle_groups)

        return {
            "name": program_name,
            "description": f"A personalized {program_name} generated for {self.user.username}.",
            "weekly_schedule": weekly_schedule
        }

    def build_day_workout(self, muscle_groups):
        workout_day = []
        # Simple logic: 2 exercises per primary muscle group, 1 for secondary
        is_primary = True
        for group in muscle_groups:
            num_exercises = 2 if is_primary else 1
            exercises = self.select_exercises_for_group(group, num_exercises)
            workout_day.extend(exercises)
            is_primary = False
        
        # Add a core workout at the end
        workout_day.extend(self.select_exercises_for_group('core', 2))
        return workout_day

    def select_exercises_for_group(self, muscle_group, count):
        # 3. Filter exercises from DB based on user profile
        equipment_map = {
            'none': ['bodyweight'],
            'home_gym': ['bodyweight', 'dumbbell', 'bands'],
            'full_gym': ['bodyweight', 'dumbbell', 'barbell', 'machine', 'kettlebell', 'bands']
        }
        
        allowed_equipment = equipment_map.get(self.profile.equipment_access, ['bodyweight'])
        
        # Fetch all suitable exercises from the database
        exercise_pool = list(Exercise.objects.filter(
            muscle_group=muscle_group,
            equipment__in=allowed_equipment,
            difficulty__in=[self.profile.fitness_level, 'beginner'] # Always include beginner exercises
        ))
        
        # Randomly select 'count' exercises, ensuring we don't ask for more than we have
        actual_count = min(count, len(exercise_pool))
        selected_exercises = random.sample(exercise_pool, actual_count)
        
        # Format the selected exercises
        return [{'name': ex.name, 'sets': 3, 'reps': '8-12'} for ex in selected_exercises]

    def get_full_body_split(self, days):
        split = {
            "Day1": ['legs', 'back', 'chest'],
            "Day2": ['chest', 'shoulders', 'triceps'],
            "Day3": ['back', 'biceps']
        }
        return {f"Day{i+1}": v for i, (k, v) in enumerate(split.items()) if i < days}

    def get_push_pull_legs_split(self, days):
        base_split = {
            "Day1": ['chest', 'shoulders', 'triceps'], # Push
            "Day2": ['back', 'biceps'],              # Pull
            "Day3": ['legs'],                       # Legs
            "Day4": ['chest', 'shoulders', 'triceps'], # Push
            "Day5": ['back', 'biceps'],              # Pull
        }
        return {f"Day{i+1}": v for i, (k, v) in enumerate(base_split.items()) if i < days}
