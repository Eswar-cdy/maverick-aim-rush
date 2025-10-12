# Social Features for Maverick Aim Rush
# Friends, challenges, leaderboards, and community features

import math
from datetime import date, timedelta, datetime
from typing import Dict, List, Any, Optional, Tuple
from django.contrib.auth.models import User
from django.db.models import Sum, Avg, Count, Max, Min, Q, F
from django.utils import timezone
from .models import (
    UserConnection, Challenge, ChallengeParticipation, Leaderboard, 
    LeaderboardEntry, Achievement, UserAchievement, WorkoutSession,
    StrengthSet, CardioEntry, NutritionLog, BodyMeasurement
)


class SocialFeatures:
    """Social features engine for community and competition."""
    
    def __init__(self, user: User):
        self.user = user
        self.today = date.today()
    
    # User Connections
    def send_friend_request(self, target_user: User, connection_type: str = 'friend') -> Dict[str, Any]:
        """Send a friend request to another user."""
        if target_user == self.user:
            return {'error': 'Cannot send request to yourself'}
        
        if UserConnection.objects.filter(
            follower=self.user,
            following=target_user
        ).exists():
            return {'error': 'Connection already exists'}
        
        connection = UserConnection.objects.create(
            follower=self.user,
            following=target_user,
            connection_type=connection_type
        )
        
        return {
            'success': True,
            'message': f'Friend request sent to {target_user.username}',
            'connection_id': connection.id
        }
    
    def accept_friend_request(self, connection_id: int) -> Dict[str, Any]:
        """Accept a friend request."""
        try:
            connection = UserConnection.objects.get(
                id=connection_id,
                following=self.user
            )
            connection.connection_type = 'friend'
            connection.save()
            
            return {
                'success': True,
                'message': f'Accepted friend request from {connection.follower.username}'
            }
        except UserConnection.DoesNotExist:
            return {'error': 'Friend request not found'}
    
    def get_friends(self) -> List[Dict[str, Any]]:
        """Get list of friends."""
        friends = UserConnection.objects.filter(
            follower=self.user,
            connection_type='friend'
        ).select_related('following')
        
        return [
            {
                'id': friend.id,
                'username': friend.following.username,
                'connected_since': friend.created_at,
                'can_view_workouts': friend.can_view_workouts,
                'can_view_progress': friend.can_view_progress,
                'can_view_nutrition': friend.can_view_nutrition
            }
            for friend in friends
        ]
    
    def get_friend_activity(self, friend_id: int, days: int = 7) -> Dict[str, Any]:
        """Get recent activity from a friend."""
        try:
            connection = UserConnection.objects.get(
                id=friend_id,
                follower=self.user
            )
            friend = connection.following
            
            if not connection.can_view_workouts:
                return {'error': 'No permission to view friend activity'}
            
            # Get recent workouts
            start_date = self.today - timedelta(days=days)
            recent_workouts = WorkoutSession.objects.filter(
                user=friend,
                date__gte=start_date
            ).order_by('-date')
            
            activity = {
                'friend_username': friend.username,
                'workouts': [
                    {
                        'date': workout.date,
                        'duration_minutes': workout.duration_minutes,
                        'exercises_count': workout.strength_sets.count(),
                        'total_volume': sum(
                            set_obj.weight_kg * set_obj.reps 
                            for set_obj in workout.strength_sets.all()
                        )
                    }
                    for workout in recent_workouts
                ],
                'total_workouts': recent_workouts.count(),
                'last_workout': recent_workouts.first().date if recent_workouts.exists() else None
            }
            
            return activity
            
        except UserConnection.DoesNotExist:
            return {'error': 'Friend not found'}
    
    # Challenges
    def create_challenge(self, challenge_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new fitness challenge."""
        challenge = Challenge.objects.create(
            name=challenge_data['name'],
            description=challenge_data['description'],
            challenge_type=challenge_data['challenge_type'],
            start_date=challenge_data['start_date'],
            end_date=challenge_data['end_date'],
            target_value=challenge_data['target_value'],
            target_unit=challenge_data['target_unit'],
            is_public=challenge_data.get('is_public', True),
            max_participants=challenge_data.get('max_participants'),
            entry_fee=challenge_data.get('entry_fee', 0),
            created_by=self.user
        )
        
        # Auto-join creator
        ChallengeParticipation.objects.create(
            user=self.user,
            challenge=challenge
        )
        
        return {
            'success': True,
            'challenge_id': challenge.id,
            'message': f'Challenge "{challenge.name}" created successfully'
        }
    
    def join_challenge(self, challenge_id: int) -> Dict[str, Any]:
        """Join an existing challenge."""
        try:
            challenge = Challenge.objects.get(id=challenge_id)
            
            # Check if challenge is still open
            if challenge.end_date < self.today:
                return {'error': 'Challenge has ended'}
            
            # Check if user already joined
            if ChallengeParticipation.objects.filter(
                user=self.user,
                challenge=challenge
            ).exists():
                return {'error': 'Already joined this challenge'}
            
            # Check participant limit
            if challenge.max_participants:
                current_participants = ChallengeParticipation.objects.filter(
                    challenge=challenge
                ).count()
                if current_participants >= challenge.max_participants:
                    return {'error': 'Challenge is full'}
            
            participation = ChallengeParticipation.objects.create(
                user=self.user,
                challenge=challenge
            )
            
            return {
                'success': True,
                'message': f'Joined challenge "{challenge.name}"',
                'participation_id': participation.id
            }
            
        except Challenge.DoesNotExist:
            return {'error': 'Challenge not found'}
    
    def get_available_challenges(self) -> List[Dict[str, Any]]:
        """Get list of available challenges."""
        challenges = Challenge.objects.filter(
            is_public=True,
            start_date__lte=self.today,
            end_date__gte=self.today
        ).exclude(
            participants__user=self.user
        ).order_by('-created_at')
        
        return [
            {
                'id': challenge.id,
                'name': challenge.name,
                'description': challenge.description,
                'challenge_type': challenge.challenge_type,
                'target_value': challenge.target_value,
                'target_unit': challenge.target_unit,
                'start_date': challenge.start_date,
                'end_date': challenge.end_date,
                'participants_count': challenge.participants.count(),
                'max_participants': challenge.max_participants,
                'entry_fee': challenge.entry_fee,
                'created_by': challenge.created_by.username
            }
            for challenge in challenges
        ]
    
    def get_my_challenges(self) -> List[Dict[str, Any]]:
        """Get challenges the user is participating in."""
        participations = ChallengeParticipation.objects.filter(
            user=self.user
        ).select_related('challenge').order_by('-joined_at')
        
        return [
            {
                'id': participation.id,
                'challenge_id': participation.challenge.id,
                'challenge_name': participation.challenge.name,
                'challenge_type': participation.challenge.challenge_type,
                'target_value': participation.challenge.target_value,
                'target_unit': participation.challenge.target_unit,
                'current_progress': participation.current_progress,
                'is_completed': participation.is_completed,
                'rank': participation.rank,
                'joined_at': participation.joined_at,
                'start_date': participation.challenge.start_date,
                'end_date': participation.challenge.end_date,
                'progress_percentage': min(100, (participation.current_progress / participation.challenge.target_value) * 100)
            }
            for participation in participations
        ]
    
    def update_challenge_progress(self, challenge_id: int) -> Dict[str, Any]:
        """Update progress for a specific challenge."""
        try:
            participation = ChallengeParticipation.objects.get(
                user=self.user,
                challenge_id=challenge_id
            )
            challenge = participation.challenge
            
            # Calculate progress based on challenge type
            progress = self._calculate_challenge_progress(challenge, participation)
            
            participation.current_progress = progress
            participation.save()
            
            # Update rankings
            self._update_challenge_rankings(challenge)
            
            return {
                'success': True,
                'current_progress': progress,
                'target_value': challenge.target_value,
                'progress_percentage': min(100, (progress / challenge.target_value) * 100)
            }
            
        except ChallengeParticipation.DoesNotExist:
            return {'error': 'Challenge participation not found'}
    
    def _calculate_challenge_progress(self, challenge: Challenge, participation: ChallengeParticipation) -> float:
        """Calculate progress for a specific challenge."""
        start_date = challenge.start_date
        end_date = min(challenge.end_date, self.today)
        
        if challenge.challenge_type == 'workout_frequency':
            return WorkoutSession.objects.filter(
                user=self.user,
                date__gte=start_date,
                date__lte=end_date
            ).count()
        
        elif challenge.challenge_type == 'weight_loss':
            # Get weight measurements
            measurements = BodyMeasurement.objects.filter(
                user=self.user,
                date__gte=start_date,
                date__lte=end_date
            ).order_by('date')
            
            if measurements.count() < 2:
                return 0
            
            start_weight = measurements.first().weight_kg
            end_weight = measurements.last().weight_kg
            
            if start_weight and end_weight:
                return max(0, start_weight - end_weight)
            return 0
        
        elif challenge.challenge_type == 'strength_gain':
            # Calculate total volume increase
            sessions = WorkoutSession.objects.filter(
                user=self.user,
                date__gte=start_date,
                date__lte=end_date
            )
            
            total_volume = 0
            for session in sessions:
                for set_obj in session.strength_sets.all():
                    total_volume += set_obj.weight_kg * set_obj.reps
            
            return total_volume
        
        elif challenge.challenge_type == 'distance':
            # Calculate total distance
            sessions = WorkoutSession.objects.filter(
                user=self.user,
                date__gte=start_date,
                date__lte=end_date
            )
            
            total_distance = 0
            for session in sessions:
                for cardio in session.cardio_entries.all():
                    if cardio.distance_km:
                        total_distance += cardio.distance_km
            
            return total_distance
        
        return 0
    
    def _update_challenge_rankings(self, challenge: Challenge):
        """Update rankings for a challenge."""
        participations = ChallengeParticipation.objects.filter(
            challenge=challenge
        ).order_by('-current_progress', 'joined_at')
        
        for rank, participation in enumerate(participations, 1):
            participation.rank = rank
            participation.final_score = participation.current_progress
            participation.save()
    
    # Leaderboards
    def get_leaderboard(self, leaderboard_id: int) -> Dict[str, Any]:
        """Get a specific leaderboard."""
        try:
            leaderboard = Leaderboard.objects.get(id=leaderboard_id)
            entries = LeaderboardEntry.objects.filter(
                leaderboard=leaderboard
            ).select_related('user').order_by('rank')[:50]
            
            return {
                'id': leaderboard.id,
                'name': leaderboard.name,
                'description': leaderboard.description,
                'metric_type': leaderboard.metric_type,
                'period_type': leaderboard.period_type,
                'entries': [
                    {
                        'rank': entry.rank,
                        'username': entry.user.username,
                        'score': entry.score,
                        'metadata': entry.metadata
                    }
                    for entry in entries
                ],
                'user_rank': self._get_user_rank_in_leaderboard(leaderboard)
            }
            
        except Leaderboard.DoesNotExist:
            return {'error': 'Leaderboard not found'}
    
    def get_available_leaderboards(self) -> List[Dict[str, Any]]:
        """Get list of available leaderboards."""
        leaderboards = Leaderboard.objects.filter(
            is_active=True,
            is_public=True
        ).order_by('-created_at')
        
        return [
            {
                'id': lb.id,
                'name': lb.name,
                'description': lb.description,
                'metric_type': lb.metric_type,
                'period_type': lb.period_type,
                'last_updated': lb.last_updated,
                'participants_count': lb.entries.count()
            }
            for lb in leaderboards
        ]
    
    def _get_user_rank_in_leaderboard(self, leaderboard: Leaderboard) -> Optional[Dict[str, Any]]:
        """Get user's rank in a specific leaderboard."""
        try:
            entry = LeaderboardEntry.objects.get(
                leaderboard=leaderboard,
                user=self.user
            )
            return {
                'rank': entry.rank,
                'score': entry.score,
                'metadata': entry.metadata
            }
        except LeaderboardEntry.DoesNotExist:
            return None
    
    def create_leaderboard(self, leaderboard_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new leaderboard."""
        leaderboard = Leaderboard.objects.create(
            name=leaderboard_data['name'],
            description=leaderboard_data['description'],
            metric_type=leaderboard_data['metric_type'],
            period_type=leaderboard_data['period_type'],
            is_public=leaderboard_data.get('is_public', True),
            auto_update=leaderboard_data.get('auto_update', True)
        )
        
        return {
            'success': True,
            'leaderboard_id': leaderboard.id,
            'message': f'Leaderboard "{leaderboard.name}" created successfully'
        }
    
    def update_leaderboard(self, leaderboard_id: int) -> Dict[str, Any]:
        """Update leaderboard entries."""
        try:
            leaderboard = Leaderboard.objects.get(id=leaderboard_id)
            
            # Calculate period dates
            period_start, period_end = self._get_period_dates(leaderboard.period_type)
            
            # Get all users who have data for this metric
            users_with_data = self._get_users_with_metric_data(
                leaderboard.metric_type,
                period_start,
                period_end
            )
            
            # Calculate scores and create entries
            entries_data = []
            for user, score, metadata in users_with_data:
                entry, created = LeaderboardEntry.objects.update_or_create(
                    leaderboard=leaderboard,
                    user=user,
                    period_start=period_start,
                    defaults={
                        'score': score,
                        'metadata': metadata,
                        'period_end': period_end
                    }
                )
                entries_data.append((user, score))
            
            # Update rankings
            entries = LeaderboardEntry.objects.filter(
                leaderboard=leaderboard,
                period_start=period_start
            ).order_by('-score', 'created_at')
            
            for rank, entry in enumerate(entries, 1):
                entry.rank = rank
                entry.save()
            
            leaderboard.last_updated = timezone.now()
            leaderboard.save()
            
            return {
                'success': True,
                'entries_updated': len(entries_data),
                'message': f'Leaderboard "{leaderboard.name}" updated successfully'
            }
            
        except Leaderboard.DoesNotExist:
            return {'error': 'Leaderboard not found'}
    
    def _get_period_dates(self, period_type: str) -> Tuple[date, date]:
        """Get start and end dates for a period type."""
        today = self.today
        
        if period_type == 'daily':
            return today, today
        elif period_type == 'weekly':
            week_start = today - timedelta(days=today.weekday())
            return week_start, week_start + timedelta(days=6)
        elif period_type == 'monthly':
            month_start = today.replace(day=1)
            if month_start.month == 12:
                month_end = month_start.replace(year=month_start.year + 1, month=1) - timedelta(days=1)
            else:
                month_end = month_start.replace(month=month_start.month + 1) - timedelta(days=1)
            return month_start, month_end
        elif period_type == 'yearly':
            year_start = today.replace(month=1, day=1)
            year_end = today.replace(month=12, day=31)
            return year_start, year_end
        else:  # all_time
            return date(2020, 1, 1), today
    
    def _get_users_with_metric_data(self, metric_type: str, start_date: date, end_date: date) -> List[Tuple[User, float, Dict]]:
        """Get users with data for a specific metric."""
        users_data = []
        
        if metric_type == 'total_volume':
            # Get users with workout sessions in the period
            sessions = WorkoutSession.objects.filter(
                date__gte=start_date,
                date__lte=end_date
            ).select_related('user')
            
            user_volumes = {}
            for session in sessions:
                user = session.user
                if user not in user_volumes:
                    user_volumes[user] = 0
                
                for set_obj in session.strength_sets.all():
                    user_volumes[user] += set_obj.weight_kg * set_obj.reps
            
            for user, volume in user_volumes.items():
                users_data.append((user, volume, {'total_sets': 0}))
        
        elif metric_type == 'workout_streak':
            # This would require streak calculation for each user
            # Simplified version
            from .analytics import AdvancedAnalytics
            
            all_users = User.objects.all()
            for user in all_users:
                analytics = AdvancedAnalytics(user)
                streak_data = analytics.update_workout_streak()
                users_data.append((user, streak_data['current_streak'], {}))
        
        elif metric_type == 'consistency':
            # Calculate consistency for each user
            all_users = User.objects.all()
            for user in all_users:
                sessions = WorkoutSession.objects.filter(
                    user=user,
                    date__gte=start_date,
                    date__lte=end_date
                )
                
                if sessions.exists():
                    total_days = (end_date - start_date).days + 1
                    workout_days = sessions.values('date').distinct().count()
                    consistency = (workout_days / total_days) * 100
                    users_data.append((user, consistency, {'workout_days': workout_days}))
        
        return users_data
    
    # Achievements
    def get_user_achievements(self) -> Dict[str, Any]:
        """Get user's achievements."""
        user_achievements = UserAchievement.objects.filter(
            user=self.user,
            is_displayed=True
        ).select_related('achievement').order_by('-earned_at')
        
        return {
            'total_achievements': user_achievements.count(),
            'achievements': [
                {
                    'id': ua.id,
                    'name': ua.achievement.name,
                    'description': ua.achievement.description,
                    'icon': ua.achievement.icon,
                    'rarity': ua.achievement.rarity,
                    'points_value': ua.achievement.points_value,
                    'earned_at': ua.earned_at,
                    'is_featured': ua.is_featured
                }
                for ua in user_achievements
            ]
        }
    
    def get_achievement_progress(self, achievement_id: int) -> Dict[str, Any]:
        """Get progress toward a specific achievement."""
        try:
            achievement = Achievement.objects.get(id=achievement_id)
            
            # Calculate current progress
            progress = self._calculate_achievement_progress(achievement)
            
            return {
                'achievement': {
                    'id': achievement.id,
                    'name': achievement.name,
                    'description': achievement.description,
                    'required_value': achievement.required_value,
                    'required_unit': achievement.required_unit
                },
                'current_progress': progress,
                'progress_percentage': min(100, (progress / achievement.required_value) * 100),
                'is_completed': progress >= achievement.required_value
            }
            
        except Achievement.DoesNotExist:
            return {'error': 'Achievement not found'}
    
    def _calculate_achievement_progress(self, achievement: Achievement) -> float:
        """Calculate progress toward an achievement."""
        if achievement.achievement_type == 'workout_count':
            return WorkoutSession.objects.filter(user=self.user).count()
        
        elif achievement.achievement_type == 'streak':
            from .analytics import AdvancedAnalytics
            analytics = AdvancedAnalytics(self.user)
            streak_data = analytics.update_workout_streak()
            return streak_data['current_streak']
        
        elif achievement.achievement_type == 'weight_loss':
            measurements = BodyMeasurement.objects.filter(
                user=self.user
            ).order_by('date')
            
            if measurements.count() < 2:
                return 0
            
            start_weight = measurements.first().weight_kg
            end_weight = measurements.last().weight_kg
            
            if start_weight and end_weight:
                return max(0, start_weight - end_weight)
            return 0
        
        elif achievement.achievement_type == 'strength_gain':
            # Calculate total volume
            sessions = WorkoutSession.objects.filter(user=self.user)
            total_volume = 0
            
            for session in sessions:
                for set_obj in session.strength_sets.all():
                    total_volume += set_obj.weight_kg * set_obj.reps
            
            return total_volume
        
        return 0
    
    def get_community_stats(self) -> Dict[str, Any]:
        """Get community statistics."""
        total_users = User.objects.count()
        total_workouts = WorkoutSession.objects.count()
        total_challenges = Challenge.objects.filter(is_public=True).count()
        active_challenges = Challenge.objects.filter(
            is_public=True,
            start_date__lte=self.today,
            end_date__gte=self.today
        ).count()
        
        return {
            'total_users': total_users,
            'total_workouts': total_workouts,
            'total_challenges': total_challenges,
            'active_challenges': active_challenges,
            'community_activity': {
                'workouts_today': WorkoutSession.objects.filter(date=self.today).count(),
                'new_users_this_week': User.objects.filter(
                    date_joined__gte=self.today - timedelta(days=7)
                ).count()
            }
        }
