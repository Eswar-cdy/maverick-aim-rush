"""
Gamification Engine for Maverick Aim Rush
Handles XP calculations, badge awarding, and quest management
"""

from django.contrib.auth.models import User
from django.utils import timezone
from datetime import date, timedelta
from .models import (
    GamificationProfile, Badge, UserBadge, DailyQuest, UserDailyQuest, 
    StreakBonus, Activity, WorkoutSession, ChallengeParticipation
)


class GamificationEngine:
    """Main gamification engine for handling XP, badges, and quests"""
    
    # XP multipliers for different activities
    XP_MULTIPLIERS = {
        'workout_completion': 10,
        'strength_pr': 50,
        'cardio_session': 15,
        'challenge_completion': 100,
        'challenge_join': 25,
        'friend_help': 20,
        'streak_bonus': 5,
        'daily_login': 5,
        'achievement_unlock': 75,
        'social_interaction': 10,
        'nutrition_log': 5,
        'goal_reached': 100,
        'personal_record': 50,
    }
    
    def __init__(self, user):
        self.user = user
        self.profile, created = GamificationProfile.objects.get_or_create(user=user)
    
    def award_xp(self, activity_type, amount=None, metadata=None):
        """Award XP for an activity and check for level ups/badges"""
        if amount is None:
            amount = self.XP_MULTIPLIERS.get(activity_type, 10)
        
        # Apply streak bonus
        streak_multiplier = self.get_streak_multiplier()
        final_amount = int(amount * streak_multiplier)
        
        # Add XP and check for level up
        leveled_up, new_level = self.profile.add_xp(final_amount, activity_type)
        
        # Update streak
        self.update_streak()
        
        # Check for badge unlocks
        new_badges = self.check_badge_unlocks()
        
        # Update daily quest progress
        self.update_daily_quests(activity_type, metadata)
        
        # Create activity record
        self.create_activity_record(activity_type, final_amount, metadata)
        
        return {
            'xp_gained': final_amount,
            'leveled_up': leveled_up,
            'new_level': new_level,
            'new_badges': new_badges,
            'streak_multiplier': streak_multiplier
        }
    
    def get_streak_multiplier(self):
        """Get XP multiplier based on current streak"""
        try:
            bonus = StreakBonus.objects.filter(
                streak_days__lte=self.profile.current_streak,
                is_active=True
            ).order_by('-streak_days').first()
            
            return bonus.xp_multiplier if bonus else 1.0
        except:
            return 1.0
    
    def update_streak(self):
        """Update user's activity streak"""
        today = date.today()
        
        if self.profile.last_activity_date is None:
            # First activity
            self.profile.current_streak = 1
            self.profile.last_activity_date = today
        elif self.profile.last_activity_date == today:
            # Already active today, no change
            pass
        elif self.profile.last_activity_date == today - timedelta(days=1):
            # Consecutive day
            self.profile.current_streak += 1
            self.profile.last_activity_date = today
        else:
            # Streak broken
            self.profile.current_streak = 1
            self.profile.last_activity_date = today
        
        # Update longest streak
        if self.profile.current_streak > self.profile.longest_streak:
            self.profile.longest_streak = self.profile.current_streak
        
        self.profile.save()
    
    def check_badge_unlocks(self):
        """Check if user has unlocked any new badges"""
        new_badges = []
        
        # Get all badges user hasn't earned yet
        earned_badge_ids = UserBadge.objects.filter(user=self.user).values_list('badge_id', flat=True)
        available_badges = Badge.objects.filter(
            is_active=True,
            is_hidden=False
        ).exclude(id__in=earned_badge_ids)
        
        for badge in available_badges:
            if self.check_badge_requirements(badge):
                # Award badge
                user_badge = UserBadge.objects.create(
                    user=self.user,
                    badge=badge,
                    earned_data={
                        'level': self.profile.current_level,
                        'xp': self.profile.total_xp,
                        'streak': self.profile.current_streak,
                        'workouts': self.profile.total_workouts,
                        'challenges': self.profile.total_challenges_completed
                    }
                )
                
                new_badges.append({
                    'badge': badge,
                    'user_badge': user_badge
                })
                
                # Create achievement activity
                Activity.objects.create(
                    user=self.user,
                    activity_type='achievement_unlocked',
                    title=f'Badge Unlocked: {badge.name}',
                    description=f'You earned the {badge.rarity} badge: {badge.description}',
                    activity_data={
                        'badge_id': badge.id,
                        'badge_name': badge.name,
                        'badge_rarity': badge.rarity,
                        'badge_icon': badge.icon
                    }
                )
        
        return new_badges
    
    def check_badge_requirements(self, badge):
        """Check if user meets badge requirements"""
        # Basic requirements
        if badge.xp_required > 0 and self.profile.total_xp < badge.xp_required:
            return False
        
        if badge.level_required > 0 and self.profile.current_level < badge.level_required:
            return False
        
        if badge.streak_required > 0 and self.profile.current_streak < badge.streak_required:
            return False
        
        if badge.workouts_required > 0 and self.profile.total_workouts < badge.workouts_required:
            return False
        
        if badge.challenges_required > 0 and self.profile.total_challenges_completed < badge.challenges_required:
            return False
        
        # Special requirements
        if badge.special_requirements:
            return self.check_special_requirements(badge.special_requirements)
        
        return True
    
    def check_special_requirements(self, requirements):
        """Check special badge requirements"""
        for req_type, req_value in requirements.items():
            if req_type == 'consecutive_workouts':
                if not self.check_consecutive_workouts(req_value):
                    return False
            elif req_type == 'specific_exercise_pr':
                if not self.check_exercise_pr(req_value):
                    return False
            elif req_type == 'weight_loss_goal':
                if not self.check_weight_loss_goal(req_value):
                    return False
            # Add more special requirements as needed
        
        return True
    
    def check_consecutive_workouts(self, days):
        """Check if user has worked out for consecutive days"""
        # This would check workout history
        # For now, return True as a placeholder
        return True
    
    def check_exercise_pr(self, exercise_name):
        """Check if user has set a PR for specific exercise"""
        # This would check strength set history
        # For now, return True as a placeholder
        return True
    
    def check_weight_loss_goal(self, target_loss):
        """Check if user has achieved weight loss goal"""
        # This would check measurement history
        # For now, return True as a placeholder
        return True
    
    def update_daily_quests(self, activity_type, metadata=None):
        """Update progress on daily quests"""
        today = date.today()
        
        # Get today's quests for user
        user_quests = UserDailyQuest.objects.filter(
            user=self.user,
            date=today,
            is_completed=False
        )
        
        for user_quest in user_quests:
            quest = user_quest.quest
            
            # Check if this activity type matches the quest
            if quest.quest_type == activity_type:
                # Update progress
                if quest.quest_type == 'workout':
                    user_quest.progress += 1
                elif quest.quest_type == 'social':
                    user_quest.progress += 1
                elif quest.quest_type == 'challenge':
                    user_quest.progress += 1
                # Add more quest types as needed
                
                # Check if quest is completed
                if user_quest.progress >= user_quest.target:
                    user_quest.is_completed = True
                    user_quest.completed_at = timezone.now()
                    
                    # Award quest rewards
                    if quest.xp_reward > 0:
                        self.profile.add_xp(quest.xp_reward, 'daily_quest')
                        user_quest.xp_claimed = True
                    
                    if quest.badge_reward:
                        UserBadge.objects.get_or_create(
                            user=self.user,
                            badge=quest.badge_reward
                        )
                        user_quest.badge_claimed = True
                
                user_quest.save()
    
    def create_activity_record(self, activity_type, xp_gained, metadata=None):
        """Create activity record for social feed"""
        activity_titles = {
            'workout_completion': 'Workout Completed',
            'strength_pr': 'Personal Record Set',
            'challenge_completion': 'Challenge Completed',
            'achievement_unlock': 'Achievement Unlocked',
            'level_up': 'Level Up!',
        }
        
        activity_descriptions = {
            'workout_completion': f'Completed a workout and earned {xp_gained} XP!',
            'strength_pr': f'Set a new personal record and earned {xp_gained} XP!',
            'challenge_completion': f'Completed a challenge and earned {xp_gained} XP!',
            'achievement_unlock': f'Unlocked a new achievement and earned {xp_gained} XP!',
            'level_up': f'Leveled up and earned {xp_gained} XP!',
        }
        
        title = activity_titles.get(activity_type, 'Activity Completed')
        description = activity_descriptions.get(activity_type, f'Completed an activity and earned {xp_gained} XP!')
        
        Activity.objects.create(
            user=self.user,
            activity_type=activity_type,
            title=title,
            description=description,
            activity_data={
                'xp_gained': xp_gained,
                'level': self.profile.current_level,
                'streak': self.profile.current_streak,
                'metadata': metadata or {}
            }
        )
    
    def get_daily_quests(self, date_obj=None):
        """Get daily quests for a specific date"""
        if date_obj is None:
            date_obj = date.today()
        
        # Get or create daily quests for the user
        active_quests = DailyQuest.objects.filter(is_active=True)
        
        user_quests = []
        for quest in active_quests:
            user_quest, created = UserDailyQuest.objects.get_or_create(
                user=self.user,
                quest=quest,
                date=date_obj,
                defaults={
                    'target': 1,  # Default target, could be customized per quest
                    'progress': 0
                }
            )
            user_quests.append(user_quest)
        
        return user_quests
    
    def get_user_stats(self):
        """Get comprehensive user gamification stats"""
        return {
            'profile': self.profile,
            'level': self.profile.current_level,
            'xp': self.profile.total_xp,
            'xp_to_next_level': self.profile.xp_to_next_level,
            'level_progress': self.profile.level_progress_percentage,
            'current_streak': self.profile.current_streak,
            'longest_streak': self.profile.longest_streak,
            'total_workouts': self.profile.total_workouts,
            'total_challenges': self.profile.total_challenges_completed,
            'total_achievements': self.profile.total_achievements,
            'earned_badges': UserBadge.objects.filter(user=self.user).count(),
            'available_badges': Badge.objects.filter(is_active=True).count(),
            'daily_quests': self.get_daily_quests(),
        }


