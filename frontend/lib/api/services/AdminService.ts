import { ApiRequest } from "../core/ApiRequest";

/**
 * Service quản lý các API admin
 */
export class AdminService extends ApiRequest {
  /**
   * Lấy thống kê tổng quan
   */
  async getStatistics() {
    return this.get<{
      overview: {
        total_songs: number;
        total_playlists: number;
        total_users: number;
        active_users: number;
        total_plays: number;
      };
      genre_stats: Record<
        string,
        {
          song_count: number;
          total_plays: number;
          avg_plays: number;
        }
      >;
      monthly_plays: Record<string, number>;
      top_songs: any[];
      top_playlists: any[];
      new_users: Record<string, number>;
    }>("/api/v1/music/admin/statistics/");
  }

  /**
   * Lấy thông tin hoạt động người dùng
   */
  async getUserActivity(userId?: number) {
    if (userId) {
      return this.get(`/api/v1/music/admin/user-activity/${userId}/`);
    }
    return this.get("/api/v1/music/admin/user-activity/");
  }

  /**
   * Lấy báo cáo top bài hát
   */
  async getTopSongsReport(period: string = "month", limit: number = 20) {
    return this.get("/api/v1/music/admin/reports/top-songs/", {
      period,
      limit,
    });
  }

  /**
   * Lấy báo cáo top thể loại
   */
  async getTopGenresReport(period: string = "month") {
    return this.get("/api/v1/music/admin/reports/top-genres/", { period });
  }

  /**
   * Lấy danh sách collaborative playlist
   */
  async getCollaborativePlaylists(params?: {
    page?: number;
    page_size?: number;
    owner_id?: number;
    collaborator_id?: number;
    search?: string;
    ordering?: string;
    created_after?: string;
    created_before?: string;
  }) {
    return this.get("/api/v1/music/admin/playlists/collaborative/", params);
  }

  /**
   * Lấy chi tiết collaborative playlist
   */
  async getCollaborativePlaylistDetail(playlistId: number) {
    return this.get(
      `/api/v1/music/admin/playlists/collaborative/${playlistId}/`
    );
  }

  /**
   * Cập nhật collaborative playlist
   */
  async updateCollaborativePlaylist(
    playlistId: number,
    data: {
      name?: string;
      description?: string;
      is_public?: boolean;
    }
  ) {
    return this.patch(
      `/api/v1/music/admin/playlists/collaborative/${playlistId}/`,
      data
    );
  }

  /**
   * Xóa collaborative playlist
   */
  async deleteCollaborativePlaylist(playlistId: number) {
    return this.delete(
      `/api/v1/music/admin/playlists/collaborative/${playlistId}/`
    );
  }

  /**
   * Lấy danh sách người cộng tác
   */
  async getPlaylistCollaborators(playlistId: number) {
    return this.get(
      `/api/v1/music/admin/playlists/${playlistId}/collaborators/`
    );
  }

  /**
   * Thêm người cộng tác
   */
  async addPlaylistCollaborator(
    playlistId: number,
    data: {
      user: number;
      role: string;
    }
  ) {
    return this.post(
      `/api/v1/music/admin/playlists/${playlistId}/collaborators/add/`,
      data
    );
  }

  /**
   * Xóa người cộng tác
   */
  async removePlaylistCollaborator(playlistId: number, userId: number) {
    return this.delete(
      `/api/v1/music/admin/playlists/${playlistId}/collaborators/${userId}/`
    );
  }

  /**
   * Thay đổi vai trò người cộng tác
   */
  async changeCollaboratorRole(
    playlistId: number,
    userId: number,
    data: {
      role: string;
    }
  ) {
    return this.post(
      `/api/v1/music/admin/playlists/${playlistId}/collaborators/${userId}/role/`,
      data
    );
  }

  /**
   * Lấy lịch sử chỉnh sửa playlist
   */
  async getPlaylistEditHistory(playlistId: number) {
    return this.get(
      `/api/v1/music/admin/playlists/${playlistId}/edit_history/`
    );
  }

  /**
   * Khôi phục phiên bản cũ của playlist
   */
  async restorePlaylist(playlistId: number, historyId: number) {
    return this.post(`/api/v1/music/admin/playlists/${playlistId}/restore/`, {
      history_id: historyId,
    });
  }
}
