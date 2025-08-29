from rest_framework import serializers
from .models import NutritionLog

class NutritionLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = NutritionLog
        fields = ['date', 'daily_goals', 'consumed', 'meal_plan', 'extra_foods']
        read_only_fields = ['user'] # User will be set automatically based on the request

    def create(self, validated_data):
        # When creating, we associate the log with the current user
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)
