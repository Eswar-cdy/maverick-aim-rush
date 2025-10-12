from rest_framework import serializers
from django.contrib.auth.models import User
from .models import UserProfile


class UserProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = UserProfile
        fields = [
            'id', 'username', 'unit_system', 'distance_unit', 'timezone',
            'age', 'sex', 'height_cm', 'primary_goal', 'days_per_week',
            'equipment', 'created_at', 'updated_at'
        ]


