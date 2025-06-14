from rest_framework import serializers
from .models import (
    Song, Playlist, Album, Genre, SongPlayHistory, 
    SearchHistory, UserActivity, LyricLine, Artist, Queue, QueueItem, UserStatus, CollaboratorRole, PlaylistEditHistory,
    UserRecommendation
)
from django.contrib.auth import get_user_model
from django.conf import settings
import os

User = get_user_model()

class BaseModelSerializer(serializers.ModelSerializer):

    def get_current_user(self):
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            return request.user
        return None
    
    def ensure_user_in_validated_data(self, validated_data, user_field='user'):
        if user_field not in validated_data:
            user = self.get_current_user()
            if user:
                validated_data[user_field] = user
        return validated_data

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'avatar', 'bio')
        read_only_fields = ('id',)

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'avatar', 'bio')
        read_only_fields = ('id',)

class SongBasicSerializer(serializers.ModelSerializer):
    cover_image = serializers.SerializerMethodField()
    
    class Meta:
        model = Song
        fields = ('id', 'title', 'artist', 'cover_image', 'duration')
        
    def get_cover_image(self, obj):
        if obj.cover_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.cover_image.url)
            return f"{settings.SITE_URL}{obj.cover_image.url}"
        return None

class PlaylistBasicSerializer(serializers.ModelSerializer):
    cover_image = serializers.SerializerMethodField()
    
    class Meta:
        model = Playlist
        fields = ('id', 'name', 'is_public', 'cover_image')
        
    def get_cover_image(self, obj):
        if obj.cover_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.cover_image.url)
            return f"{settings.SITE_URL}{obj.cover_image.url}"
        return None

class UserBasicSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'avatar')

class ArtistSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()
    
    class Meta:
        model = Artist
        fields = ('id', 'name', 'bio', 'image')
        
    def get_image(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return f"{settings.SITE_URL}{obj.image.url}"
        return None

class ArtistDetailSerializer(serializers.ModelSerializer):
    songs_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Artist
        fields = ('id', 'name', 'bio', 'image', 'songs_count')
        
    def get_songs_count(self, obj):
        return Song.objects.filter(artist=obj.name).count()

class GenreBasicSerializer(serializers.ModelSerializer):
    class Meta:
        model = Genre
        fields = ('id', 'name', 'image')

class AlbumBasicSerializer(serializers.ModelSerializer):
    class Meta:
        model = Album
        fields = ('id', 'title', 'artist', 'cover_image', 'release_date')

class SongSerializer(BaseModelSerializer):
    uploaded_by = UserBasicSerializer(read_only=True)
    audio_file = serializers.SerializerMethodField()
    cover_image = serializers.SerializerMethodField()
    download_url = serializers.SerializerMethodField()
    stream_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Song
        fields = ('id', 'title', 'artist', 'album', 'duration', 'audio_file', 
                 'cover_image', 'genre', 'likes_count', 'play_count', 
                 'uploaded_by', 'created_at', 'release_date', 'download_url', 'stream_url')
    
    def create(self, validated_data):
        validated_data = self.ensure_user_in_validated_data(validated_data, 'uploaded_by')
            
        if 'uploaded_by' not in validated_data:
            raise serializers.ValidationError("Không thể xác định người dùng tải lên")
            
        return Song.objects.create(**validated_data)
                 
    def get_audio_file(self, obj):
        if obj.audio_file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.audio_file.url)
            return f"{settings.SITE_URL}{obj.audio_file.url}"
        return None
        
    def get_cover_image(self, obj):
        if obj.cover_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.cover_image.url)
            return f"{settings.SITE_URL}{obj.cover_image.url}"
        return None

    def get_download_url(self, obj):
        if obj.audio_file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(f'/api/v1/music/songs/{obj.id}/download/')
            return f"{settings.SITE_URL}/api/v1/music/songs/{obj.id}/download/"
        return None

    def get_stream_url(self, obj):
        if obj.audio_file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(f'/api/v1/music/songs/{obj.id}/stream/')
            return f"{settings.SITE_URL}/api/v1/music/songs/{obj.id}/stream/"
        return None

