import { BaseAdminService } from "./BaseAdminService";
import { AdminSong, AdminSongResponse } from "./AdminSongService";

/**
 * Interface thông tin nghệ sĩ cho admin
 */
export interface AdminArtist {
  id: number;
  name: string;
  bio?: string;
  image?: string;
  songs_count: number;
  albums_count: number;
  total_plays?: number;
  total_likes?: number;
  is_featured: boolean;
  genres?: Array<{
    id: number;
    name: string;
  }>;
  top_songs?: Array<{
    id: number;
    title: string;
    play_count: number;
    likes_count: number;
  }>;
  created_at: string;
  updated_at?: string;
}

export interface AdminArtistResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: AdminArtist[];
}

export interface AdminArtistStats {
  total_artists: number;
  featured_artists: number;
  top_artists: Array<{
    id: number;
    name: string;
    play_count: number;
    likes_count: number;
    songs_count: number;
  }>;
  genres_distribution: Array<{
    genre: string;
    artists_count: number;
    percentage: number;
  }>;
  monthly_registrations: Array<{
    month: string;
    count: number;
  }>;
}

interface AdminAlbumBasic {
  id: number;
  title: string;
  artist: {
    id: number;
    name: string;
  };
  release_date: string;
  cover_image?: string;
  description?: string;
  songs_count: number;
  created_at: string;
}

export interface AdminAlbumResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: AdminAlbumBasic[];
}

/**
 * Service xử lý quản lý nghệ sĩ (Admin)
 */
export class AdminArtistService extends BaseAdminService {
  private readonly BASE_URL = "/api/v1/music/admin/artists";

  /**
   * Lấy danh sách nghệ sĩ
   * @param params Tham số tìm kiếm, lọc và phân trang
   * @returns Danh sách nghệ sĩ phân trang hoặc mảng nghệ sĩ đơn giản
   */
  async getArtists(params?: {
    page?: number;
    page_size?: number;
    search?: string;
    ordering?: string;
    genre_id?: number;
    is_featured?: boolean;
  }) {
    try {
      const response = await this.getPaginatedData<
        AdminArtistResponse | AdminArtist[]
      >(this.BASE_URL + "/", params);

      // Kiểm tra nếu response là mảng (API trả về mảng đơn giản)
      if (Array.isArray(response)) {
        // Trả về định dạng giống như AdminArtistResponse để frontend xử lý nhất quán
        return {
          count: response.length,
          next: null,
          previous: null,
          results: response.map((artist) => ({
            ...artist,
            // Thêm các trường mặc định nếu không có
            songs_count: artist.songs_count || 0,
            albums_count: artist.albums_count || 0,
            is_featured: artist.is_featured || false,
            created_at: artist.created_at || new Date().toISOString(),
          })),
        } as AdminArtistResponse;
      }

      // Nếu không, trả về response như bình thường
      return response as AdminArtistResponse;
    } catch (error) {
      console.error("Lỗi khi lấy danh sách nghệ sĩ:", error);
      // Trả về một đối tượng rỗng để tránh lỗi undefined
      return {
        count: 0,
        next: null,
        previous: null,
        results: [],
      } as AdminArtistResponse;
    }
  }

  /**
   * Lấy chi tiết nghệ sĩ
   * @param id ID nghệ sĩ
   * @returns Thông tin chi tiết nghệ sĩ
   */
  async getArtist(id: number) {
    return this.get<AdminArtist>(`${this.BASE_URL}/${id}/`);
  }

  /**
   * Thêm nghệ sĩ mới
   * @param artistData Form data chứa thông tin nghệ sĩ
   * @returns Thông tin nghệ sĩ mới
   */
  async createArtist(artistData: FormData) {
    return this.post<AdminArtist>(this.BASE_URL + "/", artistData);
  }

  /**
   * Cập nhật nghệ sĩ
   * @param id ID nghệ sĩ
   * @param artistData Thông tin nghệ sĩ cần cập nhật
   * @returns Thông tin nghệ sĩ sau khi cập nhật
   */
  async updateArtist(id: number, artistData: FormData) {
    return this.put<AdminArtist>(`${this.BASE_URL}/${id}/`, artistData);
  }

  /**
   * Cập nhật một phần thông tin nghệ sĩ
   * @param id ID nghệ sĩ
   * @param artistData Thông tin nghệ sĩ cần cập nhật
   * @returns Thông tin nghệ sĩ sau khi cập nhật
   */
  async partialUpdateArtist(
    id: number,
    artistData: Partial<AdminArtist> | FormData
  ) {
    return this.patch<AdminArtist>(`${this.BASE_URL}/${id}/`, artistData);
  }

  /**
   * Xóa nghệ sĩ
   * @param id ID nghệ sĩ
   * @returns Void
   */
  async deleteArtist(id: number) {
    return this.delete(`${this.BASE_URL}/${id}/`);
  }

  /**
   * Upload avatar nghệ sĩ
   * @param id ID nghệ sĩ
   * @param imageFile File ảnh avatar
   * @returns Kết quả upload
   */
  async uploadAvatar(id: number, imageFile: File) {
    return this.uploadFile<{ status: string; message: string; image: string }>(
      `${this.BASE_URL}/${id}/upload_image/`,
      imageFile,
      "image"
    );
  }

  /**
   * Cập nhật tiểu sử nghệ sĩ
   * @param id ID nghệ sĩ
   * @param bio Tiểu sử mới
   * @returns Kết quả cập nhật
   */
  async updateBio(id: number, bio: string) {
    return this.post<{ status: string; message: string; bio: string }>(
      `${this.BASE_URL}/${id}/update_bio/`,
      { bio }
    );
  }

  /**
   * Lấy danh sách bài hát của nghệ sĩ
   * @param id ID nghệ sĩ
   * @param params Tham số tìm kiếm, lọc và phân trang
   * @returns Danh sách bài hát của nghệ sĩ
   */
  async getArtistSongs(
    id: number,
    params?: {
      page?: number;
      page_size?: number;
      ordering?: string;
      album_id?: number;
      is_approved?: boolean;
    }
  ) {
    return this.getPaginatedData<AdminSongResponse>(
      `${this.BASE_URL}/${id}/songs/`,
      params
    );
  }

  /**
   * Lấy danh sách album của nghệ sĩ
   * @param id ID nghệ sĩ
   * @param params Tham số tìm kiếm, lọc và phân trang
   * @returns Danh sách album của nghệ sĩ
   */
  async getArtistAlbums(
    id: number,
    params?: {
      page?: number;
      page_size?: number;
      ordering?: string;
    }
  ) {
    return this.getPaginatedData<AdminAlbumResponse>(
      `${this.BASE_URL}/${id}/albums/`,
      params
    );
  }

  /**
   * Lấy thống kê nghệ sĩ
   * @param params Tham số lọc thống kê
   * @returns Dữ liệu thống kê
   */
  async getStats(params?: { period?: "all" | "month" | "week" | "day" }) {
    return this.get<AdminArtistStats>(`${this.BASE_URL}/stats/`, params);
  }
}
