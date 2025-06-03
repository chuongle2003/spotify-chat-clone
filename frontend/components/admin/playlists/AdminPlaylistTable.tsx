"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination"
import { Badge } from "@/components/ui/badge"
import { Edit, MoreVertical, Search, Trash2, Upload, Eye } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { AdminPlaylistService } from "@/lib/api/services/AdminPlaylistService"
import { formatDate } from "@/lib/utils"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

export default function AdminPlaylistTable() {
    const router = useRouter()
    const { toast } = useToast()
    const [playlists, setPlaylists] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [totalCount, setTotalCount] = useState(0)
    const [page, setPage] = useState(1)
    const [searchTerm, setSearchTerm] = useState("")
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [playlistToDelete, setPlaylistToDelete] = useState<number | null>(null)

    const playlistService = new AdminPlaylistService()

    const fetchPlaylists = async () => {
        try {
            setLoading(true)

            const params: any = {
                page,
                page_size: 10,
            }

            if (searchTerm) {
                params.search = searchTerm
            }

            // Gọi API để lấy danh sách playlist
            const response = await playlistService.getPlaylists(params)

            // Kiểm tra định dạng response
            if (Array.isArray(response)) {
                // Nếu response là mảng (API trả về mảng trực tiếp)
                setPlaylists(response)
                setTotalCount(response.length)
            } else if (response && response.results) {
                // Nếu response là đối tượng có thuộc tính results (như định nghĩa trong AdminPlaylistResponse)
                setPlaylists(response.results)
                setTotalCount(response.count || response.results.length)
            } else {
                // Trường hợp không có dữ liệu hoặc định dạng không phù hợp
                setPlaylists([])
                setTotalCount(0)
                console.error("Định dạng dữ liệu không đúng:", response)
            }
        } catch (error) {
            console.error("Lỗi khi tải danh sách playlist:", error)
            toast({
                title: "Lỗi",
                description: "Không thể tải danh sách playlist. Vui lòng thử lại sau.",
                variant: "destructive",
            })
            // Đặt mảng rỗng trong trường hợp lỗi
            setPlaylists([])
            setTotalCount(0)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchPlaylists()
    }, [page, searchTerm])

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        setPage(1) // Reset về trang 1 khi tìm kiếm
        fetchPlaylists()
    }

    const handleDeleteClick = (id: number) => {
        setPlaylistToDelete(id)
        setDeleteDialogOpen(true)
    }

    const handleConfirmDelete = async () => {
        if (!playlistToDelete) return

        try {
            await playlistService.deletePlaylist(playlistToDelete)
            toast({
                title: "Thành công",
                description: "Đã xóa playlist thành công",
            })
            fetchPlaylists() // Tải lại danh sách
        } catch (error) {
            console.error("Lỗi khi xóa playlist:", error)
            toast({
                title: "Lỗi",
                description: "Không thể xóa playlist. Vui lòng thử lại sau.",
                variant: "destructive",
            })
        }

        setDeleteDialogOpen(false)
        setPlaylistToDelete(null)
    }

    const totalPages = Math.ceil(totalCount / 10)

    // Thêm console.log để debug
    console.log("Playlists data:", playlists)
    console.log("Total count:", totalCount)

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <form onSubmit={handleSearch} className="relative w-full max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                        type="search"
                        placeholder="Tìm kiếm playlist..."
                        className="pl-9"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </form>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Tên playlist</TableHead>
                            <TableHead>Người tạo</TableHead>
                            <TableHead>Trạng thái</TableHead>
                            <TableHead>Ngày tạo</TableHead>
                            <TableHead>Lượt theo dõi</TableHead>
                            <TableHead></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center h-24">
                                    <div className="flex justify-center">
                                        <div className="animate-spin h-6 w-6 border-t-2 border-green-500 rounded-full" />
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : playlists.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center h-24">
                                    Không tìm thấy playlist nào
                                </TableCell>
                            </TableRow>
                        ) : (
                            playlists.map((playlist) => (
                                <TableRow key={playlist.id}>
                                    <TableCell className="font-medium">{playlist.id}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded bg-gray-700 flex-shrink-0 overflow-hidden">
                                                {playlist.cover_image ? (
                                                    <img
                                                        src={playlist.cover_image}
                                                        alt={playlist.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-500">
                                                        <Upload className="h-4 w-4" />
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-medium">{playlist.name}</div>
                                                {playlist.description && (
                                                    <div className="text-xs text-gray-500 truncate max-w-[200px]">
                                                        {playlist.description}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>{playlist.user?.username || "Không rõ"}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1">
                                            <Badge variant={playlist.is_public ? "default" : "outline"}>
                                                {playlist.is_public ? "Công khai" : "Riêng tư"}
                                            </Badge>
                                            {playlist.is_collaborative && (
                                                <Badge variant="secondary">Cộng tác</Badge>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>{formatDate(playlist.created_at)}</TableCell>
                                    <TableCell>{playlist.followers_count || playlist.collaborators_count || 0}</TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={() => router.push(`/admin/playlists/${playlist.id}`)}>
                                                    <Eye className="mr-2 h-4 w-4" />
                                                    Xem chi tiết
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => router.push(`/admin/playlists/${playlist.id}/edit`)}>
                                                    <Edit className="mr-2 h-4 w-4" />
                                                    Chỉnh sửa
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="text-red-500 focus:text-red-500"
                                                    onClick={() => handleDeleteClick(playlist.id)}
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Xóa
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {totalPages > 1 && (
                <Pagination>
                    <PaginationContent>
                        <PaginationItem>
                            <PaginationPrevious
                                onClick={() => page > 1 && setPage(page - 1)}
                                className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                            />
                        </PaginationItem>

                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            // Hiển thị các trang xung quanh trang hiện tại
                            let pageToShow

                            if (totalPages <= 5) {
                                // Nếu tổng số trang <= 5, hiển thị tất cả
                                pageToShow = i + 1
                            } else if (page <= 3) {
                                // Nếu đang ở gần đầu
                                pageToShow = i + 1
                            } else if (page >= totalPages - 2) {
                                // Nếu đang ở gần cuối
                                pageToShow = totalPages - 4 + i
                            } else {
                                // Ở giữa
                                pageToShow = page - 2 + i
                            }

                            return (
                                <PaginationItem key={i}>
                                    <PaginationLink
                                        isActive={pageToShow === page}
                                        onClick={() => setPage(pageToShow)}
                                        className="cursor-pointer"
                                    >
                                        {pageToShow}
                                    </PaginationLink>
                                </PaginationItem>
                            )
                        })}

                        {totalPages > 5 && page < totalPages - 2 && (
                            <PaginationItem>
                                <PaginationEllipsis />
                            </PaginationItem>
                        )}

                        {totalPages > 5 && page < totalPages - 1 && (
                            <PaginationItem>
                                <PaginationLink
                                    onClick={() => setPage(totalPages)}
                                    className="cursor-pointer"
                                >
                                    {totalPages}
                                </PaginationLink>
                            </PaginationItem>
                        )}

                        <PaginationItem>
                            <PaginationNext
                                onClick={() => page < totalPages && setPage(page + 1)}
                                className={page === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                            />
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            )}

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Xác nhận xóa playlist</AlertDialogTitle>
                        <AlertDialogDescription>
                            Hành động này không thể hoàn tác. Playlist sẽ bị xóa vĩnh viễn khỏi hệ thống.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmDelete} className="bg-red-500 hover:bg-red-600">
                            Xóa
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
} 