class SongDetailSerializer(serializers.ModelSerializer):
    uploaded_by = UserBasicSerializer(read_only=True)
    comments_count = serializers.SerializerMethodField()
    audio_file = serializers.SerializerMethodField()
    cover_image = serializers.SerializerMethodField()
    download_url = serializers.SerializerMethodField()
    stream_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Song
        fields = ('id', 'title', 'artist', 'album', 'duration', 'audio_file', 
                 'cover_image', 'genre', 'likes_count', 'play_count', 
                 'uploaded_by', 'created_at', 'lyrics', 'release_date', 'comments_count',
                 'download_url', 'stream_url')
                 
    def get_comments_count(self, obj):
        return obj.comments.count()
        
    def get_audio_file(self, obj):
        if obj.audio_file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.audio_file.url)
            return f"{settings.SITE_URL}{obj.audio_file.url}"
        return None
        
    def get_cover_image(self, obj):
        if obj.cover_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.cover_image.url)
            return f"{settings.SITE_URL}{obj.cover_image.url}"
        return None

    def get_download_url(self, obj):
        if obj.audio_file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(f'/api/v1/music/songs/{obj.id}/download/')
            return f"{settings.SITE_URL}/api/v1/music/songs/{obj.id}/download/"
        return None

    def get_stream_url(self, obj):
        if obj.audio_file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(f'/api/v1/music/songs/{obj.id}/stream/')
            return f"{settings.SITE_URL}/api/v1/music/songs/{obj.id}/stream/"
        return None

class PlaylistSerializer(serializers.ModelSerializer):
    user = UserBasicSerializer(read_only=True)
    is_collaborative = serializers.BooleanField(read_only=True)
    collaborators_count = serializers.SerializerMethodField()
    cover_image = serializers.SerializerMethodField()
    cover_image_upload = serializers.ImageField(write_only=True, required=False)

    class Meta:
        model = Playlist
        fields = ['id', 'name', 'user', 'description', 'is_public', 'cover_image', 'cover_image_upload',
                  'created_at', 'updated_at', 'is_collaborative', 'collaborators_count']
        read_only_fields = ['user', 'created_at', 'updated_at', 'collaborators_count']

    def get_collaborators_count(self, obj):
        return obj.collaborators.count()
        
    def get_cover_image(self, obj):
        if obj.cover_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.cover_image.url)
            return f"{settings.SITE_URL}{obj.cover_image.url}"
        return None

    def validate_cover_image_upload(self, value):
        if value:
            if value.size > 5 * 1024 * 1024:
                raise serializers.ValidationError('Kích thước ảnh không được vượt quá 5MB')
            
            valid_types = ['image/jpeg', 'image/png', 'image/jpg']
            if value.content_type not in valid_types:
                raise serializers.ValidationError('Định dạng ảnh không hợp lệ. Chỉ chấp nhận JPEG, JPG và PNG')
        
        return value
        
    def create(self, validated_data):
        cover_image = None
        if 'cover_image_upload' in validated_data:
            cover_image = validated_data.pop('cover_image_upload')
            
        playlist = Playlist.objects.create(**validated_data)
        
        if cover_image:
            playlist.cover_image = cover_image
            playlist.save()
            
        return playlist
        
    def update(self, instance, validated_data):
        if 'cover_image_upload' in validated_data:
            instance.cover_image = validated_data.pop('cover_image_upload')
            
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
            
        instance.save()
        return instance

