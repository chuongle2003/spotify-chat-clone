import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Hook bảo vệ trang admin
 * - Kiểm tra người dùng có quyền admin hay không (is_admin === true)
 * - Chuyển hướng về trang chủ nếu không có quyền
 */
export function useAdminProtection() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkAdminPermission = () => {
      try {
        // Lấy thông tin người dùng từ localStorage
        const userDataStr = localStorage.getItem("spotify_user");
        if (!userDataStr) {
          // Nếu không có thông tin người dùng, chuyển về trang đăng nhập
          router.push("/login");
          return;
        }

        const userData = JSON.parse(userDataStr);

        // Kiểm tra quyền admin
        if (userData && userData.is_admin === true) {
          setIsAdmin(true);
        } else {
          // Nếu không phải admin, chuyển về trang chủ
          router.push("/");
        }
      } catch (error) {
        console.error("Error checking admin permission:", error);
        router.push("/");
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminPermission();
  }, [router]);

  return { isAdmin, isLoading };
}

export default useAdminProtection;
