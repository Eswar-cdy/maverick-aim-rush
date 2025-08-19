from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from django.contrib.auth import get_user_model

User = get_user_model()

@database_sync_to_async
def get_user(token_key):
    try:
        # Validate the token
        access_token = AccessToken(token_key)
        # Get the user ID from the token
        user_id = access_token['user_id']
        # Get the user object
        return User.objects.get(id=user_id)
    except (InvalidToken, TokenError, User.DoesNotExist):
        # Token is invalid or user does not exist
        return AnonymousUser()

class TokenAuthMiddleware:
    def __init__(self, inner):
        self.inner = inner

    async def __call__(self, scope, receive, send):
        # Look for a 'token' query string parameter
        query_string = scope.get("query_string", b"").decode("utf-8")
        params = dict(qp.split('=') for qp in query_string.split('&'))
        token = params.get("token")

        if token:
            # If a token is present, try to authenticate the user
            scope['user'] = await get_user(token)
        else:
            # If no token, the user is anonymous
            scope['user'] = AnonymousUser()
        
        return await self.inner(scope, receive, send)
