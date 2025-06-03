import { ApiRequest } from "../core/ApiRequest";
import { PaginatedResponse, SongData, ArtistData } from "../core/types";

/**
 * Service xử lý bài hát
 */
export class SongService extends ApiRequest {
  /**
   * Lấy danh sách bài hát
   * @param params Tham số phân trang và lọc
   * @returns Danh sách bài hát phân trang
   */
  async getSongs(params?: { page?: number; limit?: number; genre?: string }) {
    return this.get<PaginatedResponse<SongData>>(
      "/api/v1/music/songs/",
      params
    );
  }

  /**
   * Lấy chi tiết bài hát
   * @param id ID bài hát
   * @returns Thông tin chi tiết bài hát
   */
  async getSong(id: string) {
    return this.get<SongData>(`/api/v1/music/songs/${id}/`);
  }

  /**
   * Lấy chi tiết bài hát (alias của getSong)
   * @param id ID bài hát
   * @returns Thông tin chi tiết bài hát
   */
  async getSongDetails(id: string) {
    return this.getSong(id);
  }

  /**
   * Lấy bài hát trending
   * @returns Danh sách bài hát thịnh hành
   */
  async getTrendingSongs() {
    return this.get<{ trending_period_days: number; results: SongData[] }>(
      "/api/v1/music/songs/trending/"
    );
  }

  /**
   * Lấy bài hát đề xuất
   * @returns Danh sách bài hát đề xuất
   */
  async getRecommendedSongs() {
    return this.get<SongData[]>("/api/v1/music/songs/recommended/");
  }

  /**
   * Lấy xu hướng cá nhân
   * @returns Danh sách bài hát dựa trên lịch sử nghe
   */
  async getPersonalTrends() {
    return this.get<SongData[]>("/api/v1/music/songs/personal/");
  }

  /**
   * Tạo bài hát mới (upload)
   * @param songData Form data chứa thông tin bài hát
   * @returns Thông tin bài hát mới
   */
  async createSong(songData: FormData) {
    return this.post<SongData>("/api/v1/music/songs/", songData);
  }

  /**
   * Cập nhật bài hát
   * @param id ID bài hát
   * @param songData Thông tin bài hát cần cập nhật
   * @returns Thông tin bài hát sau khi cập nhật
   */
  async updateSong(id: string, songData: FormData | any) {
    return this.put<SongData>(`/api/v1/music/songs/${id}/`, songData);
  }

  /**
   * Xóa bài hát
   * @param id ID bài hát
   * @returns Kết quả xóa
   */
  async deleteSong(id: string) {
    return this.delete(`/api/v1/music/songs/${id}/`);
  }

  /**
   * Ghi nhận lượt phát
   * @param songId ID bài hát
   * @returns Kết quả ghi nhận
   */
  async playSong(songId: string) {
    return this.post(`/api/v1/music/songs/${songId}/play/`, {});
  }

  /**
   * Thích một bài hát
   * @param songId ID bài hát
   * @returns Kết quả thích
   */
  async likeSong(songId: string) {
    return this.post(`/api/v1/music/songs/${songId}/like/`, {});
  }

  /**
   * Bỏ thích một bài hát
   * @param songId ID bài hát
   * @returns Kết quả bỏ thích
   */
  async unlikeSong(songId: string) {
    return this.delete(`/api/v1/music/songs/${songId}/like/`);
  }

  /**
   * Thêm bài hát vào danh sách yêu thích
   * @param songId ID bài hát
   * @returns Kết quả thêm vào yêu thích
   */
  async addToFavorites(songId: string) {
    return this.post(`/api/v1/music/favorites/`, {
      song_id: songId,
    });
  }

  /**
   * Xóa bài hát khỏi danh sách yêu thích
   * @param songId ID bài hát
   * @returns Kết quả xóa khỏi yêu thích
   */
  async removeFromFavorites(songId: string) {
    return this.delete(`/api/v1/music/favorites/`, {
      song_id: songId,
    });
  }

