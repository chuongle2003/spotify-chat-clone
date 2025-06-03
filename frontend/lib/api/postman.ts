/**
 * Postman-style API client
 * Tổ chức API calls theo cách tương tự như Postman collections và requests
 */

// Cấu hình API
export const API_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || "https://spotifybackend.shop",
  defaultHeaders: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
};

// Interface cho response của thông tin người dùng
export interface UserResponse {
  is_admin: boolean;
  id: string;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  profile_image?: string;
  following?: string[];
  created_at?: string;
}

// Interface cho response của API đăng nhập
export interface LoginResponse {
  access: string;
  refresh: string;
  user: {
    id: number;
    username: string;
    email: string;
    first_name?: string;
    last_name?: string;
    avatar?: string | null;
    bio?: string;
    is_admin: boolean;
  };
}

// Interface cho dữ liệu đăng ký người dùng
export interface RegisterUserData {
  email: string;
  username?: string;
  password?: string;
  first_name?: string;
  last_name?: string;
  bio?: string;
}

// Lớp cơ sở cho tất cả các requests
class ApiRequest {
  protected async request<T>(
    method: string,
    endpoint: string,
    data?: any,
    customHeaders?: Record<string, string>
  ): Promise<T> {
    // Lấy token từ localStorage (nếu có)
    let token = null;
    if (typeof window !== "undefined") {
      token = localStorage.getItem("spotify_token");
    }

    // Chuẩn bị headers
    const headers: Record<string, string> = {
      ...API_CONFIG.defaultHeaders,
      ...customHeaders,
    };

    // Thêm token vào header nếu có
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    // Chuẩn bị options cho fetch
    const options: RequestInit = {
      method,
      headers,
    };

    // Thêm body cho các phương thức không phải GET
    if (method !== "GET" && data) {
      if (data instanceof FormData) {
        // Nếu là FormData, không set Content-Type để browser tự xử lý
        delete headers["Content-Type"];
        options.body = data;
      } else {
        options.body = JSON.stringify(data);
      }
    }

    // Xây dựng URL đầy đủ
    const url = new URL(endpoint, API_CONFIG.baseUrl);

    // Thêm query params cho phương thức GET
    if (method === "GET" && data) {
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    try {
      // Thực hiện request
      const response = await fetch(url.toString(), options);

      // Xử lý refresh token nếu token hết hạn (401)
      if (response.status === 401 && token) {
        const refreshed = await this.refreshToken();
        if (refreshed) {
          // Thử lại request với token mới
          return this.request<T>(method, endpoint, data, customHeaders);
        } else {
          // Nếu refresh token thất bại, chuyển hướng về trang đăng nhập
          if (typeof window !== "undefined") {
            localStorage.removeItem("spotify_token");
            localStorage.removeItem("spotify_refresh_token");
            localStorage.removeItem("spotify_user");
            window.location.href = "/login";
          }
          throw new Error("Authentication failed");
        }
      }

      // Kiểm tra response status
      if (!response.ok) {
        // Thêm response vào error để xử lý ở phía trên
        const error: any = new Error(
          `API error: ${response.status} ${response.statusText}`
        );
        error.response = response;
        error.status = response.status;

        // Cố gắng parse body nếu có
        try {
          const errorData = await response.json();
          error.data = errorData;
          if (errorData.detail) {
            error.message = errorData.detail;
          }
        } catch (e) {
          // Nếu không parse được JSON, giữ nguyên message lỗi
        }

        throw error;
      }

      // Parse JSON response
      const result = await response.json();
      return result as T;
    } catch (error) {
      console.error("API request failed:", error);
      throw error;
    }
  }

  // Hàm refresh token (định nghĩa ở lớp cha để tránh lỗi TypeScript)
  protected async refreshToken(): Promise<boolean> {
    if (typeof window === "undefined") return false;

    const storedRefreshToken = localStorage.getItem("spotify_refresh_token");
    if (!storedRefreshToken) return false;

    try {
      const response = await fetch(
        `${API_CONFIG.baseUrl}/api/v1/auth/token/refresh/`,
        {
          method: "POST",
          headers: API_CONFIG.defaultHeaders,
          body: JSON.stringify({ refresh: storedRefreshToken }),
        }
      );

      if (!response.ok) return false;

      const data = await response.json();
      localStorage.setItem("spotify_token", data.access);
      localStorage.setItem("spotify_refresh_token", data.refresh);
      return true;
    } catch (error) {
      console.error("Token refresh failed:", error);
      return false;
    }
  }

  // Các phương thức helper cho các loại request khác nhau
  protected get<T>(endpoint: string, params?: any): Promise<T> {
    return this.request<T>("GET", endpoint, params);
  }

  protected post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>("POST", endpoint, data);
  }

  protected put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>("PUT", endpoint, data);
  }

  protected patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>("PATCH", endpoint, data);
  }

  protected delete<T>(endpoint: string): Promise<T> {
    return this.request<T>("DELETE", endpoint);
  }
}

