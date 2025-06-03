import { BaseAdminService } from "./BaseAdminService";

/**
 * Interface thông tin playlist cho admin
 */
export interface AdminPlaylist {
  id: number;
  name: string;
  description?: string;
  user: {
    id: number;
    username: string;
  };
  cover_image?: string;
  is_public: boolean;
  is_collaborative: boolean;
  songs?: Array<{
    id: number;
    title: string;
    artist: string;
    duration: number;
    cover_image?: string;
  }>;
  collaborators?: Array<{
    id: number;
    user: {
      id: number;
      username: string;
    };
    role: string;
    added_at: string;
    added_by: {
      id: number;
      username: string;
    };
  }>;
  followers_count: number;
  created_at: string;
  updated_at?: string;
}

export interface AdminPlaylistResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: AdminPlaylist[];
}

export interface PlaylistEditHistory {
  id: number;
  user: {
    id: number;
    username: string;
  };
  action: string;
  timestamp: string;
  details?: Record<string, any>;
  related_song?: {
    id: number;
    title: string;
    artist: string;
  } | null;
  related_user?: {
    id: number;
    username: string;
  } | null;
}

export interface PlaylistEditHistoryResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: PlaylistEditHistory[];
}

/**
 * Service xử lý quản lý playlist (Admin)
 */
export class AdminPlaylistService extends BaseAdminService {
  private readonly BASE_URL = "/api/v1/music/admin/playlists";

  /**
   * Lấy danh sách playlist
   * @param params Tham số tìm kiếm, lọc và phân trang
   * @returns Danh sách playlist phân trang hoặc mảng playlist
   */
  async getPlaylists(params?: {
    page?: number;
    page_size?: number;
    search?: string;
    ordering?: string;
    user?: number;
    is_public?: boolean;
    is_collaborative?: boolean;
  }): Promise<AdminPlaylistResponse | AdminPlaylist[]> {
    try {
      const response = await this.getPaginatedData<AdminPlaylistResponse>(
        this.BASE_URL + "/",
        params
      );
      return response;
    } catch (error) {
      // Kiểm tra nếu lỗi liên quan đến định dạng, thử gọi lại với phương thức khác
      console.warn(
        "Lỗi khi tải danh sách playlist với định dạng phân trang, thử lại với định dạng mảng",
        error
      );
      return this.get<AdminPlaylist[]>(this.BASE_URL + "/", { params });
    }
  }

  /**
   * Lấy chi tiết playlist
   * @param id ID playlist
   * @returns Thông tin chi tiết playlist
   */
  async getPlaylist(id: number) {
    return this.get<AdminPlaylist>(`${this.BASE_URL}/${id}/`);
  }

  /**
   * Thêm playlist mới
   * @param playlistData Dữ liệu playlist mới
   * @returns Thông tin playlist mới
   */
  async createPlaylist(playlistData: {
    name: string;
    description?: string;
    is_public?: boolean;
    is_collaborative?: boolean;
    user?: number;
    songs?: number[];
  }) {
    return this.post<AdminPlaylist>(this.BASE_URL + "/", playlistData);
  }

  /**
   * Cập nhật playlist
   * @param id ID playlist
   * @param playlistData Thông tin playlist cần cập nhật
   * @returns Thông tin playlist sau khi cập nhật
   */
  async updatePlaylist(
    id: number,
    playlistData: {
      name?: string;
      description?: string;
      is_public?: boolean;
      is_collaborative?: boolean;
      songs?: number[];
    }
  ) {
    return this.put<AdminPlaylist>(`${this.BASE_URL}/${id}/`, playlistData);
  }

  /**
   * Cập nhật một phần thông tin playlist
   * @param id ID playlist
   * @param playlistData Thông tin playlist cần cập nhật
   * @returns Thông tin playlist sau khi cập nhật
   */
  async partialUpdatePlaylist(
    id: number,
    playlistData: Partial<{
      name: string;
      description?: string;
      is_public?: boolean;
      is_collaborative?: boolean;
      songs?: number[];
    }>
  ) {
    return this.patch<AdminPlaylist>(`${this.BASE_URL}/${id}/`, playlistData);
  }

  /**
   * Xóa playlist
   * @param id ID playlist
   * @returns Void
   */
  async deletePlaylist(id: number) {
    return this.delete(`${this.BASE_URL}/${id}/`);
  }

  /**
   * Thêm bài hát vào playlist
   * @param playlistId ID playlist
   * @param songId ID bài hát cần thêm
   * @returns Kết quả thêm bài hát
   */
  async addSongToPlaylist(playlistId: number, songId: number) {
    return this.post<{ status: string }>(
      `${this.BASE_URL}/${playlistId}/add_song/`,
      { song_id: songId }
    );
  }

  /**
   * Xóa bài hát khỏi playlist
   * @param playlistId ID playlist
   * @param songId ID bài hát cần xóa
   * @returns Kết quả xóa bài hát
   */
  async removeSongFromPlaylist(playlistId: number, songId: number) {
    return this.post<{ status: string }>(
      `${this.BASE_URL}/${playlistId}/remove_song/`,
      { song_id: songId }
    );
  }

