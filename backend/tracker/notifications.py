"""
Push Notifications System for Maverick Aim Rush
Handles notification creation, delivery, and user preferences
"""

from django.contrib.auth.models import User
from django.utils import timezone
from django.conf import settings
from datetime import datetime, timedelta
import json
from .models import GamificationProfile, Activity, UserBadge, UserDailyQuest


class NotificationManager:
    """Manages push notifications for the application"""
    
    # Notification types and their templates
    NOTIFICATION_TYPES = {
        'friend_request': {
            'title': 'New Friend Request',
            'body': '{username} wants to be your friend!',
            'icon': '/MAR/Images/favicon.png',
            'badge': '/MAR/Images/favicon.png',
            'actions': [
                {'action': 'accept', 'title': 'Accept'},
                {'action': 'decline', 'title': 'Decline'}
            ]
        },
        'friend_activity': {
            'title': 'Friend Activity',
            'body': '{username} completed a workout!',
            'icon': '/MAR/Images/favicon.png',
            'badge': '/MAR/Images/favicon.png',
            'actions': [
                {'action': 'view', 'title': 'View Activity'},
                {'action': 'cheer', 'title': 'Cheer'}
            ]
        },
        'challenge_invite': {
            'title': 'Challenge Invitation',
            'body': 'You\'ve been invited to join {challenge_name}',
            'icon': '/MAR/Images/favicon.png',
            'badge': '/MAR/Images/favicon.png',
            'actions': [
                {'action': 'join', 'title': 'Join Challenge'},
                {'action': 'view', 'title': 'View Details'}
            ]
        },
        'challenge_update': {
            'title': 'Challenge Update',
            'body': 'Progress update for {challenge_name}',
            'icon': '/MAR/Images/favicon.png',
            'badge': '/MAR/Images/favicon.png',
            'actions': [
                {'action': 'view', 'title': 'View Progress'},
                {'action': 'compete', 'title': 'Compete'}
            ]
        },
        'achievement_unlock': {
            'title': 'Achievement Unlocked!',
            'body': 'You earned the {badge_name} badge!',
            'icon': '/MAR/Images/favicon.png',
            'badge': '/MAR/Images/favicon.png',
            'actions': [
                {'action': 'view', 'title': 'View Badge'},
                {'action': 'share', 'title': 'Share'}
            ]
        },
        'level_up': {
            'title': 'Level Up!',
            'body': 'Congratulations! You reached level {new_level}!',
            'icon': '/MAR/Images/favicon.png',
            'badge': '/MAR/Images/favicon.png',
            'actions': [
                {'action': 'view', 'title': 'View Profile'},
                {'action': 'share', 'title': 'Share Achievement'}
            ]
        },
        'streak_reminder': {
            'title': 'Keep Your Streak!',
            'body': 'Don\'t break your {days}-day streak!',
            'icon': '/MAR/Images/favicon.png',
            'badge': '/MAR/Images/favicon.png',
            'actions': [
                {'action': 'workout', 'title': 'Start Workout'},
                {'action': 'remind_later', 'title': 'Remind Later'}
            ]
        },
        'daily_quest': {
            'title': 'Daily Quest Available',
            'body': 'New quest: {quest_name}',
            'icon': '/MAR/Images/favicon.png',
            'badge': '/MAR/Images/favicon.png',
            'actions': [
                {'action': 'view', 'title': 'View Quest'},
                {'action': 'start', 'title': 'Start Now'}
            ]
        },
        'leaderboard_change': {
            'title': 'Leaderboard Update',
            'body': 'You moved to #{rank} on the leaderboard!',
            'icon': '/MAR/Images/favicon.png',
            'badge': '/MAR/Images/favicon.png',
            'actions': [
                {'action': 'view', 'title': 'View Leaderboard'},
                {'action': 'compete', 'title': 'Compete More'}
            ]
        },
        'social_interaction': {
            'title': 'Social Activity',
            'body': '{username} {action} your {activity_type}',
            'icon': '/MAR/Images/favicon.png',
            'badge': '/MAR/Images/favicon.png',
            'actions': [
                {'action': 'view', 'title': 'View Activity'},
                {'action': 'respond', 'title': 'Respond'}
            ]
        }
    }
    
    def __init__(self):
        self.vapid_public_key = getattr(settings, 'VAPID_PUBLIC_KEY', None)
        self.vapid_private_key = getattr(settings, 'VAPID_PRIVATE_KEY', None)
        self.vapid_claims = getattr(settings, 'VAPID_CLAIMS', {
            "sub": "mailto:admin@maverickaimrush.com"
        })
    
    def send_notification(self, user, notification_type, data=None, delay=None):
        """Send a push notification to a user"""
        try:
            # Check if user has notifications enabled
            if not self.user_notifications_enabled(user):
                return False
            
            # Get notification template
            template = self.NOTIFICATION_TYPES.get(notification_type)
            if not template:
                return False
            
            # Format notification content
            notification_data = self.format_notification(template, data or {})
            
            # Add user-specific data
            notification_data['data'] = {
                'user_id': user.id,
                'notification_type': notification_type,
                'timestamp': timezone.now().isoformat(),
                **(data or {})
            }
            
            # Send notification
            return self.deliver_notification(user, notification_data, delay)
            
        except Exception as e:
            print(f"Error sending notification: {e}")
            return False
    
    def format_notification(self, template, data):
        """Format notification template with data"""
        formatted = template.copy()
        
        # Format title and body with data
        formatted['title'] = formatted['title'].format(**data)
        formatted['body'] = formatted['body'].format(**data)
        
        return formatted
    
    def deliver_notification(self, user, notification_data, delay=None):
        """Deliver notification to user's devices"""
        try:
            # Get user's push subscriptions
            subscriptions = self.get_user_subscriptions(user)
            if not subscriptions:
                return False
            
            # Send to each subscription
            results = []
            for subscription in subscriptions:
                result = self.send_to_subscription(subscription, notification_data, delay)
                results.append(result)
            
            return any(results)
            
        except Exception as e:
            print(f"Error delivering notification: {e}")
            return False
    
    def send_to_subscription(self, subscription, notification_data, delay=None):
        """Send notification to a specific subscription"""
        try:
            # This would integrate with a push service like Firebase or OneSignal
            # For now, we'll simulate the notification
            
            # In a real implementation, you would:
            # 1. Use pywebpush or similar library
            # 2. Send to Firebase Cloud Messaging
            # 3. Use OneSignal API
            
            print(f"Sending notification to subscription: {subscription.id}")
            print(f"Notification data: {notification_data}")
            
            # Simulate successful delivery
            return True
            
        except Exception as e:
            print(f"Error sending to subscription: {e}")
            return False
    
    def get_user_subscriptions(self, user):
        """Get user's push notification subscriptions"""
        # This would query a PushSubscription model
        # For now, return empty list
        return []
    
    def user_notifications_enabled(self, user):
        """Check if user has notifications enabled"""
        # This would check user preferences
        # For now, return True for all users
        return True
    
    def schedule_notification(self, user, notification_type, data, send_time):
        """Schedule a notification for later delivery"""
        # This would store in a database for later processing
        # For now, just log it
        print(f"Scheduling notification for {user.username} at {send_time}")
        return True
    
    def send_bulk_notifications(self, users, notification_type, data):
        """Send notifications to multiple users"""
        results = []
        for user in users:
            result = self.send_notification(user, notification_type, data)
            results.append(result)
        return results


