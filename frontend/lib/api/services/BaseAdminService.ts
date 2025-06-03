import { ApiRequest } from "../core/ApiRequest";

/**
 * Lớp cơ sở cho tất cả Admin Service
 * Cung cấp các tiện ích chung cho quản lý admin
 */
export class BaseAdminService extends ApiRequest {
  /**
   * Upload một file
   * @param endpoint Điểm cuối API
   * @param file File cần upload
   * @param fieldName Tên trường chứa file
   * @param additionalData Dữ liệu bổ sung
   * @returns Kết quả từ API
   */
  protected async uploadFile<T>(
    endpoint: string,
    file: File,
    fieldName: string,
    additionalData?: Record<string, any>
  ): Promise<T> {
    const formData = new FormData();
    formData.append(fieldName, file);

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, String(value));
        }
      });
    }

    return this.post<T>(endpoint, formData);
  }

  /**
   * Xử lý request phân trang
   * @param endpoint Điểm cuối API
   * @param params Tham số phân trang và lọc
   * @returns Kết quả phân trang
   */
  protected async getPaginatedData<T>(
    endpoint: string,
    params?: Record<string, any>
  ) {
    return this.get<T>(endpoint, params);
  }

  /**
   * Kiểm tra xem user hiện tại có phải admin không
   * @returns Boolean cho biết có phải admin không
   */
  async isAdmin(): Promise<boolean> {
    try {
      const userData =
        typeof window !== "undefined"
          ? localStorage.getItem("spotify_user")
          : null;

      if (!userData) return false;

      const user = JSON.parse(userData);
      return user?.is_admin === true;
    } catch (error) {
      console.error("Lỗi kiểm tra quyền admin:", error);
      return false;
    }
  }
}
