"use client"

import { useState, useEffect, ReactNode } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { AdminArtist, AdminArtistService } from "@/lib/api/services/AdminArtistService"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Pencil, Trash2, Search, ArrowUpDown } from "lucide-react"
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import { useToast } from "@/components/ui/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

// Thêm component ConfirmDialog thay vì import
interface ConfirmDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    title: string
    description: string | ReactNode
    onConfirm: () => void
    confirmText?: string
    cancelText?: string
    variant?: "default" | "destructive"
}

function ConfirmDialog({
    open,
    onOpenChange,
    title,
    description,
    onConfirm,
    confirmText = "Xác nhận",
    cancelText = "Hủy",
    variant = "destructive",
}: ConfirmDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        {cancelText}
                    </Button>
                    <Button variant={variant} onClick={onConfirm}>
                        {confirmText}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export function AdminArtistTable() {
    const router = useRouter()
    const { toast } = useToast()
    const [artists, setArtists] = useState<AdminArtist[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [ordering, setOrdering] = useState("-created_at")
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [artistToDelete, setArtistToDelete] = useState<AdminArtist | null>(null)
    const artistService = new AdminArtistService()

    // Lấy danh sách nghệ sĩ
    const fetchArtists = async () => {
        setLoading(true)
        try {
            const response = await artistService.getArtists({
                search: searchQuery,
                ordering
            })
            setArtists(response.results) // Lưu trữ tất cả nghệ sĩ
            setTotalPages(Math.ceil(response.results.length / 20)) // Tính tổng số trang dựa trên tổng số nghệ sĩ
        } catch (error) {
            console.error("Lỗi khi lấy danh sách nghệ sĩ:", error)
            toast({
                variant: "destructive",
                title: "Đã xảy ra lỗi",
                description: "Không thể tải danh sách nghệ sĩ. Vui lòng thử lại sau."
            })
            setArtists([])
            setTotalPages(1)
        } finally {
            setLoading(false)
        }
    }

    // Load nghệ sĩ khi component mount hoặc các dependency thay đổi
    useEffect(() => {
        fetchArtists()
    }, [page, ordering])

    // Tìm kiếm
    const handleSearch = () => {
        setPage(1)
        fetchArtists()
    }

    // Xử lý thay đổi thứ tự sắp xếp
    const handleOrderingChange = (value: string) => {
        setOrdering(value)
    }

    // Xử lý xóa nghệ sĩ
    const handleDeleteArtist = async (artist: AdminArtist) => {
        setArtistToDelete(artist)
        setIsDeleteDialogOpen(true)
    }

    // Xác nhận xóa nghệ sĩ
    const confirmDeleteArtist = async () => {
        if (!artistToDelete) return

        try {
            await artistService.deleteArtist(artistToDelete.id)
            toast({
                title: "Xóa thành công",
                description: `Đã xóa nghệ sĩ "${artistToDelete.name}"`
            })
            fetchArtists()
        } catch (error) {
            console.error("Lỗi khi xóa nghệ sĩ:", error)
            toast({
                variant: "destructive",
                title: "Đã xảy ra lỗi",
                description: "Không thể xóa nghệ sĩ. Vui lòng thử lại sau."
            })
        } finally {
            setIsDeleteDialogOpen(false)
            setArtistToDelete(null)
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4 justify-between">
                {/* Tìm kiếm */}
                <div className="flex gap-2">
                    <Input
                        placeholder="Tìm kiếm nghệ sĩ..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full md:w-80"
                    />
                    <Button variant="outline" onClick={handleSearch}>
                        <Search className="h-4 w-4 mr-2" />
                        Tìm kiếm
                    </Button>
                </div>

                {/* Bộ lọc */}
                <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Sắp xếp theo:</span>
                    <Select value={ordering} onValueChange={handleOrderingChange}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="name">Tên (A-Z)</SelectItem>
                            <SelectItem value="-name">Tên (Z-A)</SelectItem>
                            <SelectItem value="-songs_count">Nhiều bài hát nhất</SelectItem>
                            <SelectItem value="-albums_count">Nhiều album nhất</SelectItem>
                            <SelectItem value="-created_at">Mới nhất</SelectItem>
                            <SelectItem value="created_at">Cũ nhất</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Bảng danh sách nghệ sĩ */}
            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-12">ID</TableHead>
                            <TableHead className="w-14">Ảnh</TableHead>
                            <TableHead>Tên nghệ sĩ</TableHead>
                            <TableHead className="hidden md:table-cell">Bài hát</TableHead>
                            <TableHead className="hidden md:table-cell">Album</TableHead>
                            <TableHead className="hidden md:table-cell">Ngày tạo</TableHead>
                            <TableHead className="hidden md:table-cell">Trạng thái</TableHead>
                            <TableHead className="text-right">Thao tác</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            // Hiển thị skeleton loading
                            Array.from({ length: 5 }).map((_, index) => (
                                <TableRow key={index}>
                                    <TableCell><Skeleton className="h-6 w-8" /></TableCell>
                                    <TableCell><Skeleton className="h-12 w-12 rounded-md" /></TableCell>
                                    <TableCell><Skeleton className="h-6 w-full" /></TableCell>
                                    <TableCell className="hidden md:table-cell"><Skeleton className="h-6 w-12" /></TableCell>
                                    <TableCell className="hidden md:table-cell"><Skeleton className="h-6 w-12" /></TableCell>
                                    <TableCell className="hidden md:table-cell"><Skeleton className="h-6 w-24" /></TableCell>
                                    <TableCell className="hidden md:table-cell"><Skeleton className="h-6 w-16" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-10 w-20 ml-auto" /></TableCell>
                                </TableRow>
                            ))
                        ) : artists.length > 0 ? (
                            // Hiển thị danh sách nghệ sĩ
                            artists.map((artist) => (
                                <TableRow key={artist.id}>
                                    <TableCell>{artist.id}</TableCell>
                                    <TableCell>
                                        {artist.image ? (
                                            <div className="relative h-12 w-12 rounded-md overflow-hidden">
                                                <Image
                                                    src={artist.image}
                                                    alt={artist.name}
                                                    fill
                                                    className="object-cover"
                                                />
                                            </div>
                                        ) : (
                                            <div className="h-12 w-12 bg-zinc-800 rounded-md flex items-center justify-center text-zinc-400">
                                                <span className="text-lg font-semibold">{artist.name.charAt(0)}</span>
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell className="font-medium">{artist.name}</TableCell>
                                    <TableCell className="hidden md:table-cell">{artist.songs_count}</TableCell>
                                    <TableCell className="hidden md:table-cell">{artist.albums_count}</TableCell>
                                    <TableCell className="hidden md:table-cell">
                                        {new Date(artist.created_at).toLocaleDateString("vi-VN")}
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell">
                                        <span
                                            className={`px-2 py-1 rounded-full text-xs ${artist.is_featured
                                                ? "bg-green-500/20 text-green-500"
                                                : "bg-zinc-500/20 text-zinc-400"
                                                }`}
                                        >
                                            {artist.is_featured ? "Nổi bật" : "Bình thường"}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={() => router.push(`/admin/artists/${artist.id}`)}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                size="icon"
                                                onClick={() => handleDeleteArtist(artist)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            // Không có nghệ sĩ
                            <TableRow>
                                <TableCell colSpan={8} className="text-center h-32 text-muted-foreground">
                                    Không tìm thấy nghệ sĩ nào
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Phân trang */}
            {!loading && totalPages > 1 && (
            <Pagination className="mt-4">
                <PaginationContent>
                    <PaginationItem>
                        <PaginationPrevious
                            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                            className={page <= 1 ? "pointer-events-none opacity-50" : ""}
                        />
                    </PaginationItem>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => (
                        <PaginationItem key={pageNumber}>
                            <PaginationLink
                                onClick={() => setPage(pageNumber)}
                                isActive={page === pageNumber}
                            >
                                {pageNumber}
                            </PaginationLink>
                        </PaginationItem>
                    ))}

                    <PaginationItem>
                        <PaginationNext
                            onClick={() => setPage((prev) => (prev < totalPages ? prev + 1 : prev))}
                            className={page >= totalPages ? "pointer-events-none opacity-50" : ""}
                        />
                    </PaginationItem>
                </PaginationContent>
            </Pagination>
        )}

            {/* Dialog xác nhận xóa */}
            <ConfirmDialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                title="Xóa nghệ sĩ"
                description={`Bạn có chắc chắn muốn xóa nghệ sĩ "${artistToDelete?.name}" không? Hành động này không thể hoàn tác.`}
                onConfirm={confirmDeleteArtist}
                confirmText="Xóa"
                cancelText="Hủy"
            />
        </div>
    )
} 