class PlaylistDetailSerializer(serializers.ModelSerializer):
    user = UserBasicSerializer(read_only=True)
    songs = SongSerializer(many=True, read_only=True)
    followers_count = serializers.SerializerMethodField()
    is_collaborative = serializers.BooleanField(read_only=True)
    collaborators = serializers.SerializerMethodField()

    class Meta:
        model = Playlist
        fields = ['id', 'name', 'user', 'description', 'is_public', 'cover_image', 
                  'songs', 'created_at', 'updated_at', 'followers_count', 
                  'is_collaborative', 'collaborators']
        read_only_fields = ['user', 'created_at', 'updated_at', 'followers_count']

    def get_followers_count(self, obj):
        return obj.followers.count()
        
    def get_collaborators(self, obj):
        if not obj.is_collaborative:
            return []
        return CollaboratorRoleSerializer(
            obj.role_assignments.all(), many=True, context=self.context
        ).data

class CollaboratorRoleSerializer(serializers.ModelSerializer):
    user = UserBasicSerializer(read_only=True)
    playlist = serializers.PrimaryKeyRelatedField(read_only=True)
    added_by = UserBasicSerializer(read_only=True)
    
    class Meta:
        model = CollaboratorRole
        fields = ['id', 'user', 'playlist', 'role', 'added_by', 'added_at']
        read_only_fields = ['added_by', 'added_at']

class CollaboratorRoleCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = CollaboratorRole
        fields = ['user', 'playlist', 'role']
        
    def validate(self, data):
        playlist = data.get('playlist')
        if not playlist.is_collaborative:
            raise serializers.ValidationError(
                "Không thể thêm cộng tác viên vào playlist không phải là collaborative")
                
        user = data.get('user')
        if CollaboratorRole.objects.filter(playlist=playlist, user=user).exists():
            raise serializers.ValidationError(
                "Người dùng này đã là cộng tác viên của playlist")
                
        if user == playlist.user:
            raise serializers.ValidationError(
                "Không thể thêm chủ sở hữu playlist làm cộng tác viên")
                
    def get_cover_image(self, obj):
        if obj.cover_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.cover_image.url)
            return f"{settings.SITE_URL}{obj.cover_image.url}"
        return None

class UserActivitySerializer(serializers.ModelSerializer):
    song = SongBasicSerializer(read_only=True)
    playlist = PlaylistBasicSerializer(read_only=True)
    target_user = UserBasicSerializer(read_only=True)
    
    class Meta:
        model = UserActivity
        fields = ('id', 'activity_type', 'song', 'playlist', 'target_user', 'timestamp')


class AlbumSerializer(serializers.ModelSerializer):
    songs_count = serializers.SerializerMethodField()
    cover_image = serializers.SerializerMethodField()
    
    class Meta:
        model = Album
        fields = ('id', 'title', 'artist', 'release_date', 'cover_image', 'description', 'created_at', 'songs_count')
    
    def get_songs_count(self, obj):
        return Song.objects.filter(album=obj.title).count()
        
    def get_cover_image(self, obj):
        if obj.cover_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.cover_image.url)
            return f"{settings.SITE_URL}{obj.cover_image.url}"
        return None

class AlbumDetailSerializer(serializers.ModelSerializer):
    songs = serializers.SerializerMethodField()
    cover_image = serializers.SerializerMethodField()
    
    class Meta:
        model = Album
        fields = ('id', 'title', 'artist', 'release_date', 'cover_image', 'description', 'created_at', 'songs')
    
    def get_songs(self, obj):
        songs = Song.objects.filter(album=obj.title)
        context = self.context
        return SongSerializer(songs, many=True, context=context).data
    
    def get_cover_image(self, obj):
        if obj.cover_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.cover_image.url)
            return f"{settings.SITE_URL}{obj.cover_image.url}"
        return None

class GenreSerializer(serializers.ModelSerializer):
    songs_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Genre
        fields = ('id', 'name', 'description', 'image', 'songs_count')
    
    def get_songs_count(self, obj):
        return Song.objects.filter(genre=obj.name).count()

