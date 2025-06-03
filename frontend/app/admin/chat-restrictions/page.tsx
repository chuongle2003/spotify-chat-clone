"use client"

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogDescription
} from "@/components/ui/dialog"
import {
    AlertTriangle,
    MoreHorizontal,
    Plus,
    RefreshCw,
    Search,
    User
} from 'lucide-react'
import {
    adminUserService,
    ChatRestriction,
    ChatRestrictionParams
} from '@/lib/api/services/AdminUserService'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import Link from 'next/link'

export default function ChatRestrictionsPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [restrictions, setRestrictions] = useState<ChatRestriction[]>([])
    const [loading, setLoading] = useState(true)
    const [pagination, setPagination] = useState({
        page: 1,
        pageSize: 10,
        totalCount: 0
    })
    const [filters, setFilters] = useState<ChatRestrictionParams>({
        user_id: searchParams.get('user_id') ? parseInt(searchParams.get('user_id') as string) : undefined,
        restriction_type: undefined,
        is_active: undefined
    })
    const [searchTerm, setSearchTerm] = useState("")
    const [userDetails, setUserDetails] = useState<Record<number, { username: string, avatar?: string }>>({})

    const fetchRestrictions = useCallback(async () => {
        try {
            setLoading(true)
            const response = await adminUserService.getChatRestrictions({
                page: pagination.page,
                page_size: pagination.pageSize,
                user_id: filters.user_id,
                restriction_type: filters.restriction_type,
                is_active: filters.is_active
            })

            setRestrictions(response.results)
            setPagination(prev => ({ ...prev, totalCount: response.count }))

            // Lấy thông tin người dùng cho mỗi restriction nếu chưa có
            const userIds = response.results
                .filter(r => r.user && r.user.id)
                .map(r => r.user.id)
                .filter(id => !userDetails[id])

            // Thực hiện lấy thông tin người dùng nếu cần
            if (userIds.length > 0) {
                // Trong thực tế, bạn sẽ cần API để lấy thông tin users hàng loạt
                // Hoặc lấy từ response nếu API đã trả về thông tin người dùng đầy đủ
            }
        } catch (error) {
            console.error("Lỗi khi tải danh sách hạn chế:", error)
            toast.error("Không thể tải danh sách hạn chế")
        } finally {
            setLoading(false)
        }
    }, [pagination.page, pagination.pageSize, filters])

    useEffect(() => {
        fetchRestrictions()
    }, [fetchRestrictions])

    const handlePageChange = (newPage: number) => {
        setPagination(prev => ({ ...prev, page: newPage }))
    }

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        // Trong thực tế API có thể không hỗ trợ tìm kiếm, bạn sẽ cần thay đổi phần này
        fetchRestrictions()
    }

    const handleDeactivateRestriction = async (restrictionId: number) => {
        try {
            await adminUserService.deactivateChatRestriction(restrictionId)
            toast.success("Đã hủy hạn chế thành công")
            fetchRestrictions()
        } catch (error) {
            console.error("Lỗi khi hủy hạn chế:", error)
            toast.error("Không thể hủy hạn chế")
        }
    }

    const getRestrictionBadge = (type: string, isActive: boolean) => {
        if (!isActive) {
            return (
                <Badge variant="outline" className="bg-zinc-600/20 text-zinc-400 border-zinc-800">
                    {type} - Đã hủy
                </Badge>
            )
        }

        switch (type) {
            case 'TEMPORARY':
                return (
                    <Badge variant="outline" className="bg-amber-600/20 text-amber-400 border-amber-800">
                        Tạm thời
                    </Badge>
                )
            case 'PERMANENT':
                <Badge variant="destructive" className="bg-red-600 hover:bg-red-700">
                    Vĩnh viễn
                </Badge>
            case 'WARNING':
                return (
                    <Badge variant="outline" className="bg-blue-600/20 text-blue-400 border-blue-800">
                        Cảnh báo
                    </Badge>
                )
            default:
                return (
                    <Badge variant="outline">{type}</Badge>
                )
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Quản lý hạn chế chat</h1>

                <div className="flex items-center gap-2">
                    <form onSubmit={handleSearch} className="relative max-w-xs">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-zinc-500" />
                        <Input
                            placeholder="Tìm kiếm hạn chế..."
                            className="pl-8 bg-zinc-800 border-zinc-700"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </form>

                    <Button
                        onClick={() => router.push('/admin/chat-restrictions/new')}
                        className="gap-1"
                    >
                        <Plus className="h-4 w-4" />
                        Tạo mới
                    </Button>
                </div>
            </div>

            <Card className="bg-zinc-800 border-zinc-700 text-white">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle>Danh sách hạn chế chat</CardTitle>

                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <p className="text-xs text-zinc-400">Loại hạn chế:</p>
                                <Select
                                    value={filters.restriction_type || ''}
                                    onValueChange={(value) => setFilters(prev => ({
                                        ...prev,
                                        restriction_type: value === '' ? undefined : value as any
                                    }))}
                                >
                                    <SelectTrigger className="w-32 h-8">
                                        <SelectValue placeholder="Tất cả" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">Tất cả</SelectItem>
                                        <SelectItem value="TEMPORARY">Tạm thời</SelectItem>
                                        <SelectItem value="PERMANENT">Vĩnh viễn</SelectItem>
                                        <SelectItem value="WARNING">Cảnh báo</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-center gap-2">
                                <p className="text-xs text-zinc-400">Trạng thái:</p>
                                <Select
                                    value={filters.is_active === undefined ? '' : filters.is_active ? 'active' : 'inactive'}
                                    onValueChange={(value) => setFilters(prev => ({
                                        ...prev,
                                        is_active: value === '' ? undefined : value === 'active'
                                    }))}
                                >
                                    <SelectTrigger className="w-32 h-8">
                                        <SelectValue placeholder="Tất cả" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">Tất cả</SelectItem>
                                        <SelectItem value="active">Đang áp dụng</SelectItem>
                                        <SelectItem value="inactive">Đã hủy</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                </CardHeader>

                <CardContent>
                    <div className="rounded-md border border-zinc-700">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-zinc-800/50">
                                    <TableHead>Người dùng</TableHead>
                                    <TableHead>Loại hạn chế</TableHead>
                                    <TableHead>Lý do</TableHead>
                                    <TableHead>Ngày tạo</TableHead>
                                    <TableHead>Ngày hết hạn</TableHead>
                                    <TableHead className="text-right">Thao tác</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center">
                                            <div className="flex items-center justify-center">
                                                <RefreshCw className="h-6 w-6 animate-spin text-zinc-500" />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : restrictions.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center">
                                            Không tìm thấy hạn chế nào
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    restrictions.map((restriction) => (
                                        <TableRow key={restriction.id} className="hover:bg-zinc-700/50">
                                            <TableCell>
                                                {restriction.user ? (
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-8 w-8">
                                                            {restriction.user.avatar ? (
                                                                <AvatarImage src={restriction.user.avatar} alt={restriction.user.username} />
                                                            ) : (
                                                                <AvatarFallback className="bg-zinc-700">
                                                                    <User className="h-4 w-4 text-zinc-400" />
                                                                </AvatarFallback>
                                                            )}
                                                        </Avatar>
                                                        <Link href={`/admin/users/${restriction.user.id}`} className="font-medium hover:underline">
                                                            {restriction.user.username}
                                                        </Link>
                                                    </div>
                                                ) : (
                                                    <span className="text-zinc-400">Không rõ</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {getRestrictionBadge(restriction.restriction_type, restriction.is_active)}
                                            </TableCell>
                                            <TableCell className="max-w-xs truncate" title={restriction.reason}>
                                                {restriction.reason}
                                            </TableCell>
                                            <TableCell>
                                                {new Date(restriction.created_at).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell>
                                                {restriction.expires_at
                                                    ? new Date(restriction.expires_at).toLocaleDateString()
                                                    : restriction.restriction_type === 'PERMANENT'
                                                        ? <span className="text-zinc-400">Vĩnh viễn</span>
                                                        : <span className="text-zinc-400">-</span>
                                                }
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem
                                                            onClick={() => router.push(`/admin/users/${restriction.user?.id || ''}`)}
                                                        >
                                                            Xem người dùng
                                                        </DropdownMenuItem>

                                                        {restriction.is_active && (
                                                            <>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem
                                                                    onClick={() => handleDeactivateRestriction(restriction.id)}
                                                                    className="text-red-500 focus:text-red-500"
                                                                >
                                                                    Hủy hạn chế
                                                                </DropdownMenuItem>
                                                            </>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    {pagination.totalCount > 0 && (
                        <div className="flex items-center justify-between mt-4">
                            <div className="text-sm text-zinc-400">
                                Hiển thị {restrictions.length} trên {pagination.totalCount} hạn chế
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(pagination.page - 1)}
                                    disabled={pagination.page === 1}
                                >
                                    Trước
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(pagination.page + 1)}
                                    disabled={pagination.page * pagination.pageSize >= pagination.totalCount}
                                >
                                    Sau
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
} 