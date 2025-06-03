"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@/context/auth-context"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Eye, EyeOff, ChevronDown, ChevronUp, ArrowLeft } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

// Định nghĩa schema validation với Zod
const registerSchema = z.object({
  email: z.string()
    .min(1, "Địa chỉ email là bắt buộc")
    .email("Địa chỉ email không hợp lệ")
    .refine(email => email.endsWith('@gmail.com'), {
      message: "Chỉ chấp nhận email có domain @gmail.com"
    }),
  username: z.string()
    .min(3, "Tên người dùng phải có ít nhất 3 ký tự")
    .max(30, "Tên người dùng không được vượt quá 30 ký tự")
    .regex(/^[a-zA-Z0-9_]+$/, "Tên người dùng chỉ được chứa chữ cái, số và dấu gạch dưới"),
  password: z.string()
    .min(8, "Mật khẩu phải có ít nhất 8 ký tự"),
  confirmPassword: z.string(),
  // Thêm các trường không bắt buộc theo response API
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  bio: z.string().optional(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Mật khẩu xác nhận không khớp",
  path: ["confirmPassword"],
});

// Định nghĩa type từ schema
type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const { register: registerUser, loginWithProvider, isLoading } = useAuth()
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [showAdditionalFields, setShowAdditionalFields] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  // Khởi tạo React Hook Form với Zod resolver
  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      username: "",
      password: "",
      confirmPassword: "",
      first_name: "",
      last_name: "",
      bio: ""
    }
  });

  const onSubmit = async (data: RegisterForm) => {
    setError("")
    try {
      // Gọi API đăng ký và chờ kết quả
      await registerUser({
        email: data.email,
        username: data.username,
        password: data.password,
        first_name: data.first_name || undefined,
        last_name: data.last_name || undefined,
        bio: data.bio || undefined
      })

      // Hiển thị thông báo thành công bằng toast
      toast({
        title: "Đăng ký thành công!",
        description: "Vui lòng đăng nhập để tiếp tục.",
        variant: "default",
      })

      // Chuyển hướng tới trang đăng nhập với thông tin trạng thái đăng ký và email
      setTimeout(() => {
        router.push(`/login?fromRegister=true&email=${encodeURIComponent(data.email)}`)
      }, 1500)
    } catch (err: any) {
      // Xử lý các lỗi từ API
      if (err.message && err.message.includes("Email already registered")) {
        setError("Email này đã được đăng ký trước đó")
        toast({
          title: "Đăng ký thất bại",
          description: "Email này đã được đăng ký trước đó",
          variant: "destructive",
        })
      } else if (err.message && err.message.includes("Username already taken")) {
        setError("Tên người dùng này đã tồn tại")
        toast({
          title: "Đăng ký thất bại",
          description: "Tên người dùng này đã tồn tại",
          variant: "destructive",
        })
      } else {
        console.error("Registration error:", err)
        setError("Đăng ký thất bại. Vui lòng thử lại sau.")
        toast({
          title: "Đăng ký thất bại",
          description: "Có lỗi xảy ra. Vui lòng thử lại sau.",
          variant: "destructive",
        })
      }
    }
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 relative">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <svg viewBox="0 0 496 512" width="78" height="24" className="text-white">
            <path
              fill="#1DB954"
              d="M248 8C111.1 8 0 119.1 0 256s111.1 248 248 248 248-111.1 248-248S384.9 8 248 8Z"
            />
            <path
              fill="#191414"
              d="M406.6 231.1c-5.2 0-8.4-1.3-12.9-3.9-71.2-42.5-198.5-52.7-280.9-29.7-3.6 1-8.1 2.6-12.9 2.6-13.2 0-23.3-10.3-23.3-23.6 0-13.6 8.4-21.3 17.4-23.9 35.2-10.3 74.6-15.2 117.5-15.2 73 0 149.5 15.2 205.4 47.8 7.8 4.5 12.9 10.7 12.9 22.6 0 13.6-11 23.3-23.2 23.3zm-31 76.2c-5.2 0-8.7-2.3-12.3-4.2-62.5-37-155.7-51.9-238.6-29.4-4.8 1.3-7.4 2.6-11.9 2.6-10.7 0-19.4-8.7-19.4-19.4s5.2-17.8 15.5-20.7c27.8-7.8 56.2-13.6 97.8-13.6 64.9 0 127.6 16.1 177 45.5 8.1 4.8 11.3 11 11.3 19.7-.1 10.8-8.5 19.5-19.4 19.5zm-26.9 65.6c-4.2 0-6.8-1.3-10.7-3.6-62.4-37.6-135-39.2-206.7-24.5-3.9 1-9 2.6-11.9 2.6-9.7 0-15.8-7.7-15.8-15.8 0-10.3 6.1-15.2 13.6-16.8 81.9-18.1 165.6-16.5 237 26.2 6.1 3.9 9.7 7.4 9.7 16.5s-7.1 15.4-15.2 15.4z"
            />
          </svg>
        </div>

        <h1 className="text-3xl font-bold text-center mb-8">Đăng ký để bắt đầu nghe</h1>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Địa chỉ email</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      placeholder="name@domain.com"
                      className="bg-zinc-800 border-zinc-700 text-white"
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage className="text-red-500" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Tên người dùng</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="text"
                      placeholder="Tên người dùng"
                      className="bg-zinc-800 border-zinc-700 text-white"
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage className="text-red-500" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Mật khẩu</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        type={showPassword ? "text" : "password"}
                        placeholder="Mật khẩu"
                        className="bg-zinc-800 border-zinc-700 text-white pr-10"
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 flex items-center pr-3"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5 text-white/70" />
                        ) : (
                          <Eye className="h-5 w-5 text-white/70" />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage className="text-red-500" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Xác nhận mật khẩu</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Xác nhận mật khẩu"
                        className="bg-zinc-800 border-zinc-700 text-white pr-10"
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 flex items-center pr-3"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-5 w-5 text-white/70" />
                        ) : (
                          <Eye className="h-5 w-5 text-white/70" />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage className="text-red-500" />
                </FormItem>
              )}
            />

            <Button
              type="button"
              variant="ghost"
              className="w-full text-white flex items-center justify-center gap-1"
              onClick={() => setShowAdditionalFields(!showAdditionalFields)}
            >
              {showAdditionalFields ? "Ẩn thông tin bổ sung" : "Thêm thông tin bổ sung"}
              {showAdditionalFields ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>

            {showAdditionalFields && (
              <>
                <FormField
                  control={form.control}
                  name="first_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Tên</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="text"
                          placeholder="Tên của bạn"
                          className="bg-zinc-800 border-zinc-700 text-white"
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage className="text-red-500" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="last_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Họ</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="text"
                          placeholder="Họ của bạn"
                          className="bg-zinc-800 border-zinc-700 text-white"
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage className="text-red-500" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Giới thiệu</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Giới thiệu về bản thân bạn"
                          className="bg-zinc-800 border-zinc-700 text-white resize-none min-h-[80px]"
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage className="text-red-500" />
                    </FormItem>
                  )}
                />
              </>
            )}

            {error && <div className="text-red-500 text-sm mt-1">{error}</div>}

            <Button
              type="submit"
              className="w-full bg-green-500 hover:bg-green-600 text-black font-bold py-3"
              disabled={isLoading}
            >
              {isLoading ? "Đang xử lý..." : "Đăng ký"}
            </Button>

            <div className="relative flex items-center justify-center">
              <div className="border-t border-white/10 absolute w-full"></div>
              <span className="bg-black px-4 relative text-white/70">hoặc</span>
            </div>

            <div className="border-t border-white/10 pt-6 text-center">
              <p className="text-white/70">
                Bạn đã có tài khoản?{" "}
                <Link href="/login" className="text-white hover:underline">
                  Đăng nhập tại đây
                </Link>
              </p>
            </div>

            <div className="text-xs text-white/50 text-center mt-8">
              <p>
                This site is protected by reCAPTCHA and the Google{" "}
                <Link href="#" className="underline">
                  Privacy Policy
                </Link>{" "}
                and{" "}
                <Link href="#" className="underline">
                  Terms of Service
                </Link>{" "}
                apply.
              </p>
            </div>
          </form>
        </Form>
      </div>
    </div>
  )
}