class GenreDetailSerializer(serializers.ModelSerializer):
    top_songs = serializers.SerializerMethodField()
    top_artists = serializers.SerializerMethodField()
    
    class Meta:
        model = Genre
        fields = ('id', 'name', 'description', 'image', 'top_songs', 'top_artists')
    
    def get_top_songs(self, obj):
        songs = Song.objects.filter(genre=obj.name).order_by('-play_count')[:10]
        return SongSerializer(songs, many=True).data
        
    def get_top_artists(self, obj):
        artists = {}
        for song in Song.objects.filter(genre=obj.name):
            if song.artist in artists:
                artists[song.artist] += 1
            else:
                artists[song.artist] = 1
        
        top_artists = sorted(artists.items(), key=lambda x: x[1], reverse=True)[:5]
        return [{'name': artist[0], 'songs_count': artist[1]} for artist in top_artists]

class SongPlayHistorySerializer(serializers.ModelSerializer):
    song = SongSerializer(read_only=True)
    
    class Meta:
        model = SongPlayHistory
        fields = ('id', 'user', 'song', 'played_at')
        read_only_fields = ('user', 'played_at')

class SearchHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = SearchHistory
        fields = ('id', 'query', 'timestamp')
        read_only_fields = ('user', 'timestamp') 

class LyricLineSerializer(serializers.ModelSerializer):
    class Meta:
        model = LyricLine
        fields = ('id', 'song', 'timestamp', 'text')

class QueueItemSerializer(serializers.ModelSerializer):
    song = SongSerializer(read_only=True)
    
    class Meta:
        model = QueueItem
        fields = ('id', 'position', 'song', 'added_at')
        read_only_fields = ('id', 'added_at')

class QueueSerializer(serializers.ModelSerializer):
    items = serializers.SerializerMethodField()
    
    class Meta:
        model = Queue
        fields = ('id', 'items', 'updated_at')
        read_only_fields = ('id', 'updated_at')
    
    def get_items(self, obj):
        queue_items = QueueItem.objects.filter(queue=obj).order_by('position')
        return QueueItemSerializer(queue_items, many=True).data

class UserStatusSerializer(serializers.ModelSerializer):
    currently_playing = SongBasicSerializer(read_only=True)
    user = UserBasicSerializer(read_only=True)
    
    class Meta:
        model = UserStatus
        fields = ('id', 'user', 'currently_playing', 'status_text', 'is_listening', 'updated_at')
        read_only_fields = ('id', 'updated_at')


class PlaylistEditHistorySerializer(serializers.ModelSerializer):
    user = UserBasicSerializer(read_only=True)
    related_song = SongBasicSerializer(read_only=True)
    related_user = UserBasicSerializer(read_only=True)
    action_display = serializers.CharField(source='get_action_display', read_only=True)
    
    class Meta:
        model = PlaylistEditHistory
        fields = ['id', 'playlist', 'user', 'action', 'action_display', 'timestamp', 
                  'details', 'related_song', 'related_user']
        read_only_fields = ['playlist', 'user', 'action', 'timestamp', 
                          'details', 'related_song', 'related_user']


class CollaborativePlaylistCreateSerializer(serializers.ModelSerializer):
    """Serializer để tạo Collaborative Playlist mới"""
    initial_collaborators = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        write_only=True
    )
    
    class Meta:
        model = Playlist
        fields = ['name', 'description', 'is_public', 'cover_image', 
                  'is_collaborative', 'initial_collaborators']
        
    def validate(self, data):
        data['is_collaborative'] = True
        return data
        
    def create(self, validated_data):
        initial_collaborators = validated_data.pop('initial_collaborators', [])
        
        playlist = Playlist.objects.create(**validated_data)
        
        user_model = get_user_model()
        for user_id in initial_collaborators:
            try:
                collaborator = user_model.objects.get(id=user_id)
                if collaborator != playlist.user:
                    CollaboratorRole.objects.create(
                        user=collaborator,
                        playlist=playlist,
                        role='EDITOR',
                        added_by=playlist.user
                    )
            except user_model.DoesNotExist:
                pass
        
        PlaylistEditHistory.log_action(
            playlist=playlist,
            user=playlist.user,
            action='CREATE',
            details={'name': playlist.name, 'collaborative': True}
        )
        
        return playlist 

