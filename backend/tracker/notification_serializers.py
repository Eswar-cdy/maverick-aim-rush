"""
Serializers for Push Notification models
"""

from rest_framework import serializers
from .models import PushSubscription, NotificationPreference, NotificationLog


class PushSubscriptionSerializer(serializers.ModelSerializer):
    """Serializer for push notification subscriptions"""
    
    class Meta:
        model = PushSubscription
        fields = [
            'id', 'endpoint', 'device_type', 'is_active',
            'created_at', 'last_used'
        ]
        read_only_fields = ['id', 'created_at', 'last_used']


class NotificationPreferenceSerializer(serializers.ModelSerializer):
    """Serializer for notification preferences"""
    
    class Meta:
        model = NotificationPreference
        fields = [
            'notifications_enabled', 'email_notifications', 'push_notifications',
            'friend_requests', 'friend_activities', 'challenge_invites',
            'challenge_updates', 'achievement_unlocks', 'level_ups',
            'streak_reminders', 'daily_quests', 'leaderboard_changes',
            'social_interactions', 'quiet_hours_start', 'quiet_hours_end',
            'timezone', 'max_notifications_per_day', 'min_interval_minutes'
        ]


class NotificationLogSerializer(serializers.ModelSerializer):
    """Serializer for notification logs"""
    
    class Meta:
        model = NotificationLog
        fields = [
            'id', 'notification_type', 'title', 'body', 'status',
            'notification_data', 'sent_at', 'delivered_at', 'clicked_at'
        ]
        read_only_fields = ['id', 'sent_at', 'delivered_at', 'clicked_at']
