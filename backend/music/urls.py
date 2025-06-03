from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from django.conf import settings
from django.conf.urls.static import static
from .views import (SongRecommendationView,
                   SongDownloadView, SongStreamView)


router = DefaultRouter()
router.register(r'songs', views.SongViewSet)
router.register(r'playlists', views.PlaylistViewSet)
router.register(r'albums', views.AlbumViewSet)
router.register(r'genres', views.GenreViewSet)
router.register(r'artists', views.ArtistViewSet)

admin_router = DefaultRouter()
admin_router.register(r'songs', views.AdminSongViewSet)
admin_router.register(r'artists', views.AdminArtistViewSet)
admin_router.register(r'albums', views.AdminAlbumViewSet)
admin_router.register(r'genres', views.AdminGenreViewSet)
admin_router.register(r'playlists', views.AdminPlaylistViewSet)

urlpatterns = [
    path('', include(router.urls)),

    path('admin/', include(admin_router.urls)),
    

    path('home/', views.HomePageView.as_view(), name='home'),
    path('albums/new/', views.NewAlbumsView.as_view(), name='albums-new'),
    

    path('public/playlists/', views.PublicPlaylistView.as_view(), name='public-playlists'),
    path('public/search/', views.PublicSearchView.as_view(), name='public-search'),
    

    path('playlists/', views.UserPlaylistView.as_view(), name='user-playlists'),
    path('playlists/create/', views.CreatePlaylistView.as_view(), name='create-playlist'),
    path('features/basic/', views.BasicUserFeatures.as_view(), name='basic-features'),
    

    path('playlists/<int:pk>/update-cover/', views.PlaylistViewSet.as_view({'post': 'update_cover_image'}), name='playlist-update-cover'),
    path('playlists/<int:pk>/toggle-privacy/', views.PlaylistViewSet.as_view({'post': 'toggle_privacy'}), name='playlist-toggle-privacy'),
    path('playlists/<int:pk>/followers/', views.PlaylistViewSet.as_view({'get': 'followers'}), name='playlist-followers'),
    path('playlists/<int:pk>/add_song/', views.PlaylistViewSet.as_view({'post': 'add_song'}), name='playlist-add-song'),
    path('playlists/<int:pk>/remove_song/', views.PlaylistViewSet.as_view({'post': 'remove_song'}), name='playlist-remove-song'),
    

    path('search/', views.SearchView.as_view(), name='search'),
    path('trending/', views.TrendingSongsView.as_view(), name='trending'),
    path('recommended/', views.RecommendedSongsView.as_view(), name='recommended'),


    path('queue/', views.QueueView.as_view(), name='queue'),
    path('queue/add/', views.AddToQueueView.as_view(), name='add-to-queue'),
    path('queue/remove/<int:position>/', views.RemoveFromQueueView.as_view(), name='remove-from-queue'),
    path('queue/clear/', views.ClearQueueView.as_view(), name='clear-queue'),
    

    path('status/', views.UserStatusView.as_view(), name='user-status'),
    
    
    path('statistics/', views.UserStatisticsView.as_view(), name='user-statistics'),
    path('trends/personal/', views.PersonalTrendsView.as_view(), name='personal-trends'),
    

    path('recommendations/', views.RecommendationsView.as_view(), name='recommendations'),
    

    path('favorites/', views.FavoriteSongsView.as_view(), name='favorite-songs'),
    

    path('history/', views.PlayHistoryView.as_view(), name='play-history'),
    

    path('songs/<int:song_id>/lyrics/synced/', views.SyncedLyricsView.as_view(), name='synced-lyrics'),
    path('play/', views.play_song, name='play_song'),
    path('recommendations/songs/', SongRecommendationView.as_view(), name='song-recommendations'),
    

    path('admin/playlists/collaborative/', views.AdminCollaborativePlaylistListView.as_view(), name='admin-collaborative-playlists'),
    path('admin/playlists/collaborative/<int:pk>/', views.AdminCollaborativePlaylistDetailView.as_view(), name='admin-collaborative-playlist-detail'),
    path('admin/playlists/<int:playlist_id>/collaborators/', views.AdminPlaylistCollaboratorsView.as_view(), name='admin-playlist-collaborators'),
    path('admin/playlists/<int:playlist_id>/collaborators/add/', views.AdminAddCollaboratorView.as_view(), name='admin-add-collaborator'),
    path('admin/playlists/<int:playlist_id>/collaborators/<int:user_id>/', views.AdminRemoveCollaboratorView.as_view(), name='admin-remove-collaborator'),
    path('admin/playlists/<int:playlist_id>/collaborators/<int:user_id>/role/', views.AdminChangeCollaboratorRoleView.as_view(), name='admin-change-collaborator-role'),
    path('admin/playlists/<int:playlist_id>/edit_history/', views.AdminPlaylistEditHistoryView.as_view(), name='admin-playlist-edit-history'),
    path('admin/playlists/<int:playlist_id>/restore/', views.AdminRestorePlaylistView.as_view(), name='admin-restore-playlist'),
    

    path('admin/statistics/', views.AdminStatisticsView.as_view(), name='admin-statistics'),
    path('admin/user-activity/', views.AdminUserActivityView.as_view(), name='admin-user-activity'),
    path('admin/user-activity/<int:user_id>/', views.AdminUserActivityView.as_view(), name='admin-user-activity-detail'),
    path('admin/reports/top-songs/', views.AdminTopSongsReportView.as_view(), name='admin-top-songs-report'),
    

    path('songs/<int:song_id>/download/', SongDownloadView.as_view(), name='song-download'),
    path('songs/<int:song_id>/stream/', SongStreamView.as_view(), name='song-stream'),
]
if settings.DEBUG:
      urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)