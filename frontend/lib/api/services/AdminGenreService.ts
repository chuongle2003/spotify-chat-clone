import { BaseAdminService } from "./BaseAdminService";
import { AdminSongResponse } from "./AdminSongService";

/**
 * Interface thông tin thể loại nhạc cho admin
 */
export interface AdminGenre {
  id: number;
  name: string;
  description?: string;
  image?: string;
  songs_count: number;
  artists_count: number;
  is_featured: boolean;
  created_at: string;
  updated_at?: string;
  top_songs?: Array<{
    id: number;
    title: string;
    artist: {
      id: number;
      name: string;
    };
    cover_image?: string;
    play_count: number;
    likes_count: number;
    duration: number;
  }>;
  top_artists?: Array<{
    id: number;
    name: string;
    songs_count: number;
    play_count: number;
  }>;
}

export interface AdminGenreResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: AdminGenre[];
}

export interface AdminGenreStats {
  total_genres: number;
  featured_genres: number;
  most_popular_genres: Array<{
    id: number;
    name: string;
    songs_count: number;
    play_count: number;
    artists_count: number;
    percentage: number;
  }>;
  least_popular_genres: Array<{
    id: number;
    name: string;
    songs_count: number;
    play_count: number;
    artists_count: number;
    percentage: number;
  }>;
  monthly_trends: Array<{
    month: string;
    top_genre: string;
    plays: number;
  }>;
}

/**
 * Service xử lý quản lý thể loại nhạc (Admin)
 */
export class AdminGenreService extends BaseAdminService {
  private readonly BASE_URL = "/api/v1/music/admin/genres";

  /**
   * Lấy danh sách thể loại
   * @param params Tham số tìm kiếm, lọc và phân trang
   * @returns Danh sách thể loại phân trang
   */
  async getGenres(params?: {
    page?: number;
    page_size?: number;
    search?: string;
    ordering?: string;
    is_featured?: boolean;
  }) {
    return this.getPaginatedData<AdminGenreResponse>(
      this.BASE_URL + "/",
      params
    );
  }

  /**
   * Lấy chi tiết thể loại
   * @param id ID thể loại
   * @returns Thông tin chi tiết thể loại
   */
  async getGenre(id: number) {
    return this.get<AdminGenre>(`${this.BASE_URL}/${id}/`);
  }

  /**
   * Thêm thể loại mới
   * @param genreData Form data chứa thông tin thể loại
   * @returns Thông tin thể loại mới
   */
  async createGenre(genreData: FormData) {
    return this.post<AdminGenre>(this.BASE_URL + "/", genreData);
  }

  /**
   * Cập nhật thể loại
   * @param id ID thể loại
   * @param genreData Thông tin thể loại cần cập nhật
   * @returns Thông tin thể loại sau khi cập nhật
   */
  async updateGenre(id: number, genreData: FormData) {
    return this.put<AdminGenre>(`${this.BASE_URL}/${id}/`, genreData);
  }

  /**
   * Cập nhật một phần thông tin thể loại
   * @param id ID thể loại
   * @param genreData Thông tin thể loại cần cập nhật
   * @returns Thông tin thể loại sau khi cập nhật
   */
  async partialUpdateGenre(
    id: number,
    genreData: Partial<AdminGenre> | FormData
  ) {
    return this.patch<AdminGenre>(`${this.BASE_URL}/${id}/`, genreData);
  }

  /**
   * Xóa thể loại
   * @param id ID thể loại
   * @returns Void
   */
  async deleteGenre(id: number) {
    return this.delete(`${this.BASE_URL}/${id}/`);
  }

  /**
   * Upload ảnh thể loại
   * @param id ID thể loại
   * @param imageFile File ảnh
   * @returns Kết quả upload
   */
  async uploadImage(id: number, imageFile: File) {
    return this.uploadFile<{ status: string; message: string; image: string }>(
      `${this.BASE_URL}/${id}/upload_image/`,
      imageFile,
      "image"
    );
  }

  /**
   * Lấy danh sách bài hát theo thể loại
   * @param id ID thể loại
   * @param params Tham số tìm kiếm, lọc và phân trang
   * @returns Danh sách bài hát thuộc thể loại
   */
  async getGenreSongs(
    id: number,
    params?: {
      page?: number;
      page_size?: number;
      ordering?: string;
      album_id?: number;
      artist_id?: number;
      is_approved?: boolean;
    }
  ) {
    return this.getPaginatedData<AdminSongResponse>(
      `${this.BASE_URL}/${id}/songs/`,
      params
    );
  }

  /**
   * Lấy thống kê thể loại
   * @param params Tham số lọc thống kê
   * @returns Dữ liệu thống kê
   */
  async getStats(params?: { period?: "all" | "month" | "week" | "day" }) {
    return this.get<AdminGenreStats>(`${this.BASE_URL}/stats/`, params);
  }
}
