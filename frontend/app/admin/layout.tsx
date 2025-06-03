"use client"

import { ReactNode, useState, useEffect } from "react"
import AdminRoute from "@/components/admin-router"
import AdminHeader from "@/components/admin/header"
import AdminSidebar from "@/components/admin/sidebar"
import AdminCenter from "@/components/admin/center"

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // Lắng nghe sự kiện sidebar-collapsed từ localStorage
  useEffect(() => {
    // Kiểm tra trạng thái ban đầu
    const storedState = localStorage.getItem('admin-sidebar-collapsed')
    if (storedState) {
      setSidebarCollapsed(storedState === 'true')
    }

    // Hàm xử lý sự kiện storage change
    const handleStorageChange = () => {
      const collapsed = localStorage.getItem('admin-sidebar-collapsed') === 'true'
      setSidebarCollapsed(collapsed)
    }

    // Đăng ký sự kiện
    window.addEventListener('storage', handleStorageChange)

    // Custom event cho cùng tab/window
    window.addEventListener('admin-sidebar-toggle', () => {
      const collapsed = localStorage.getItem('admin-sidebar-collapsed') === 'true'
      setSidebarCollapsed(collapsed)
    })

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('admin-sidebar-toggle', handleStorageChange)
    }
  }, [])

  return (
    <AdminRoute>
      <div className="min-h-screen bg-black text-white flex flex-col">
        {/* Header */}
        <AdminHeader />

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <AdminSidebar onToggle={(collapsed) => setSidebarCollapsed(collapsed)} />

          {/* Main content with padding to avoid overlap with sidebar */}
          <div className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'ml-20' : 'ml-64'}`}>
            <AdminCenter>
              {children}
            </AdminCenter>
          </div>
        </div>
      </div>
    </AdminRoute>
  )
}
