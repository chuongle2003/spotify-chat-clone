import { ApiRequest } from "../core/ApiRequest";

/**
 * Interface cho thông tin album nhạc
 */
export interface Album {
  id: number;
  title: string;
  artist: string;
  cover_image: string | null;
  description: string | null;
  release_date: string | null;
  songs_count: number;
  created_at: string;
  updated_at: string;
}

/**
 * Service quản lý các album nhạc
 */
export class AlbumService extends ApiRequest {
  /**
   * Lấy danh sách album
   * @returns Danh sách album
   */
  getAlbums() {
    return this.get<Album[]>("/api/v1/music/albums/");
  }

  /**
   * Lấy thông tin chi tiết một album
   * @param id ID của album
   * @returns Thông tin chi tiết album bao gồm danh sách bài hát
   */
  getAlbum(id: number | string) {
    return this.get<any>(`/api/v1/music/albums/${id}/`);
  }

  /**
   * Tạo album mới
   * @param albumData Dữ liệu album mới
   * @returns Thông tin album đã tạo
   */
  createAlbum(albumData: FormData) {
    return this.post<Album>("/api/v1/music/albums/", albumData);
  }

  /**
   * Cập nhật thông tin album
   * @param id ID của album
   * @param albumData Dữ liệu cập nhật
   * @returns Thông tin album đã cập nhật
   */
  updateAlbum(id: number | string, albumData: any) {
    return this.put<Album>(`/api/v1/music/albums/${id}/`, albumData);
  }

  /**
   * Xóa album
   * @param id ID của album cần xóa
   * @returns Kết quả xóa
   */
  deleteAlbum(id: number | string) {
    return this.delete<any>(`/api/v1/music/albums/${id}/`);
  }

  /**
   * Lấy danh sách album được đề xuất
   * @returns Danh sách album đề xuất
   */
  getFeaturedAlbums() {
    return this.get<Album[]>("/api/v1/music/albums/featured/");
  }

  /**
   * Tìm kiếm album theo từ khóa
   * @param query Từ khóa tìm kiếm
   * @returns Danh sách album phù hợp
   */
  searchAlbums(query: string) {
    return this.get<Album[]>(
      `/api/v1/music/albums/search/?q=${encodeURIComponent(query)}`
    );
  }

  /**
   * Lấy danh sách album mới phát hành
   * @returns Danh sách album mới
   */
  getNewReleases() {
    return this.get<Album[]>("/api/v1/music/albums/new-releases/");
  }
}