// Collection cho Auth API
export class AuthCollection extends ApiRequest {
  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      return await this.post<LoginResponse>("/api/v1/auth/token/", {
        email,
        password,
      });
    } catch (error: any) {
      // Xử lý cụ thể lỗi đăng nhập
      if (error.status === 401) {
        const err = new Error(
          "No active account found with the given credentials"
        );
        err.name = "AuthenticationError";
        throw err;
      }
      throw error;
    }
  }

  // Ghi đè refreshToken (không bắt buộc vì đã có ở lớp cha, nhưng có thể để tùy chỉnh)
  override async refreshToken(): Promise<boolean> {
    return super.refreshToken(); // Gọi implementation ở lớp cha
  }

  register(userData: RegisterUserData) {
    return this.post("/api/v1/accounts/auth/register/", userData);
  }

  // Add password reset methods
  requestPasswordReset(email: string) {
    return this.post("/api/v1/accounts/auth/forgot-password/", { email });
  }

  verifyResetTokenAndSetPassword(
    email: string,
    token: string,
    newPassword: string
  ) {
    return this.post<any>("/api/v1/accounts/auth/reset-password/", {
      email,
      token,
      new_password: newPassword,
    });
  }

  resetPassword(token: string, password: string) {
    return this.post("/api/v1/accounts/password-reset/confirm/", {
      token,
      password,
    });
  }
}

// Collection cho User API
export class AccountsCollection extends ApiRequest {
  getPublicUsers() {
    return this.get<any>("/api/v1/accounts/public/users/");
  }
}

// Collection cho Music API
export class MusicCollection extends ApiRequest {
  // Genre cache
  private genresCache: any[] | null = null;
  private genresCacheExpiry: number = 0;

  // API Quản lý Bài hát
  getSongs(params?: any) {
    return this.get<any[]>("/api/v1/music/songs/", params);
  }

  getSong(id: string) {
    return this.get<any>(`/api/v1/music/songs/${id}/`);
  }

  // Thêm phương thức search
  search(query: string) {
    return this.get<any>("/api/v1/music/search/", { q: query });
  }

  getFeaturedPlaylists() {
    // Lấy danh sách playlist thông thường nhưng định dạng kết quả trả về cho phù hợp
    return this.get<any>("/api/v1/music/playlists/").then((data) => {
      if (Array.isArray(data)) {
        return {
          playlists: data,
          total: data.length,
          page: 1,
          page_size: data.length,
        };
      }
      return data;
    });
  }

  getTrendingSongs() {
    return this.get<any>("/api/v1/music/songs/trending/");
  }

  getRecommendedSongs() {
    return this.get<any>("/api/v1/music/recommendations/");
  }

  getPersonalTrends() {
    return this.get<any>("/api/v1/music/trends/personal/");
  }

  getArtist(id: string) {
    return this.get<any>(`/api/v1/music/artists/${id}/`);
  }

  // API Quản lý Playlist
  getPlaylists() {
    return this.get<any>("/api/v1/music/playlists/");
  }

  // Ghi nhận lượt phát
  playSong(songId: string) {
    return this.post<any>(`/api/v1/music/songs/${songId}/play/`);
  }

  // Quản lý queue và player
  // Thêm các phương thức mới
  likeSong(songId: string) {
    return this.post<any>(`/api/v1/music/songs/${songId}/like/`);
  }

  unlikeSong(songId: string) {
    return this.post<any>(`/api/v1/music/songs/${songId}/unlike/`);
  }

  // Thêm phương thức mới theo tài liệu API
  addToFavorites(songId: string) {
    return this.post<any>(`/api/v1/music/favorites/`, {
      song_id: songId,
    });
  }

  // Thêm phương thức mới theo tài liệu API
  removeFromFavorites(songId: string) {
    return this.post<any>(`/api/v1/music/favorites/remove/`, {
      song_id: songId,
    });
  }

  // Thêm phương thức lấy thư viện bài hát của người dùng
  getLibrary() {
    return this.get<any>(`/api/v1/music/library/`);
  }

  addSongToPlaylist(playlistId: string, songId: string) {
    return this.post<any>(`/api/v1/music/playlists/${playlistId}/add_song/`, {
      song_id: songId,
    });
  }

  togglePlaylistPrivacy(playlistId: string) {
    return this.post<any>(
      `/api/v1/music/playlists/${playlistId}/toggle_privacy/`,
      {}
    );
  }

  getPlaylistFollowers(playlistId: string) {
    return this.get<any>(`/api/v1/music/playlists/${playlistId}/followers/`);
  }

  sharePlaylist(playlistId: string, receiverId: string, content: string) {
    return this.post<any>(`/api/v1/music/share/playlist/${playlistId}/`, {
      receiver_id: receiverId,
      content,
    });
  }

  createPlaylist(data: {
    name: string;
    description?: string;
    is_public?: boolean;
  }) {
    return this.post<any>("/api/v1/music/playlists/", data);
  }
}

// Tạo các instance của các collection
export const postmanApi = {
  auth: new AuthCollection(),
  accounts: new AccountsCollection(),
  music: new MusicCollection(),
};

// Export default
export default postmanApi;
