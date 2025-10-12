"""
ASGI routing configuration for Maverick Aim Rush.

This module contains the ASGI routing configuration for WebSocket connections.
"""

from django.urls import re_path
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack

# Import your consumers here when you create them
# from tracker.consumers import NotificationConsumer, SocialConsumer

application = ProtocolTypeRouter({
    # WebSocket chat handler
    "websocket": AuthMiddlewareStack(
        URLRouter([
            # Add your WebSocket routes here
            # re_path(r"ws/notifications/$", NotificationConsumer.as_asgi()),
            # re_path(r"ws/social/$", SocialConsumer.as_asgi()),
        ])
    ),
})
