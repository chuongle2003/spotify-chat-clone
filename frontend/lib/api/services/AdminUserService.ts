import axios from "axios";
import { BaseAdminService } from "./BaseAdminService";
import { PaginatedResponse } from "../core/types";

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  avatar: string | null;
  is_active: boolean;
  is_admin: boolean;
  is_superuser?: boolean;
  date_joined: string;
  last_login?: string | null;
  bio: string;
  followers_count?: number;
  following_count?: number;
  favorite_songs_count?: number;
  has_chat_restriction?: boolean;
  status?: "ACTIVE" | "INACTIVE" | "RESTRICTED";
}

export interface UserDetailResponse extends User {
  followers?: UserBrief[];
  following?: UserBrief[];
  chat_restrictions?: ChatRestriction[];
}

export interface UserBrief {
  id: number;
  username: string;
  avatar: string;
}

export interface ChatRestriction {
  id: number;
  restriction_type: "TEMPORARY" | "PERMANENT" | "WARNING";
  reason: string;
  created_at: string;
  expires_at?: string;
  is_active: boolean;
  created_by?: {
    id: number;
    username: string;
  };
}

export interface UserListParams {
  page?: number;
  page_size?: number;
  search?: string;
  is_active?: boolean;
  is_admin?: boolean;
  has_restriction?: boolean;
  sort_by?: "username" | "email" | "date_joined";
  order?: "asc" | "desc";
}

export interface UserStats {
  total_users: number;
  active_users: number;
  inactive_users: number;
  admin_users: number;
  restricted_users: number;
  new_users_last_7_days: number;
  new_users_last_30_days: number;
  users_by_day: {
    date: string;
    count: number;
  }[];
}

export interface ChatRestrictionParams {
  page?: number;
  page_size?: number;
  user_id?: number;
  restriction_type?: "TEMPORARY" | "PERMANENT" | "WARNING";
  is_active?: boolean;
}

export class AdminUserService extends BaseAdminService {
  // Lấy danh sách người dùng
  async getUsers(params: UserListParams = {}) {
    return this.get<PaginatedResponse<User> | User[]>(
      "/api/v1/accounts/admin/users/",
      {
        params,
      }
    );
  }

  // Lấy thông tin chi tiết người dùng
  async getUserDetail(userId: number) {
    return this.get<UserDetailResponse>(
      `/api/v1/accounts/admin/users/${userId}/`
    );
  }

  // Cập nhật thông tin người dùng
  async updateUser(userId: number, data: Partial<User>) {
    return this.patch<UserDetailResponse>(
      `/api/v1/accounts/admin/users/${userId}/`,
      data
    );
  }

  // Đổi mật khẩu người dùng
  async changePassword(
    userId: number,
    newPassword: string,
    confirmPassword: string
  ) {
    return this.post<{ success: boolean; message: string }>(
      `/api/v1/accounts/admin/users/${userId}/change-password/`,
      {
        new_password: newPassword,
        confirm_password: confirmPassword,
      }
    );
  }

  // Kích hoạt/Vô hiệu hoá người dùng
  async toggleActive(userId: number, isActive: boolean, reason?: string) {
    return this.post<{ success: boolean; message: string; is_active: boolean }>(
      `/api/v1/accounts/admin/users/${userId}/toggle-active/`,
      {
        is_active: isActive,
        reason,
      }
    );
  }

  // Hành động hàng loạt
  async batchAction(
    action: "activate" | "deactivate",
    userIds: number[],
    reason?: string
  ) {
    return this.post<{
      success: boolean;
      message: string;
      failed_ids: number[];
    }>("/api/v1/accounts/admin/users/batch-action/", {
      action,
      user_ids: userIds,
      reason,
    });
  }

  // Thống kê người dùng
  async getUserStats() {
    return this.get<UserStats>("/api/v1/accounts/admin/users/stats/");
  }

  // Tạo hạn chế chat mới
  async createChatRestriction(
    userId: number,
    restrictionType: "TEMPORARY" | "PERMANENT" | "WARNING",
    reason: string,
    expiresAt?: string
  ) {
    return this.post<ChatRestriction>(
      "/api/v1/accounts/admin/chat-restrictions/",
      {
        user_id: userId,
        restriction_type: restrictionType,
        reason,
        expires_at: expiresAt,
      }
    );
  }

  // Lấy danh sách hạn chế chat
  async getChatRestrictions(params: ChatRestrictionParams = {}) {
    return this.get<PaginatedResponse<ChatRestriction>>(
      "/api/v1/accounts/admin/chat-restrictions/",
      {
        params,
      }
    );
  }

  // Hủy hạn chế chat
  async deactivateChatRestriction(restrictionId: number, reason?: string) {
    return this.post<{
      success: boolean;
      message: string;
      restriction: ChatRestriction;
    }>(
      `/api/v1/accounts/admin/chat-restrictions/${restrictionId}/deactivate/`,
      { reason }
    );
  }
}

export const adminUserService = new AdminUserService();