class AdminCollaborativePlaylistListSerializer(serializers.ModelSerializer):
    owner = UserBasicSerializer(read_only=True)
    collaborator_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Playlist
        fields = ['id', 'name', 'description', 'owner', 'cover_image', 'created_at', 'is_collaborative', 'collaborator_count']
    
    def get_collaborator_count(self, obj):
        return obj.collaborators.count()

class AdminCollaboratorDetailSerializer(serializers.ModelSerializer):
    user = UserBasicSerializer(read_only=True)
    
    class Meta:
        model = CollaboratorRole
        fields = ['id', 'user', 'role', 'added_at']

class AdminCollaboratorAddSerializer(serializers.Serializer):
    user_id = serializers.IntegerField()
    role = serializers.ChoiceField(choices=CollaboratorRole.ROLE_CHOICES)
    
    def validate_user_id(self, value):
        try:
            User.objects.get(id=value)
        except User.DoesNotExist:
            raise serializers.ValidationError("User does not exist")
        return value

class AdminCollaboratorRoleSerializer(serializers.Serializer):
    role = serializers.ChoiceField(choices=CollaboratorRole.ROLE_CHOICES)

class AdminRestorePlaylistSerializer(serializers.Serializer):
    history_id = serializers.IntegerField()
    
    def validate_history_id(self, value):
        try:
            PlaylistEditHistory.objects.get(id=value)
        except PlaylistEditHistory.DoesNotExist:
            raise serializers.ValidationError("History entry does not exist")
        return value 

class UserRecommendationSerializer(serializers.ModelSerializer):
    song = SongSerializer(read_only=True)
    
    class Meta:
        model = UserRecommendation
        fields = ['id', 'user', 'song', 'score', 'created_at']
        read_only_fields = ['user', 'created_at']

