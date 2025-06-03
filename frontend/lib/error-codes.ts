/**
 * Error codes management for API responses
 * Helps standardize error handling across the application
 */

export interface ErrorCode {
  code: number;
  message: string;
  type: "success" | "error" | "info" | "warning";
}

// Authentication error codes
export const AUTH_ERROR_CODES: Record<string, ErrorCode> = {
  // Success codes
  REGISTER_SUCCESS: {
    code: 201,
    message: "Đăng ký tài khoản thành công",
    type: "success",
  },
  LOGIN_SUCCESS: {
    code: 200,
    message: "Đăng nhập thành công",
    type: "success",
  },

  // Error codes
  EMAIL_ALREADY_EXISTS: {
    code: 409,
    message: "Email này đã được đăng ký trước đó",
    type: "error",
  },
  USERNAME_ALREADY_EXISTS: {
    code: 409,
    message: "Tên người dùng này đã tồn tại",
    type: "error",
  },
  INVALID_CREDENTIALS: {
    code: 401,
    message: "Email hoặc mật khẩu không đúng",
    type: "error",
  },
  USER_NOT_FOUND: {
    code: 404,
    message: "Tài khoản không tồn tại",
    type: "error",
  },
  SESSION_EXPIRED: {
    code: 401,
    message: "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại",
    type: "error",
  },
  UNAUTHORIZED: {
    code: 401,
    message: "Bạn không có quyền thực hiện hành động này",
    type: "error",
  },
};

// User management error codes
export const USER_ERROR_CODES: Record<string, ErrorCode> = {
  // Success codes
  UPDATE_PROFILE_SUCCESS: {
    code: 200,
    message: "Cập nhật thông tin thành công",
    type: "success",
  },
  CHANGE_PASSWORD_SUCCESS: {
    code: 200,
    message: "Đổi mật khẩu thành công",
    type: "success",
  },

  // Error codes
  PROFILE_UPDATE_FAILED: {
    code: 400,
    message: "Cập nhật thông tin thất bại",
    type: "error",
  },
  PASSWORD_MISMATCH: {
    code: 400,
    message: "Mật khẩu cũ không chính xác",
    type: "error",
  },
};

// General API error codes
export const API_ERROR_CODES: Record<string, ErrorCode> = {
  BAD_REQUEST: {
    code: 400,
    message: "Yêu cầu không hợp lệ",
    type: "error",
  },
  SERVER_ERROR: {
    code: 500,
    message: "Lỗi máy chủ, vui lòng thử lại sau",
    type: "error",
  },
  NOT_FOUND: {
    code: 404,
    message: "Không tìm thấy dữ liệu yêu cầu",
    type: "error",
  },
  TOO_MANY_REQUESTS: {
    code: 429,
    message: "Quá nhiều yêu cầu, vui lòng thử lại sau",
    type: "warning",
  },
  FORBIDDEN: {
    code: 403,
    message: "Bạn không có quyền truy cập vào tài nguyên này",
    type: "error",
  },
  MAINTENANCE: {
    code: 503,
    message: "Hệ thống đang bảo trì, vui lòng thử lại sau",
    type: "info",
  },
};

// Function to get error message by code
export function getErrorByCode(code: number): ErrorCode | undefined {
  // Search through all error code categories
  const allErrorCodes = {
    ...AUTH_ERROR_CODES,
    ...USER_ERROR_CODES,
    ...API_ERROR_CODES,
  };

  // Find the first error that matches the code
  return Object.values(allErrorCodes).find((error) => error.code === code);
}

// Function to get error by key
export function getErrorByKey(key: string): ErrorCode | undefined {
  // Search through all error code categories
  const allErrorCodes = {
    ...AUTH_ERROR_CODES,
    ...USER_ERROR_CODES,
    ...API_ERROR_CODES,
  };

  return allErrorCodes[key];
}