class BadgeManager:
    """Manager for creating and managing badges"""
    
    @staticmethod
    def create_default_badges():
        """Create default badges for the system"""
        default_badges = [
            # Strength Badges
            {
                'name': 'First Workout',
                'description': 'Complete your first workout',
                'icon': '💪',
                'category': 'strength',
                'rarity': 'common',
                'workouts_required': 1,
            },
            {
                'name': 'Strength Builder',
                'description': 'Complete 10 strength workouts',
                'icon': '🏋️',
                'category': 'strength',
                'rarity': 'uncommon',
                'workouts_required': 10,
            },
            {
                'name': 'Powerlifter',
                'description': 'Complete 50 strength workouts',
                'icon': '🏆',
                'category': 'strength',
                'rarity': 'rare',
                'workouts_required': 50,
            },
            
            # Consistency Badges
            {
                'name': 'Getting Started',
                'description': 'Work out for 3 consecutive days',
                'icon': '🔥',
                'category': 'consistency',
                'rarity': 'common',
                'streak_required': 3,
            },
            {
                'name': 'Week Warrior',
                'description': 'Work out for 7 consecutive days',
                'icon': '⚡',
                'category': 'consistency',
                'rarity': 'uncommon',
                'streak_required': 7,
            },
            {
                'name': 'Month Master',
                'description': 'Work out for 30 consecutive days',
                'icon': '👑',
                'category': 'consistency',
                'rarity': 'epic',
                'streak_required': 30,
            },
            
            # Social Badges
            {
                'name': 'Social Butterfly',
                'description': 'Make your first friend',
                'icon': '🦋',
                'category': 'social',
                'rarity': 'common',
                'special_requirements': {'friends_required': 1},
            },
            {
                'name': 'Challenge Master',
                'description': 'Complete 5 challenges',
                'icon': '🎯',
                'category': 'social',
                'rarity': 'uncommon',
                'challenges_required': 5,
            },
            
            # Milestone Badges
            {
                'name': 'Level 10',
                'description': 'Reach level 10',
                'icon': '🌟',
                'category': 'milestone',
                'rarity': 'uncommon',
                'level_required': 10,
            },
            {
                'name': 'Level 25',
                'description': 'Reach level 25',
                'icon': '💫',
                'category': 'milestone',
                'rarity': 'rare',
                'level_required': 25,
            },
            {
                'name': 'Level 50',
                'description': 'Reach level 50',
                'icon': '⭐',
                'category': 'milestone',
                'rarity': 'legendary',
                'level_required': 50,
            },
        ]
        
        created_badges = []
        for badge_data in default_badges:
            badge, created = Badge.objects.get_or_create(
                name=badge_data['name'],
                defaults=badge_data
            )
            if created:
                created_badges.append(badge)
        
        return created_badges


class QuestManager:
    """Manager for creating and managing daily quests"""
    
    @staticmethod
    def create_default_quests():
        """Create default daily quests"""
        default_quests = [
            {
                'name': 'Daily Workout',
                'description': 'Complete any workout today',
                'quest_type': 'workout',
                'xp_reward': 20,
                'difficulty': 'easy',
            },
            {
                'name': 'Social Butterfly',
                'description': 'Like 3 friend activities',
                'quest_type': 'social',
                'xp_reward': 15,
                'difficulty': 'easy',
            },
            {
                'name': 'Challenge Participant',
                'description': 'Join a new challenge',
                'quest_type': 'challenge',
                'xp_reward': 30,
                'difficulty': 'medium',
            },
            {
                'name': 'Streak Keeper',
                'description': 'Maintain your workout streak',
                'quest_type': 'streak',
                'xp_reward': 10,
                'difficulty': 'easy',
            },
        ]
        
        created_quests = []
        for quest_data in default_quests:
            quest, created = DailyQuest.objects.get_or_create(
                name=quest_data['name'],
                defaults=quest_data
            )
            if created:
                created_quests.append(quest)
        
        return created_quests
