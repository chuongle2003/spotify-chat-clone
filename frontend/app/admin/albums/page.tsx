"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Disc } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import type { AdminAlbum } from "@/lib/api/services/AdminAlbumService"
import { api } from "@/lib/api"
import AdminAlbumTable from "@/components/admin/albums/AdminAlbumTable"
import AdminAlbumForm from "@/components/admin/albums/AdminAlbumForm"
import AdminSongsList from "@/components/admin/albums/AdminSongsList"

export default function AdminAlbumsPage() {
  const { toast } = useToast()
  const [albums, setAlbums] = useState<AdminAlbum[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddAlbumOpen, setIsAddAlbumOpen] = useState(false)
  const [isEditAlbumOpen, setIsEditAlbumOpen] = useState(false)
  const [isManageSongsOpen, setIsManageSongsOpen] = useState(false)
  const [selectedAlbum, setSelectedAlbum] = useState<AdminAlbum | null>(null)

  // Hàm fetch danh sách album từ API
  const fetchAlbums = async () => {
    try {
      setLoading(true)
      const response = await api.adminAlbums.getAlbums({
        search: searchQuery,
      })

      // Kiểm tra và xử lý response
      if (response && Array.isArray(response)) {
        setAlbums(response)
      } else if (response && Array.isArray(response.results)) {
        setAlbums(response.results)
      } else {
        setAlbums([])
        console.error("Định dạng response không hợp lệ:", response)
      }
    } catch (error) {
      console.error("Lỗi khi lấy danh sách album:", error)
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách album",
        variant: "destructive",
      })
      setAlbums([])
    } finally {
      setLoading(false)
    }
  }

  // Load danh sách album khi component mount hoặc searchQuery thay đổi
  useEffect(() => {
    fetchAlbums()
  }, [searchQuery])

  // Mở form thêm album mới
  const handleAddAlbum = () => {
    setIsAddAlbumOpen(true)
  }

  // Mở form chỉnh sửa album
  const handleEditAlbum = (album: AdminAlbum) => {
    setSelectedAlbum(album)
    setIsEditAlbumOpen(true)
  }

  // Mở dialog quản lý bài hát trong album
  const handleManageSongs = (album: AdminAlbum) => {
    setSelectedAlbum(album)
    setIsManageSongsOpen(true)
  }

  // Xóa album
  const handleDeleteAlbum = async (id: number) => {
    try {
      await api.adminAlbums.deleteAlbum(id)
      // Cập nhật lại danh sách albums sau khi xóa
      setAlbums(albums.filter(album => album.id !== id))
      return Promise.resolve()
    } catch (error) {
      console.error("Lỗi khi xóa album:", error)
      return Promise.reject(error)
    }
  }

  // Sau khi thêm hoặc sửa album thành công, cập nhật lại danh sách
  const handleFormSuccess = () => {
    fetchAlbums()
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Quản lý album</h1>
        <Button onClick={handleAddAlbum}>
          <Disc className="h-4 w-4 mr-2" />
          Thêm album
        </Button>
      </div>

      {/* Bảng danh sách album */}
      <AdminAlbumTable
        albums={albums}
        loading={loading}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onDelete={handleDeleteAlbum}
        onEdit={handleEditAlbum}
        onManageSongs={handleManageSongs}
      />

      {/* Form thêm album mới */}
      <AdminAlbumForm
        isOpen={isAddAlbumOpen}
        onClose={() => setIsAddAlbumOpen(false)}
        onSuccess={handleFormSuccess}
        mode="add"
        albumService={api.adminAlbums}
      />

      {/* Form chỉnh sửa album */}
      {selectedAlbum && (
        <>
          <AdminAlbumForm
            isOpen={isEditAlbumOpen}
            onClose={() => {
              setIsEditAlbumOpen(false)
              setSelectedAlbum(null)
            }}
            onSuccess={handleFormSuccess}
            albumData={selectedAlbum}
            mode="edit"
            albumService={api.adminAlbums}
          />

          {/* Dialog quản lý bài hát trong album */}
          <AdminSongsList
            isOpen={isManageSongsOpen}
            onClose={() => {
              setIsManageSongsOpen(false)
              setSelectedAlbum(null)
            }}
            album={selectedAlbum}
            albumService={api.adminAlbums}
          />
        </>
      )}
    </div>
  )
}
