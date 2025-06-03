"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { postmanApi } from "@/lib/api/postman"
import { useAuth } from "@/context/auth-context"

// Schema cho form đăng nhập
const formSchema = z.object({
  email: z.string().email({ message: "Email không hợp lệ" }),
  password: z.string().min(6, { message: "Mật khẩu phải có ít nhất 6 ký tự" }),
})

export default function LoginPage() {
  const { login } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  // Kiểm tra xem có vừa từ trang register chuyển đến không
  useEffect(() => {
    const fromRegister = searchParams.get("fromRegister")
    const email = searchParams.get("email")

    if (fromRegister === "true") {
      toast({
        title: "Chào mừng bạn đã đăng ký thành công!",
        description: "Vui lòng đăng nhập để bắt đầu trải nghiệm.",
        variant: "default",
      })

      // Nếu có email từ trang đăng ký, điền sẵn vào form
      if (email) {
        form.setValue("email", email)
      }
    }
  }, [searchParams, toast, form])

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true)

    try {
      // Gọi API đăng nhập
      await login(values.email, values.password)

      toast({
        title: "Đăng nhập thành công",
        description: "Chào mừng bạn quay trở lại!",
      })

      // Chuyển hướng được xử lý trong useAuth dựa trên vai trò người dùng
    } catch (error: any) {
      console.error("Login error:", error)

      toast({
        title: "Đăng nhập thất bại",
        description: error?.message || "Email hoặc mật khẩu không đúng",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold text-white">Đăng nhập</h1>
        <p className="text-zinc-400 mt-2">Đăng nhập để tiếp tục trải nghiệm âm nhạc</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">Email</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    disabled={isLoading}
                    placeholder="email@example.com"
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                </FormControl>
                <FormMessage />
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
                  <Input
                    {...field}
                    type="password"
                    disabled={isLoading}
                    placeholder="••••••••"
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                </FormControl>
                <FormMessage />
                <div className="mt-1 text-right">
                  <Link href="/forgot-password" className="text-sm text-green-500 hover:text-green-400">
                    Quên mật khẩu?
                  </Link>
                </div>
              </FormItem>
            )}
          />

          <Button type="submit" disabled={isLoading} className="w-full bg-green-500 hover:bg-green-600 text-white">
            {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
          </Button>
        </form>
      </Form>

      <div className="mt-6 text-center">
        <p className="text-zinc-400">
          Chưa có tài khoản?{" "}
          <Link href="/register" className="text-green-500 hover:text-green-400">
            Đăng ký ngay
          </Link>
        </p>
      </div>
    </div>
  )
}