  /**
   * Lấy thư viện bài hát của người dùng
   * @returns Thư viện bài hát (playlists, favorites, recently played)
   */
  async getLibrary() {
    try {
      const response: any = await this.get(`/api/v1/music/library/`);

      // Kiểm tra và xử lý response
      if (response && typeof response === "object") {
        // Nếu có trường favorites, trả về nó
        if (response.favorites && Array.isArray(response.favorites)) {
          return response.favorites;
        }

        // Nếu không có favorites nhưng có response, trả về response
        return response;
      }

      // Trường hợp không có dữ liệu, trả về mảng rỗng
      return [];
    } catch (error) {
      console.error("Lỗi khi lấy thư viện người dùng:", error);
      return [];
    }
  }

  /**
   * Lấy danh sách nghệ sĩ
   * @param params Tham số phân trang và lọc
   * @returns Danh sách nghệ sĩ phân trang
   */
  async getArtists(params?: { page?: number; limit?: number }) {
    return this.get<PaginatedResponse<ArtistData>>(
      "/api/v1/music/artists/",
      params
    );
  }

  /**
   * Tìm kiếm bài hát
   * @param query Từ khóa tìm kiếm
   * @returns Kết quả tìm kiếm
   */
  async searchSongs(query: string) {
    return this.get<SongData[]>("/api/v1/music/search/", {
      q: query,
      type: "song",
    });
  }

  /**
   * Tải xuống bài hát
   * @param songId ID bài hát
   * @param range Tùy chọn - Range header cho phép resume download
   * @returns Stream file nhạc để tải xuống
   */
  async downloadSong(songId: string | number, range?: string) {
    console.log(`Tải xuống bài hát ID: ${songId}`);
    const headers: Record<string, string> = {};
    if (range) {
      headers["Range"] = range;
    }

    return this.get(
      `/api/v1/music/songs/${songId}/download/`,
      {},
      {
        responseType: "blob",
        headers,
      }
    );
  }

  /**
   * Tải xuống bài hát trực tiếp và lưu vào thiết bị
   * @param songId ID bài hát
   * @param songTitle Tiêu đề bài hát
   * @param artistName Tên nghệ sĩ
   * @returns Kết quả tải xuống
   */
  async directDownload(
    songId: string | number,
    songTitle?: string,
    artistName?: string
  ) {
    try {
      console.log(`Bắt đầu tải xuống bài hát: ${songTitle || songId}`);

      // Kiểm tra token trước khi tải xuống
      let token = null;
      if (typeof window !== "undefined") {
        token = localStorage.getItem("spotify_token");
        if (!token) {
          console.error("Không tìm thấy access token. Vui lòng đăng nhập lại.");
          throw new Error("Unauthorized: Không tìm thấy token truy cập");
        }
        console.log(`Sử dụng token: ${token.substring(0, 15)}...`);
      }

      const response = (await this.downloadSong(songId)) as Blob;
      console.log("Nhận được response blob:", response);

      // Trích xuất tên file từ Content-Disposition nếu có
      let filename = songTitle
        ? `${songTitle}${artistName ? ` - ${artistName}` : ""}.mp3`
        : `song-${songId}.mp3`;

      // Tạo URL đối tượng từ blob
      const url = window.URL.createObjectURL(response);

      // Tạo link tải xuống
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);

      // Kích hoạt tải xuống
      link.click();

      // Dọn dẹp
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);

      console.log(`Tải xuống bài hát thành công: ${filename}`);
      return { success: true, filename };
    } catch (error) {
      console.error("Lỗi khi tải xuống bài hát:", error);
      throw error;
    }
  }

  /**
   * Phát trực tuyến bài hát
   * @param songId ID bài hát
   * @param range Range header cho phát trực tuyến
   * @returns Stream audio
   */
  async streamSong(songId: string | number, range?: string) {
    const headers: Record<string, string> = {};
    if (range) {
      headers["Range"] = range;
    }

    return this.get(
      `/api/v1/music/songs/${songId}/stream/`,
      {},
      {
        headers,
        responseType: "blob",
      }
    );
  }
}
