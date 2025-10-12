"""
Custom JWT authentication views that set tokens as httpOnly cookies
"""
import secrets
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings


class CookieTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Custom serializer that doesn't return tokens in response body."""
    
    def validate(self, attrs):
        data = super().validate(attrs)
        # Remove tokens from response data - they'll be set as cookies
        data.pop('access', None)
        data.pop('refresh', None)
        return data


class CookieTokenObtainPairView(TokenObtainPairView):
    """Custom JWT token view that sets tokens as httpOnly cookies."""
    
    serializer_class = CookieTokenObtainPairSerializer
    
    def post(self, request, *args, **kwargs):
        # Get the original serializer to extract tokens
        serializer = TokenObtainPairSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Create response with user data (no tokens in body)
        response = Response({
            'user': {
                'id': serializer.user.id,
                'username': serializer.user.username,
                'email': getattr(serializer.user, 'email', ''),
            },
            'message': 'Login successful'
        }, status=status.HTTP_200_OK)
        
        # Set httpOnly cookies
        response.set_cookie(
            'access_token',
            serializer.validated_data['access'],
            max_age=60 * 60 * 24,  # 24 hours
            httponly=True,
            secure=settings.SESSION_COOKIE_SECURE,
            samesite='Lax'
        )
        
        response.set_cookie(
            'refresh_token',
            serializer.validated_data['refresh'],
            max_age=60 * 60 * 24 * 7,  # 7 days
            httponly=True,
            secure=settings.SESSION_COOKIE_SECURE,
            samesite='Lax'
        )
        
        # Set CSRF token for double-submit pattern
        if settings.MAR_FLAGS.get("csrf_protection", True):
            csrf_token = secrets.token_urlsafe(24)
            response.set_cookie(
                'csrf_token',
                csrf_token,
                max_age=60 * 60 * 24,  # 24 hours
                httponly=False,  # Must be accessible to JavaScript
                secure=settings.SESSION_COOKIE_SECURE,
                samesite='Lax'
            )
            response.data['csrf_token'] = csrf_token
        
        return response
