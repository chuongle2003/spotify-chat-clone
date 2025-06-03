import { ApiRequest } from "../core/ApiRequest";
import { PaginatedResponse, PlaylistData, SongData } from "../core/types";

/**
 * Service xử lý playlist
 */
export class PlaylistService extends ApiRequest {
  /**
   * Lấy danh sách playlist
   * @param params Tham số phân trang
   * @returns Danh sách playlist phân trang
   */
  async getPlaylists(params?: { page?: number; limit?: number }) {
    return this.get<PaginatedResponse<PlaylistData>>(
      "/api/v1/music/playlists/",
      params
    );
  }

  /**
   * Lấy chi tiết playlist
   * @param id ID playlist
   * @returns Thông tin chi tiết playlist và bài hát
   */
  async getPlaylist(id: string) {
    return this.get<{ playlist: PlaylistData; songs: SongData[] }>(
      `/api/v1/music/playlists/${id}/`
    );
  }

  /**
   * Lấy danh sách playlist cộng tác
   * @returns Danh sách playlist cộng tác
   */
  async getCollaborativePlaylists() {
    return this.get<PlaylistData[]>("/api/v1/music/playlists/collaborative/");
  }

  /**
   * Lấy chi tiết playlist cộng tác
   * @param id ID playlist
   * @returns Thông tin chi tiết playlist cộng tác
   */
  async getCollaborativePlaylist(id: string) {
    return this.get<PlaylistData>(
      `/api/v1/music/playlists/collaborative/${id}/`
    );
  }

  /**
   * Lấy danh sách người cộng tác của playlist
   * @param playlistId ID playlist
   * @returns Danh sách người cộng tác
   */
  async getPlaylistCollaborators(playlistId: string) {
    return this.get(`/api/v1/music/playlists/${playlistId}/collaborators/`);
  }

  /**
   * Thêm người cộng tác vào playlist
   * @param playlistId ID playlist
   * @param data Thông tin người dùng và quyền
   * @returns Kết quả thêm
   */
  async addPlaylistCollaborator(
    playlistId: string,
    data: { user_id: string; role: string }
  ) {
    return this.post(
      `/api/v1/music/playlists/${playlistId}/collaborators/`,
      data
    );
  }

  /**
   * Cập nhật quyền của người cộng tác
   * @param playlistId ID playlist
   * @param userId ID người dùng
   * @param role Quyền mới
   * @returns Kết quả cập nhật
   */
  async updateCollaboratorRole(
    playlistId: string,
    userId: string,
    role: string
  ) {
    return this.patch(
      `/api/v1/music/playlists/${playlistId}/collaborators/${userId}/`,
      {
        role,
      }
    );
  }

  /**
   * Tạo playlist mới
   * @param data Thông tin playlist
   * @returns Thông tin playlist mới
   */
  async createPlaylist(data: {
    name: string;
    description?: string;
    is_public?: boolean;
  }) {
    return this.post<PlaylistData>("/api/v1/music/playlists/", data);
  }

  /**
   * Cập nhật thông tin playlist
   * @param playlistId ID playlist
   * @param data FormData chứa thông tin cập nhật
   * @returns Thông tin playlist sau khi cập nhật
   */
  async updatePlaylist(playlistId: string | number, data: FormData) {
    return this.request<PlaylistData>(
      "PATCH",
      `/api/v1/music/playlists/${playlistId}/`,
      data,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
  }

  /**
   * Xóa playlist
   * @param id ID playlist
   * @returns Kết quả xóa
   */
  async deletePlaylist(id: string) {
    return this.delete(`/api/v1/music/playlists/${id}/`);
  }

  /**
   * Thêm bài hát vào playlist
   * @param playlistId ID playlist
   * @param songId ID bài hát
   * @returns Kết quả thêm
   */
  async addSongToPlaylist(playlistId: string, songId: string) {
    return this.post(`/api/v1/music/playlists/${playlistId}/add_song/`, {
      song_id: songId,
    });
  }

  /**
   * Xóa bài hát khỏi playlist
   * @param playlistId ID playlist
   * @param songId ID bài hát
   * @returns Kết quả xóa
   */
  async removeSongFromPlaylist(playlistId: string, songId: string) {
    return this.post(`/api/v1/music/playlists/${playlistId}/remove_song/`, {
      song_id: songId,
    });
  }

  /**
   * Kiểm tra có theo dõi playlist hay không
   * @param playlistId ID playlist
   * @returns Kết quả kiểm tra
   */
  async checkFollowingPlaylist(playlistId: string) {
    return this.get<{ following: boolean }>(
      `/api/v1/music/playlists/${playlistId}/following/`
    );
  }

  /**
   * Theo dõi playlist
   * @param playlistId ID playlist
   * @returns Kết quả theo dõi
   */
  async followPlaylist(playlistId: string) {
    return this.post(`/api/v1/music/playlists/${playlistId}/follow/`, {});
  }

  /**
   * Bỏ theo dõi playlist
   * @param playlistId ID playlist
   * @returns Kết quả bỏ theo dõi
   */
  async unfollowPlaylist(playlistId: string) {
    return this.post(`/api/v1/music/playlists/${playlistId}/follow/`, {
      action: "unfollow",
    });
  }

  /**
   * Cập nhật ảnh bìa playlist (dùng FormData)
   * @param playlistId ID playlist
   * @param formData FormData chứa ảnh bìa
   * @returns Kết quả cập nhật
   */
  async updatePlaylistCover(playlistId: string, formData: FormData) {
    return this.request<PlaylistData>(
      "POST",
      `/api/v1/music/playlists/${playlistId}/update_cover_image/`,
      formData
    );
  }

  /**
   * Cập nhật ảnh bìa playlist từ bài hát
   * @param playlistId ID playlist
   * @param songId ID bài hát để lấy ảnh bìa
   * @returns Kết quả cập nhật
   */
  async updatePlaylistCoverFromSong(playlistId: string, songId: string) {
    return this.post<PlaylistData>(
      `/api/v1/music/playlists/${playlistId}/update_cover_image/`,
      {
        song_id: songId,
      }
    );
  }

  /**
   * Chuyển đổi chế độ riêng tư của playlist
   * @param playlistId ID playlist
   * @returns Kết quả chuyển đổi
   */
  async togglePlaylistPrivacy(playlistId: string) {
    return this.post<PlaylistData>(
      `/api/v1/music/playlists/${playlistId}/toggle_privacy/`,
      {}
    );
  }

  /**
   * Lấy danh sách người theo dõi playlist
   * @param playlistId ID playlist
   * @returns Danh sách người theo dõi
   */
  async getPlaylistFollowers(playlistId: string) {
    return this.get(`/api/v1/music/playlists/${playlistId}/followers/`);
  }

  /**
   * Chia sẻ playlist với người dùng khác
   * @param playlistId ID playlist
   * @param receiverId ID người nhận
   * @param content Nội dung chia sẻ
   * @returns Kết quả chia sẻ
   */
  async sharePlaylist(playlistId: string, receiverId: string, content: string) {
    return this.post(`/api/v1/music/share/playlist/${playlistId}/`, {
      receiver_id: receiverId,
      content,
    });
  }
}
