"""
Serializers for Gamification System
"""

from rest_framework import serializers
from .models import (
    GamificationProfile, Badge, UserBadge, DailyQuest, UserDailyQuest, StreakBonus
)


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for GamificationProfile model"""
    username = serializers.CharField(source='user.username', read_only=True)
    level_progress = serializers.ReadOnlyField()
    
    class Meta:
        model = GamificationProfile
        fields = [
            'id', 'username', 'total_xp', 'current_level', 'xp_to_next_level',
            'level_progress', 'current_streak', 'longest_streak',
            'total_achievements', 'total_workouts', 'total_challenges_completed',
            'created_at', 'updated_at'
        ]


class BadgeSerializer(serializers.ModelSerializer):
    """Serializer for Badge model"""
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    rarity_display = serializers.CharField(source='get_rarity_display', read_only=True)
    
    class Meta:
        model = Badge
        fields = [
            'id', 'name', 'description', 'icon', 'category', 'category_display',
            'rarity', 'rarity_display', 'xp_required', 'level_required',
            'streak_required', 'workouts_required', 'challenges_required',
            'special_requirements', 'is_hidden', 'is_active', 'created_at'
        ]


class UserBadgeSerializer(serializers.ModelSerializer):
    """Serializer for UserBadge model"""
    badge = BadgeSerializer(read_only=True)
    badge_name = serializers.CharField(source='badge.name', read_only=True)
    badge_icon = serializers.CharField(source='badge.icon', read_only=True)
    badge_rarity = serializers.CharField(source='badge.rarity', read_only=True)
    
    class Meta:
        model = UserBadge
        fields = [
            'id', 'badge', 'badge_name', 'badge_icon', 'badge_rarity',
            'earned_at', 'earned_data'
        ]


class DailyQuestSerializer(serializers.ModelSerializer):
    """Serializer for DailyQuest model"""
    quest_type_display = serializers.CharField(source='get_quest_type_display', read_only=True)
    difficulty_display = serializers.CharField(source='get_difficulty_display', read_only=True)
    badge_reward_name = serializers.CharField(source='badge_reward.name', read_only=True)
    
    class Meta:
        model = DailyQuest
        fields = [
            'id', 'name', 'description', 'quest_type', 'quest_type_display',
            'requirements', 'xp_reward', 'badge_reward', 'badge_reward_name',
            'is_active', 'difficulty', 'difficulty_display', 'created_at'
        ]


class UserDailyQuestSerializer(serializers.ModelSerializer):
    """Serializer for UserDailyQuest model"""
    quest = DailyQuestSerializer(read_only=True)
    quest_name = serializers.CharField(source='quest.name', read_only=True)
    quest_description = serializers.CharField(source='quest.description', read_only=True)
    quest_type = serializers.CharField(source='quest.quest_type', read_only=True)
    xp_reward = serializers.IntegerField(source='quest.xp_reward', read_only=True)
    difficulty = serializers.CharField(source='quest.difficulty', read_only=True)
    progress_percentage = serializers.ReadOnlyField()
    
    class Meta:
        model = UserDailyQuest
        fields = [
            'id', 'quest', 'quest_name', 'quest_description', 'quest_type',
            'date', 'progress', 'target', 'progress_percentage',
            'is_completed', 'completed_at', 'xp_reward', 'difficulty',
            'xp_claimed', 'badge_claimed'
        ]


class StreakBonusSerializer(serializers.ModelSerializer):
    """Serializer for StreakBonus model"""
    
    class Meta:
        model = StreakBonus
        fields = [
            'id', 'streak_days', 'xp_multiplier', 'bonus_xp',
            'badge_reward', 'description', 'is_active'
        ]


class GamificationStatsSerializer(serializers.Serializer):
    """Serializer for gamification statistics"""
    level = serializers.IntegerField()
    xp = serializers.IntegerField()
    xp_to_next_level = serializers.IntegerField()
    level_progress = serializers.FloatField()
    current_streak = serializers.IntegerField()
    longest_streak = serializers.IntegerField()
    total_workouts = serializers.IntegerField()
    total_challenges = serializers.IntegerField()
    total_achievements = serializers.IntegerField()
    earned_badges = serializers.IntegerField()
    available_badges = serializers.IntegerField()
    rank = serializers.IntegerField()
    total_users = serializers.IntegerField()


class LeaderboardEntrySerializer(serializers.Serializer):
    """Serializer for leaderboard entries"""
    rank = serializers.IntegerField()
    username = serializers.CharField()
    level = serializers.IntegerField()
    xp = serializers.IntegerField()
    streak = serializers.IntegerField()
    total_workouts = serializers.IntegerField()
    total_achievements = serializers.IntegerField()
