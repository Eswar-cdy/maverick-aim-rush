"""
Push Notification API Views for Maverick Aim Rush
Handles subscription management, preferences, and notification delivery
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
import json

from .models import PushSubscription, NotificationPreference, NotificationLog
from .notifications import NotificationManager, notification_triggers
from .notification_serializers import (
    PushSubscriptionSerializer, NotificationPreferenceSerializer,
    NotificationLogSerializer
)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def subscribe_push_notifications(request):
    """Subscribe user to push notifications"""
    try:
        data = request.data
        
        # Validate required fields
        required_fields = ['endpoint', 'p256dh_key', 'auth_key']
        for field in required_fields:
            if field not in data:
                return Response(
                    {'error': f'Missing required field: {field}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Get or create subscription
        subscription, created = PushSubscription.objects.get_or_create(
            user=request.user,
            endpoint=data['endpoint'],
            defaults={
                'p256dh_key': data['p256dh_key'],
                'auth_key': data['auth_key'],
                'user_agent': request.META.get('HTTP_USER_AGENT', ''),
                'device_type': data.get('device_type', 'desktop'),
                'is_active': True
            }
        )
        
        if not created:
            # Update existing subscription
            subscription.p256dh_key = data['p256dh_key']
            subscription.auth_key = data['auth_key']
            subscription.user_agent = request.META.get('HTTP_USER_AGENT', '')
            subscription.device_type = data.get('device_type', 'desktop')
            subscription.is_active = True
            subscription.save()
        
        # Create default notification preferences if they don't exist
        NotificationPreference.objects.get_or_create(
            user=request.user,
            defaults={
                'notifications_enabled': True,
                'push_notifications': True
            }
        )
        
        return Response({
            'message': 'Successfully subscribed to push notifications',
            'subscription_id': subscription.id,
            'created': created
        }, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': f'Failed to subscribe: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def unsubscribe_push_notifications(request):
    """Unsubscribe user from push notifications"""
    try:
        endpoint = request.data.get('endpoint')
        
        if not endpoint:
            return Response(
                {'error': 'Missing endpoint'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Deactivate subscription
        subscription = PushSubscription.objects.filter(
            user=request.user,
            endpoint=endpoint
        ).first()
        
        if subscription:
            subscription.is_active = False
            subscription.save()
            return Response({
                'message': 'Successfully unsubscribed from push notifications'
            })
        else:
            return Response(
                {'error': 'Subscription not found'},
                status=status.HTTP_404_NOT_FOUND
            )
            
    except Exception as e:
        return Response(
            {'error': f'Failed to unsubscribe: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def notification_preferences(request):
    """Get or update user's notification preferences"""
    try:
        if request.method == 'GET':
            # Get user's preferences
            preferences, created = NotificationPreference.objects.get_or_create(
                user=request.user,
                defaults={
                    'notifications_enabled': True,
                    'push_notifications': True
                }
            )
            
            serializer = NotificationPreferenceSerializer(preferences)
            return Response(serializer.data)
            
        elif request.method == 'PUT':
            # Update user's preferences
            preferences, created = NotificationPreference.objects.get_or_create(
                user=request.user
            )
            
            serializer = NotificationPreferenceSerializer(preferences, data=request.data)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
                
    except Exception as e:
        return Response(
            {'error': f'Failed to handle preferences: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def notification_history(request):
    """Get user's notification history"""
    try:
        # Get recent notifications
        notifications = NotificationLog.objects.filter(
            user=request.user
        ).order_by('-sent_at')[:50]  # Last 50 notifications
        
        serializer = NotificationLogSerializer(notifications, many=True)
        return Response(serializer.data)
        
    except Exception as e:
        return Response(
            {'error': f'Failed to get notification history: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def test_notification(request):
    """Send a test notification to the user"""
    try:
        notification_manager = NotificationManager()
        
        # Send test notification
        result = notification_manager.send_notification(
            user=request.user,
            notification_type='achievement_unlock',
            data={
                'badge_name': 'Test Badge',
                'badge_icon': '🧪',
                'badge_rarity': 'common'
            }
        )
        
        if result:
            return Response({
                'message': 'Test notification sent successfully'
            })
        else:
            return Response(
                {'error': 'Failed to send test notification'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            
    except Exception as e:
        return Response(
            {'error': f'Failed to send test notification: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def notification_stats(request):
    """Get user's notification statistics"""
    try:
        # Get notification counts
        total_notifications = NotificationLog.objects.filter(user=request.user).count()
        delivered_notifications = NotificationLog.objects.filter(
            user=request.user,
            status='delivered'
        ).count()
        clicked_notifications = NotificationLog.objects.filter(
            user=request.user,
            status='clicked'
        ).count()
        
        # Get active subscriptions
        active_subscriptions = PushSubscription.objects.filter(
            user=request.user,
            is_active=True
        ).count()
        
        # Get preferences
        preferences = NotificationPreference.objects.filter(user=request.user).first()
        
        stats = {
            'total_notifications': total_notifications,
            'delivered_notifications': delivered_notifications,
            'clicked_notifications': clicked_notifications,
            'delivery_rate': (delivered_notifications / total_notifications * 100) if total_notifications > 0 else 0,
            'click_rate': (clicked_notifications / delivered_notifications * 100) if delivered_notifications > 0 else 0,
            'active_subscriptions': active_subscriptions,
            'notifications_enabled': preferences.notifications_enabled if preferences else True,
            'push_notifications_enabled': preferences.push_notifications if preferences else True
        }
        
        return Response(stats)
        
    except Exception as e:
        return Response(
            {'error': f'Failed to get notification stats: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_notification_clicked(request):
    """Mark a notification as clicked"""
    try:
        notification_id = request.data.get('notification_id')
        
        if not notification_id:
            return Response(
                {'error': 'Missing notification_id'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update notification status
        notification = NotificationLog.objects.filter(
            id=notification_id,
            user=request.user
        ).first()
        
        if notification:
            notification.status = 'clicked'
            notification.clicked_at = timezone.now()
            notification.save()
            
            return Response({
                'message': 'Notification marked as clicked'
            })
        else:
            return Response(
                {'error': 'Notification not found'},
                status=status.HTTP_404_NOT_FOUND
            )
            
    except Exception as e:
        return Response(
            {'error': f'Failed to mark notification as clicked: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
def get_vapid_public_key(request):
    """Get VAPID public key for push notifications (public endpoint)"""
    try:
        from django.conf import settings
        
        vapid_public_key = getattr(settings, 'VAPID_PUBLIC_KEY', None)
        
        if vapid_public_key:
            return Response({
                'vapid_public_key': vapid_public_key
            })
        else:
            # Return empty string if not configured (graceful degradation)
            return Response({
                'vapid_public_key': ''
            })
            
    except Exception as e:
        return Response(
            {'vapid_public_key': ''},
            status=status.HTTP_200_OK
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def trigger_notification(request):
    """Manually trigger a notification (for testing)"""
    try:
        notification_type = request.data.get('type')
        data = request.data.get('data', {})
        
        if not notification_type:
            return Response(
                {'error': 'Missing notification type'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Trigger notification
        result = notification_triggers.send_notification(
            user=request.user,
            notification_type=notification_type,
            data=data
        )
        
        if result:
            return Response({
                'message': f'Notification triggered successfully: {notification_type}'
            })
        else:
            return Response(
                {'error': 'Failed to trigger notification'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            
    except Exception as e:
        return Response(
            {'error': f'Failed to trigger notification: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
