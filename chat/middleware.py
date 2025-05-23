import json
from django.utils import timezone
from django.contrib.auth import get_user_model
from channels.db import database_sync_to_async
from .models import ChatRestriction
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import AccessToken, UntypedToken
from channels.middleware import BaseMiddleware
from django.contrib.auth.models import AnonymousUser
from urllib.parse import parse_qs
import jwt
from django.conf import settings

User = get_user_model()

class ChatRestrictionMiddleware:
    """
    Middleware để kiểm tra xem người dùng có bị hạn chế tính năng chat không
    Áp dụng cho kết nối WebSocket
    """
    
    def __init__(self, inner):
        self.inner = inner
        
    async def __call__(self, scope, receive, send):
        # Chỉ kiểm tra cho các kết nối WebSocket, bỏ qua các loại khác
        if scope["type"] != "websocket":
            return await self.inner(scope, receive, send)
            
        # Lấy thông tin người dùng từ scope
        user = scope.get("user", None)
        if not user or not user.is_authenticated:
            # Cho phép kết nối đi qua, nhưng consumer sẽ xử lý việc từ chối sau đó
            return await self.inner(scope, receive, send)
            
        # Kiểm tra xem người dùng có bị hạn chế không
        is_restricted = await self.check_user_restriction(user)
        if is_restricted:
            # Đóng kết nối WebSocket nếu người dùng bị hạn chế
            await send({
                "type": "websocket.close",
                "code": 4000,  # Mã tùy chỉnh cho biết người dùng bị hạn chế
                "reason": "Tính năng chat của bạn đã bị hạn chế bởi quản trị viên"
            })
            return
            
        # Người dùng không bị hạn chế, cho phép kết nối đi tiếp
        return await self.inner(scope, receive, send)
    
    @database_sync_to_async
    def check_user_restriction(self, user):
        """Kiểm tra xem người dùng có bị hạn chế chat không"""
        
        # Admin luôn được phép chat
        if user.is_admin:
            return False
            
        # Kiểm tra các hạn chế đang hoạt động
        active_restrictions = ChatRestriction.objects.filter(
            user=user,
            is_active=True
        )
        
        now = timezone.now()
        for restriction in active_restrictions:
            # Nếu là hạn chế vĩnh viễn hoặc chưa hết hạn
            if restriction.restriction_type == 'PERMANENT' or (restriction.expires_at and restriction.expires_at > now):
                return True
                
            # Nếu đã hết hạn, cập nhật trạng thái
            if restriction.expires_at and restriction.expires_at <= now:
                restriction.is_active = False
                restriction.save(update_fields=['is_active'])
                
        return False
        
def get_user_from_token(token):
    """Hàm tiện ích để lấy thông tin người dùng từ token"""
    try:
        # Đầu tiên thử với AccessToken
        token_obj = AccessToken(token)
        user_id = token_obj['user_id']
        return User.objects.get(id=user_id)
    except (TokenError, User.DoesNotExist):
        try:
            # Thử với UntypedToken
            token_obj = UntypedToken(token)
            user_id = token_obj['user_id']
            return User.objects.get(id=user_id)
        except (TokenError, User.DoesNotExist):
            return None

class TokenAuthMiddleware(BaseMiddleware):
    """
    Middleware xác thực JWT token từ query parameter
    """
    async def __call__(self, scope, receive, send):
        # Chỉ xử lý kết nối WebSocket, bỏ qua các loại khác
        if scope["type"] != "websocket":
            return await self.inner(scope, receive, send)

        # Trích xuất token từ query string
        query_string = scope.get("query_string", b"").decode()
        query_params = parse_qs(query_string)
        token = query_params.get("token", [None])[0]
        
        # Nếu không có token trong query parameter, đặt người dùng là AnonymousUser
        if not token:
            scope["user"] = AnonymousUser()
            return await self.inner(scope, receive, send)
        
        # Nếu có token, xác thực và lấy thông tin người dùng
        try:
            # Thử xác thực token
            user = await self.get_user_from_token(token)
            scope["user"] = user if user else AnonymousUser()
        except Exception:
            # Nếu có lỗi, đặt người dùng là AnonymousUser
            scope["user"] = AnonymousUser()
        
        return await self.inner(scope, receive, send)
    
    @database_sync_to_async
    def get_user_from_token(self, token):
        """Lấy user từ token"""
        return get_user_from_token(token) 