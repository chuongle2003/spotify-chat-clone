"""
ASGI config for backend project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.1/howto/deployment/asgi/
"""

import os

# Đặt biến môi trường trước khi import các module khác
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
from urllib.parse import parse_qs


django_asgi_app = get_asgi_application()

def get_websocket_urlpatterns():
    from chat.routing import websocket_urlpatterns as chat_websocket_urlpatterns
    from ai_assistant.routing import websocket_urlpatterns as ai_websocket_urlpatterns
    
    all_patterns = []
    all_patterns.extend(chat_websocket_urlpatterns)
    all_patterns.extend(ai_websocket_urlpatterns)
    
    return all_patterns

from chat.middleware import TokenAuthMiddleware, ChatRestrictionMiddleware

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": TokenAuthMiddleware(
        ChatRestrictionMiddleware(
            AuthMiddlewareStack(
                URLRouter(
                    get_websocket_urlpatterns()
                )
            )
        )
    ),
})
