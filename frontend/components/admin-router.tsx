"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"

export default function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    console.log("===== ADMIN ROUTE DEBUG =====")
    console.log("- User:", user)
    console.log("- isAdmin:", isAdmin)
    console.log("- isLoading:", isLoading)

    if (user) {
      console.log("- Chi tiết user.is_admin:", user.is_admin)
      console.log("- Kiểu dữ liệu is_admin:", typeof user.is_admin)
    }

    if (!isLoading) {
      if (!isAdmin) {
        console.log("Người dùng không có quyền admin, chuyển hướng về dashboard")
        router.push("/dashboard")
      } else {
        console.log("Xác thực admin thành công, hiển thị nội dung admin")
      }
    }
  }, [isLoading, isAdmin, router, user])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    )
  }

  if (!isAdmin) {
    console.log("AdminRoute: Block rendering vì không có quyền admin")
    return null
  }

  return <>{children}</>
}
