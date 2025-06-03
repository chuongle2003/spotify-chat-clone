"use client"

import { useRouter } from "next/navigation"

/**
 * Hook xử lý lỗi từ API và điều hướng tới trang 404 nếu cần
 */
export function useErrorHandler() {
    const router = useRouter()

    /**
     * Xử lý lỗi API và điều hướng nếu lỗi 404
     * @param error Lỗi từ API
     * @param customMessage Thông điệp tùy chỉnh cho trang 404
     * @returns boolean - true nếu đã xử lý lỗi, false nếu không phải lỗi 404
     */
    const handleApiError = (error: any, customMessage?: string): boolean => {
        console.error("API error:", error)

        // Xử lý trường hợp lỗi 404
        if (error?.status === 404 || error?.response?.status === 404) {
            // Tạo thông điệp mặc định hoặc sử dụng thông điệp từ API nếu có
            let message = customMessage || "Trang bạn tìm kiếm không tồn tại."

            // Thử lấy thông điệp lỗi từ API response nếu có
            try {
                if (error.response?.data?.detail) {
                    message = error.response.data.detail
                } else if (error.response?.data?.message) {
                    message = error.response.data.message
                } else if (error.message && !error.message.includes("fetch")) {
                    message = error.message
                }
            } catch (e) {
                // Bỏ qua lỗi khi trích xuất thông điệp
            }

            // Điều hướng tới trang 404 với thông điệp
            router.push(`/not-found?message=${encodeURIComponent(message)}`)
            return true
        }

        // Không phải lỗi 404
        return false
    }

    return { handleApiError }
}

/**
 * HOC bọc component và xử lý lỗi 404 tự động
 * @param Component Component cần bọc
 * @param customMessage Thông điệp tùy chỉnh cho lỗi 404
 * @returns Component đã được bọc với xử lý lỗi
 */
export function withErrorHandling<P extends object>(
    Component: React.ComponentType<P>,
    customMessage?: string
) {
    return function WithErrorHandling(props: P) {
        const { handleApiError } = useErrorHandler()

        // Truyền hàm xử lý lỗi vào component
        return <Component {...props} onError={(error: any) => handleApiError(error, customMessage)} />
    }
}

/**
 * Hàm chuyển hướng đến trang 404 với thông điệp tùy chỉnh
 * @param router NextRouter instance
 * @param message Thông điệp hiển thị trên trang 404
 */
export function redirectTo404(router: any, message: string = "Trang bạn tìm kiếm không tồn tại.") {
    router.push(`/not-found?message=${encodeURIComponent(message)}`)
} 