from rest_framework import serializers
from .models import NutritionLog, Workout, ExerciseLog, ScheduleState
from .models import UserProfile, ProgramPlan

class NutritionLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = NutritionLog
        fields = ['date', 'daily_goals', 'consumed', 'meal_plan', 'extra_foods']
        read_only_fields = ['user']

class ExerciseLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExerciseLog
        fields = ['name', 'category', 'sets', 'personal_record']

class WorkoutSerializer(serializers.ModelSerializer):
    exercises = ExerciseLogSerializer(many=True)

    class Meta:
        model = Workout
        fields = ['id', 'date', 'duration_seconds', 'exercises']
        read_only_fields = ['user']
    
    def create(self, validated_data):
        exercises_data = validated_data.pop('exercises')
        workout = Workout.objects.create(user=self.context['request'].user, **validated_data)
        for exercise_data in exercises_data:
            ExerciseLog.objects.create(workout=workout, **exercise_data)
        return workout

class ScheduleStateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ScheduleState
        fields = ['schedule_data', 'last_updated']
        read_only_fields = ['user']

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['fitness_goal', 'fitness_level', 'days_per_week', 'equipment_access']
        read_only_fields = ['user']

class ProgramPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProgramPlan
        fields = ['plan', 'created_at', 'updated_at']
        read_only_fields = ['user', 'created_at', 'updated_at']
