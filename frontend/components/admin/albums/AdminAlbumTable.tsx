"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Pencil, Trash2, Search, Disc, ListMusic } from "lucide-react"
import Image from "next/image"
import { useToast } from "@/components/ui/use-toast"
import { AdminAlbum } from "@/lib/api/services/AdminAlbumService"

interface AdminAlbumTableProps {
    albums: AdminAlbum[]
    loading: boolean
    searchQuery: string
    onSearchChange: (query: string) => void
    onDelete: (id: number) => Promise<void>
    onEdit: (album: AdminAlbum) => void
    onManageSongs?: (album: AdminAlbum) => void
}

export default function AdminAlbumTable({
    albums,
    loading,
    searchQuery,
    onSearchChange,
    onDelete,
    onEdit,
    onManageSongs,
}: AdminAlbumTableProps) {
    const { toast } = useToast()
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [albumToDelete, setAlbumToDelete] = useState<AdminAlbum | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString()
    }

    const handleDeleteClick = (album: AdminAlbum) => {
        setAlbumToDelete(album)
        setIsDeleteDialogOpen(true)
    }

    const handleConfirmDelete = async () => {
        if (!albumToDelete) return

        try {
            setIsDeleting(true)
            await onDelete(albumToDelete.id)
            toast({
                title: "Thành công",
                description: `Đã xóa album "${albumToDelete.title}"`,
            })
        } catch (error) {
            console.error("Lỗi khi xóa album:", error)
            toast({
                title: "Lỗi",
                description: "Có lỗi xảy ra khi xóa album",
                variant: "destructive",
            })
        } finally {
            setIsDeleting(false)
            setIsDeleteDialogOpen(false)
            setAlbumToDelete(null)
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <Input
                        placeholder="Tìm kiếm album..."
                        className="pl-10 bg-zinc-800 border-zinc-700 text-white"
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-zinc-800 rounded-md border border-zinc-700 overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-zinc-700/50">
                            <TableHead className="text-zinc-400">Album</TableHead>
                            <TableHead className="text-zinc-400">Nghệ sĩ</TableHead>
                            <TableHead className="text-zinc-400">Ngày phát hành</TableHead>
                            <TableHead className="text-zinc-400">Mô tả</TableHead>
                            <TableHead className="text-zinc-400 text-right">Thao tác</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-10 text-zinc-500">
                                    Đang tải dữ liệu...
                                </TableCell>
                            </TableRow>
                        ) : albums.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-10 text-zinc-500">
                                    Không tìm thấy album nào
                                </TableCell>
                            </TableRow>
                        ) : (
                            albums.map((album) => (
                                <TableRow key={album.id} className="hover:bg-zinc-700/50">
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Image
                                                src={album.cover_image || "/placeholder.svg?height=60&width=60"}
                                                width={60}
                                                height={60}
                                                alt={album.title}
                                                className="rounded"
                                            />
                                            <div className="font-medium">{album.title}</div>
                                        </div>
                                    </TableCell>
                                    <TableCell>{album.artist.name}</TableCell>
                                    <TableCell>{formatDate(album.release_date)}</TableCell>
                                    <TableCell className="max-w-xs truncate">{album.description || "-"}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            {onManageSongs && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    title="Quản lý bài hát"
                                                    onClick={() => onManageSongs(album)}
                                                >
                                                    <ListMusic className="h-4 w-4" />
                                                </Button>
                                            )}
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                title="Chỉnh sửa"
                                                onClick={() => onEdit(album)}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-red-500"
                                                title="Xóa"
                                                onClick={() => handleDeleteClick(album)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent className="bg-zinc-900 text-white border-zinc-800">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Xác nhận xóa album</AlertDialogTitle>
                        <AlertDialogDescription className="text-zinc-400">
                            Bạn có chắc chắn muốn xóa album này? Hành động này không thể hoàn tác.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    {albumToDelete && (
                        <div className="py-4">
                            <div className="flex items-center gap-3 p-4 bg-zinc-800 rounded-md">
                                <Image
                                    src={albumToDelete.cover_image || "/placeholder.svg?height=80&width=80"}
                                    width={80}
                                    height={80}
                                    alt={albumToDelete.title}
                                    className="rounded"
                                />
                                <div>
                                    <div className="font-medium">{albumToDelete.title}</div>
                                    <div className="text-sm text-zinc-400">{albumToDelete.artist.name}</div>
                                    <div className="text-xs text-zinc-400">{formatDate(albumToDelete.release_date)}</div>
                                </div>
                            </div>
                        </div>
                    )}
                    <AlertDialogFooter>
                        <AlertDialogCancel
                            className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
                            disabled={isDeleting}
                        >
                            Hủy
                        </AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-red-600 text-white hover:bg-red-700"
                            onClick={handleConfirmDelete}
                            disabled={isDeleting}
                        >
                            {isDeleting ? "Đang xóa..." : "Xóa album"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
} 