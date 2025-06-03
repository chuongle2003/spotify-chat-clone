"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Eye, EyeOff, ArrowLeft } from "lucide-react"
import postmanApi from "@/lib/api/postman"

export default function ForgotPasswordPage() {
  // Form states
  const [email, setEmail] = useState("")
  const [resetToken, setResetToken] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  // UI states
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentStep, setCurrentStep] = useState<"request" | "reset" | "success">("request")
  const [error, setError] = useState("")

  // OTP timer states
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 phút tính bằng giây
  const [timerActive, setTimerActive] = useState(false);

  // Xử lý đồng hồ đếm ngược cho OTP
  useEffect(() => {
    if (!timerActive) return;

    if (timeLeft <= 0) {
      // Hết thời gian
      setError("Mã xác nhận đã hết hạn. Vui lòng yêu cầu mã mới.");
      setTimerActive(false);
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft, timerActive]);

  // Format thời gian còn lại
  const formatTimeLeft = () => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Handle email request submission
  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!email) {
      setError("Vui lòng nhập địa chỉ email")
      return
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError("Địa chỉ email không hợp lệ")
      return
    }

    try {
      setIsSubmitting(true)

      // Call the API to request password reset
      await postmanApi.auth.requestPasswordReset(email)

      // Move to the reset password step
      setCurrentStep("reset")

      // Bắt đầu đếm ngược
      setTimeLeft(15 * 60);
      setTimerActive(true);
    } catch (err) {
      console.error("Error requesting password reset:", err)
      setError("Có lỗi xảy ra. Vui lòng thử lại sau.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle reset password submission
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validate inputs
    if (!resetToken) {
      setError("Vui lòng nhập mã xác nhận")
      return
    }

    if (!newPassword) {
      setError("Vui lòng nhập mật khẩu mới")
      return
    }

    if (newPassword.length < 8) {
      setError("Mật khẩu phải có ít nhất 8 ký tự")
      return
    }

    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp")
      return
    }

    try {
      setIsSubmitting(true)

      // Call API to verify token and set new password
      await postmanApi.auth.verifyResetTokenAndSetPassword(email, resetToken, newPassword)

      // Move to success step
      setCurrentStep("success")
    } catch (err) {
      console.error("Error resetting password:", err)
      setError("Có lỗi xảy ra. Mã xác nhận có thể không hợp lệ hoặc đã hết hạn.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 relative">

      <div className="w-full max-w-md bg-zinc-900 rounded-lg p-8">
        <div className="flex justify-center mb-8">
          <svg viewBox="0 0 78 24" width="78" height="24" className="text-white">
            <path
              fill="currentColor"
              d="M18.616 10.639c-3.77-2.297-9.99-2.509-13.59-1.388a1.077 1.077 0 0 1-1.164-.363 1.14 1.14 0 0 1-.119-1.237c.136-.262.37-.46.648-.548 4.132-1.287 11-1.038 15.342 1.605a1.138 1.138 0 0 1 .099 1.863 1.081 1.081 0 0 1-.813.213c-.142-.02-.28-.07-.403-.145Zm-.124 3.402a.915.915 0 0 1-.563.42.894.894 0 0 1-.69-.112c-3.144-1.983-7.937-2.557-11.657-1.398a.898.898 0 0 1-.971-.303.952.952 0 0 1-.098-1.03.929.929 0 0 1 .54-.458c4.248-1.323 9.53-.682 13.14 1.595a.95.95 0 0 1 .3 1.286Zm-1.43 3.267a.73.73 0 0 1-.45.338.712.712 0 0 1-.553-.089c-2.748-1.722-6.204-2.111-10.276-1.156a.718.718 0 0 1-.758-.298.745.745 0 0 1-.115-.265.757.757 0 0 1 .092-.563.737.737 0 0 1 .457-.333c4.455-1.045 8.277-.595 11.361 1.338a.762.762 0 0 1 .241 1.028ZM11.696 0C5.237 0 0 5.373 0 12c0 6.628 5.236 12 11.697 12 6.46 0 11.698-5.372 11.698-12 0-6.627-5.238-12-11.699-12h.001Z"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-center mb-4">Đặt lại mật khẩu</h1>

        {currentStep === "request" && (
          <>
            <p className="text-white/70 text-center mb-6">
              Nhập địa chỉ email của bạn và chúng tôi sẽ gửi cho bạn một mã xác nhận để đặt lại mật khẩu.
            </p>

            <form onSubmit={handleRequestReset} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                  Địa chỉ email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                {isSubmitting ? "Đang xử lý..." : "Gửi mã xác nhận"}
              </Button>

              <div className="text-center mt-4">
                <Link href="/login" className="text-white/70 hover:underline text-sm">
                  Quay lại đăng nhập
                </Link>
              </div>
            </form>
          </>
        )}

        {currentStep === "reset" && (
          <>
            <div className="bg-green-500/20 text-green-500 p-4 rounded-lg mb-6">
              <p className="font-medium">Đã gửi mã xác nhận!</p>
              <p className="text-sm mt-1">
                Chúng tôi đã gửi một mã xác nhận đến <span className="font-medium">{email}</span>
              </p>
              {timerActive && (
                <p className="text-sm mt-1 font-bold">
                  Mã xác nhận có hiệu lực trong: {formatTimeLeft()}
                </p>
              )}
            </div>

            <p className="text-white/70 text-center mb-6">Vui lòng nhập mã xác nhận và mật khẩu mới của bạn.</p>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label htmlFor="reset-token" className="block text-sm font-medium mb-2">
                  Mã xác nhận
                </label>
                <Input
                  id="reset-token"
                  type="text"
                  placeholder="Nhập mã xác nhận từ email"
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white"
                  disabled={isSubmitting}
                />
              </div>

              <div className="relative">
                <label htmlFor="new-password" className="block text-sm font-medium mb-2">
                  Mật khẩu mới
                </label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Nhập mật khẩu mới"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-white pr-10"
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirm-password" className="block text-sm font-medium mb-2">
                  Xác nhận mật khẩu
                </label>
                <Input
                  id="confirm-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Xác nhận mật khẩu mới"
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
                <Button
                  variant="link"
                  className="text-white/70"
                  onClick={() => {
                    setEmail("")
                    setCurrentStep("request")
                    setError("")
                  }}
                  type="button"
                >
                  Thử với email khác
                </Button>
              </div>
            </form>
          </>
        )}

        {currentStep === "success" && (
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
              Mật khẩu của bạn đã được cập nhật. Bạn có thể đăng nhập bằng mật khẩu mới ngay bây giờ.
            </p>

            <div className="flex flex-col space-y-2">
              <Link href="/login">
                <Button className="w-full bg-green-500 hover:bg-green-600 text-black font-bold">Đăng nhập ngay</Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