  /**
   * Upload ảnh bìa playlist
   * @param id ID playlist
   * @param coverImage File ảnh bìa
   * @returns Kết quả upload
   */
  async uploadCover(id: number, coverImage: File) {
    return this.uploadFile<{ status: string }>(
      `${this.BASE_URL}/${id}/upload_cover/`,
      coverImage,
      "cover_image"
    );
  }

  /**
   * Chuyển đổi trạng thái công khai/riêng tư của playlist
   * @param id ID playlist
   * @returns Kết quả chuyển đổi
   */
  async togglePrivacy(id: number) {
    return this.post<{ status: string }>(
      `${this.BASE_URL}/${id}/toggle_privacy/`,
      {}
    );
  }

  /**
   * Chuyển đổi trạng thái cộng tác của playlist
   * @param id ID playlist
   * @returns Kết quả chuyển đổi
   */
  async toggleCollaborative(id: number) {
    return this.post<{ status: string }>(
      `${this.BASE_URL}/${id}/toggle_collaborative/`,
      {}
    );
  }

  /**
   * Lấy danh sách playlist cộng tác
   * @param params Tham số tìm kiếm, lọc và phân trang
   * @returns Danh sách playlist cộng tác
   */
  async getCollaborativePlaylists(params?: {
    page?: number;
    page_size?: number;
    search?: string;
    ordering?: string;
    owner_id?: number;
    collaborator_id?: number;
  }) {
    return this.getPaginatedData<AdminPlaylistResponse>(
      `${this.BASE_URL}/collaborative/`,
      params
    );
  }

  /**
   * Lấy chi tiết playlist cộng tác
   * @param id ID playlist
   * @returns Thông tin chi tiết playlist cộng tác
   */
  async getCollaborativePlaylist(id: number) {
    return this.get<AdminPlaylist>(`${this.BASE_URL}/collaborative/${id}/`);
  }

  /**
   * Lấy danh sách cộng tác viên của playlist
   * @param playlistId ID playlist
   * @returns Danh sách cộng tác viên
   */
  async getPlaylistCollaborators(playlistId: number) {
    return this.get<
      Array<{
        id: number;
        user: {
          id: number;
          username: string;
        };
        role: string;
        added_at: string;
        added_by: {
          id: number;
          username: string;
        };
      }>
    >(`${this.BASE_URL}/${playlistId}/collaborators/`);
  }

  /**
   * Thêm cộng tác viên vào playlist
   * @param playlistId ID playlist
   * @param userId ID người dùng cần thêm
   * @param role Vai trò (EDITOR/VIEWER)
   * @returns Thông tin cộng tác viên mới
   */
  async addCollaborator(playlistId: number, userId: number, role: string) {
    return this.post<{
      id: number;
      user: {
        id: number;
        username: string;
      };
      role: string;
      added_at: string;
      added_by: {
        id: number;
        username: string;
      };
      playlist: number;
    }>(`${this.BASE_URL}/${playlistId}/collaborators/add/`, {
      user: userId,
      role,
      playlist: playlistId,
    });
  }

  /**
   * Xóa cộng tác viên khỏi playlist
   * @param playlistId ID playlist
   * @param userId ID người dùng cần xóa
   * @returns Void
   */
  async removeCollaborator(playlistId: number, userId: number) {
    return this.delete(
      `${this.BASE_URL}/${playlistId}/collaborators/${userId}/`
    );
  }

  /**
   * Thay đổi vai trò cộng tác viên
   * @param playlistId ID playlist
   * @param userId ID cộng tác viên
   * @param role Vai trò mới (EDITOR/VIEWER)
   * @returns Thông tin cộng tác viên sau khi cập nhật
   */
  async changeCollaboratorRole(
    playlistId: number,
    userId: number,
    role: string
  ) {
    return this.post<{
      id: number;
      user: {
        id: number;
        username: string;
      };
      role: string;
      added_at: string;
      added_by: {
        id: number;
        username: string;
      };
      playlist: number;
    }>(`${this.BASE_URL}/${playlistId}/collaborators/${userId}/role/`, {
      role,
    });
  }

  /**
   * Lấy lịch sử chỉnh sửa playlist
   * @param playlistId ID playlist
   * @param params Tham số phân trang
   * @returns Lịch sử chỉnh sửa
   */
  async getEditHistory(
    playlistId: number,
    params?: {
      page?: number;
      page_size?: number;
    }
  ) {
    return this.getPaginatedData<PlaylistEditHistoryResponse>(
      `${this.BASE_URL}/${playlistId}/edit_history/`,
      params
    );
  }

  /**
   * Khôi phục playlist từ một phiên bản cũ
   * @param playlistId ID playlist
   * @param historyId ID của bản ghi lịch sử
   * @returns Kết quả khôi phục
   */
  async restoreFromHistory(playlistId: number, historyId: number) {
    return this.post<{ status: string }>(
      `${this.BASE_URL}/${playlistId}/restore/`,
      { history_id: historyId }
    );
  }
}
