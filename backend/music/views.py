from django.shortcuts import get_object_or_404, render
from django.http import JsonResponse, FileResponse, Http404, StreamingHttpResponse
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions, viewsets, generics, filters, serializers
from rest_framework.pagination import PageNumberPagination
from .models import (
    Playlist, Song, Album, Genre, SongPlayHistory, 
    SearchHistory, Artist, Queue, QueueItem, UserStatus, LyricLine,UserRecommendation,
    CollaboratorRole, PlaylistEditHistory,  UserActivity
)
from .serializers import (
    PlaylistSerializer, SongSerializer, AlbumSerializer, GenreSerializer,  SongPlayHistorySerializer,
    SearchHistorySerializer, PlaylistDetailSerializer, SongDetailSerializer,
    AlbumDetailSerializer, GenreDetailSerializer, ArtistSerializer,
    QueueSerializer, UserStatusSerializer, LyricLineSerializer,
    UserBasicSerializer, CollaboratorRoleSerializer, CollaboratorRoleCreateSerializer,
    PlaylistEditHistorySerializer, ArtistDetailSerializer,
    SongAdminSerializer, AdminAlbumSerializer, AdminArtistSerializer, AdminGenreSerializer, AdminPlaylistSerializer
)
from django.urls import reverse
from django.contrib.auth import get_user_model
from django.db.models import Q, Count, Avg, Sum, F
import random
from datetime import datetime, timedelta
import django.utils.timezone
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.request import Request
from .utils import get_audio_metadata, convert_audio_format, extract_synchronized_lyrics, import_synchronized_lyrics, normalize_audio, get_waveform_data, generate_song_recommendations, download_song_for_offline, verify_offline_song, get_offline_song_metadata
import os
from io import BytesIO
from django.conf import settings
import logging
import mimetypes
import re
from wsgiref.util import FileWrapper
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db import transaction

User = get_user_model()

class HomePageView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request, format=None):
        genres = Genre.objects.all()[:6]  
        featured_by_genre = {}
        
        for genre in genres:
            top_songs = Song.objects.filter(genre=genre.name).order_by('-play_count')[:5]
            featured_by_genre[genre.name] = SongSerializer(top_songs, many=True).data
        
        one_month_ago = datetime.now().date() - timedelta(days=30)
        new_albums = Album.objects.filter(release_date__gte=one_month_ago).order_by('-release_date')[:8]
        
        popular_playlists = Playlist.objects.filter(is_public=True).annotate(
            followers_count=Count('followers')
        ).order_by('-followers_count')[:8]
        
        top_songs = Song.objects.order_by('-play_count')[:10]
        
        return Response({
            'featured_by_genre': featured_by_genre,
            'new_albums': AlbumSerializer(new_albums, many=True).data,
            'popular_playlists': PlaylistSerializer(popular_playlists, many=True).data,
            'top_songs': SongSerializer(top_songs, many=True).data
        })

class PublicPlaylistView(APIView):
    permission_classes = [AllowAny]
    def get(self, request):
        playlists = Playlist.objects.filter(is_public=True)
        serializer = PlaylistSerializer(playlists, many=True)
        return Response(serializer.data)

class UserPlaylistView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        playlists = Playlist.objects.filter(user=request.user)
        serializer = PlaylistSerializer(playlists, many=True)
        return Response(serializer.data)

class PublicSearchView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request):
        query = request.GET.get('q', '')
        songs = Song.objects.filter(
            Q(title__icontains=query) | 
            Q(artist__icontains=query) | 
            Q(album__icontains=query)
        )
        serializer = SongSerializer(songs, many=True)
        return Response(serializer.data)

class BasicUserFeatures(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        return Response({
            'my_playlists': reverse('user-playlists'),
            'create_playlist': reverse('create-playlist'),
            'upload': reverse('song-upload'),
            'library': reverse('user-library'),
            'search': reverse('search'),
            'recommended': reverse('recommended'),
            'trending': reverse('trending'),
            'queue': reverse('queue'),
            'statistics': reverse('user-statistics'),
            'trends': reverse('personal-trends')
        })

class CreatePlaylistView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    
    def post(self, request):
        serializer = PlaylistSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)