class SongAdminSerializer(serializers.ModelSerializer):
    uploaded_by = UserBasicSerializer(read_only=True)
    uploaded_by_id = serializers.IntegerField(write_only=True, required=False)
    audio_file = serializers.SerializerMethodField()
    cover_image = serializers.SerializerMethodField()
    audio_file_upload = serializers.FileField(write_only=True, required=False)  
    cover_image_upload = serializers.ImageField(write_only=True, required=False)
    download_url = serializers.SerializerMethodField()
    stream_url = serializers.SerializerMethodField()
    comments_count = serializers.SerializerMethodField()
    album_info = serializers.SerializerMethodField()
    genre_info = serializers.SerializerMethodField()
    
    class Meta:
        model = Song
        fields = ('id', 'title', 'artist', 'album', 'album_info', 'genre', 'genre_info',
                 'duration', 'audio_file', 'cover_image', 'audio_file_upload', 'cover_image_upload',
                 'lyrics', 'release_date', 'likes_count', 'play_count', 'comments_count', 
                 'is_approved', 'uploaded_by', 'uploaded_by_id', 'created_at', 
                 'download_url', 'stream_url')
        extra_kwargs = {
            'title': {'required': True},
            'artist': {'required': True},
            'genre': {'required': True},
            'duration': {'required': False},
        }
    
    def validate_duration(self, value):
        if value is None:
            return 0  
        try:
            duration = int(value)
            if duration < 0:
                return 0  
            return duration
        except (TypeError, ValueError):
            return 0  
    
    def validate_audio_file_upload(self, value):
        if value:
            if value.size > 50 * 1024 * 1024:
                raise serializers.ValidationError("Kích thước file quá lớn (tối đa 50MB)")
            
            ext = os.path.splitext(value.name)[1].lower()
            valid_extensions = ['.mp3', '.wav', '.ogg', '.m4a']
            if ext not in valid_extensions:
                raise serializers.ValidationError(f"Định dạng file không được hỗ trợ. Hỗ trợ: {', '.join(valid_extensions)}")
        return value
    
    def validate_cover_image_upload(self, value):
        if value:
            if value.size > 5 * 1024 * 1024:
                raise serializers.ValidationError("Kích thước ảnh quá lớn (tối đa 5MB)")
            
            ext = os.path.splitext(value.name)[1].lower()
            valid_extensions = ['.jpg', '.jpeg', '.png', '.webp']
            if ext not in valid_extensions:
                raise serializers.ValidationError(f"Định dạng ảnh không được hỗ trợ. Hỗ trợ: {', '.join(valid_extensions)}")
        return value
    
    def validate_release_date(self, value):
        if value:
            try:
                from django.utils.dateparse import parse_date
                if isinstance(value, str):
                    parsed_date = parse_date(value)
                    if not parsed_date:
                        raise serializers.ValidationError("Định dạng ngày không hợp lệ (sử dụng YYYY-MM-DD)")
                    return parsed_date
            except Exception as e:
                raise serializers.ValidationError(f"Lỗi khi xử lý ngày phát hành: {str(e)}")
        return value
                 
    def get_audio_file(self, obj):
        if obj and obj.audio_file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.audio_file.url)
            return f"{settings.SITE_URL}{obj.audio_file.url}"
        return None
        
    def get_cover_image(self, obj):
        if obj and obj.cover_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.cover_image.url)
            return f"{settings.SITE_URL}{obj.cover_image.url}"
        return None
        
    def get_download_url(self, obj):
        if obj and obj.audio_file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(f'/api/v1/music/songs/{obj.id}/download/')
            return f"{settings.SITE_URL}/api/v1/music/songs/{obj.id}/download/"
        return None
        
    def get_stream_url(self, obj):
        if obj and obj.audio_file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(f'/api/v1/music/songs/{obj.id}/stream/')
            return f"{settings.SITE_URL}/api/v1/music/songs/{obj.id}/stream/"
        return None
        
    def get_comments_count(self, obj):
        if obj:
            return obj.comments.count()
        return 0
        
    def get_album_info(self, obj):
        if obj and obj.album:
            try:
                album = Album.objects.filter(title=obj.album).first()
                if album:
                    return {
                        'id': album.id,
                        'title': album.title,
                        'artist': album.artist
                    }
            except Exception:
                pass
        return None
        
    def get_genre_info(self, obj):
        if obj and obj.genre:
            try:
                genre = Genre.objects.filter(name=obj.genre).first()
                if genre:
                    return {
                        'id': genre.id,
                        'name': genre.name
                    }
            except Exception:
                pass
        return None
    
    def create(self, validated_data):
        try:
            audio_file_upload = validated_data.pop('audio_file_upload', None)
            cover_image_upload = validated_data.pop('cover_image_upload', None)
            uploaded_by_id = validated_data.pop('uploaded_by_id', None)
            
            request = self.context.get('request')
            if 'uploaded_by' not in validated_data:
                if uploaded_by_id:
                    try:
                        uploaded_by = User.objects.get(id=uploaded_by_id)
                        validated_data['uploaded_by'] = uploaded_by
                    except User.DoesNotExist:
                        if request and hasattr(request, 'user'):
                            validated_data['uploaded_by'] = request.user
                        else:
                            raise serializers.ValidationError("Không tìm thấy người dùng với ID đã cung cấp")
                elif request and hasattr(request, 'user'):
                    validated_data['uploaded_by'] = request.user
                else:
                    raise serializers.ValidationError("Không có thông tin người dùng trong request")
            
            missing_fields = []
            
            if 'title' not in validated_data or not validated_data['title']:
                missing_fields.append('title')
                
            if 'artist' not in validated_data or not validated_data['artist']:
                missing_fields.append('artist')
                
            if 'genre' not in validated_data or not validated_data['genre']:
                missing_fields.append('genre')
            
            has_audio_file = audio_file_upload or (request and request.FILES and 'audio_file' in request.FILES)
            if not has_audio_file:
                missing_fields.append('audio_file')
            
            if missing_fields:
                error_msg = "Các trường sau là bắt buộc: " + ", ".join(missing_fields)
                raise serializers.ValidationError(error_msg)
            
            if 'duration' not in validated_data or validated_data['duration'] is None:
                validated_data['duration'] = 0  
            
            song = Song.objects.create(**validated_data)
            
            if audio_file_upload:
                song.audio_file = audio_file_upload
            elif request and request.FILES and 'audio_file' in request.FILES:
                song.audio_file = request.FILES['audio_file']
                
            if cover_image_upload:
                song.cover_image = cover_image_upload
            elif request and request.FILES and 'cover_image' in request.FILES:
                song.cover_image = request.FILES['cover_image']
            
            if audio_file_upload or cover_image_upload or (request and request.FILES):
                song.save()
                
            if song.duration == 0 and song.audio_file and hasattr(song.audio_file, 'path') and os.path.exists(song.audio_file.path):
                try:
                    from tinytag import TinyTag
                    tag = TinyTag.get(song.audio_file.path)
                    if tag.duration:
                        song.duration = int(tag.duration)
                        song.save(update_fields=['duration'])
                except Exception:
                    pass
                    
            return song
        except Exception as e:
            import logging, traceback
            logger = logging.getLogger(__name__)
            logger.error(f"Lỗi trong create(): {str(e)}")
            logger.error(traceback.format_exc())
            raise
        
    def update(self, instance, validated_data):
        try:
            request = self.context.get('request')
            
            if 'audio_file_upload' in validated_data:
                instance.audio_file = validated_data.pop('audio_file_upload')
                
            if 'cover_image_upload' in validated_data:
                instance.cover_image = validated_data.pop('cover_image_upload')
            
            for attr, value in validated_data.items():
                if attr != 'uploaded_by_id':
                    setattr(instance, attr, value)
            
            if 'uploaded_by_id' in validated_data:
                try:
                    user = User.objects.get(id=validated_data['uploaded_by_id'])
                    instance.uploaded_by = user
                except User.DoesNotExist:
                    pass
            
            if request and request.FILES:
                if 'audio_file' in request.FILES:
                    instance.audio_file = request.FILES['audio_file']
                
                if 'cover_image' in request.FILES:
                    instance.cover_image = request.FILES['cover_image']
            
            if (instance.duration == 0 or not instance.duration) and instance.audio_file:
                try:
                    from tinytag import TinyTag
                    tag = TinyTag.get(instance.audio_file.path)
                    instance.duration = int(tag.duration or 0)
                except Exception:
                    pass
                    
            instance.save()
            return instance
        except Exception as e:
            import logging, traceback
            logger = logging.getLogger(__name__)
            logger.error(f"Lỗi trong SongAdminSerializer.update: {str(e)}")
            logger.error(traceback.format_exc())
            raise serializers.ValidationError(f"Không thể cập nhật bài hát: {str(e)}")

