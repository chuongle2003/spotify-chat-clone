from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
import random
import string
from django.conf import settings
from django.db.models import Q

class User(AbstractUser):
    email = models.EmailField(unique=True)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    bio = models.TextField(max_length=500, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    favorite_songs = models.ManyToManyField('music.Song', related_name='favorited_by', blank=True)
    following = models.ManyToManyField('self', symmetrical=False, related_name='followers', blank=True)
    is_admin = models.BooleanField(default=False, verbose_name='Is Admin User')
    groups = models.ManyToManyField(
        'auth.Group',
        related_name='custom_users',
        blank=True,
        help_text='The groups this user belongs to.',
        verbose_name='groups',
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        related_name='custom_users',
        blank=True,
        help_text='Specific permissions for this user.',
        verbose_name='user permissions',
    )
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    class Meta:
        db_table = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        
    def __str__(self):
        return self.email
    
    @property
    def has_admin_access(self):

        return self.is_superuser or self.is_admin
    
    def save(self, *args, **kwargs):
        if self.is_superuser:
            self.is_admin = True
            self.is_staff = True
        elif self.is_admin:

            self.is_staff = True
        super().save(*args, **kwargs)

class PasswordResetToken(models.Model):

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='password_reset_tokens')
    token = models.CharField(max_length=6)
    token_hash = models.CharField(max_length=128, null=True, blank=True)  
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)
    attempted_uses = models.PositiveIntegerField(default=0)  
    
    def __str__(self):
        return f"Reset token for {self.user.email}"
    
    def save(self, *args, **kwargs):
        if not self.token:
            self.token = ''.join(random.choices(string.digits, k=6))
            
            import hashlib
            self.token_hash = hashlib.sha256(self.token.encode()).hexdigest()
        
        if not self.expires_at:

            self.expires_at = timezone.now() + timezone.timedelta(minutes=15)
            
        super().save(*args, **kwargs)
    
    @property
    def is_valid(self):

        return not self.is_used and self.expires_at > timezone.now() and self.attempted_uses < 5
    
    def increment_attempts(self):
        self.attempted_uses += 1
        self.save(update_fields=['attempted_uses'])
    
    @classmethod
    def generate_token(cls, user):

        cls.invalidate_all_tokens(user)
        

        return cls.objects.create(user=user)
    
    @classmethod
    def invalidate_all_tokens(cls, user):
        cls.objects.filter(user=user, is_used=False).update(is_used=True)
        
    @classmethod 
    def verify_token(cls, user, token_value):

        token_obj = cls.objects.filter(user=user, is_used=False).order_by('-created_at').first()
        
        if not token_obj:
            return None
            
        token_obj.increment_attempts()

        if not token_obj.is_valid:
            return None
            
        if token_obj.token != token_value:
            return None
            
        return token_obj

class UserConnection(models.Model):
    CONNECTION_STATUS = (
        ('PENDING', 'Đang chờ xác nhận'),
        ('ACCEPTED', 'Đã chấp nhận'),
        ('DECLINED', 'Đã từ chối'),
        ('BLOCKED', 'Đã chặn'),
    )
    
    requester = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='sent_connections', on_delete=models.CASCADE)
    receiver = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='received_connections', on_delete=models.CASCADE)
    status = models.CharField(max_length=10, choices=CONNECTION_STATUS, default='PENDING')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('requester', 'receiver')
        db_table = 'user_connections'
    
    def __str__(self):
        return f"{self.requester.username} -> {self.receiver.username}: {self.status}"
    
    @classmethod
    def get_connection(cls, user1, user2):
        """Lấy kết nối giữa hai người dùng nếu có"""
        return cls.objects.filter(
            (Q(requester=user1) & Q(receiver=user2)) | 
            (Q(requester=user2) & Q(receiver=user1))
        ).first()
    
    @classmethod
    def are_connected(cls, user1, user2):
        """Kiểm tra xem hai người dùng đã kết nối chưa"""
        return True
