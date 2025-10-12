"""
WebSocket JWT Authentication Middleware for Django Channels
"""
import json
import jwt
from django.conf import settings
from django.contrib.auth.models import AnonymousUser
from channels.middleware import BaseMiddleware
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model

User = get_user_model()


class JWTAuthMiddleware(BaseMiddleware):
    """
    JWT authentication middleware for WebSocket connections.
    Extracts JWT from httpOnly cookies or query string and authenticates the user.
    """
    
    def __init__(self, inner):
        super().__init__(inner)
    
    async def __call__(self, scope, receive, send):
        # Extract JWT token from cookies or query string
        token = self._extract_token(scope)
        user = AnonymousUser()
        
        if token:
            try:
                # Decode and verify JWT
                payload = jwt.decode(
                    token,
                    settings.SIMPLE_JWT['SIGNING_KEY'],
                    algorithms=[settings.SIMPLE_JWT['ALGORITHM']]
                )
                user_id = payload.get('user_id')
                if user_id:
                    user = await self._get_user(user_id)
            except (jwt.ExpiredSignatureError, jwt.InvalidTokenError, jwt.DecodeError):
                # Invalid token, keep as anonymous
                pass
        
        # Add user to scope
        scope['user'] = user
        
        # Continue to the next middleware/consumer
        return await super().__call__(scope, receive, send)
    
    def _extract_token(self, scope):
        """Extract JWT token from httpOnly cookies or query string."""
        # Try httpOnly cookies first (preferred method)
        cookies = scope.get('cookies', {})
        access_token = cookies.get('access_token')
        if access_token:
            return access_token
        
        # Try query string (for WebSocket connections)
        query_string = scope.get('query_string', b'').decode()
        if query_string:
            from urllib.parse import parse_qs
            query_params = parse_qs(query_string)
            token = query_params.get('token', [None])[0]
            if token:
                return token
        
        return None
    
    @database_sync_to_async
    def _get_user(self, user_id):
        """Get user by ID from database."""
        try:
            return User.objects.get(id=user_id)
        except User.DoesNotExist:
            return AnonymousUser()


# For backward compatibility
JWTAuthMiddlewareInstance = JWTAuthMiddleware