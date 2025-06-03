import { SongType } from "@/components/music/SongCard";
import { AlbumType } from "@/components/music/AlbumCard";
import { PlaylistType } from "@/components/music/PlaylistCard";



// Delay helper để giả lập delay của API
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// API Routes
export const musicApi = {
  // Trending songs
  getTrendingSongs: async (): Promise<{
    trending_period_days: number;
    results: any[];
  }> => {
    // Thay vì sử dụng mocked data, sẽ gọi API thật
    try {
      const response = await fetch(
        "https://spotifybackend.shop/api/v1/music/songs/trending/"
      );
      if (!response.ok) {
        throw new Error("Không thể lấy trending songs");
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching trending songs:", error);
      throw error;
    }
  },

  // Bài hát
  getSongs: async (params?: {
    page?: number;
    limit?: number;
  }): Promise<{ data: SongType[]; total: number }> => {
    await delay(500); // Giả lập độ trễ mạng
    const limit = params?.limit || 10;
    return {
      data: mockSongs.slice(0, limit),
      total: mockSongs.length,
    };
  },

  getSong: async (id: number): Promise<SongType> => {
    await delay(500);
    const song = mockSongs.find((song) => song.id === id);
    if (!song) throw new Error("Không tìm thấy bài hát");
    return song;
  },

  // Album
  getAlbums: async (params?: {
    page?: number;
    limit?: number;
  }): Promise<{ data: AlbumType[]; total: number }> => {
    await delay(500);
    const limit = params?.limit || 10;
    return {
      data: mockAlbums.slice(0, limit),
      total: mockAlbums.length,
    };
  },

  getAlbum: async (
    id: number
  ): Promise<{ album: AlbumType; songs: SongType[] }> => {
    await delay(500);
    const album = mockAlbums.find((album) => album.id === id);
    if (!album) throw new Error("Không tìm thấy album");

    // Lấy bài hát thuộc album này
    const albumSongs = mockSongs.filter((song) => song.album.id === id);

    return {
      album,
      songs: albumSongs,
    };
  },

  // Playlist
  getPlaylists: async (params?: {
    page?: number;
    limit?: number;
  }): Promise<{ data: PlaylistType[]; total: number }> => {
    await delay(500);
    const limit = params?.limit || 10;
    return {
      data: mockPlaylists.slice(0, limit),
      total: mockPlaylists.length,
    };
  },

  getPlaylist: async (
    id: number
  ): Promise<{ playlist: PlaylistType; songs: SongType[] }> => {
    await delay(500);
    const playlist = mockPlaylists.find((playlist) => playlist.id === id);
    if (!playlist) throw new Error("Không tìm thấy playlist");

    // Chọn ngẫu nhiên 10 bài hát cho playlist
    const shuffled = [...mockSongs].sort(() => 0.5 - Math.random());
    const playlistSongs = shuffled.slice(0, 10);

    return {
      playlist,
      songs: playlistSongs,
    };
  },

  createPlaylist: async (data: {
    name: string;
    description?: string;
    is_public?: boolean;
  }): Promise<PlaylistType> => {
    await delay(500);
    // Mock tạo playlist mới
    const newPlaylist: PlaylistType = {
      id: mockPlaylists.length + 1,
      name: data.name,
      description: data.description || "",
      is_public: data.is_public ?? true,
      cover_image: "/placeholder.jpg",
      user: {
        id: 1,
        username: "current_user",
        avatar: null,
      },
      songs_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    return newPlaylist;
  },

  updatePlaylist: async (
    id: number,
    data: { name?: string; description?: string; is_public?: boolean }
  ): Promise<PlaylistType> => {
    await delay(500);
    const playlist = mockPlaylists.find((p) => p.id === id);
    if (!playlist) throw new Error("Không tìm thấy playlist");

    // Mock cập nhật playlist
    const updatedPlaylist = {
      ...playlist,
      name: data.name || playlist.name,
      description:
        data.description !== undefined
          ? data.description
          : playlist.description,
      is_public:
        data.is_public !== undefined ? data.is_public : playlist.is_public,
      updated_at: new Date().toISOString(),
    };

    return updatedPlaylist;
  },

  deletePlaylist: async (id: number): Promise<void> => {
    await delay(500);
    // Giả lập xóa playlist

  },

  addSongToPlaylist: async (
    playlistId: number,
    songId: number
  ): Promise<void> => {
    await delay(500);

  },

  removeSongFromPlaylist: async (
    playlistId: number,
    songId: number
  ): Promise<void> => {
    await delay(500);
    // Giả lập xóa bài hát khỏi playlist
  },

  // Tìm kiếm
  search: async (
    query: string
  ): Promise<{
    songs: SongType[];
    albums: AlbumType[];
    playlists: PlaylistType[];
  }> => {
    await delay(500);
    // Tìm kiếm dựa trên query
    const lowerQuery = query.toLowerCase();

    const filteredSongs = mockSongs.filter(
      (song) =>
        song.title.toLowerCase().includes(lowerQuery) ||
        song.artist.name.toLowerCase().includes(lowerQuery)
    );

    const filteredAlbums = mockAlbums.filter(
      (album) =>
        album.title.toLowerCase().includes(lowerQuery) ||
        album.artist.name.toLowerCase().includes(lowerQuery)
    );

    const filteredPlaylists = mockPlaylists.filter(
      (playlist) =>
        playlist.name.toLowerCase().includes(lowerQuery) ||
        playlist.description.toLowerCase().includes(lowerQuery)
    );

    return {
      songs: filteredSongs,
      albums: filteredAlbums,
      playlists: filteredPlaylists,
    };
  },

  // Nghệ sĩ
  getArtists: async (params?: {
    page?: number;
    limit?: number;
  }): Promise<{ data: any[]; total: number }> => {
    try {
      // Gọi API thật để lấy danh sách nghệ sĩ
      const response = await fetch(
        "https://spotifybackend.shop/api/v1/music/artists/"
      );
      if (!response.ok) {
        throw new Error("Không thể lấy danh sách nghệ sĩ");
      }
      const artists = await response.json();
      const limit = params?.limit || 10;

      // Map dữ liệu từ API để đảm bảo nó khớp với cấu trúc dữ liệu hiện tại
      const mappedArtists = artists.map((artist: any) => ({
        id: artist.id,
        name: artist.name,
        bio: artist.bio,
        image: artist.image,
        monthly_listeners: 1000000, // Giả định số người nghe hàng tháng
      }));

      return {
        data: mappedArtists.slice(0, limit),
        total: artists.length,
      };
    } catch (error) {
      console.error("Error fetching artists:", error);
      // Fallback về dữ liệu giả lập nếu có lỗi
      const limit = params?.limit || 10;
      return {
        data: mockArtists.slice(0, limit),
        total: mockArtists.length,
      };
    }
  },

  getArtist: async (id: number): Promise<any> => {
    await delay(500);
    const artist = mockArtists.find((artist) => artist.id === id);
    if (!artist) throw new Error("Không tìm thấy nghệ sĩ");

    // Lấy bài hát của nghệ sĩ này
    const artistSongs = mockSongs.filter((song) => song.artist.id === id);

    // Lấy album của nghệ sĩ này
    const artistAlbums = mockAlbums.filter((album) => album.artist.id === id);

    return {
      artist,
      songs: artistSongs,
      albums: artistAlbums,
    };
  },

  getArtistSongs: async (id: number): Promise<SongType[]> => {
    await delay(500);
    return mockSongs.filter((song) => song.artist.id === id);
  },

  getArtistAlbums: async (id: number): Promise<AlbumType[]> => {
    await delay(500);
    return mockAlbums.filter((album) => album.artist.id === id);
  },
};
