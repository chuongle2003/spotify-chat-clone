"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api"
import { User } from "@/types"

interface LoginUserResponse {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  avatar?: string | null;
  bio?: string;
  is_admin: boolean;
}

interface ApiResponse {
  access: string;
  refresh: string;
  user: LoginUserResponse;
}

type AuthContextType = {
  user: User | null
  isLoading: boolean
  isAdmin: boolean
  isAuthenticated: boolean
  loading: boolean
  accessToken: string | null
  login: (email: string, password: string) => Promise<void>
  loginWithProvider: (provider: string) => Promise<void>
  register: (userData: {
    email: string;
    username?: string;
    password?: string;
    first_name?: string;
    last_name?: string;
    bio?: string;
  }) => Promise<any>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const router = useRouter()

  // Refresh token tự động mỗi 45 phút (trước khi hết hạn 60 phút)
  useEffect(() => {
    if (!accessToken) return;

    // Hàm refresh token
    const refreshTokenPeriodically = async () => {
      try {
        const refreshToken = localStorage.getItem("spotify_refresh_token");
        if (!refreshToken) return;

        // Gọi API refresh token
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://spotifybackend.shop"}/api/v1/auth/token/refresh/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ refresh: refreshToken }),
        });

        if (response.ok) {
          const data = await response.json();

          // Cập nhật token mới
          localStorage.setItem("spotify_token", data.access);
          if (data.refresh) {
            localStorage.setItem("spotify_refresh_token", data.refresh);
          }

          setAccessToken(data.access);
          console.log("Đã refresh token thành công");
        } else {
          console.error("Không thể refresh token");
          // Nếu không refresh được, đăng xuất
          handleLogout();
        }
      } catch (error) {
        console.error("Lỗi khi refresh token:", error);
      }
    };

    // Thiết lập interval refresh token mỗi 45 phút
    const intervalId = setInterval(refreshTokenPeriodically, 45 * 60 * 1000);

    // Clear interval khi component unmount
    return () => clearInterval(intervalId);
  }, [accessToken]);

  // Check if user is logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("spotify_token")
      const userDataStr = localStorage.getItem("spotify_user")

      if (token && userDataStr) {
        try {
          // Đọc thông tin người dùng từ localStorage
          const userDataParsed = JSON.parse(userDataStr)

          // Đảm bảo id là string
          const userData: User = {
            ...userDataParsed,
            id: String(userDataParsed.id)
          }

          setUser(userData)
          setAccessToken(token)
        } catch (error) {
          console.error("Failed to parse user data from localStorage:", error)
          localStorage.removeItem("spotify_token")
          localStorage.removeItem("spotify_refresh_token")
          localStorage.removeItem("spotify_user")
        }
      }
      setIsLoading(false)
    }

    checkAuth()
  }, [])

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      console.log("===== BẮT ĐẦU QUÁ TRÌNH ĐĂNG NHẬP =====")
      // Call the login API
      const response = await api.auth.login(email, password) as ApiResponse
      const { access, refresh } = response
      console.log("Đăng nhập thành công, nhận được token:", { access: access.substring(0, 15) + "..." })

      // Save tokens
      localStorage.setItem("spotify_token", access)
      localStorage.setItem("spotify_refresh_token", refresh)
      setAccessToken(access)
      console.log("Đã lưu token vào localStorage")

      // Lấy thông tin người dùng mới nhất từ API
      try {
        const userData = await api.auth.getUserInfo() as User
        // Đảm bảo id là string để phù hợp với type User
        const userDataFormatted: User = {
          ...userData,
          id: String(userData.id)
        }

        // Lưu user data từ API getUserInfo
        setUser(userDataFormatted)
        localStorage.setItem("spotify_user", JSON.stringify(userDataFormatted))
        console.log("Đã lưu thông tin người dùng từ API vào state và localStorage:", userDataFormatted)

        // Debug chi tiết về quyền admin
        console.log("Kiểm tra chi tiết quyền admin:")
        console.log("- is_admin =", userDataFormatted.is_admin)
        console.log("- Kiểu dữ liệu:", typeof userDataFormatted.is_admin)
        console.log("- Giá trị chính xác:", JSON.stringify(userDataFormatted.is_admin))

        // Đảm bảo giá trị is_admin là boolean
        const isAdminUser = userDataFormatted.is_admin === true

        console.log("- Kết quả kiểm tra is_admin === true:", isAdminUser)

        if (isAdminUser) {
          console.log("User có quyền admin, chuyển hướng đến trang admin")
          // Sử dụng timeout để đảm bảo chuyển hướng được thực hiện sau khi state đã được cập nhật
          setTimeout(() => {
            router.push("/admin")
          }, 100)
        } else {
          console.log("User không có quyền admin, chuyển hướng đến dashboard")
          router.push("/dashboard")
        }
      } catch (error) {
        console.error("Không thể lấy thông tin người dùng từ API:", error)

        // Sử dụng thông tin từ response login nếu không lấy được từ API
        const userDataFromLogin: User = {
          id: String(response.user.id),
          username: response.user.username,
          email: response.user.email,
          first_name: response.user.first_name,
          last_name: response.user.last_name,
          bio: response.user.bio,
          is_admin: response.user.is_admin,
          avatar: response.user.avatar ? response.user.avatar : undefined
        }

        setUser(userDataFromLogin)
        localStorage.setItem("spotify_user", JSON.stringify(userDataFromLogin))
        console.log("Đã lưu thông tin người dùng từ response login vào state và localStorage:", userDataFromLogin)

        // Kiểm tra quyền admin và chuyển hướng
        const isAdminUser = userDataFromLogin.is_admin === true

        if (isAdminUser) {
          router.push("/admin")
        } else {
          router.push("/dashboard")
        }
      }
    } catch (error: any) {
      console.error("Login failed:", error)

      // Xử lý chi tiết các lỗi API
      if (error.response) {
        // Trường hợp API trả về response với status code
        const status = error.response.status

        if (status === 401) {
          throw new Error("No active account found with the given credentials")
        } else if (status === 404) {
          throw new Error("User not found")
        } else if (status === 400) {
          // Parse lỗi từ API nếu có
          try {
            const errorData = await error.response.json()
            if (errorData && errorData.detail) {
              throw new Error(errorData.detail)
            }
          } catch (parseError) {
            // Nếu không parse được JSON, trả về lỗi mặc định
            throw new Error("Invalid credentials")
          }
        }
      }

      // Trường hợp lỗi không xác định hoặc lỗi mạng
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const loginWithProvider = async (provider: string) => {
    setIsLoading(true)
    try {
      // Xác định URL OAuth dựa trên nhà cung cấp
      let authUrl = ""
      const redirectUri = encodeURIComponent(window.location.origin + "/auth/callback")

      switch (provider) {
        case "Google":
          authUrl = `${process.env.NEXT_PUBLIC_API_URL}/auth/google/login?redirect_uri=${redirectUri}`
          break
        case "Facebook":
          authUrl = `${process.env.NEXT_PUBLIC_API_URL}/auth/facebook/login?redirect_uri=${redirectUri}`
          break
        case "Apple":
          authUrl = `${process.env.NEXT_PUBLIC_API_URL}/auth/apple/login?redirect_uri=${redirectUri}`
          break
        default:
          throw new Error(`Không hỗ trợ đăng nhập với ${provider}`)
      }

      // Mở cửa sổ popup cho đăng nhập OAuth
      const width = 600
      const height = 700
      const left = window.innerWidth / 2 - width / 2
      const top = window.innerHeight / 2 - height / 2

      const authWindow = window.open(
        authUrl,
        `Đăng nhập với ${provider}`,
        `width=${width},height=${height},top=${top},left=${left}`,
      )

      // Xử lý kết quả đăng nhập từ cửa sổ popup
      const checkAuthWindow = setInterval(async () => {
        if (authWindow && authWindow.closed) {
          clearInterval(checkAuthWindow)

          // Kiểm tra xem đã có token trong localStorage chưa
          const token = localStorage.getItem("spotify_token")
          if (token) {
            // Lấy thông tin người dùng từ localStorage
            const userDataStr = localStorage.getItem("spotify_user")
            if (userDataStr) {
              try {
                const userDataParsed = JSON.parse(userDataStr)

                // Đảm bảo id là string
                const userData: User = {
                  ...userDataParsed,
                  id: String(userDataParsed.id)
                }

                setUser(userData)
                setAccessToken(token)

                console.log("OAuth login: Thông tin người dùng:", userData)

                // Debug chi tiết về quyền admin
                console.log("OAuth login: Kiểm tra chi tiết quyền admin:")
                console.log("- is_admin =", userData.is_admin)
                console.log("- Kiểu dữ liệu:", typeof userData.is_admin)
                console.log("- Giá trị chính xác:", JSON.stringify(userData.is_admin))

                // Đảm bảo giá trị is_admin là boolean
                const isAdminUser = userData.is_admin === true

                console.log("- Kết quả kiểm tra is_admin === true:", isAdminUser)

                if (isAdminUser) {
                  console.log("OAuth login: User có quyền admin, chuyển hướng đến trang admin")
                  // Sử dụng timeout để đảm bảo chuyển hướng được thực hiện sau khi state đã được cập nhật
                  setTimeout(() => {
                    router.push("/admin")
                  }, 100)
                } else {
                  console.log("OAuth login: User không có quyền admin, chuyển hướng đến dashboard")
                  router.push("/dashboard")
                }
              } catch (error) {
                console.error("Failed to parse user data:", error)
                localStorage.removeItem("spotify_token")
                localStorage.removeItem("spotify_refresh_token")
                localStorage.removeItem("spotify_user")
              }
            } else {
              console.error("No user data found in localStorage")
              localStorage.removeItem("spotify_token")
              localStorage.removeItem("spotify_refresh_token")
            }
          } else {
            // Người dùng đã đóng cửa sổ mà không đăng nhập
            console.log(`Đăng nhập với ${provider} đã bị hủy`)
          }
        }
      }, 500)
    } catch (error) {
      console.error(`Đăng nhập với ${provider} thất bại:`, error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (userData: {
    email: string;
    username?: string;
    password?: string;
    first_name?: string;
    last_name?: string;
    bio?: string;
  }) => {
    setIsLoading(true)
    try {
      // Chỉ gọi API đăng ký và trả về kết quả, không tự động đăng nhập
      const response = await api.auth.register(userData)
      console.log("Registration successful")

      // Trả về kết quả để component xử lý tiếp
      return response
    } catch (error) {
      console.error("Registration failed:", error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    // Gọi API đăng xuất (hiện đã được cập nhật để gửi refresh token)
    api.auth.logout().then(() => {
      // Xóa dữ liệu token và user từ state
      setUser(null);
      setAccessToken(null);

      // Chuyển hướng về trang đăng nhập
      router.push("/login");
    }).catch(error => {
      console.error("Lỗi khi đăng xuất:", error);

      // Vẫn xóa dữ liệu local và chuyển hướng nếu có lỗi
      setUser(null);
      setAccessToken(null);
      router.push("/login");
    });
  }

  // Hàm logout để export qua context
  const logout = handleLogout;

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAdmin: user?.is_admin === true,
        isAuthenticated: !!user,
        loading: isLoading,
        accessToken,
        login,
        loginWithProvider,
        register,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
