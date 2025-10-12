"""
Gamification API Views for Maverick Aim Rush
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import date
from .models import GamificationProfile, Badge, UserBadge, DailyQuest, UserDailyQuest, StreakBonus
from .gamification import GamificationEngine, BadgeManager, QuestManager
from .gamification_serializers import (
    UserProfileSerializer, BadgeSerializer, UserBadgeSerializer,
    DailyQuestSerializer, UserDailyQuestSerializer, StreakBonusSerializer
)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def gamification_dashboard(request):
    """Get user's gamification dashboard data"""
    try:
        engine = GamificationEngine(request.user)
        stats = engine.get_user_stats()
        
        # Get recent activities
        from .models import Activity
        recent_activities = Activity.objects.filter(
            user=request.user
        ).order_by('-created_at')[:10]
        
        # Get leaderboard position
        total_users = GamificationProfile.objects.count()
        user_rank = GamificationProfile.objects.filter(
            total_xp__gt=stats['profile'].total_xp
        ).count() + 1
        
        return Response({
            'profile': UserProfileSerializer(stats['profile']).data,
            'stats': {
                'level': stats['level'],
                'xp': stats['xp'],
                'xp_to_next_level': stats['xp_to_next_level'],
                'level_progress': stats['level_progress'],
                'current_streak': stats['current_streak'],
                'longest_streak': stats['longest_streak'],
                'total_workouts': stats['total_workouts'],
                'total_challenges': stats['total_challenges'],
                'total_achievements': stats['total_achievements'],
                'earned_badges': stats['earned_badges'],
                'available_badges': stats['available_badges'],
                'rank': user_rank,
                'total_users': total_users,
            },
            'daily_quests': UserDailyQuestSerializer(stats['daily_quests'], many=True).data,
            'recent_activities': [
                {
                    'id': activity.id,
                    'type': activity.activity_type,
                    'title': activity.title,
                    'description': activity.description,
                    'created_at': activity.created_at.isoformat(),
                    'data': activity.activity_data
                }
                for activity in recent_activities
            ]
        })
    
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_badges(request):
    """Get user's earned badges"""
    try:
        earned_badges = UserBadge.objects.filter(user=request.user).order_by('-earned_at')
        available_badges = Badge.objects.filter(is_active=True).exclude(
            id__in=earned_badges.values_list('badge_id', flat=True)
        )
        
        return Response({
            'earned_badges': UserBadgeSerializer(earned_badges, many=True).data,
            'available_badges': BadgeSerializer(available_badges, many=True).data,
            'total_earned': earned_badges.count(),
            'total_available': available_badges.count()
        })
    
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def daily_quests(request):
    """Get user's daily quests"""
    try:
        quest_date = request.GET.get('date', date.today().isoformat())
        quest_date = date.fromisoformat(quest_date)
        
        engine = GamificationEngine(request.user)
        user_quests = engine.get_daily_quests(quest_date)
        
        return Response({
            'date': quest_date.isoformat(),
            'quests': UserDailyQuestSerializer(user_quests, many=True).data,
            'completed_count': sum(1 for q in user_quests if q.is_completed),
            'total_count': len(user_quests)
        })
    
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def award_xp(request):
    """Award XP to user (for testing or manual awards)"""
    try:
        activity_type = request.data.get('activity_type')
        amount = request.data.get('amount')
        metadata = request.data.get('metadata', {})
        
        if not activity_type:
            return Response(
                {'error': 'activity_type is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        engine = GamificationEngine(request.user)
        result = engine.award_xp(activity_type, amount, metadata)
        
        return Response({
            'success': True,
            'result': result
        })
    
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def leaderboard(request):
    """Get gamification leaderboard"""
    try:
        leaderboard_type = request.GET.get('type', 'xp')  # xp, level, streak
        limit = int(request.GET.get('limit', 10))
        
        if leaderboard_type == 'xp':
            profiles = GamificationProfile.objects.order_by('-total_xp')[:limit]
        elif leaderboard_type == 'level':
            profiles = GamificationProfile.objects.order_by('-current_level', '-total_xp')[:limit]
        elif leaderboard_type == 'streak':
            profiles = GamificationProfile.objects.order_by('-current_streak')[:limit]
        else:
            return Response(
                {'error': 'Invalid leaderboard type'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        leaderboard_data = []
        for i, profile in enumerate(profiles, 1):
            leaderboard_data.append({
                'rank': i,
                'username': profile.user.username,
                'level': profile.current_level,
                'xp': profile.total_xp,
                'streak': profile.current_streak,
                'total_workouts': profile.total_workouts,
                'total_achievements': profile.total_achievements,
            })
        
        # Get user's position
        user_profile = GamificationProfile.objects.get(user=request.user)
        if leaderboard_type == 'xp':
            user_rank = GamificationProfile.objects.filter(total_xp__gt=user_profile.total_xp).count() + 1
        elif leaderboard_type == 'level':
            user_rank = GamificationProfile.objects.filter(
                current_level__gt=user_profile.current_level
            ).count() + 1
        else:  # streak
            user_rank = GamificationProfile.objects.filter(
                current_streak__gt=user_profile.current_streak
            ).count() + 1
        
        return Response({
            'type': leaderboard_type,
            'leaderboard': leaderboard_data,
            'user_rank': user_rank,
            'user_stats': {
                'level': user_profile.current_level,
                'xp': user_profile.total_xp,
                'streak': user_profile.current_streak,
            }
        })
    
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def streak_bonuses(request):
    """Get available streak bonuses"""
    try:
        bonuses = StreakBonus.objects.filter(is_active=True).order_by('streak_days')
        
        return Response({
            'bonuses': StreakBonusSerializer(bonuses, many=True).data,
            'current_streak': GamificationProfile.objects.get(user=request.user).current_streak
        })
    
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def complete_quest(request):
    """Manually complete a daily quest (for testing)"""
    try:
        quest_id = request.data.get('quest_id')
        if not quest_id:
            return Response(
                {'error': 'quest_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            quest = DailyQuest.objects.get(id=quest_id)
        except DailyQuest.DoesNotExist:
            return Response(
                {'error': 'Quest not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        today = date.today()
        user_quest, created = UserDailyQuest.objects.get_or_create(
            user=request.user,
            quest=quest,
            date=today,
            defaults={'target': 1, 'progress': 0}
        )
        
        # Complete the quest
        user_quest.progress = user_quest.target
        user_quest.is_completed = True
        user_quest.completed_at = timezone.now()
        
        # Award rewards
        engine = GamificationEngine(request.user)
        if quest.xp_reward > 0:
            engine.award_xp('daily_quest', quest.xp_reward)
            user_quest.xp_claimed = True
        
        if quest.badge_reward:
            UserBadge.objects.get_or_create(
                user=request.user,
                badge=quest.badge_reward
            )
            user_quest.badge_claimed = True
        
        user_quest.save()
        
        return Response({
            'success': True,
            'quest': UserDailyQuestSerializer(user_quest).data,
            'xp_gained': quest.xp_reward
        })
    
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def initialize_gamification(request):
    """Initialize gamification system with default badges and quests"""
    try:
        # Create default badges
        created_badges = BadgeManager.create_default_badges()
        
        # Create default quests
        created_quests = QuestManager.create_default_quests()
        
        # Create default streak bonuses
        default_bonuses = [
            {'streak_days': 3, 'xp_multiplier': 1.1, 'bonus_xp': 5, 'description': '3-day streak bonus'},
            {'streak_days': 7, 'xp_multiplier': 1.2, 'bonus_xp': 10, 'description': '1-week streak bonus'},
            {'streak_days': 14, 'xp_multiplier': 1.3, 'bonus_xp': 20, 'description': '2-week streak bonus'},
            {'streak_days': 30, 'xp_multiplier': 1.5, 'bonus_xp': 50, 'description': '1-month streak bonus'},
        ]
        
        created_bonuses = []
        for bonus_data in default_bonuses:
            bonus, created = StreakBonus.objects.get_or_create(
                streak_days=bonus_data['streak_days'],
                defaults=bonus_data
            )
            if created:
                created_bonuses.append(bonus)
        
        return Response({
            'success': True,
            'created_badges': len(created_badges),
            'created_quests': len(created_quests),
            'created_bonuses': len(created_bonuses),
            'message': 'Gamification system initialized successfully'
        })
    
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