class SmartNotificationScheduler:
    """Intelligent notification scheduling based on user behavior"""
    
    def __init__(self):
        self.notification_manager = NotificationManager()
    
    def get_optimal_send_time(self, user):
        """Get optimal time to send notifications to user"""
        # Analyze user's activity patterns
        # For now, return current time + 1 hour
        return timezone.now() + timedelta(hours=1)
    
    def should_send_notification(self, user, notification_type):
        """Determine if notification should be sent based on user preferences and behavior"""
        # Check user's notification preferences
        # Check if user is active
        # Check notification frequency limits
        
        # For now, always send
        return True
    
    def send_smart_notification(self, user, notification_type, data):
        """Send notification at optimal time"""
        if not self.should_send_notification(user, notification_type):
            return False
        
        optimal_time = self.get_optimal_send_time(user)
        
        if optimal_time <= timezone.now():
            # Send immediately
            return self.notification_manager.send_notification(user, notification_type, data)
        else:
            # Schedule for later
            return self.notification_manager.schedule_notification(user, notification_type, data, optimal_time)


class NotificationTriggers:
    """Triggers for automatic notifications"""
    
    def __init__(self):
        self.notification_manager = NotificationManager()
        self.scheduler = SmartNotificationScheduler()
    
    def on_friend_request(self, from_user, to_user):
        """Trigger when friend request is sent"""
        data = {
            'username': from_user.username,
            'from_user_id': from_user.id
        }
        return self.scheduler.send_smart_notification(
            to_user, 'friend_request', data
        )
    
    def on_friend_activity(self, user, activity):
        """Trigger when friend completes activity"""
        # Get user's friends
        friends = self.get_user_friends(user)
        
        data = {
            'username': user.username,
            'activity_type': activity.activity_type,
            'activity_id': activity.id
        }
        
        # Send to all friends
        return self.notification_manager.send_bulk_notifications(
            friends, 'friend_activity', data
        )
    
    def on_challenge_invite(self, challenge, invited_users):
        """Trigger when users are invited to challenge"""
        data = {
            'challenge_name': challenge.name,
            'challenge_id': challenge.id
        }
        
        return self.notification_manager.send_bulk_notifications(
            invited_users, 'challenge_invite', data
        )
    
    def on_achievement_unlock(self, user, badge):
        """Trigger when user unlocks achievement"""
        data = {
            'badge_name': badge.name,
            'badge_icon': badge.icon,
            'badge_rarity': badge.rarity
        }
        
        return self.scheduler.send_smart_notification(
            user, 'achievement_unlock', data
        )
    
    def on_level_up(self, user, old_level, new_level):
        """Trigger when user levels up"""
        data = {
            'old_level': old_level,
            'new_level': new_level,
            'user_level': new_level
        }
        
        return self.scheduler.send_smart_notification(
            user, 'level_up', data
        )
    
    def on_streak_reminder(self, user, days):
        """Trigger streak reminder"""
        data = {
            'days': days,
            'streak_type': 'workout'
        }
        
        return self.scheduler.send_smart_notification(
            user, 'streak_reminder', data
        )
    
    def on_daily_quest_available(self, user, quest):
        """Trigger when daily quest becomes available"""
        data = {
            'quest_name': quest.name,
            'quest_description': quest.description,
            'quest_xp': quest.xp_reward
        }
        
        return self.scheduler.send_smart_notification(
            user, 'daily_quest', data
        )
    
    def on_leaderboard_change(self, user, old_rank, new_rank):
        """Trigger when user's leaderboard position changes"""
        data = {
            'old_rank': old_rank,
            'rank': new_rank,
            'leaderboard_type': 'xp'
        }
        
        return self.scheduler.send_smart_notification(
            user, 'leaderboard_change', data
        )
    
    def on_social_interaction(self, user, actor, action, activity):
        """Trigger when someone interacts with user's activity"""
        data = {
            'username': actor.username,
            'action': action,  # 'liked', 'commented', 'shared'
            'activity_type': activity.activity_type,
            'activity_id': activity.id
        }
        
        return self.scheduler.send_smart_notification(
            user, 'social_interaction', data
        )
    
    def get_user_friends(self, user):
        """Get user's friends list"""
        # This would query the UserConnection model
        # For now, return empty list
        return []


# Global notification triggers instance
notification_triggers = NotificationTriggers()
