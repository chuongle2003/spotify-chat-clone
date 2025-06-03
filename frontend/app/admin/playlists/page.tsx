"use client"

import { Suspense } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import AdminPlaylistTable from "@/components/admin/playlists/AdminPlaylistTable"
import { useRouter } from "next/navigation"

export default function AdminPlaylistsPage() {
  const router = useRouter()

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Quản lý Playlist</h1>
        <Button onClick={() => router.push("/admin/playlists/new")} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Tạo mới
        </Button>
      </div>

      <Suspense fallback={<div>Đang tải...</div>}>
        <AdminPlaylistTable />
      </Suspense>
    </div>
  )
}
