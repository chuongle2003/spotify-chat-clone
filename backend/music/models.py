from django.db import models
from django.conf import settings
from django.utils import timezone

User = settings.AUTH_USER_MODEL

class Song(models.Model):
    title = models.CharField(max_length=200)
    artist = models.CharField(max_length=200)
    album = models.CharField(max_length=200, blank=True)
    duration = models.IntegerField()  # seconds
    audio_file = models.FileField(upload_to='songs/%Y/%m/%d/')
    cover_image = models.ImageField(upload_to='covers/%Y/%m/%d/', null=True, blank=True)
    genre = models.CharField(max_length=100, blank=True)
    likes_count = models.IntegerField(default=0)
    play_count = models.IntegerField(default=0)
    uploaded_by = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    lyrics = models.TextField(blank=True)
    release_date = models.DateField(null=True, blank=True)
    is_approved = models.BooleanField(default=True, help_text="Đánh dấu bài hát đã được phê duyệt")
    
    class Meta:
        db_table = 'songs'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} - {self.artist}"

class Playlist(models.Model):
    name = models.CharField(max_length=200)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='playlists')
    songs = models.ManyToManyField(Song, related_name='playlists')
    description = models.TextField(blank=True)
    is_public = models.BooleanField(default=True)
    cover_image = models.ImageField(upload_to='playlist_covers/', null=True, blank=True)
    followers = models.ManyToManyField(User, related_name='followed_playlists', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    is_collaborative = models.BooleanField(default=False, help_text="Playlist có thể được chỉnh sửa bởi nhiều người cộng tác")
    collaborators = models.ManyToManyField(User, through='CollaboratorRole', related_name='collaborative_playlists', through_fields=('playlist', 'user'))

    class Meta:
        db_table = 'playlists'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} by {self.user.username}"

    def can_access(self, user):
        if self.is_public:
            return True
        return user == self.user or (self.is_collaborative and user in self.collaborators.all())
    
    def can_edit(self, user):
        """Kiểm tra xem người dùng có quyền chỉnh sửa playlist không"""
        if user == self.user:
            return True
        
        if user.is_admin:
            return True
        
        if self.is_collaborative:
            try:
                role = CollaboratorRole.objects.get(playlist=self, user=user)
                return role.can_edit
            except CollaboratorRole.DoesNotExist:
                return False
                
        return False

class CollaboratorRole(models.Model):
    """Model để lưu trữ vai trò của người cộng tác trong playlist"""
    ROLE_CHOICES = (
        ('EDITOR', 'Người chỉnh sửa'),
        ('VIEWER', 'Người xem'),
    )
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='playlist_roles')
    playlist = models.ForeignKey(Playlist, on_delete=models.CASCADE, related_name='role_assignments')
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='VIEWER')
    added_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='added_collaborators')
    added_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'playlist_collaborator_roles'
        unique_together = ('user', 'playlist')
        
    def __str__(self):
        return f"{self.user.username} as {self.role} on {self.playlist.name}"
        
    @property
    def can_edit(self):
        """Kiểm tra xem vai trò có quyền chỉnh sửa không"""
        return self.role == 'EDITOR'

class PlaylistEditHistory(models.Model):
    """Lưu lịch sử chỉnh sửa của playlist"""
    ACTION_TYPES = (
        ('CREATE', 'Tạo mới'),
        ('UPDATE_INFO', 'Cập nhật thông tin'),
        ('ADD_SONG', 'Thêm bài hát'),
        ('REMOVE_SONG', 'Xóa bài hát'),
        ('ADD_COLLABORATOR', 'Thêm cộng tác viên'),
        ('REMOVE_COLLABORATOR', 'Xóa cộng tác viên'),
        ('CHANGE_ROLE', 'Thay đổi vai trò'),
        ('RESTORE', 'Khôi phục'),
    )
    
    playlist = models.ForeignKey(Playlist, on_delete=models.CASCADE, related_name='edit_history')
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='playlist_edits')
    action = models.CharField(max_length=20, choices=ACTION_TYPES)
    timestamp = models.DateTimeField(auto_now_add=True)
    details = models.JSONField(default=dict, help_text="Chi tiết về hành động chỉnh sửa")
    
    related_song = models.ForeignKey(Song, on_delete=models.SET_NULL, null=True, blank=True, related_name='playlist_history')
    related_user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='playlist_history_mentions')
    
    class Meta:
        db_table = 'playlist_edit_history'
        ordering = ['-timestamp']
        
    def __str__(self):
        user_name = self.user.username if self.user else "Unknown User"
        return f"{user_name} {self.get_action_display()} on {self.playlist.name} at {self.timestamp}"
        
    @classmethod
    def log_action(cls, playlist, user, action, details=None, related_song=None, related_user=None):
        """Helper method để tạo bản ghi lịch sử mới"""
        if details is None:
            details = {}
            
        return cls.objects.create(
            playlist=playlist,
            user=user,
            action=action,
            details=details,
            related_song=related_song,
            related_user=related_user
        )



