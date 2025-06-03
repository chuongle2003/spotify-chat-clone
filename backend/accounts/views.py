from django.shortcuts import render, get_object_or_404
from rest_framework import viewsets, status, permissions, generics, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.core.exceptions import ValidationError
from .models import User, PasswordResetToken, UserConnection
from .serializers import UserSerializer, UserRegistrationSerializer, PublicUserSerializer, AdminUserSerializer, CompleteUserSerializer, CustomTokenObtainPairSerializer, AdminUserCreateSerializer, ForgotPasswordSerializer, VerifyPasswordResetTokenSerializer, UserConnectionSerializer
from rest_framework.views import APIView
from .permissions import IsAdminUser, IsOwnerOrReadOnly, ReadOnly
import logging
from rest_framework_simplejwt.views import TokenObtainPairView
from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.utils import timezone
from django.db.models import Q
from django.core.cache import cache

logger = logging.getLogger(__name__)

# Create your views here.

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    
    def get_permissions(self):
        if self.action == 'create':
            return [permissions.AllowAny()]
        elif self.action in ['update', 'partial_update', 'destroy']:
            return [IsOwnerOrReadOnly()]
        elif self.action == 'list':
            return [IsAdminUser()]
        return [permissions.IsAuthenticated()]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return UserRegistrationSerializer
        return UserSerializer
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def follow(self, request, pk=None):
        user_to_follow = self.get_object()
        user = request.user
        
        if user_to_follow == user:
            return Response({'error': 'You cannot follow yourself'}, status=status.HTTP_400_BAD_REQUEST)
        
        user.following.add(user_to_follow)
        return Response({'status': 'Successfully followed user'}, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['post'])
    def unfollow(self, request, pk=None):
        user_to_unfollow = self.get_object()
        user = request.user
        
        user.following.remove(user_to_unfollow)
        return Response({'status': 'Successfully unfollowed user'}, status=status.HTTP_200_OK)

