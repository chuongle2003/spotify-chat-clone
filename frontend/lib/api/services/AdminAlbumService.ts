import { BaseAdminService } from "./BaseAdminService";
import { AdminSong, AdminSongResponse } from "./AdminSongService";

/**
 * Interface thông tin album cho admin
 */
export interface AdminAlbum {
  id: number;
  title: string;
  artist: {
    id: number;
    name: string;
  };
  release_date: string;
  cover_image?: string;
  description?: string;
  created_at: string;
  updated_at?: string;
  total_duration?: number;
  total_plays?: number;
  songs?: AdminSong[];
}

export interface AdminAlbumResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: AdminAlbum[];
}

export interface AdminAlbumStats {
  total_albums: number;
  total_plays: number;
  top_albums: Array<{
    id: number;
    title: string;
    artist: string;
    play_count: number;
    songs_count: number;
  }>;
  artists_distribution: Array<{
    artist: string;
    albums_count: number;
    percentage: number;
  }>;
  monthly_releases: Array<{
    month: string;
    count: number;
  }>;
}

/**
 * Service xử lý quản lý album (Admin)
 */
export class AdminAlbumService extends BaseAdminService {
  private readonly BASE_URL = "/api/v1/music/admin/albums";

  /**
   * Lấy danh sách album
   * @param params Tham số tìm kiếm, lọc và phân trang
   * @returns Danh sách album phân trang
   */
  async getAlbums(params?: {
    page?: number;
    page_size?: number;
    search?: string;
    ordering?: string;
    artist_id?: number;
    year?: number;
  }) {
    return this.getPaginatedData<AdminAlbumResponse>(
      this.BASE_URL + "/",
      params
    );
  }

  /**
   * Lấy chi tiết album
   * @param id ID album
   * @returns Thông tin chi tiết album
   */
  async getAlbum(id: number) {
    return this.get<AdminAlbum>(`${this.BASE_URL}/${id}/`);
  }

  /**
   * Lấy danh sách bài hát trong album
   * @param id ID album
   * @param params Tham số tìm kiếm, lọc và phân trang
   * @returns Danh sách bài hát trong album
   */
  async getAlbumSongs(
    id: number,
    params?: {
      page?: number;
      page_size?: number;
      search?: string;
      ordering?: string;
    }
  ) {
    return this.getPaginatedData<AdminSongResponse>(
      `${this.BASE_URL}/${id}/songs/`,
      params
    );
  }

  /**
   * Thêm album mới
   * @param albumData Form data chứa thông tin album
   * @returns Thông tin album mới
   */
  async createAlbum(albumData: FormData) {
    return this.post<AdminAlbum>(this.BASE_URL + "/", albumData);
  }

  /**
   * Cập nhật album
   * @param id ID album
   * @param albumData Thông tin album cần cập nhật
   * @returns Thông tin album sau khi cập nhật
   */
  async updateAlbum(id: number, albumData: FormData) {
    return this.put<AdminAlbum>(`${this.BASE_URL}/${id}/`, albumData);
  }

  /**
   * Cập nhật một phần thông tin album
   * @param id ID album
   * @param albumData Thông tin album cần cập nhật
   * @returns Thông tin album sau khi cập nhật
   */
  async partialUpdateAlbum(
    id: number,
    albumData: Partial<AdminAlbum> | FormData
  ) {
    return this.patch<AdminAlbum>(`${this.BASE_URL}/${id}/`, albumData);
  }

  /**
   * Xóa album
   * @param id ID album
   * @returns Void
   */
  async deleteAlbum(id: number) {
    return this.delete(`${this.BASE_URL}/${id}/`);
  }

  /**
   * Thêm bài hát vào album
   * @param albumId ID album
   * @param songId ID bài hát cần thêm
   * @returns Kết quả thêm bài hát
   */
  async addSongToAlbum(albumId: number, songId: number) {
    return this.post<{
      status: string;
      message: string;
      song: { id: number; title: string };
    }>(`${this.BASE_URL}/${albumId}/add_song/`, { song_id: songId });
  }

  /**
   * Xóa bài hát khỏi album
   * @param albumId ID album
   * @param songId ID bài hát cần xóa
   * @returns Kết quả xóa bài hát
   */
  async removeSongFromAlbum(albumId: number, songId: number) {
    return this.post<{
      status: string;
      message: string;
      song: { id: number; title: string };
    }>(`${this.BASE_URL}/${albumId}/remove_song/`, { song_id: songId });
  }

  /**
   * Upload ảnh bìa album
   * @param id ID album
   * @param coverImage File ảnh bìa
   * @returns Kết quả upload
   */
  async uploadCover(id: number, coverImage: File) {
    return this.uploadFile<{
      status: string;
      message: string;
      cover_image: string;
    }>(`${this.BASE_URL}/${id}/upload_cover/`, coverImage, "cover_image");
  }

  /**
   * Lấy thống kê album
   * @param params Tham số lọc thống kê
   * @returns Dữ liệu thống kê
   */
  async getStats(params?: {
    period?: "all" | "month" | "week" | "day";
    artist_id?: number;
  }) {
    return this.get<AdminAlbumStats>(`${this.BASE_URL}/stats/`, params);
  }
}
