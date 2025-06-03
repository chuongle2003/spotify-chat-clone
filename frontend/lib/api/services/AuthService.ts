import { ApiRequest } from "../core/ApiRequest";
import { LoginResponse, RegisterUserData } from "../core/types";

/**
 * Service xử lý xác thực người dùng
 */
export class AuthService extends ApiRequest {
  /**
   * Đăng nhập người dùng
   * @param email Email người dùng (sử dụng làm username)
   * @param password Mật khẩu người dùng
   * @returns Thông tin đăng nhập và token
   */
  async login(email: string, password: string): Promise<LoginResponse> {
    const data = await this.post<LoginResponse>("/api/v1/auth/token/", {
      email: email,
      password,
    });

    // Lưu thông tin vào localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("spotify_token", data.access);
      localStorage.setItem("spotify_refresh_token", data.refresh);
      localStorage.setItem("spotify_user", JSON.stringify(data.user));
    }

    return data;
  }

  /**
   * Đăng ký người dùng mới
   * @param userData Thông tin người dùng
   * @returns Kết quả đăng ký
   */
  async register(userData: RegisterUserData) {
    return this.post("/api/v1/accounts/users/", userData);
  }

  /**
   * Yêu cầu đặt lại mật khẩu
   * @param email Email người dùng
   * @returns Thông báo kết quả
   */
  async requestPasswordReset(email: string) {
    return this.post("/api/v1/accounts/password/reset/", { email });
  }

  /**
   * Xác minh token và đặt lại mật khẩu
   * @param email Email người dùng
   * @param token Token xác minh (OTP)
   * @param newPassword Mật khẩu mới
   * @returns Kết quả đặt lại mật khẩu
   */
  async verifyResetTokenAndSetPassword(
    email: string,
    token: string,
    newPassword: string
  ) {
    return this.post("/api/v1/accounts/password/reset/confirm/", {
      email,
      token,
      new_password: newPassword,
    });
  }

  /**
   * Đặt lại mật khẩu
   * @param token Token xác minh
   * @param password Mật khẩu mới
   * @returns Kết quả đặt lại mật khẩu
   */
  async resetPassword(token: string, password: string) {
    return this.post("/api/v1/auth/password-reset/confirm/", {
      token,
      password,
    });
  }

  /**
   * Đăng xuất
   * Gọi API đăng xuất và xóa thông tin đăng nhập khỏi localStorage
   */
  async logout() {
    // Lấy refresh token từ localStorage
    const refreshToken =
      typeof window !== "undefined"
        ? localStorage.getItem("spotify_refresh_token")
        : null;

    if (refreshToken) {
      try {
        // Gọi API đăng xuất với refresh token
        await this.post("/api/v1/auth/logout/", { refresh: refreshToken });
      } catch (error) {
        console.error("Đăng xuất thất bại:", error);
      }
    }

    // Xóa thông tin khỏi localStorage
    if (typeof window !== "undefined") {
      localStorage.removeItem("spotify_token");
      localStorage.removeItem("spotify_refresh_token");
      localStorage.removeItem("spotify_user");
    }
  }

  /**
   * Lấy thông tin người dùng hiện tại
   * @returns Thông tin người dùng
   */
  async getUserInfo() {
    return this.get("/api/v1/accounts/users/me/");
  }
}