# ViewSets
class SongViewSet(viewsets.ModelViewSet):
    queryset = Song.objects.all()
    serializer_class = SongSerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'search', 'trending']:
            permission_classes = [AllowAny]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return SongDetailSerializer
        return SongSerializer
    
    def get_serializer(self, *args, **kwargs):
        kwargs['context'] = self.get_serializer_context()
        return super().get_serializer(*args, **kwargs)
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        return context
    
    def perform_create(self, serializer):
        if 'uploaded_by' not in serializer.validated_data:
            serializer.save(uploaded_by=self.request.user)
        else:
            serializer.save()
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def play(self, request, pk=None):
        song = self.get_object()
        song.play_count += 1
        song.save()
        
        SongPlayHistory.objects.create(
            user=request.user,
            song=song,
            played_at=datetime.now()
        )
        
        return Response({'status': 'play logged'})
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def like(self, request, pk=None):
        song = self.get_object()
        user = request.user
        
        if song in user.favorite_songs.all():
            user.favorite_songs.remove(song)
            song.likes_count = max(0, song.likes_count - 1)
            song.save()
            return Response({'status': 'unliked'})
        else:
            user.favorite_songs.add(song)
            song.likes_count += 1
            song.save()
            return Response({'status': 'liked'})
    
    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def trending(self, request):
        days = int(request.query_params.get('days', 7))
        limit = int(request.query_params.get('limit', 10))
        genre = request.query_params.get('genre', None)
        
        start_date = django.utils.timezone.now() - timedelta(days=days)
        
        try:
            query = Song.objects.filter(
                play_history__played_at__gte=start_date
            )
            
            if genre:
                query = query.filter(genre=genre)
            
            trending_songs = query.annotate(
                recent_plays=Count('play_history')
            ).order_by('-recent_plays', '-likes_count')[:limit]
        
            if not trending_songs.exists():
                trending_songs = Song.objects.all().order_by('-likes_count', '-play_count')[:limit]

            serializer = self.get_serializer(trending_songs, many=True)
            
            result_data = serializer.data
            for i, song in enumerate(trending_songs):
                result_data[i]['recent_plays'] = SongPlayHistory.objects.filter(
                    song=song, 
                    played_at__gte=start_date
                ).count()
            
            return Response({
                'trending_period_days': days,
                'results': result_data
            })
        
        except Exception as e:
            trending_songs = Song.objects.all().order_by('-likes_count', '-play_count')[:limit]
            serializer = self.get_serializer(trending_songs, many=True)
            
            return Response({
                'trending_period_days': days,
                'results': serializer.data,
                'note': 'Showing popular songs due to an error with trending data'
            })
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def recommended(self, request):
        user = request.user
        
        if not user.favorite_songs.exists() and not SongPlayHistory.objects.filter(user=user).exists():
            popular_songs = Song.objects.order_by('-play_count', '-likes_count')[:10]
            serializer = self.get_serializer(popular_songs, many=True)
            return Response(serializer.data)
        
        favorite_genres = set()
        
        for song in user.favorite_songs.all():
            favorite_genres.add(song.genre)
        
        played_songs = SongPlayHistory.objects.filter(user=user).select_related('song')
        for play in played_songs:
            favorite_genres.add(play.song.genre)
        
        played_song_ids = played_songs.values_list('song_id', flat=True)
        fav_song_ids = user.favorite_songs.values_list('id', flat=True)
        
        recommended_songs = Song.objects.filter(
            genre__in=favorite_genres
        ).exclude(
            id__in=list(played_song_ids) + list(fav_song_ids)
        ).order_by('-likes_count')[:10]
        
        if recommended_songs.count() < 10:
            excluded_ids = list(recommended_songs.values_list('id', flat=True)) + list(played_song_ids) + list(fav_song_ids)
            more_songs = Song.objects.exclude(id__in=excluded_ids).order_by('-play_count')[:10-recommended_songs.count()]
            recommended_songs = list(recommended_songs) + list(more_songs)
        
        serializer = self.get_serializer(recommended_songs, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def search(self, request):
        query = request.query_params.get('q', '')
        if not query:
            return Response({'error': 'Cần cung cấp từ khóa tìm kiếm'}, status=status.HTTP_400_BAD_REQUEST)
        
        songs = Song.objects.filter(
            Q(title__icontains=query) | 
            Q(artist__icontains=query) | 
            Q(album__icontains=query) |
            Q(genre__icontains=query)
        )
        
        genre = request.query_params.get('genre', None)
        artist = request.query_params.get('artist', None)
        
        if genre:
            songs = songs.filter(genre=genre)
        
        if artist:
            songs = songs.filter(artist=artist)
        
        sort_by = request.query_params.get('sort', 'title')
        if sort_by == 'title':
            songs = songs.order_by('title')
        elif sort_by == 'artist':
            songs = songs.order_by('artist')
        elif sort_by == 'release_date':
            songs = songs.order_by('-release_date')
        
        page_size = int(request.query_params.get('page_size', 20))
        page = int(request.query_params.get('page', 1))
        start = (page - 1) * page_size
        end = start + page_size
        
        serializer = self.get_serializer(songs[start:end], many=True)
        
        if request.user.is_authenticated:
            SearchHistory.objects.create(
                user=request.user,
                query=query
            )
        
        return Response({
            'total': songs.count(),
            'page': page, 
            'page_size': page_size,
            'results': serializer.data
        })
    
    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def filter(self, request):
        songs = Song.objects.all()
        
        genre = request.query_params.get('genre', None)
        if genre:
            songs = songs.filter(genre=genre)
        
        artist = request.query_params.get('artist', None)
        if artist:
            songs = songs.filter(artist=artist)
            
        album = request.query_params.get('album', None)
        if album:
            songs = songs.filter(album=album)
        
        sort_by = request.query_params.get('sort', 'title')
        if sort_by == 'title':
            songs = songs.order_by('title')
        elif sort_by == 'artist':
            songs = songs.order_by('artist')
        elif sort_by == 'release_date':
            songs = songs.order_by('-release_date')
        elif sort_by == 'popularity':
            songs = songs.order_by('-play_count')
        
        page_size = int(request.query_params.get('page_size', 20))
        page = int(request.query_params.get('page', 1))
        start = (page - 1) * page_size
        end = start + page_size
        
        serializer = self.get_serializer(songs[start:end], many=True)
        
        return Response({
            'total': songs.count(),
            'page': page, 
            'page_size': page_size,
            'results': serializer.data
        })




class PlaylistViewSet(viewsets.ModelViewSet):
    queryset = Playlist.objects.all()
    serializer_class = PlaylistSerializer
    parser_classes = (MultiPartParser, FormParser, JSONParser)
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            permission_classes = [AllowAny]
        else:
            permission_classes = [IsAuthenticated]
            
        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated:
            return Playlist.objects.filter(
                Q(is_public=True) | Q(user=user)
            )
        return Playlist.objects.filter(is_public=True)
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return PlaylistDetailSerializer
        return PlaylistSerializer
    
    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        if not instance.is_public and instance.user != request.user:
            return Response(
                {'error': 'Bạn không có quyền xem playlist riêng tư này'},
                status=status.HTTP_403_FORBIDDEN
            )
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
    
    def perform_create(self, serializer):
        user_playlists_count = Playlist.objects.filter(user=self.request.user).count()
        if user_playlists_count >= 50:
            raise serializers.ValidationError('Bạn đã đạt giới hạn tối đa 50 playlist')
            
        serializer.save(user=self.request.user)
        self.request._request.session['message'] = 'Đã tạo playlist thành công!'
    
    def create(self, request, *args, **kwargs):
        if not request.data.get('name'):
            return Response(
                {'error': 'Tên playlist không được để trống'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        return super().create(request, *args, **kwargs)
    
    def update(self, request, *args, **kwargs):
        playlist = self.get_object()
        if playlist.user != request.user:
            return Response(
                {'error': 'Bạn không có quyền chỉnh sửa playlist này'}, 
                status=status.HTTP_403_FORBIDDEN
            )
            
        if 'cover_image' in request.data and playlist.cover_image:
            if os.path.isfile(playlist.cover_image.path):
                os.remove(playlist.cover_image.path)
                
        return super().update(request, *args, **kwargs)
    
    def destroy(self, request, *args, **kwargs):
        playlist = self.get_object()
        if playlist.user != request.user:
            return Response(
                {'error': 'Bạn không có quyền xóa playlist này'}, 
                status=status.HTTP_403_FORBIDDEN
            )
            
        if playlist.cover_image:
            if os.path.isfile(playlist.cover_image.path):
                os.remove(playlist.cover_image.path)
                
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated], parser_classes=[JSONParser])
    def add_song(self, request, pk=None):
        playlist = self.get_object()
        
        if playlist.user != request.user:
            return Response(
                {'error': 'Bạn không có quyền chỉnh sửa playlist này'}, 
                status=status.HTTP_403_FORBIDDEN
            )
            
        song_id = request.data.get('song_id')
        if not song_id:
            return Response(
                {'error': 'Cần cung cấp ID bài hát'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        song_count = playlist.songs.count()
        if song_count >= 1000:  # Giới hạn tối đa 1000 bài/playlist
            return Response(
                {'error': 'Playlist đã đạt giới hạn tối đa 1000 bài hát'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            song = Song.objects.get(id=song_id)
            
            if playlist.songs.filter(id=song_id).exists():
                return Response(
                    {'error': 'Bài hát đã có trong playlist'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            if not song.audio_file:
                return Response(
                    {'error': 'Bài hát không có file audio'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            playlist.songs.add(song)
            return Response({'status': 'Đã thêm bài hát vào playlist'})
        except Song.DoesNotExist:
            return Response(
                {'error': 'Không tìm thấy bài hát'}, 
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def remove_song(self, request, pk=None):
        playlist = self.get_object()
        
        if playlist.user != request.user:
            return Response(
                {'error': 'Bạn không có quyền chỉnh sửa playlist này'}, 
                status=status.HTTP_403_FORBIDDEN
            )
            
        song_id = request.data.get('song_id')
        if not song_id:
            return Response(
                {'error': 'Cần cung cấp ID bài hát'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            song = Song.objects.get(id=song_id)
            
            if not playlist.songs.filter(id=song_id).exists():
                return Response(
                    {'error': 'Bài hát không có trong playlist'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            playlist.songs.remove(song)
            return Response({'status': 'Đã xóa bài hát khỏi playlist'})
        except Song.DoesNotExist:
            return Response(
                {'error': 'Không tìm thấy bài hát'}, 
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def update_cover_image(self, request, pk=None):
        playlist = self.get_object()
        
        if playlist.user != request.user:
            return Response(
                {'error': 'Bạn không có quyền chỉnh sửa playlist này'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        image_file = request.FILES.get('cover_image')
        if not image_file:
            song_id = request.data.get('song_id')
            if song_id:
                try:
                    song = Song.objects.get(id=song_id)
                    if song.cover_image:
                        playlist.cover_image = song.cover_image
                        playlist.save()
                        return Response({
                            "id": playlist.id,
                            "name": playlist.name,
                            "cover_image": request.build_absolute_uri(playlist.cover_image.url) if request else None,
                            "updated_at": playlist.updated_at
                        })
                    else:
                        return Response(
                            {'error': 'Bài hát không có ảnh bìa'}, 
                            status=status.HTTP_400_BAD_REQUEST
                        )
                except Song.DoesNotExist:
                    return Response(
                        {'error': 'Không tìm thấy bài hát'}, 
                        status=status.HTTP_404_NOT_FOUND
                    )
            else:
                return Response(
                    {'error': 'Cần cung cấp file ảnh hoặc ID bài hát'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        if image_file.size > 5 * 1024 * 1024:
            return Response(
                {'error': 'Kích thước ảnh không được vượt quá 5MB'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        valid_types = ['image/jpeg', 'image/png', 'image/jpg']
        if image_file.content_type not in valid_types:
            return Response(
                {'error': 'Định dạng ảnh không hợp lệ. Chỉ chấp nhận JPEG, JPG và PNG'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        playlist.cover_image = image_file
        playlist.save()
        
        return Response({
            "id": playlist.id,
            "name": playlist.name,
            "cover_image": request.build_absolute_uri(playlist.cover_image.url) if request else None,
            "updated_at": playlist.updated_at
        })
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def toggle_privacy(self, request, pk=None):
        playlist = self.get_object()
        
        if playlist.user != request.user:
            return Response(
                {'error': 'Bạn không có quyền chỉnh sửa playlist này'}, 
                status=status.HTTP_403_FORBIDDEN
            )
            
        playlist.is_public = not playlist.is_public
        playlist.save()
        
        return Response({
            "id": playlist.id,
            "name": playlist.name,
            "is_public": playlist.is_public,
            "updated_at": playlist.updated_at
        })
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def follow(self, request, pk=None):
        playlist = self.get_object()
        user = request.user
        
        if not playlist.is_public and playlist.user != user:
            return Response(
                {'error': 'Bạn không có quyền xem playlist riêng tư này'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        if playlist.followers.filter(id=user.id).exists():
            return Response(
                {'error': 'Bạn đã theo dõi playlist này rồi'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        playlist.followers.add(user)
        return Response({'status': 'Đã theo dõi playlist thành công'})
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def unfollow(self, request, pk=None):
        playlist = self.get_object()
        user = request.user
        
        if not playlist.followers.filter(id=user.id).exists():
            return Response(
                {'error': 'Bạn chưa theo dõi playlist này'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        playlist.followers.remove(user)
        return Response({'status': 'Đã bỏ theo dõi playlist thành công'})
        
    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated])
    def followers(self, request, pk=None):
        playlist = self.get_object()
        
        if not playlist.is_public and playlist.user != request.user:
            return Response(
                {'error': 'Bạn không có quyền xem thông tin playlist riêng tư này'}, 
                status=status.HTTP_403_FORBIDDEN
            )
            
        followers = playlist.followers.all()
        serializer = UserBasicSerializer(followers, many=True)
        return Response({
            'playlist_id': playlist.id,
            'playlist_name': playlist.name,
            'followers_count': followers.count(),
            'followers': serializer.data
        })

class AlbumViewSet(viewsets.ModelViewSet):
    queryset = Album.objects.all()
    serializer_class = AlbumSerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'songs', 'related']:
            permission_classes = [AllowAny]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return AlbumDetailSerializer
        return AlbumSerializer
    
    def get_serializer(self, *args, **kwargs):
        kwargs['context'] = self.get_serializer_context()
        return super().get_serializer(*args, **kwargs)
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        return context
    
    @action(detail=True, methods=['get'], permission_classes=[AllowAny])
    def songs(self, request, pk=None):
        album = self.get_object()
        songs = Song.objects.filter(album=album.title)
        serializer = SongSerializer(songs, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'], permission_classes=[AllowAny])
    def related(self, request, pk=None):
        album = self.get_object()
        related_albums = Album.objects.filter(artist=album.artist).exclude(id=album.id)[:5]
        serializer = AlbumSerializer(related_albums, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def new(self, request):
        three_months_ago = datetime.now().date() - timedelta(days=90)
        new_albums = Album.objects.filter(release_date__gte=three_months_ago).order_by('-release_date')[:10]
        serializer = self.get_serializer(new_albums, many=True)
        return Response(serializer.data)

class GenreViewSet(viewsets.ModelViewSet):
    queryset = Genre.objects.all()
    serializer_class = GenreSerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'songs', 'artists']:
            permission_classes = [AllowAny]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return GenreDetailSerializer
        return GenreSerializer
    
    @action(detail=True, methods=['get'], permission_classes=[AllowAny])
    def songs(self, request, pk=None):
        genre = self.get_object()
        songs = Song.objects.filter(genre=genre.name)
        
        page_size = int(request.query_params.get('page_size', 20))
        page = int(request.query_params.get('page', 1))
        start = (page - 1) * page_size
        end = start + page_size
        
        serializer = SongSerializer(songs[start:end], many=True)
        
        return Response({
            'total': songs.count(),
            'page': page, 
            'page_size': page_size,
            'songs': serializer.data
        })
    
    @action(detail=True, methods=['get'], permission_classes=[AllowAny])
    def artists(self, request, pk=None):
        genre = self.get_object()
        
        artists = {}
        for song in Song.objects.filter(genre=genre.name):
            if song.artist in artists:
                artists[song.artist] += 1
            else:
                artists[song.artist] = 1
        
        top_artists = sorted(artists.items(), key=lambda x: x[1], reverse=True)[:10]
        
        return Response([
            {'name': artist[0], 'songs_count': artist[1]} 
            for artist in top_artists
        ])
    
    @action(detail=True, methods=['get'], permission_classes=[AllowAny])
    def top_songs(self, request, pk=None):
        genre = self.get_object()
        top_songs = Song.objects.filter(genre=genre.name).order_by('-play_count')[:10]
        serializer = SongSerializer(top_songs, many=True)
        return Response(serializer.data)


class TrendingSongsView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request, format=None):
        trending_songs = Song.objects.order_by('-play_count')[:10]
        serializer = SongSerializer(trending_songs, many=True)
        return Response(serializer.data)

class RecommendedSongsView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, format=None):
        user = request.user
        
        favorite_genres = set()
        for song in user.favorite_songs.all():
            favorite_genres.add(song.genre)
        
        if not favorite_genres:
            for history in SongPlayHistory.objects.filter(user=user):
                favorite_genres.add(history.song.genre)
        
        if not favorite_genres:
            popular_songs = Song.objects.order_by('-play_count')[:10]
            serializer = SongSerializer(popular_songs, many=True)
            return Response(serializer.data)
        
        listened_songs = SongPlayHistory.objects.filter(user=user).values_list('song_id', flat=True)
        
        recommended = Song.objects.filter(
            genre__in=favorite_genres
        ).exclude(
            id__in=list(listened_songs)
        ).order_by('?')[:10]
        
        serializer = SongSerializer(recommended, many=True)
        return Response(serializer.data)

class SearchView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request, format=None):
        query = request.query_params.get('q', '')
        if not query:
            return Response({'error': 'Search query is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        songs = Song.objects.filter(
            Q(title__icontains=query) | 
            Q(artist__icontains=query) | 
            Q(album__icontains=query)
        )
        song_serializer = SongSerializer(songs, many=True)
        
        playlists = Playlist.objects.filter(
            Q(name__icontains=query) | 
            Q(description__icontains=query),
            is_public=True
        )
        playlist_serializer = PlaylistSerializer(playlists, many=True)
        
        albums = Album.objects.filter(
            Q(title__icontains=query) | 
            Q(artist__icontains=query)
        )
        album_serializer = AlbumSerializer(albums, many=True)
        
        if request.user.is_authenticated:
            SearchHistory.objects.create(
                user=request.user,
                query=query
            )
        
        return Response({
            'songs': song_serializer.data,
            'playlists': playlist_serializer.data,
            'albums': album_serializer.data
        })

# Thêm endpoint để xử lý lời bài hát đồng bộ
class SyncedLyricsView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, song_id, format=None):
        try:
            song = Song.objects.get(id=song_id)
            if not request.user.is_superuser and request.user != song.uploaded_by:
                return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
            
            lyrics_text = request.data.get('lyrics_text', '')
            if not lyrics_text:
                return Response({'error': 'No lyrics provided'}, status=status.HTTP_400_BAD_REQUEST)
            
            success = import_synchronized_lyrics(song_id, lyrics_text)
            if success:
                return Response({'status': 'Synced lyrics imported successfully'})
            else:
                return Response({'error': 'Failed to import synced lyrics'}, status=status.HTTP_400_BAD_REQUEST)
        except Song.DoesNotExist:
            return Response({'error': 'Song not found'}, status=status.HTTP_404_NOT_FOUND)
    
    def get(self, request, song_id, format=None):
        try:
            song = Song.objects.get(id=song_id)
            lyric_lines = song.lyric_lines.all()  # type: ignore
            
            lyrics = []
            for line in lyric_lines:
                lyrics.append({
                    'timestamp': line.timestamp,
                    'formatted_time': line.format_timestamp(),
                    'text': line.text
                })
            
            return Response({
                'song_id': song_id,
                'song_title': song.title,
                'lyrics': lyrics
            })
        except Song.DoesNotExist:
            return Response({'error': 'Song not found'}, status=status.HTTP_404_NOT_FOUND)

# Admin Statistics and Analytics
class AdminStatisticsView(APIView):
    permission_classes = [permissions.IsAdminUser]
    
    def get(self, request, format=None):
        total_songs = Song.objects.count()
        total_playlists = Playlist.objects.count()
        total_users = User.objects.count()
        total_active_users = User.objects.filter(last_login__gte=django.utils.timezone.now() - timedelta(days=30)).count()
        
        total_plays = sum(Song.objects.values_list('play_count', flat=True))
        
        genre_stats = {}
        genres = set(Song.objects.values_list('genre', flat=True).distinct())
        for genre in genres:
            if genre:  # Một số bài hát có thể không có thể loại
                genre_count = Song.objects.filter(genre=genre).count()
                genre_plays = Song.objects.filter(genre=genre).aggregate(total=Sum('play_count'))['total'] or 0
                genre_stats[genre] = {
                    'song_count': genre_count,
                    'total_plays': genre_plays,
                    'avg_plays': round(genre_plays / genre_count, 2) if genre_count > 0 else 0
                }
        
        today = django.utils.timezone.now().date()
        month_plays = {}
        for i in range(30):
            date = today - timedelta(days=i)
            count = SongPlayHistory.objects.filter(played_at__date=date).count()
            month_plays[date.strftime('%Y-%m-%d')] = count
        
        top_songs = Song.objects.order_by('-play_count')[:10]
        top_songs_data = SongSerializer(top_songs, many=True).data
        
        top_playlists = Playlist.objects.annotate(
            follower_count=Count('followers')
        ).order_by('-follower_count')[:10]
        top_playlists_data = PlaylistSerializer(top_playlists, many=True).data
        
        new_users_by_day = {}
        for i in range(30):
            date = today - timedelta(days=i)
            count = User.objects.filter(
                date_joined__year=date.year,
                date_joined__month=date.month,
                date_joined__day=date.day
            ).count()
            new_users_by_day[date.strftime('%Y-%m-%d')] = count
        
        return Response({
            'overview': {
                'total_songs': total_songs,
                'total_playlists': total_playlists,
                'total_users': total_users,
                'active_users': total_active_users,
                'total_plays': total_plays,
            },
            'genre_stats': genre_stats,
            'monthly_plays': month_plays,
            'top_songs': top_songs_data,
            'top_playlists': top_playlists_data,
            'new_users': new_users_by_day
        })


class AdminUserActivityView(APIView):
    permission_classes = [permissions.IsAdminUser]
    
    def get(self, request, format=None):
        user_id = request.query_params.get('user_id')
        
        if user_id:
            try:
                user = User.objects.get(id=user_id)
                
                user_info = {
                    'id': getattr(user, 'id', None),
                    'username': user.username,
                    'email': user.email,
                    'date_joined': user.date_joined,
                    'last_login': user.last_login,
                    'is_active': user.is_active,
                }
                
                play_history = SongPlayHistory.objects.filter(user=user).order_by('-played_at')[:100]
                play_history_data = []
                for history in play_history:
                    play_history_data.append({
                        'song_id': getattr(history.song, 'id', None),
                        'song_title': history.song.title,
                        'song_artist': history.song.artist,
                        'played_at': history.played_at,
                    })
                
                favorite_genres = {}
                for history in SongPlayHistory.objects.filter(user=user):
                    genre = history.song.genre
                    if genre in favorite_genres:
                        favorite_genres[genre] += 1
                    else:
                        favorite_genres[genre] = 1
                
                favorite_genres = dict(sorted(favorite_genres.items(), 
                                             key=lambda item: item[1], 
                                             reverse=True))
                
                playlists = Playlist.objects.filter(user=user)
                playlist_data = PlaylistSerializer(playlists, many=True).data
                
                favorite_songs = user.favorite_songs.all()  # type: ignore
                favorite_songs_data = SongSerializer(favorite_songs, many=True).data
                
                today = django.utils.timezone.now().date()
                daily_activity = {}
                for i in range(30):
                    date = today - timedelta(days=i)
                    count = SongPlayHistory.objects.filter(
                        user=user,
                        played_at__year=date.year,
                        played_at__month=date.month,
                        played_at__day=date.day
                    ).count()
                    daily_activity[date.strftime('%Y-%m-%d')] = count
                
                return Response({
                    'user_info': user_info,
                    'play_history': play_history_data,
                    'favorite_genres': favorite_genres,
                    'playlists': playlist_data,
                    'favorite_songs': favorite_songs_data,
                    'daily_activity': daily_activity,
                })
            
            except User.DoesNotExist:
                return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        
        else:
            top_listeners = User.objects.annotate(
                play_count=Count('play_history')
            ).order_by('-play_count')[:10]
            
            top_listeners_data = []
            for user in top_listeners:
                play_count = SongPlayHistory.objects.filter(user=user).count()
                top_listeners_data.append({
                    'id': getattr(user, 'id', None),
                    'username': user.username,
                    'play_count': play_count,
                    'playlist_count': Playlist.objects.filter(user=user).count(),
                    'date_joined': user.date_joined,
                    'last_login': user.last_login,
                })
            
            new_users = User.objects.order_by('-date_joined')[:10]
            new_users_data = []
            for user in new_users:
                new_users_data.append({
                    'id': getattr(user, 'id', None),
                    'username': user.username,
                    'email': user.email,
                    'date_joined': user.date_joined,
                    'last_login': user.last_login,
                })
            
            active_users = User.objects.filter(
                last_login__gte=django.utils.timezone.now() - timedelta(days=7)
            ).annotate(
                recent_plays=Count('play_history', 
                                  filter=Q(play_history__played_at__gte=django.utils.timezone.now() - timedelta(days=7)))
            ).order_by('-recent_plays')[:10]
            
            active_users_data = []
            for user in active_users:
                active_users_data.append({
                    'id': getattr(user, 'id', None),
                    'username': user.username,
                    'recent_plays': getattr(user, 'recent_plays', 0),
                    'last_login': user.last_login,
                })
            
            return Response({
                'top_listeners': top_listeners_data,
                'new_users': new_users_data,
                'active_users': active_users_data,
            })

class NewAlbumsView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request, format=None):
        three_months_ago = datetime.now().date() - timedelta(days=90)
        new_albums = Album.objects.filter(release_date__gte=three_months_ago).order_by('-release_date')
        
        page_size = int(request.query_params.get('page_size', 20))
        page = int(request.query_params.get('page', 1))
        start = (page - 1) * page_size
        end = start + page_size
        
        serializer = AlbumSerializer(new_albums[start:end], many=True)
        
        return Response({
            'total': new_albums.count(),
            'page': page, 
            'page_size': page_size,
            'albums': serializer.data
        })



class ArtistViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Artist.objects.all()
    serializer_class = ArtistSerializer
    permission_classes = [AllowAny]
    
    @action(detail=True, methods=['get'])
    def songs(self, request, pk=None):
        artist = self.get_object()
        songs = Song.objects.filter(artist=artist.name)
        serializer = SongSerializer(songs, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def albums(self, request, pk=None):
        artist = self.get_object()
        albums = Album.objects.filter(artist=artist.name)
        serializer = AlbumSerializer(albums, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def popular(self, request):
        artists = Artist.objects.all()
        
        artists_data = []
        
        for artist in artists:
            songs = Song.objects.filter(artist=artist.name)
            song_count = songs.count()
            play_count = songs.aggregate(total_plays=Sum('play_count'))['total_plays'] or 0
            
            artist_info = {
                'artist': artist,
                'song_count': song_count,
                'play_count': play_count
            }
            artists_data.append(artist_info)
        
        sorted_artists = sorted(
            artists_data, 
            key=lambda x: (x['play_count'], x['song_count']), 
            reverse=True
        )
        
        limit = int(request.query_params.get('limit', 10))
        popular_artists = sorted_artists[:limit]
        
        result = []
        for artist_info in popular_artists:
            artist_data = ArtistSerializer(artist_info['artist']).data
            artist_data = dict(artist_data)
            artist_data['song_count'] = artist_info['song_count']
            artist_data['play_count'] = artist_info['play_count']
            result.append(artist_data)
            
        return Response(result)

# Cho phép người dùng chưa đăng nhập xem trang chơi nhạc 
def play_song(request):
    # Đường dẫn file mp3 mẫu, có thể lấy từ database sau
    song_url = '/media/songs/2025/04/28/TinhNho-ThanhHien-5825173_XH1ISay.mp3'
    return render(request, 'play_song.html', {'song_url': song_url})

# Thêm các API cho Queue
class QueueView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, format=None):
        queue, created = Queue.objects.get_or_create(user=request.user)
        serializer = QueueSerializer(queue)
        return Response(serializer.data)

class AddToQueueView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, format=None):
        song_id = request.data.get('song_id')
        if not song_id:
            return Response({'error': 'Cần cung cấp ID bài hát'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            song = Song.objects.get(id=song_id)
        except Song.DoesNotExist:
            return Response({'error': 'Bài hát không tồn tại'}, status=status.HTTP_404_NOT_FOUND)
        
        queue, created = Queue.objects.get_or_create(user=request.user)
        
        last_position = QueueItem.objects.filter(queue=queue).order_by('-position').first()
        position = 1 if not last_position else last_position.position + 1
        
        queue_item = QueueItem.objects.create(
            queue=queue,
            song=song,
            position=position
        )
        
        return Response({'status': 'Đã thêm vào hàng đợi', 'position': position})

class RemoveFromQueueView(APIView):
    permission_classes = [IsAuthenticated]
    
    def delete(self, request, position, format=None):
        try:
            queue = Queue.objects.get(user=request.user)
        except Queue.DoesNotExist:
            return Response({'error': 'Queue không tồn tại'}, status=status.HTTP_404_NOT_FOUND)
        
        try:
            queue_item = QueueItem.objects.get(queue=queue, position=position)
            queue_item.delete()
            
            items = QueueItem.objects.filter(queue=queue, position__gt=position).order_by('position')
            for item in items:
                item.position -= 1
                item.save()
            
            return Response({'status': 'Đã xóa khỏi hàng đợi'})
        except QueueItem.DoesNotExist:
            return Response({'error': 'Không tìm thấy bài hát ở vị trí này'}, status=status.HTTP_404_NOT_FOUND)

class ClearQueueView(APIView):
    permission_classes = [IsAuthenticated]
    
    def delete(self, request, format=None):
        try:
            queue = Queue.objects.get(user=request.user)
            QueueItem.objects.filter(queue=queue).delete()
            return Response({'status': 'Đã xóa toàn bộ hàng đợi'})
        except Queue.DoesNotExist:
            return Response({'error': 'Queue không tồn tại'}, status=status.HTTP_404_NOT_FOUND)

# Thêm API cho User Status
class UserStatusView(APIView):
    """Xem và cập nhật trạng thái nghe nhạc"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, format=None):
        status_obj, created = UserStatus.objects.get_or_create(user=request.user)
        serializer = UserStatusSerializer(status_obj)
        return Response(serializer.data)
    
    def put(self, request, format=None):
        status_obj, created = UserStatus.objects.get_or_create(user=request.user)
        
        data = {}
        if 'currently_playing' in request.data:
            try:
                song = Song.objects.get(id=request.data['currently_playing'])
                data['currently_playing'] = song
            except Song.DoesNotExist:
                pass
        
        if 'status_text' in request.data:
            data['status_text'] = request.data['status_text']
        
        if 'is_listening' in request.data:
            data['is_listening'] = request.data['is_listening']
        
        for key, value in data.items():
            setattr(status_obj, key, value)
        
        status_obj.save()
        serializer = UserStatusSerializer(status_obj)
        return Response(serializer.data)


class UserStatisticsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, format=None):
        user = request.user
        
        total_plays = SongPlayHistory.objects.filter(user=user).count()
        
        genre_stats = {}
        for play in SongPlayHistory.objects.filter(user=user).select_related('song'):
            genre = play.song.genre
            if genre in genre_stats:
                genre_stats[genre] += 1
            else:
                genre_stats[genre] = 1
        
        sorted_genres = sorted(genre_stats.items(), key=lambda x: x[1], reverse=True)
        
        genre_percentages = []
        for genre, count in sorted_genres:
            percentage = (count / total_plays) * 100 if total_plays > 0 else 0
            genre_percentages.append({
                'genre': genre,
                'count': count,
                'percentage': round(percentage, 2)
            })
        
        return Response({
            'total_plays': total_plays,
            'genre_stats': genre_percentages,
        })

class PersonalTrendsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, format=None):
        user = request.user
        
        recent_history = SongPlayHistory.objects.filter(user=user).order_by('-played_at')[:30]
        
        recent_plays = []
        song_ids = set()
        
        for history in recent_history:
            if history.song.pk not in song_ids:
                recent_plays.append(history)
                song_ids.add(history.song.pk)
                if len(recent_plays) >= 10:  # Giới hạn ở 10 bài khác nhau
                    break
        
        recent_serializer = SongPlayHistorySerializer(recent_plays, many=True, context={'request': request})
        
        last_month = datetime.now() - timedelta(days=30)
        genre_count = {}
        
        for play in SongPlayHistory.objects.filter(user=user, played_at__gte=last_month).select_related('song'):
            genre = play.song.genre
            if genre in genre_count:
                genre_count[genre] += 1
            else:
                genre_count[genre] = 1
        
        top_genres = sorted(genre_count.items(), key=lambda x: x[1], reverse=True)[:5]
        
        top_genres_list = [{'genre': genre, 'count': count} for genre, count in top_genres]
        
        return Response({
            'recent_plays': recent_serializer.data,
            'top_genres': top_genres_list
        })

# Thêm API cho đề xuất cá nhân hóa
class RecommendationsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, format=None):
        user = request.user
        
        genre_count = {}
        for play in SongPlayHistory.objects.filter(user=user).select_related('song'):
            genre = play.song.genre
            if genre in genre_count:
                genre_count[genre] += 1
            else:
                genre_count[genre] = 1
        
        top_genres = sorted(genre_count.items(), key=lambda x: x[1], reverse=True)[:5]
        top_genres = [genre for genre, _ in top_genres]
        
        played_songs = SongPlayHistory.objects.filter(user=user).values_list('song_id', flat=True)
        
        recommendations = Song.objects.filter(genre__in=top_genres).exclude(id__in=played_songs).order_by('-play_count')[:20]
        
        serializer = SongSerializer(recommendations, many=True)
        return Response(serializer.data)


# Thêm API cho lịch sử
class PlayHistoryView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, format=None):
        user = request.user
        
        history = SongPlayHistory.objects.filter(user=user).order_by('-played_at')
        
        page_size = int(request.query_params.get('page_size', 20))
        page = int(request.query_params.get('page', 1))
        start = (page - 1) * page_size
        end = start + page_size
        
        history_records = history[start:end]
        
        unique = request.query_params.get('unique', 'false').lower() == 'true'
        
        if unique:
            unique_songs = []
            song_ids = set()
            
            for record in history_records:
                if record.song.pk not in song_ids:
                    unique_songs.append(record)
                    song_ids.add(record.song.pk)
            
            serializer = SongPlayHistorySerializer(unique_songs, many=True, context={'request': request})
        else:
            serializer = SongPlayHistorySerializer(history_records, many=True, context={'request': request})
        
        return Response({
            'total': history.count(),
            'page': page, 
            'page_size': page_size,
            'history': serializer.data
        })

class SongRecommendationView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            from .models import UserRecommendation
            from .serializers import SongSerializer
            from .utils import generate_song_recommendations
            
            limit = request.query_params.get('limit', 10)
            try:
                limit = int(limit)
                limit = min(limit, 50)
            except (ValueError, TypeError):
                limit = 10
                
            user_recommendations = UserRecommendation.objects.filter(user=request.user).order_by('-score')[:limit]
            recommended_songs = [rec.song for rec in user_recommendations]
            
            if not recommended_songs:
                recommended_songs = generate_song_recommendations(request.user, limit=limit)
                
                if recommended_songs:
                    for i, song in enumerate(recommended_songs):
                        score = 1.0 - (i / len(recommended_songs))
                        UserRecommendation.objects.create(
                            user=request.user,
                            song=song,
                            score=score
                        )
            
            serializer = SongSerializer(recommended_songs, many=True, context={'request': request})
            
            return Response({
                'results': serializer.data,
                'count': len(recommended_songs)
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# API cho Admin quản lý Collaborative Playlist
class AdminCollaborativePlaylistListView(generics.ListAPIView):
    permission_classes = [IsAdminUser]
    serializer_class = PlaylistDetailSerializer
    queryset = Playlist.objects.filter(is_collaborative=True)
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['name', 'description', 'user__username']
    ordering_fields = ['name', 'created_at', 'updated_at']
    
    def get_queryset(self):
        queryset = Playlist.objects.filter(is_collaborative=True).order_by('-updated_at')
        
        owner_id = self.request.query_params.get('owner_id')
        if owner_id:
            queryset = queryset.filter(user_id=owner_id)
            
        collaborator_id = self.request.query_params.get('collaborator_id')
        if collaborator_id:
            queryset = queryset.filter(collaborators__id=collaborator_id)
            
        created_after = self.request.query_params.get('created_after')
        created_before = self.request.query_params.get('created_before')
        if created_after and created_before:
            queryset = queryset.filter(created_at__range=[created_after, created_before])
            
        return queryset

class AdminCollaborativePlaylistDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAdminUser]
    serializer_class = PlaylistDetailSerializer
    queryset = Playlist.objects.filter(is_collaborative=True)
    
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        
        old_data = {
            'name': instance.name,
            'description': instance.description,
            'is_public': instance.is_public
        }
        
        self.perform_update(serializer)
        
        new_data = {
            'name': instance.name,
            'description': instance.description,
            'is_public': instance.is_public
        }
        
        if old_data != new_data:
            details = {
                'old': old_data,
                'new': new_data,
                'admin_action': True
            }
            
            PlaylistEditHistory.log_action(
                playlist=instance,
                user=request.user,
                action='UPDATE_INFO',
                details=details
            )
        
        return Response(serializer.data)
    
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        
        PlaylistEditHistory.log_action(
            playlist=instance,
            user=request.user,
            action='DELETE',
            details={'admin_action': True}
        )
        
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)

class AdminPlaylistCollaboratorsView(generics.ListAPIView):
    permission_classes = [IsAdminUser]
    serializer_class = CollaboratorRoleSerializer
    
    def get_queryset(self):
        playlist_id = self.kwargs.get('playlist_id')
        return CollaboratorRole.objects.filter(playlist_id=playlist_id)

class AdminAddCollaboratorView(generics.CreateAPIView):
    permission_classes = [IsAdminUser]
    serializer_class = CollaboratorRoleCreateSerializer
    
    def perform_create(self, serializer):
        collaborator_role = serializer.save(added_by=self.request.user)
        
        PlaylistEditHistory.log_action(
            playlist=collaborator_role.playlist,
            user=self.request.user,
            action='ADD_COLLABORATOR',
            details={
                'role': collaborator_role.role,
                'admin_action': True
            },
            related_user=collaborator_role.user
        )

class AdminRemoveCollaboratorView(APIView):
    permission_classes = [IsAdminUser]
    
    def delete(self, request, playlist_id, user_id):
        try:
            playlist = Playlist.objects.get(id=playlist_id, is_collaborative=True)
            user = User.objects.get(id=user_id)
            
            if user == playlist.user:
                return Response(
                    {"error": "Không thể xóa chủ sở hữu playlist khỏi danh sách cộng tác viên"},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            try:
                role = CollaboratorRole.objects.get(playlist=playlist, user=user)
                role.delete()
                
                PlaylistEditHistory.log_action(
                    playlist=playlist,
                    user=request.user,
                    action='REMOVE_COLLABORATOR',
                    details={'admin_action': True},
                    related_user=user
                )
                
                return Response(status=status.HTTP_204_NO_CONTENT)
            except CollaboratorRole.DoesNotExist:
                return Response(
                    {"error": "Người dùng không phải là cộng tác viên của playlist này"},
                    status=status.HTTP_404_NOT_FOUND
                )
        except Playlist.DoesNotExist:
            return Response(
                {"error": "Không tìm thấy playlist collaborative"},
                status=status.HTTP_404_NOT_FOUND
            )
        except User.DoesNotExist:
            return Response(
                {"error": "Không tìm thấy người dùng"},
                status=status.HTTP_404_NOT_FOUND
            )

class AdminChangeCollaboratorRoleView(APIView):
    """API để admin thay đổi vai trò của người cộng tác"""
    permission_classes = [IsAdminUser]
    
    def post(self, request, playlist_id, user_id):
        try:
            playlist = Playlist.objects.get(id=playlist_id, is_collaborative=True)
            user = User.objects.get(id=user_id)
            
            if user == playlist.user:
                return Response(
                    {"error": "Không thể thay đổi vai trò của chủ sở hữu playlist"},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            try:
                role = CollaboratorRole.objects.get(playlist=playlist, user=user)
                
                new_role = request.data.get('role')
                if not new_role or new_role not in [choice[0] for choice in CollaboratorRole.ROLE_CHOICES]:
                    return Response(
                        {"error": f"Vai trò không hợp lệ. Các vai trò hợp lệ: {[choice[0] for choice in CollaboratorRole.ROLE_CHOICES]}"},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                    
                old_role = role.role
                role.role = new_role
                role.save()
                
                PlaylistEditHistory.log_action(
                    playlist=playlist,
                    user=request.user,
                    action='CHANGE_ROLE',
                    details={
                        'old_role': old_role,
                        'new_role': new_role,
                        'admin_action': True
                    },
                    related_user=user
                )
                
                return Response(CollaboratorRoleSerializer(role).data)
            except CollaboratorRole.DoesNotExist:
                return Response(
                    {"error": "Người dùng không phải là cộng tác viên của playlist này"},
                    status=status.HTTP_404_NOT_FOUND
                )
        except Playlist.DoesNotExist:
            return Response(
                {"error": "Không tìm thấy playlist collaborative"},
                status=status.HTTP_404_NOT_FOUND
            )
        except User.DoesNotExist:
            return Response(
                {"error": "Không tìm thấy người dùng"},
                status=status.HTTP_404_NOT_FOUND
            )

class AdminPlaylistEditHistoryView(generics.ListAPIView):
    """API để admin xem lịch sử chỉnh sửa của một playlist"""
    permission_classes = [IsAdminUser]
    serializer_class = PlaylistEditHistorySerializer
    
    def get_queryset(self):
        playlist_id = self.kwargs.get('playlist_id')
        return PlaylistEditHistory.objects.filter(playlist_id=playlist_id).order_by('-timestamp')
        
    def get_serializer_context(self):
        context = super().get_serializer_context()
        return context

class AdminRestorePlaylistView(APIView):
    """API để admin khôi phục playlist về một phiên bản trước đó"""
    permission_classes = [IsAdminUser]
    
    def post(self, request, playlist_id):
        history_id = request.data.get('history_id')
        if not history_id:
            return Response(
                {"error": "Cần cung cấp ID của bản ghi lịch sử để khôi phục"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            playlist = Playlist.objects.get(id=playlist_id, is_collaborative=True)
            history_entry = PlaylistEditHistory.objects.get(id=history_id, playlist=playlist)
            
            if history_entry.action == 'UPDATE_INFO':
                old_data = history_entry.details.get('old', {})
                if old_data:
                    for key, value in old_data.items():
                        if hasattr(playlist, key):
                            setattr(playlist, key, value)
                    playlist.save()
                    
                    PlaylistEditHistory.log_action(
                        playlist=playlist,
                        user=request.user,
                        action='RESTORE',
                        details={
                            'restored_from': history_id,
                            'admin_action': True
                        }
                    )
                    
                    return Response({"status": "Đã khôi phục thông tin playlist thành công"})
            elif history_entry.action in ['ADD_SONG', 'REMOVE_SONG']:
                if history_entry.related_song:
                    if history_entry.action == 'ADD_SONG':
                        playlist.songs.remove(history_entry.related_song)
                    else:
                        playlist.songs.add(history_entry.related_song)
                        
                    PlaylistEditHistory.log_action(
                        playlist=playlist,
                        user=request.user,
                        action='RESTORE',
                        details={
                            'restored_from': history_id,
                            'admin_action': True
                        },
                        related_song=history_entry.related_song
                    )
                    
                    return Response({"status": "Đã khôi phục bài hát thành công"})
            
            # Các trường hợp không hỗ trợ khôi phục
            return Response(
                {"error": f"Không hỗ trợ khôi phục cho hành động {history_entry.get_action_display()}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Playlist.DoesNotExist:
            return Response(
                {"error": "Không tìm thấy playlist collaborative"},
                status=status.HTTP_404_NOT_FOUND
            )
        except PlaylistEditHistory.DoesNotExist:
            return Response(
                {"error": "Không tìm thấy bản ghi lịch sử"},
                status=status.HTTP_404_NOT_FOUND
            )

class AdminTopSongsReportView(APIView):
    """API hiển thị báo cáo chi tiết về top bài hát cho admin"""
    permission_classes = [permissions.IsAdminUser]
    
    def get(self, request, format=None):
        period = request.query_params.get('period', 'month')  # Mặc định là thống kê theo tháng
        limit = int(request.query_params.get('limit', 20))    # Số lượng bài hát hiển thị
        
        now = django.utils.timezone.now()
        if period == 'week':
            start_date = now - timedelta(days=7)
            period_label = '7 ngày qua'
        elif period == 'month':
            start_date = now - timedelta(days=30)
            period_label = '30 ngày qua'
        elif period == 'year':
            start_date = now - timedelta(days=365)
            period_label = '365 ngày qua'
        else:  # Mặc định là all
            start_date = None
            period_label = 'Tất cả thời gian'
        
        if start_date:
            recent_plays = SongPlayHistory.objects.filter(
                played_at__gte=start_date
            ).values('song').annotate(
                recent_play_count=Count('id')
            ).order_by('-recent_play_count')[:limit]
            
            song_ids = [item['song'] for item in recent_plays]
            songs = Song.objects.filter(id__in=song_ids)
            
            results = []
            for song in songs:
                play_item = next((item for item in recent_plays if item['song'] == song.id), None)
                if play_item:
                    results.append({
                        'id': song.id,
                        'title': song.title,
                        'artist': song.artist,
                        'album': song.album,
                        'total_plays': song.play_count,
                        'recent_plays': play_item['recent_play_count'],
                        'likes': song.likes_count,
                    })
            
            results = sorted(results, key=lambda x: x['recent_plays'], reverse=True)
            
        else:
            top_songs = Song.objects.all().order_by('-play_count')[:limit]
            results = []
            for song in top_songs:
                results.append({
                    'id': song.id,
                    'title': song.title,
                    'artist': song.artist,
                    'album': song.album,
                    'total_plays': song.play_count,
                    'recent_plays': song.play_count,
                    'likes': song.likes_count,
                })
        
        return Response({
            'period': period_label,
            'generated_at': now.strftime('%Y-%m-%d %H:%M:%S'),
            'results': results
        })

class FavoriteSongsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, format=None):
        user = request.user
        favorite_songs = user.favorite_songs.all()
        serializer = SongSerializer(favorite_songs, many=True)
        return Response(serializer.data)
    
    def post(self, request, format=None):
        song_id = request.data.get('song_id')
        if not song_id:
            return Response({'error': 'Thiếu song_id'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            song = Song.objects.get(id=song_id)
        except Song.DoesNotExist:
            return Response({'error': 'Bài hát không tồn tại'}, status=status.HTTP_404_NOT_FOUND)
            
        user = request.user
        if song in user.favorite_songs.all():
            return Response({'error': 'Bài hát đã có trong danh sách yêu thích'}, status=status.HTTP_400_BAD_REQUEST)
            
        user.favorite_songs.add(song)
        song.likes_count += 1
        song.save()
        
        # Lưu hoạt động yêu thích
        UserActivity.objects.create(
            user=user,
            activity_type='LIKE',
            song=song
        )
        
        return Response({'status': 'success'}, status=status.HTTP_201_CREATED)
    
    def delete(self, request, format=None):
        song_id = request.data.get('song_id')
        if not song_id:
            return Response({'error': 'Thiếu song_id'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            song = Song.objects.get(id=song_id)
        except Song.DoesNotExist:
            return Response({'error': 'Bài hát không tồn tại'}, status=status.HTTP_404_NOT_FOUND)
            
        user = request.user
        if song not in user.favorite_songs.all():
            return Response({'error': 'Bài hát không có trong danh sách yêu thích'}, status=status.HTTP_400_BAD_REQUEST)
            
        user.favorite_songs.remove(song)
        song.likes_count = max(0, song.likes_count - 1)
        song.save()
        
        return Response({'status': 'success'}, status=status.HTTP_200_OK)

class SongDownloadView(APIView):

    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, song_id, format=None):
        song = get_object_or_404(Song, id=song_id)
        
        if not song.audio_file:
            return Response({'error': 'File âm thanh không tồn tại'}, status=status.HTTP_404_NOT_FOUND)
        
        file_path = song.audio_file.path
        
        if not os.path.exists(file_path):
            return Response({'error': 'File âm thanh không tồn tại'}, status=status.HTTP_404_NOT_FOUND)
        
        content_type, encoding = mimetypes.guess_type(file_path)
        if content_type is None:
            content_type = 'audio/mpeg'  # Mặc định cho file MP3
            
        filename = os.path.basename(file_path)
        file_size = os.path.getsize(file_path)
        
        range_header = request.META.get('HTTP_RANGE', '').strip()
        range_match = re.match(r'bytes=(\d+)-(\d*)', range_header)
        
        if range_match:
            start_byte = int(range_match.group(1))
            end_byte = int(range_match.group(2)) if range_match.group(2) else file_size - 1
            
            if end_byte >= file_size:
                end_byte = file_size - 1
            
            content_length = end_byte - start_byte + 1
            
            def file_iterator_partial(file_path, start, length, chunk_size=8192):
                with open(file_path, 'rb') as f:
                    f.seek(start)
                    bytes_read = 0
                    while bytes_read < length:
                        bytes_to_read = min(chunk_size, length - bytes_read)
                        data = f.read(bytes_to_read)
                        if not data:
                            break
                        bytes_read += len(data)
                        yield data
            
            response = StreamingHttpResponse(
                file_iterator_partial(file_path, start_byte, content_length),
                status=206,
                content_type=content_type
            )
            
            response['Content-Length'] = content_length
            response['Content-Range'] = f'bytes {start_byte}-{end_byte}/{file_size}'
        else:
            def file_iterator_full(file_path, chunk_size=8192):
                with open(file_path, 'rb') as f:
                    while True:
                        chunk = f.read(chunk_size)
                        if not chunk:
                            break
                        yield chunk
            
            response = StreamingHttpResponse(
                file_iterator_full(file_path),
                content_type=content_type
            )
            response['Content-Length'] = file_size
        
        response['Accept-Ranges'] = 'bytes'
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        
        response['Cache-Control'] = 'public, max-age=86400'  # Cache 1 ngày
        return response

class SongStreamView(APIView):
    """API phát nhạc trực tuyến với hỗ trợ Range requests"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, song_id, format=None):
        song = get_object_or_404(Song, id=song_id)
        
        if not song.audio_file:
            return Response({'error': 'File âm thanh không tồn tại'}, status=status.HTTP_404_NOT_FOUND)
        
        file_path = song.audio_file.path
        
        if not os.path.exists(file_path):
            return Response({'error': 'File âm thanh không tồn tại'}, status=status.HTTP_404_NOT_FOUND)
        
        content_type, encoding = mimetypes.guess_type(file_path)
        if content_type is None:
            content_type = 'application/octet-stream'
        
        file_size = os.path.getsize(file_path)
        
        range_header = request.META.get('HTTP_RANGE', '').strip()
        range_match = re.match(r'bytes=(\d+)-(\d*)', range_header)
        
        if range_match:
            start_byte = int(range_match.group(1))
            end_byte = int(range_match.group(2)) if range_match.group(2) else file_size - 1
            
            if end_byte >= file_size:
                end_byte = file_size - 1
            
            content_length = end_byte - start_byte + 1
            
            file_obj = open(file_path, 'rb')
            file_obj.seek(start_byte)
            
            response = StreamingHttpResponse(
                FileWrapper(file_obj, 8192),  # Chunk size 8KB
                status=206,
                content_type=content_type
            )
            
            response['Content-Length'] = content_length
            response['Content-Range'] = f'bytes {start_byte}-{end_byte}/{file_size}'
            response['Accept-Ranges'] = 'bytes'
        else:
            file_obj = open(file_path, 'rb')
            response = StreamingHttpResponse(
                FileWrapper(file_obj),
                content_type=content_type
            )
            response['Content-Length'] = file_size
            response['Accept-Ranges'] = 'bytes'
        

        return response

# Admin API ViewSets
class AdminSongViewSet(viewsets.ModelViewSet):
    """ViewSet để quản lý bài hát dành riêng cho admin"""
    queryset = Song.objects.all().order_by('-created_at')
    serializer_class = SongAdminSerializer
    permission_classes = [IsAdminUser]
    parser_classes = (MultiPartParser, FormParser)
    filter_backends = [SearchFilter, OrderingFilter, DjangoFilterBackend]
    search_fields = ['title', 'artist__name', 'album__title']
    ordering_fields = ['title', 'play_count', 'release_date', 'created_at', 'likes_count']
    filterset_fields = ['artist', 'genre', 'album', 'is_approved']
    pagination_class = PageNumberPagination
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        return context
    
    @transaction.atomic
    def create(self, request, *args, **kwargs):
        try:
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            instance = self.perform_create(serializer)
            serializer = self.get_serializer(instance)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except serializers.ValidationError as e:
            transaction.set_rollback(True)
            
            if hasattr(e, 'detail'):
                error_detail = e.detail
            else:
                error_detail = {'error': str(e)}
                
            return Response(error_detail, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            transaction.set_rollback(True)
            
            import logging, traceback
            logger = logging.getLogger(__name__)
            logger.error(f"Lỗi khi tạo bài hát: {str(e)}")
            logger.error(traceback.format_exc())
            
            return Response(
                {"error": f"Không thể tạo bài hát: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    def perform_create(self, serializer):
        """Ghi đè phương thức để đảm bảo bài hát được tạo với người dùng hiện tại nếu không có uploaded_by_id"""
        try:
            if 'uploaded_by' not in serializer.validated_data and 'uploaded_by_id' not in serializer.validated_data:
                instance = serializer.save(uploaded_by=self.request.user)
            else:
                instance = serializer.save()
            
            updated_fields = []
            
            if (not instance.duration or instance.duration == 0) and instance.audio_file:
                try:
                    if hasattr(instance.audio_file, 'path') and os.path.exists(instance.audio_file.path):
                        from tinytag import TinyTag
                        tag = TinyTag.get(instance.audio_file.path)
                        if tag.duration:
                            instance.duration = int(tag.duration)
                        else:
                            instance.duration = 180  # 3 phút mặc định
                        updated_fields.append('duration')
                except Exception as e:
                    import logging
                    logger = logging.getLogger(__name__)
                    logger.warning(f"Không thể tính duration: {str(e)}")
                    
                    if not instance.duration or instance.duration == 0:
                        instance.duration = 180  # 3 phút mặc định
                        updated_fields.append('duration')
            elif not instance.duration or instance.duration == 0:
                instance.duration = 180  # 3 phút mặc định
                updated_fields.append('duration')
            
            if updated_fields:
                instance.save(update_fields=updated_fields)
            
            return instance
        except Exception as e:
            import logging, traceback
            logger = logging.getLogger(__name__)
            logger.error(f"Lỗi trong perform_create(): {str(e)}")
            logger.error(traceback.format_exc())
            raise
    
    @transaction.atomic
    def update(self, request, *args, **kwargs):
        try:
            return super().update(request, *args, **kwargs)
        except Exception as e:
            transaction.set_rollback(True)
            
            import logging, traceback
            logger = logging.getLogger(__name__)
            logger.error(f"Lỗi khi cập nhật bài hát: {str(e)}")
            logger.error(traceback.format_exc())
            
            return Response(
                {"error": f"Không thể cập nhật bài hát: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    def perform_destroy(self, instance):
        try:
            if instance.audio_file:
                if os.path.isfile(instance.audio_file.path):
                    os.remove(instance.audio_file.path)
            
            if instance.cover_image:
                if os.path.isfile(instance.cover_image.path):
                    os.remove(instance.cover_image.path)
            
            super().perform_destroy(instance)
        except Exception as e:
            import logging, traceback
            logger = logging.getLogger(__name__)
            logger.error(f"Lỗi khi xóa bài hát: {str(e)}")
            logger.error(traceback.format_exc())
            raise serializers.ValidationError(f"Không thể xóa bài hát: {str(e)}")
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        song = self.get_object()
        song.is_approved = True
        song.save()
        return Response({'status': 'Song approved'})
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        song = self.get_object()
        song.is_approved = False
        song.save()
        return Response({'status': 'Song rejected'})
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        total_songs = Song.objects.count()
        total_plays = Song.objects.aggregate(total=Sum('play_count'))['total'] or 0
        total_likes = Song.objects.aggregate(total=Sum('likes_count'))['total'] or 0
        
        genre_counts = {}
        for song in Song.objects.all():
            if song.genre:
                genre_counts[song.genre] = genre_counts.get(song.genre, 0) + 1
        
        popular_genres = sorted(genre_counts.items(), key=lambda x: x[1], reverse=True)[:5]
        
        return Response({
            'total_songs': total_songs,
            'total_plays': total_plays,
            'total_likes': total_likes,
            'popular_genres': [{'name': genre, 'count': count} for genre, count in popular_genres]
        })

class AdminArtistViewSet(viewsets.ModelViewSet):
    """ViewSet để quản lý nghệ sĩ dành riêng cho admin"""
    queryset = Artist.objects.all()
    serializer_class = ArtistSerializer
    permission_classes = [IsAdminUser]
    parser_classes = (MultiPartParser, FormParser)
    filter_backends = [SearchFilter, OrderingFilter, DjangoFilterBackend]
    search_fields = ['name', 'bio']
    ordering_fields = ['name', 'id']
    
    def get_serializer_class(self):
        """Trả về serializer tương ứng với action"""
        if self.action in ['create', 'update', 'partial_update']:
            return AdminArtistSerializer
        return ArtistSerializer
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        return context
    
    def perform_destroy(self, instance):
        if instance.image:
            if os.path.isfile(instance.image.path):
                os.remove(instance.image.path)
        
        super().perform_destroy(instance)
    
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        serializer = self.get_serializer(
            instance, 
            data=request.data, 
            partial=partial, 
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        if getattr(instance, '_prefetched_objects_cache', None):
            instance._prefetched_objects_cache = {}
            
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def songs(self, request, pk=None):
        artist = self.get_object()
        songs = Song.objects.filter(artist=artist.name)
        serializer = SongSerializer(songs, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def upload_image(self, request, pk=None):
        artist = self.get_object()
        
        if 'image' not in request.FILES:
            return Response(
                {'error': 'Không có file hình ảnh được cung cấp'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        artist.image = request.FILES['image']
        artist.save()
        
        return Response({'status': 'Đã tải lên hình ảnh thành công'})
        
    @action(detail=True, methods=['post'])
    def update_bio(self, request, pk=None):
        artist = self.get_object()
        
        if 'bio' not in request.data:
            return Response(
                {'error': 'Tiểu sử nghệ sĩ không được cung cấp'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        artist.bio = request.data['bio']
        artist.save()
        
        return Response({'status': 'Đã cập nhật tiểu sử thành công'})

class AdminAlbumViewSet(viewsets.ModelViewSet):
    queryset = Album.objects.all().order_by('-release_date')
    serializer_class = AlbumSerializer
    permission_classes = [IsAdminUser]
    parser_classes = (MultiPartParser, FormParser)
    filter_backends = [SearchFilter, OrderingFilter, DjangoFilterBackend]
    search_fields = ['title', 'artist__name', 'description']
    ordering_fields = ['title', 'artist__name', 'release_date', 'created_at']
    filterset_fields = ['artist']
    
    def get_serializer_class(self):
        if self.action in ['retrieve', 'create', 'update', 'partial_update']:
            return AdminAlbumSerializer
        return AlbumSerializer
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        return context
        
    def perform_destroy(self, instance):
        if instance.cover_image:
            if os.path.isfile(instance.cover_image.path):
                os.remove(instance.cover_image.path)
        
            if os.path.isfile(instance.cover_image.path):
                os.remove(instance.cover_image.path)
        
        super().perform_destroy(instance)
    
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        serializer = self.get_serializer(
            instance, 
            data=request.data, 
            partial=partial, 
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        if getattr(instance, '_prefetched_objects_cache', None):
            instance._prefetched_objects_cache = {}
            
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def songs(self, request, pk=None):
        album = self.get_object()
        songs = Song.objects.filter(album=album.title)
        
        page = self.paginate_queryset(songs)
        if page is not None:
            serializer = SongSerializer(page, many=True, context={'request': request})
            return self.get_paginated_response(serializer.data)
            
        serializer = SongSerializer(songs, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def add_song(self, request, pk=None):
        album = self.get_object()
        song_id = request.data.get('song_id')
        
        if not song_id:
            return Response(
                {'error': 'Cần cung cấp song_id'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            song = Song.objects.get(id=song_id)
            song.album = album.title
            song.save()
            return Response({'status': f'Đã thêm bài hát "{song.title}" vào album'})
        except Song.DoesNotExist:
            return Response(
                {'error': 'Không tìm thấy bài hát'}, 
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['post'])
    def remove_song(self, request, pk=None):
        album = self.get_object()
        song_id = request.data.get('song_id')
        
        if not song_id:
            return Response(
                {'error': 'Cần cung cấp song_id'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            song = Song.objects.get(id=song_id)
            song.album = album.title
            song.save()
            return Response({'status': f'Đã xóa bài hát "{song.title}" khỏi album'})
        except Song.DoesNotExist:
            return Response(
                {'error': 'Không tìm thấy bài hát'}, 
                status=status.HTTP_404_NOT_FOUND
            )

class AdminGenreViewSet(viewsets.ModelViewSet):
    queryset = Genre.objects.all()
    serializer_class = GenreSerializer
    permission_classes = [IsAdminUser]
    parser_classes = (MultiPartParser, FormParser)
    filter_backends = [SearchFilter, OrderingFilter, DjangoFilterBackend]
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'id']
    
    def get_serializer_class(self):
        if self.action in ['retrieve', 'create', 'update', 'partial_update']:
            return AdminGenreSerializer
        return GenreSerializer
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        return context
        
    def perform_destroy(self, instance):
        if instance.image:
            if os.path.isfile(instance.image.path):
                os.remove(instance.image.path)
        
            if os.path.isfile(instance.image.path):
                os.remove(instance.image.path)
        
        super().perform_destroy(instance)
    
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        serializer = self.get_serializer(
            instance, 
            data=request.data, 
            partial=partial, 
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        if getattr(instance, '_prefetched_objects_cache', None):
            instance._prefetched_objects_cache = {}
            
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def songs(self, request, pk=None):
        genre = self.get_object()
        songs = Song.objects.filter(genre=genre.name)
        
        paginator = PageNumberPagination()
        paginator.page_size = 20
        result_page = paginator.paginate_queryset(songs, request)
        serializer = SongSerializer(result_page, many=True, context={'request': request})
        
        return paginator.get_paginated_response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def upload_image(self, request, pk=None):
        genre = self.get_object()
        
        if 'image' not in request.FILES:
            return Response(
                {'error': 'Không có file hình ảnh được cung cấp'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        genre.image = request.FILES['image']
        genre.save()
        
        return Response({'status': 'Đã tải lên hình ảnh thành công'})
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        genres = Genre.objects.all()
        result = []
        
        for genre in genres:
            songs = Song.objects.filter(genre=genre.name)
            songs_count = songs.count()
            
            # Số lượt nghe
            play_count = songs.aggregate(total=Sum('play_count'))['total'] or 0
            
            # Số nghệ sĩ
            artists = set()
            for song in songs:
                artists.add(song.artist)
            
            result.append({
                'id': genre.id,
                'name': genre.name,
                'songs_count': songs_count,
                'play_count': play_count,
                'artists_count': len(artists)
            })
        
        return Response(result)

class AdminPlaylistViewSet(viewsets.ModelViewSet):
    queryset = Playlist.objects.all().order_by('-created_at')
    serializer_class = PlaylistSerializer
    permission_classes = [IsAdminUser]
    parser_classes = (MultiPartParser, FormParser, JSONParser)
    filter_backends = [SearchFilter, OrderingFilter, DjangoFilterBackend]
    search_fields = ['name', 'description', 'user__username']
    ordering_fields = ['name', 'created_at', 'updated_at']
    filterset_fields = ['user', 'is_public', 'is_collaborative']
    
    def get_serializer_class(self):
        if self.action in ['retrieve', 'create', 'update', 'partial_update']:
            return AdminPlaylistSerializer
        return PlaylistSerializer
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        return context
        
    def perform_destroy(self, instance):
        if instance.cover_image:
            if os.path.isfile(instance.cover_image.path):
                os.remove(instance.cover_image.path)
        
        super().perform_destroy(instance)
    
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        serializer = self.get_serializer(
            instance, 
            data=request.data, 
            partial=partial, 
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        if getattr(instance, '_prefetched_objects_cache', None):
            instance._prefetched_objects_cache = {}
            
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def songs(self, request, pk=None):
        playlist = self.get_object()
        songs = playlist.songs.all()
        
        paginator = PageNumberPagination()
        paginator.page_size = 20
        result_page = paginator.paginate_queryset(songs, request)
        serializer = SongSerializer(result_page, many=True, context={'request': request})
        
        return paginator.get_paginated_response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def add_song(self, request, pk=None):
        playlist = self.get_object()
        song_id = request.data.get('song_id')
        
        if not song_id:
            return Response(
                {'error': 'Cần cung cấp song_id'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            song = Song.objects.get(id=song_id)
            playlist.songs.add(song)
            
            # Ghi log hành động
            PlaylistEditHistory.log_action(
                playlist=playlist,
                user=request.user,
                action='ADD_SONG',
                details={'admin_action': True},
                related_song=song
            )
            
            return Response({'status': f'Đã thêm bài hát "{song.title}" vào playlist'})
        except Song.DoesNotExist:
            return Response(
                {'error': 'Không tìm thấy bài hát'}, 
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['post'])
    def remove_song(self, request, pk=None):
        playlist = self.get_object()
        song_id = request.data.get('song_id')
        
        if not song_id:
            return Response(
                {'error': 'Cần cung cấp song_id'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            song = Song.objects.get(id=song_id)
            if song in playlist.songs.all():
                playlist.songs.remove(song)
                
                # Ghi log hành động
                PlaylistEditHistory.log_action(
                    playlist=playlist,
                    user=request.user,
                    action='REMOVE_SONG',
                    details={'admin_action': True},
                    related_song=song
                )
                
                return Response({'status': f'Đã xóa bài hát "{song.title}" khỏi playlist'})
            else:
                return Response(
                    {'error': 'Bài hát không nằm trong playlist'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        except Song.DoesNotExist:
            return Response(
                {'error': 'Không tìm thấy bài hát'}, 
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['post'])
    def upload_cover(self, request, pk=None):
        playlist = self.get_object()
        
        if 'cover_image' not in request.FILES:
            return Response(
                {'error': 'Không có file hình ảnh được cung cấp'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        old_cover = playlist.cover_image
        
        playlist.cover_image = request.FILES['cover_image']
        playlist.save()
        
        # Ghi log hành động
        PlaylistEditHistory.log_action(
            playlist=playlist,
            user=request.user,
            action='UPDATE_INFO',
            details={
                'old': {'cover_image': str(old_cover) if old_cover else None},
                'new': {'cover_image': str(playlist.cover_image)},
                'admin_action': True
            }
        )
        
        return Response({'status': 'Đã tải lên hình ảnh bìa thành công'})
    
    @action(detail=True, methods=['post'])
    def toggle_privacy(self, request, pk=None):
        playlist = self.get_object()
        
        if playlist.user != request.user:
            return Response(
                {'error': 'Bạn không có quyền chỉnh sửa playlist này'}, 
                status=status.HTTP_403_FORBIDDEN
            )
            
        playlist.is_public = not playlist.is_public
        playlist.save()
        
        return Response({
            "id": playlist.id,
            "name": playlist.name,
            "is_public": playlist.is_public,
            "updated_at": playlist.updated_at
        })
    
    @action(detail=True, methods=['post'])
    def toggle_collaborative(self, request, pk=None):
        playlist = self.get_object()
        playlist.is_collaborative = not playlist.is_collaborative
        playlist.save()
        
        PlaylistEditHistory.log_action(
            playlist=playlist,
            user=request.user,
            action='UPDATE_INFO',
            details={
                'old': {'is_collaborative': not playlist.is_collaborative},
                'new': {'is_collaborative': playlist.is_collaborative},
                'admin_action': True
            }
        )
        
        return Response({'status': f'Playlist đã được chuyển sang {"cho phép" if playlist.is_collaborative else "không cho phép"} cộng tác'})