class AdminViewSet(viewsets.ModelViewSet):

    queryset = User.objects.all()
    serializer_class = AdminUserSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [filters.SearchFilter]
    search_fields = ['username', 'email', 'first_name', 'last_name']
    authentication_classes = [JWTAuthentication]  # Đảm bảo chỉ sử dụng JWT, không phải session auth
    
    def get_serializer_class(self):
        if self.action == 'create':
            return AdminUserCreateSerializer
        return AdminUserSerializer
    
    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
            
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def complete(self, request, pk=None):
        user = self.get_object()
        serializer = CompleteUserSerializer(user)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        user = self.get_object()
        user.is_active = not user.is_active
        user.save()
        
        action = "activated" if user.is_active else "deactivated"
        logger.info(f"User {user.username} {action} by {request.user.username}")
        
        return Response({'status': f'User {action}'})
    
    @action(detail=True, methods=['post'])
    def toggle_admin(self, request, pk=None):
        user = self.get_object()
        user.is_admin = not user.is_admin
        user.save()
        
        action = "granted admin access" if user.is_admin else "removed admin access"
        logger.info(f"User {user.username} {action} by {request.user.username}")
        
        return Response({'status': f'User {action}'})
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        logger.info(f"New user {user.username} created by admin {request.user.username}")
        
        return Response(
            AdminUserSerializer(user, context=self.get_serializer_context()).data,
            status=status.HTTP_201_CREATED
        )
    
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        logger.info(f"User {user.username} updated by admin {request.user.username}")
        
        return Response(serializer.data)
    
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        username = instance.username
        
        if instance == request.user:
            return Response(
                {"error": "You cannot delete your own account"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        self.perform_destroy(instance)
        
        logger.info(f"User {username} deleted by admin {request.user.username}")
        
        return Response(status=status.HTTP_204_NO_CONTENT)


class PublicUserListView(generics.ListAPIView):
    queryset = User.objects.all()
    serializer_class = PublicUserSerializer
    permission_classes = [AllowAny]

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        return Response(
            UserSerializer(user, context=self.get_serializer_context()).data,
            status=status.HTTP_201_CREATED
        )

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if not refresh_token:
                return Response(
                    {"error": "Refresh token is required"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            try:
                token = RefreshToken(refresh_token)
                if token.payload.get('user_id') != request.user.id:
                    raise ValidationError("Token does not belong to current user")
                
                token.blacklist()
                
                logger.info(f"User {request.user.username} logged out successfully")
                
                return Response(
                    {"message": "Successfully logged out"},
                    status=status.HTTP_200_OK
                )
            except TokenError as te:

                logger.error(f"Invalid refresh token provided by user {request.user.username}: {str(te)}")
                return Response(
                    {"error": "Invalid or expired refresh token"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            except ValidationError as ve:
                logger.error(f"Token validation error for user {request.user.username}: {str(ve)}")
                return Response(
                    {"error": str(ve)},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        except Exception as e:
            logger.error(f"Logout error for user {request.user.username}: {str(e)}")
            return Response(
                {"error": "An unexpected error occurred"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

class ForgotPasswordView(generics.CreateAPIView):
    permission_classes = [AllowAny]
    serializer_class = ForgotPasswordSerializer
    
    def create(self, request, *args, **kwargs):
        try:
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            
            email = serializer.validated_data.get('email')
            try:
                user = User.objects.get(email=email)
                
                token_obj = PasswordResetToken.generate_token(user)
                
                logger.info(f"Generated reset token for {user.email}: {token_obj.token}")
                return Response(
                    {
                        'message': 'Mã xác nhận đã được gửi đến email của bạn.',
                        'debug_info': f'Token: {token_obj.token} (Hãy sử dụng mã này trong môi trường production vì chức năng gửi email có thể không hoạt động trên EC2)'
                    },
                    status=status.HTTP_200_OK
                )
                
                """
                try:
                    subject = 'Yêu cầu đặt lại mật khẩu'
                    
                    # Tạo nội dung email
                    html_message = f\"""
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>Đặt lại mật khẩu</title>
                        <style>
                            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }}
                            .container {{ padding: 20px; border: 1px solid #ddd; border-radius: 5px; }}
                            .header {{ background-color: #1DB954; padding: 15px; color: white; text-align: center; border-radius: 5px 5px 0 0; }}
                            .content {{ padding: 20px; }}
                            .token {{ font-size: 28px; font-weight: bold; text-align: center; padding: 15px; margin: 20px 0; background-color: #f5f5f5; border-radius: 5px; letter-spacing: 5px; }}
                            .footer {{ text-align: center; margin-top: 20px; font-size: 12px; color: #777; }}
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="header">
                                <h1>Spotify Chat</h1>
                            </div>
                            <div class="content">
                                <h2>Yêu cầu đặt lại mật khẩu</h2>
                                <p>Xin chào,</p>
                                <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn tại Spotify Chat.</p>
                                <p>Mã xác nhận của bạn là:</p>
                                <div class="token">{token_obj.token}</div>
                                <p>Mã này sẽ hết hạn sau 15 phút.</p>
                                <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này hoặc liên hệ với bộ phận hỗ trợ của chúng tôi ngay lập tức.</p>
                                <p>Trân trọng,<br>Đội ngũ Spotify Chat</p>
                            </div>
                            <div class="footer">
                                <p>Email này được gửi tự động, vui lòng không trả lời.</p>
                                <p>&copy; {timezone.now().year} Spotify Chat. All rights reserved.</p>
                            </div>
                        </div>
                    </body>
                    </html>
                    \"""
                    
                    plain_message = strip_tags(html_message)
                    from_email = settings.DEFAULT_FROM_EMAIL
                    to_email = [user.email]
                    
                    send_mail(
                        subject=subject,
                        message=plain_message,
                        from_email=from_email,
                        recipient_list=to_email,
                        html_message=html_message,
                        fail_silently=False
                    )
                    logger.info(f"Password reset email sent to {user.email}")
                    return Response(
                        {'message': 'Mã xác nhận đã được gửi đến email của bạn.'},
                        status=status.HTTP_200_OK
                    )
                except Exception as e:
                    # Log chi tiết lỗi để debug
                    logger.error(f"Error sending email to {user.email}: {str(e)}", exc_info=True)
                    
                    # Trong môi trường development, trả về token khi gặp lỗi gửi email
                    if settings.DEBUG:
                        return Response(
                            {
                                'message': f'Gặp lỗi khi gửi email, nhưng đây là token của bạn (chỉ cho development): {token_obj.token}',
                                'error_detail': str(e)
                            },
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR
                        )
                    
                    return Response(
                        {'error': 'Không thể gửi email. Vui lòng thử lại sau hoặc liên hệ bộ phận hỗ trợ.'},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR
                    )
                """
                    
            except User.DoesNotExist:
                logger.info(f"Password reset attempted for non-existent email: {email}")
                return Response(
                    {'message': 'Nếu email tồn tại trong hệ thống, mã xác nhận đã được gửi đến email của bạn.'},
                    status=status.HTTP_200_OK
                )
        except Exception as e:
            logger.error(f"Unexpected error in forgot password view: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Đã xảy ra lỗi. Vui lòng thử lại sau.', 'debug_info': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class VerifyPasswordResetTokenView(generics.CreateAPIView):
    permission_classes = [AllowAny]
    serializer_class = VerifyPasswordResetTokenSerializer
    
    def create(self, request, *args, **kwargs):
        try:
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            
            email = serializer.validated_data.get('email')
            token = serializer.validated_data.get('token')
            new_password = serializer.validated_data.get('new_password')
            
            try:
                user = User.objects.get(email=email)
                
                token_obj = PasswordResetToken.verify_token(user, token)
                
                if not token_obj:
                    self._increase_failed_attempts(user)
                    return Response(
                        {'error': 'Mã xác nhận không hợp lệ hoặc đã hết hạn.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                if self._is_account_locked(user):
                    token_obj.is_used = True
                    token_obj.save()
                    
                    return Response(
                        {'error': 'Tài khoản tạm thời bị khóa do quá nhiều lần thử không thành công. Vui lòng thử lại sau.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                token_obj.is_used = True
                token_obj.save()
                
                user.set_password(new_password)
                user.save()
                
                cache_key = f"pwd_reset_attempts_{user.id}"
                cache.delete(cache_key)

                
                logger.info(f"Password reset successful for {user.email}")
                
                return Response(
                    {'message': 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập với mật khẩu mới.'},
                    status=status.HTTP_200_OK
                )
                
            except User.DoesNotExist:
                logger.warning(f"Password reset verification attempted for non-existent email: {email}")
                return Response(
                    {'error': 'Thông tin xác thực không hợp lệ.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        except Exception as e:
            logger.error(f"Error in reset password view: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Đã xảy ra lỗi. Vui lòng thử lại sau.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _increase_failed_attempts(self, user):
        cache_key = f"pwd_reset_attempts_{user.id}"
        attempts = cache.get(cache_key, 0)
        attempts += 1
        cache.set(cache_key, attempts, timeout=1800)
        logger.warning(f"Failed password reset attempt {attempts} for user {user.email}")
    
    def _is_account_locked(self, user):
        cache_key = f"pwd_reset_attempts_{user.id}"
        attempts = cache.get(cache_key, 0)
        return attempts >= 5

# API lấy danh sách người dùng đang theo dõi
class UserFollowingListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = PublicUserSerializer

    def get_queryset(self):
        return self.request.user.following.all()

# API lấy danh sách người theo dõi người dùng
class UserFollowersListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = PublicUserSerializer

    def get_queryset(self):
        return self.request.user.followers.all()

# API theo dõi người dùng
class FollowUserView(generics.CreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = PublicUserSerializer
    
    def create(self, request, *args, **kwargs):
        user_id = kwargs.get('user_id')
        try:
            user_to_follow = User.objects.get(id=user_id)
            
            if user_to_follow == request.user:
                return Response(
                    {"error": "Bạn không thể tự theo dõi chính mình"},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            request.user.following.add(user_to_follow)
            return Response(
                {"success": f"Đã theo dõi người dùng {user_to_follow.username}"},
                status=status.HTTP_200_OK
            )
        except User.DoesNotExist:
            return Response(
                {"error": "Người dùng không tồn tại"},
                status=status.HTTP_404_NOT_FOUND
            )

# API hủy theo dõi người dùng
class UnfollowUserView(generics.CreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = PublicUserSerializer
    
    def create(self, request, *args, **kwargs):
        user_id = kwargs.get('user_id')
        try:
            user_to_unfollow = User.objects.get(id=user_id)
            
            if user_to_unfollow not in request.user.following.all():
                return Response(
                    {"error": "Bạn chưa theo dõi người dùng này"},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            request.user.following.remove(user_to_unfollow)
            return Response(
                {"success": f"Đã hủy theo dõi người dùng {user_to_unfollow.username}"},
                status=status.HTTP_200_OK
            )
        except User.DoesNotExist:
            return Response(
                {"error": "Người dùng không tồn tại"},
                status=status.HTTP_404_NOT_FOUND
            )

# API tìm kiếm người dùng
class UserSearchView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = PublicUserSerializer
    
    def get_queryset(self):
        query = self.request.query_params.get('q', '')
        if not query:
            return User.objects.none()
        
        return User.objects.filter(
            Q(username__icontains=query) | 
            Q(first_name__icontains=query) | 
            Q(last_name__icontains=query)
        ).exclude(id=self.request.user.id)

# API gợi ý người dùng dựa trên sở thích âm nhạc
class UserRecommendationView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = PublicUserSerializer
    
    def get_queryset(self):
        user = self.request.user
        
        favorite_genres = set()
        for song in user.favorite_songs.all():
            if song.genre:
                favorite_genres.add(song.genre)
        
        similar_users = User.objects.exclude(id=user.id)
        
        if not favorite_genres:
            return similar_users.order_by('?')[:10]
        
        user_scores = []
        for other_user in similar_users:
            score = 0
            common_favorites = user.favorite_songs.filter(
                id__in=other_user.favorite_songs.values_list('id', flat=True)
            ).count()
            score += common_favorites * 3  # Trọng số cao cho bài hát yêu thích chung
            
            for song in other_user.favorite_songs.all():
                if song.genre and song.genre in favorite_genres:
                    score += 1
            
            user_scores.append((other_user, score))
        
        user_scores.sort(key=lambda x: x[1], reverse=True)
        recommended_users = [user for user, score in user_scores[:10]]
        
        return recommended_users

# API danh sách tất cả người dùng
class UserListView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        users = User.objects.exclude(id=request.user.id)
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data)

# API đề xuất người dùng
class UserSuggestionsView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        current_user = request.user
        
        connections = UserConnection.objects.filter(
            (Q(requester=current_user) | Q(receiver=current_user)),
            status='ACCEPTED'
        )
        
        connected_ids = set()
        for conn in connections:
            if conn.requester_id == current_user.id:
                connected_ids.add(conn.receiver_id)
            else:
                connected_ids.add(conn.requester_id)
        
        suggested_users = User.objects.exclude(
            Q(id__in=connected_ids) | Q(id=current_user.id)
        ).order_by('?')[:10]  # Lấy 10 người ngẫu nhiên
        
        serializer = UserSerializer(suggested_users, many=True)
        return Response(serializer.data)

# API gửi yêu cầu kết nối
class ConnectionRequestView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, user_id):
        if user_id == request.user.id:
            return Response(
                {"error": "Không thể kết nối với chính mình"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        receiver = get_object_or_404(User, id=user_id)
        
        existing_connection = UserConnection.get_connection(request.user, receiver)
        
        if existing_connection:
            if existing_connection.status == 'PENDING':
                return Response(
                    {"error": "Đã có yêu cầu kết nối đang chờ xử lý"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            elif existing_connection.status == 'ACCEPTED':
                return Response(
                    {"error": "Đã kết nối với người dùng này rồi"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            elif existing_connection.status == 'BLOCKED':
                return Response(
                    {"error": "Không thể gửi yêu cầu kết nối đến người dùng này"}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            else:
                existing_connection.delete()
        
        connection = UserConnection.objects.create(
            requester=request.user,
            receiver=receiver,
            status='PENDING'
        )
        
        serializer = UserConnectionSerializer(connection)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

# API chấp nhận yêu cầu kết nối
class AcceptConnectionView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, connection_id):
        connection = get_object_or_404(
            UserConnection, 
            id=connection_id, 
            receiver=request.user,
            status='PENDING'
        )
        
        connection.status = 'ACCEPTED'
        connection.save()
        
        serializer = UserConnectionSerializer(connection)
        return Response(serializer.data)

# API từ chối yêu cầu kết nối
class DeclineConnectionView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, connection_id):
        connection = get_object_or_404(
            UserConnection, 
            id=connection_id, 
            receiver=request.user,
            status='PENDING'
        )
        
        connection.status = 'DECLINED'
        connection.save()
        
        serializer = UserConnectionSerializer(connection)
        return Response(serializer.data)

# API hủy kết nối
class RemoveConnectionView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, user_id):
        other_user = get_object_or_404(User, id=user_id)
        
        connection = UserConnection.get_connection(request.user, other_user)
        
        if not connection or connection.status != 'ACCEPTED':
            return Response(
                {"error": "Không có kết nối với người dùng này"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Xóa kết nối
        connection.delete()
        
        return Response({"message": "Đã hủy kết nối thành công"})

# API chặn người dùng
class BlockUserView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, user_id):
        user_to_block = get_object_or_404(User, id=user_id)
        
        connection = UserConnection.get_connection(request.user, user_to_block)
        
        if connection:
            connection.status = 'BLOCKED'
            if connection.receiver == request.user:
                connection.requester, connection.receiver = connection.receiver, connection.requester
            connection.save()
        else:
            connection = UserConnection.objects.create(
                requester=request.user,
                receiver=user_to_block,
                status='BLOCKED'
            )
        
        serializer = UserConnectionSerializer(connection)
        return Response(serializer.data)

# API danh sách yêu cầu kết nối đang chờ
class PendingConnectionsView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        pending_connections = UserConnection.objects.filter(
            receiver=request.user,
            status='PENDING'
        )
        
        serializer = UserConnectionSerializer(pending_connections, many=True)
        return Response(serializer.data)

# API danh sách người dùng đã kết nối (có thể chat)
class ConnectedUsersView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        connections = UserConnection.objects.filter(
            (Q(requester=request.user) | Q(receiver=request.user)),
            status='ACCEPTED'
        )
        
        connected_users = []
        for conn in connections:
            if conn.requester == request.user:
                connected_users.append(conn.receiver)
            else:
                connected_users.append(conn.requester)
        
        serializer = UserSerializer(connected_users, many=True)
        return Response(serializer.data)

class CanChatWithUserView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, username):
        try:
            other_user = User.objects.get(username=username)
            can_chat = UserConnection.are_connected(request.user, other_user)
            
            return Response({
                "can_chat": can_chat,
                "user_id": other_user.id,
                "username": other_user.username
            })
        except User.DoesNotExist:
            return Response(
                {"error": "Không tìm thấy người dùng"}, 
                status=status.HTTP_404_NOT_FOUND
            )