class UserActivity(models.Model):
    ACTIVITY_TYPES = (
        ('PLAY', 'Played Song'),
        ('LIKE', 'Liked Song'),
        ('FOLLOW', 'Followed User'),
        ('CREATE_PLAYLIST', 'Created Playlist'),
        ('ADD_TO_PLAYLIST', 'Added Song to Playlist'),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='activities')
    activity_type = models.CharField(max_length=20, choices=ACTIVITY_TYPES)
    song = models.ForeignKey(Song, on_delete=models.CASCADE, null=True, blank=True)
    playlist = models.ForeignKey(Playlist, on_delete=models.CASCADE, null=True, blank=True)
    target_user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name='targeted_activities')
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'user_activities'
        ordering = ['-timestamp']

class SongPlayHistory(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='play_history')
    song = models.ForeignKey(Song, on_delete=models.CASCADE, related_name='play_history')
    played_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'song_play_history'
        ordering = ['-played_at']

class Album(models.Model):
    title = models.CharField(max_length=200)
    artist = models.CharField(max_length=200)
    release_date = models.DateField()
    cover_image = models.ImageField(upload_to='album_covers/%Y/%m/%d/', null=True, blank=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'albums'
        ordering = ['-release_date']

class Genre(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to='genre_images/', null=True, blank=True)
    
    class Meta:
        db_table = 'genres'

class SearchHistory(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    query = models.CharField(max_length=255)
    timestamp = models.DateTimeField(auto_now_add=True)


class LyricLine(models.Model):
    song = models.ForeignKey(Song, on_delete=models.CASCADE, related_name='lyric_lines')
    timestamp = models.FloatField(help_text="Thời điểm hiển thị lời (tính bằng giây)")
    text = models.TextField()
    
    class Meta:
        db_table = 'lyric_lines'
        ordering = ['timestamp']
        
    def __str__(self):
        return f"[{self.format_timestamp()}] {self.text[:30]}"
    
    def format_timestamp(self):
        minutes = int(self.timestamp // 60)
        seconds = self.timestamp % 60
        return f"{minutes:02d}:{seconds:05.2f}"

class Artist(models.Model):
    name = models.CharField(max_length=200)
    bio = models.TextField(blank=True)
    image = models.ImageField(upload_to='artist_images/', null=True, blank=True)
    
    class Meta:
        db_table = 'artists'
        
    def __str__(self):
        return self.name

class Queue(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='queue')
    songs = models.ManyToManyField(Song, through='QueueItem')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'queues'
        
    def __str__(self):
        return f"Queue for {self.user.username}"

class QueueItem(models.Model):
    queue = models.ForeignKey(Queue, on_delete=models.CASCADE)
    song = models.ForeignKey(Song, on_delete=models.CASCADE)
    position = models.PositiveIntegerField()
    added_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'queue_items'
        ordering = ['position']
        unique_together = ['queue', 'position']
        
    def __str__(self):
        return f"{self.position}. {self.song.title} in {self.queue}"

class UserStatus(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='music_status')
    currently_playing = models.ForeignKey(Song, on_delete=models.SET_NULL, null=True, blank=True)
    status_text = models.CharField(max_length=255, blank=True)
    is_listening = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'user_statuses'
        
    def __str__(self):
        return f"Status for {self.user.username}"

class UserRecommendation(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='recommendations')
    song = models.ForeignKey(Song, on_delete=models.CASCADE, related_name='recommended_to')
    score = models.FloatField(default=0.0) 
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'user_recommendations'
        ordering = ['-score', '-created_at']
        unique_together = ['user', 'song'] 
        
    def __str__(self):
        return f"{self.user.username} - {self.song.title} ({self.score})"

