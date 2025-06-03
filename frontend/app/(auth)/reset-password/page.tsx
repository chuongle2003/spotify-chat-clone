"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState("")
  const [tokenValid, setTokenValid] = useState(true)

  // Verify token on page load
  useEffect(() => {
    if (!token) {
      setTokenValid(false)
      setError("Token không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu đặt lại mật khẩu mới.")
      return
    }

    const verifyToken = async () => {
      try {
        // In a real app, you would verify the token with your API
        // await authApi.verifyResetToken(token)

        // For demo purposes, we'll assume the token is valid if it exists
        setTokenValid(true)
      } catch (err) {
        console.error("Error verifying token:", err)
        setTokenValid(false)
        setError("Token không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu đặt lại mật khẩu mới.")
      }
    }

    verifyToken()
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!password) {
      setError("Vui lòng nhập mật khẩu mới")
      return
    }

    if (password.length < 8) {
      setError("Mật khẩu phải có ít nhất 8 ký tự")
      return
    }

    if (password !== confirmPassword) {
      setError("Mật khẩu không khớp")
      return
    }

    try {
      setIsSubmitting(true)

      // In a real app, you would call your API to reset the password
      // await authApi.resetPassword(token, password)

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))

      setIsSuccess(true)
    } catch (err) {
      console.error("Error resetting password:", err)
      setError("Có lỗi xảy ra khi đặt lại mật khẩu. Vui lòng thử lại sau.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-zinc-900 rounded-lg p-8">
        <div className="flex justify-center mb-8">
          <Link href="/">
            <svg viewBox="0 0 78 24" width="78" height="24" className="text-white">
              <path
                fill="currentColor"
                d="M18.616 10.639c-3.77-2.297-9.99-2.509-13.59-1.388a1.077 1.077 0 0 1-1.164-.363 1.14 1.14 0 0 1-.119-1.237c.136-.262.37-.46.648-.548 4.132-1.287 11-1.038 15.342 1.605a1.138 1.138 0 0 1 .099 1.863 1.081 1.081 0 0 1-.813.213c-.142-.02-.28-.07-.403-.145Zm-.124 3.402a.915.915 0 0 1-.563.42.894.894 0 0 1-.69-.112c-3.144-1.983-7.937-2.557-11.657-1.398a.898.898 0 0 1-.971-.303.952.952 0 0 1-.098-1.03.929.929 0 0 1 .54-.458c4.248-1.323 9.53-.682 13.14 1.595a.95.95 0 0 1 .3 1.286Zm-1.43 3.267a.73.73 0 0 1-.45.338.712.712 0 0 1-.553-.089c-2.748-1.722-6.204-2.111-10.276-1.156a.718.718 0 0 1-.758-.298.745.745 0 0 1-.115-.265.757.757 0 0 1 .092-.563.737.737 0 0 1 .457-.333c4.455-1.045 8.277-.595 11.361 1.338a.762.762 0 0 1 .241 1.028ZM11.696 0C5.237 0 0 5.373 0 12c0 6.628 5.236 12 11.697 12 6.46 0 11.698-5.372 11.698-12 0-6.627-5.238-12-11.699-12h.001Z"
              />
            </svg>
          </Link>
        </div>

        <h1 className="text-2xl font-bold text-center mb-4">Đặt lại mật khẩu</h1>

        {!tokenValid ? (
          <div className="text-center">
            <div className="bg-red-500/20 text-red-500 p-4 rounded-lg mb-6">
              <p className="font-medium">{error}</p>
            </div>
            <Link href="/forgot-password">
              <Button className="w-full bg-green-500 hover:bg-green-600 text-black font-bold">
                Yêu cầu đặt lại mật khẩu mới
              </Button>
            </Link>
          </div>
        ) : isSuccess ? (
          <div className="text-center">
            <div className="bg-green-500/20 text-green-500 p-4 rounded-lg mb-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 mx-auto mb-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="font-medium">Mật khẩu đã được đặt lại thành công!</p>
            </div>

            <p className="text-white/70 mb-6">
              Mật khẩu của bạn đã được cập nhật. Bây giờ bạn có thể đăng nhập bằng mật khẩu mới.
            </p>

            <Link href="/login">
              <Button className="w-full bg-green-500 hover:bg-green-600 text-black font-bold">Đăng nhập</Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                Mật khẩu mới
              </label>
              <Input
                id="password"
                type="password"
                placeholder="Nhập mật khẩu mới"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-white"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
                Xác nhận mật khẩu
              </label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Nhập lại mật khẩu mới"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-white"
                disabled={isSubmitting}
              />
            </div>

            {error && <div className="text-red-500 text-sm">{error}</div>}

            <Button
              type="submit"
              className="w-full bg-green-500 hover:bg-green-600 text-black font-bold"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Đang xử lý..." : "Đặt lại mật khẩu"}
            </Button>

            <div className="text-center mt-4">
              <Link href="/login" className="text-white/70 hover:underline text-sm">
                Quay lại đăng nhập
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
