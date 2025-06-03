import { ApiRequest } from "../core/ApiRequest";

/**
 * Interface cho thông tin thể loại nhạc
 */
export interface Genre {
  id: number;
  name: string;
  description: string;
  image: string | null;
  songs_count: number;
}

/**
 * Service quản lý các thể loại nhạc
 */
export class GenresService extends ApiRequest {
  /**
   * Lấy danh sách thể loại
   * @returns Danh sách thể loại
   */
  getGenres() {
    return this.get<Genre[]>("/api/v1/music/genres/");
  }

  /**
   * Lấy thông tin chi tiết một thể loại
   * @param id ID của thể loại
   * @returns Thông tin chi tiết thể loại
   */
  getGenre(id: number | string) {
    return this.get<Genre>(`/api/v1/music/genres/${id}/`);
  }

  /**
   * Tạo thể loại mới
   * @param genreData Dữ liệu thể loại mới
   * @returns Thông tin thể loại đã tạo
   */
  createGenre(genreData: FormData) {
    return this.post<Genre>("/api/v1/music/genres/", genreData);
  }

  /**
   * Cập nhật thông tin thể loại
   * @param id ID của thể loại
   * @param genreData Dữ liệu cập nhật
   * @returns Thông tin thể loại đã cập nhật
   */
  updateGenre(id: number | string, genreData: any) {
    return this.put<Genre>(`/api/v1/music/genres/${id}/`, genreData);
  }

  /**
   * Xóa thể loại
   * @param id ID của thể loại cần xóa
   * @returns Kết quả xóa
   */
  deleteGenre(id: number | string) {
    return this.delete<any>(`/api/v1/music/genres/${id}/`);
  }
}