class AdminAlbumSerializer(serializers.ModelSerializer):
    cover_image = serializers.SerializerMethodField()
    cover_image_upload = serializers.ImageField(write_only=True, required=False)
    songs_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Album
        fields = ('id', 'title', 'artist', 'release_date', 'cover_image', 'cover_image_upload',
                  'description', 'created_at', 'songs_count')
        extra_kwargs = {
            'title': {'required': False},
            'artist': {'required': False},
        }
    
    def get_songs_count(self, obj):
        return Song.objects.filter(album=obj.title).count()
        
    def get_cover_image(self, obj):
        if obj and obj.cover_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.cover_image.url)
            return f"{settings.SITE_URL}{obj.cover_image.url}"
        return None
    
    def update(self, instance, validated_data):
        request = self.context.get('request')
        
        if 'cover_image_upload' in validated_data:
            instance.cover_image = validated_data.pop('cover_image_upload')
            
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
            
        if request and request.FILES:
            if 'cover_image' in request.FILES:
                instance.cover_image = request.FILES['cover_image']
                
        instance.save()
        return instance 

class AdminArtistSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()
    image_upload = serializers.ImageField(write_only=True, required=False)
    songs_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Artist
        fields = ('id', 'name', 'bio', 'image', 'image_upload', 'songs_count')
        extra_kwargs = {
            'name': {'required': False},
        }
    
    def get_songs_count(self, obj):
        return Song.objects.filter(artist=obj.name).count()
        
    def get_image(self, obj):
        if obj and obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return f"{settings.SITE_URL}{obj.image.url}"
        return None
    
    def update(self, instance, validated_data):
        request = self.context.get('request')
        
        if 'image_upload' in validated_data:
            instance.image = validated_data.pop('image_upload')
            
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
            
        if request and request.FILES:
            if 'image' in request.FILES:
                instance.image = request.FILES['image']
                
        instance.save()
        return instance 

class AdminGenreSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()
    image_upload = serializers.ImageField(write_only=True, required=False)
    songs_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Genre
        fields = ('id', 'name', 'description', 'image', 'image_upload', 'songs_count')
        extra_kwargs = {
            'name': {'required': False},
        }
    
    def get_songs_count(self, obj):
        return Song.objects.filter(genre=obj.name).count()
        
    def get_image(self, obj):
        if obj and obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return f"{settings.SITE_URL}{obj.image.url}"
        return None
    
    def update(self, instance, validated_data):
        request = self.context.get('request')
        
        if 'image_upload' in validated_data:
            instance.image = validated_data.pop('image_upload')
            
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
            
        if request and request.FILES:
            if 'image' in request.FILES:
                instance.image = request.FILES['image']
                
        instance.save()
        return instance

class AdminPlaylistSerializer(serializers.ModelSerializer):
    user = UserBasicSerializer(read_only=True)
    user_id = serializers.IntegerField(write_only=True, required=False)
    cover_image = serializers.SerializerMethodField()
    cover_image_upload = serializers.ImageField(write_only=True, required=False)
    songs_count = serializers.SerializerMethodField()
    followers_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Playlist
        fields = ('id', 'name', 'description', 'is_public', 'is_collaborative', 
                  'cover_image', 'cover_image_upload', 'user', 'user_id',
                  'created_at', 'updated_at', 'songs_count', 'followers_count')
        read_only_fields = ('created_at', 'updated_at')
        extra_kwargs = {
            'name': {'required': False},
        }
    
    def get_songs_count(self, obj):
        return obj.songs.count()
        
    def get_followers_count(self, obj):
        return obj.followers.count()
        
    def get_cover_image(self, obj):
        if obj and obj.cover_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.cover_image.url)
            return f"{settings.SITE_URL}{obj.cover_image.url}"
        return None
    
    def update(self, instance, validated_data):
        request = self.context.get('request')
        
        if 'cover_image_upload' in validated_data:
            instance.cover_image = validated_data.pop('cover_image_upload')
            
        for attr, value in validated_data.items():
            if attr != 'user_id':
                setattr(instance, attr, value)
        
        if 'user_id' in validated_data:
            try:
                user = User.objects.get(id=validated_data['user_id'])
                instance.user = user
            except User.DoesNotExist:
                pass
                
        if request and request.FILES:
            if 'cover_image' in request.FILES:
                instance.cover_image = request.FILES['cover_image']
                
        instance.save()
        return instance