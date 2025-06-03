/**
 * Các interface dùng chung cho API
 */

// Interface cho response của thông tin người dùng
export interface UserResponse {
  is_admin: boolean;
  id: string;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  profile_image?: string;
  following?: string[];
  created_at?: string;
}

// Interface cho response của API đăng nhập
export interface LoginResponse {
  access: string;
  refresh: string;
  user: {
    id: number;
    username: string;
    email: string;
    first_name?: string;
    last_name?: string;
    avatar?: string | null;
    bio?: string;
    is_admin: boolean;
  };
}

// Interface cho dữ liệu đăng ký người dùng
export interface RegisterUserData {
  email: string;
  username?: string;
  password?: string;
  first_name?: string;
  last_name?: string;
  bio?: string;
}

// Interface cho phân trang
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Interface cho dữ liệu bài hát
export interface SongData {
  id: string;
  title: string;
  artist: string;
  album?: string;
  genre?: string;
  duration: number;
  play_count: number;
  uploaded_by?: UserResponse;
  cover_image?: string;
  audio_file: string;
  created_at: string;
  updated_at: string;
}

// Interface cho dữ liệu album
export interface AlbumData {
  id: string;
  title: string;
  artist: string;
  year: number;
  genre?: string;
  cover_image?: string;
  created_at: string;
  updated_at: string;
}

// Interface cho dữ liệu playlist
export interface PlaylistData {
  id: string;
  name: string;
  description?: string;
  is_public: boolean;
  owner: UserResponse;
  cover_image?: string;
  songs_count: number;
  created_at: string;
  updated_at: string;
}

// Interface cho dữ liệu nghệ sĩ
export interface ArtistData {
  id: number;
  name: string;
  bio?: string;
  image?: string;
  followers_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface MusicCollection {
  getPlaylists(params?: {
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<PlaylistData>>;
  getPlaylist(id: string): Promise<PlaylistData>;
  createPlaylist(data: FormData): Promise<PlaylistData>;
  updatePlaylist(
    playlistId: string | number,
    data: FormData
  ): Promise<PlaylistData>;
  deletePlaylist(id: string): Promise<void>;
  addSongToPlaylist(playlistId: string, songId: string): Promise<any>;
  removeSongFromPlaylist(playlistId: string, songId: string): Promise<any>;
  followPlaylist(playlistId: string): Promise<any>;
  unfollowPlaylist(playlistId: string): Promise<any>;
  checkFollowingPlaylist(playlistId: string): Promise<{ following: boolean }>;
  getPlaylistFollowers(playlistId: string): Promise<any>;
  togglePlaylistPrivacy(playlistId: string): Promise<PlaylistData>;
  updateCoverImage(
    playlistId: string,
    data: FormData | { song_id: string }
  ): Promise<Partial<PlaylistData>>;
  sharePlaylist(
    playlistId: string,
    receiverId: string,
    content: string
  ): Promise<any>;
}
