"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Search, User, Calendar, Music, Filter, Check, X,
  AlertTriangle, MoreHorizontal, Trash2, RefreshCw
} from "lucide-react"
import Link from "next/link"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog"
import UserStats from "@/components/admin/users/UserStats"
import { adminUserService, UserStats as UserStatsType } from "@/lib/api/services/AdminUserService"
import { PaginatedResponse } from "@/lib/api/core/types"
import { User as UserType } from "@/lib/api/services/AdminUserService"
import { toast } from "sonner"

export default function AdminUsersPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [users, setUsers] = useState<UserType[]>([])
  const [stats, setStats] = useState<UserStatsType | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filters, setFilters] = useState({
    is_active: undefined as boolean | undefined,
    is_admin: undefined as boolean | undefined,
    has_restriction: undefined as boolean | undefined,
  })
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    totalCount: 0
  })
  const [sorting, setSorting] = useState({
    sort_by: 'date_joined' as 'username' | 'email' | 'date_joined',
    order: 'desc' as 'asc' | 'desc'
  })
  const [selectedUsers, setSelectedUsers] = useState<number[]>([])
  const [batchActionOpen, setBatchActionOpen] = useState(false)
  const [batchActionType, setBatchActionType] = useState<'activate' | 'deactivate'>('activate')
  const [batchActionReason, setBatchActionReason] = useState('')

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true)
      const response = await adminUserService.getUsers({
        page: pagination.page,
        page_size: pagination.pageSize,
        search: searchTerm || undefined,
        is_active: filters.is_active,
        is_admin: filters.is_admin,
        has_restriction: filters.has_restriction,
        sort_by: sorting.sort_by,
        order: sorting.order
      })

      if (Array.isArray(response)) {
        setUsers(response)
        setPagination(prev => ({ ...prev, totalCount: response.length }))
      } else if (response && typeof response === 'object') {
        if (Array.isArray(response.results)) {
          setUsers(response.results)
          setPagination(prev => ({ ...prev, totalCount: response.count || response.results.length }))
        } else {
          console.warn('Response không có định dạng mong đợi:', response)
          setUsers([])
        }
      } else {
        console.warn('Response không hợp lệ:', response)
        setUsers([])
      }
    } catch (error) {
      console.error("Lỗi khi tải danh sách người dùng:", error)
      toast.error("Không thể tải danh sách người dùng")
      setUsers([])
    } finally {
      setLoading(false)
    }
  }, [pagination.page, pagination.pageSize, searchTerm, filters, sorting])

  const fetchStats = async () => {
    try {
      const stats = await adminUserService.getUserStats()
      setStats(stats)
    } catch (error) {
      console.error("Lỗi khi tải thống kê người dùng:", error)
    }
  }

  useEffect(() => {
    fetchUsers()
    fetchStats()
  }, [fetchUsers])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchUsers()
  }

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }))
  }

  const handleToggleActive = async (userId: number, isActive: boolean) => {
    try {
      await adminUserService.toggleActive(userId, isActive)
      toast.success(`Đã ${isActive ? 'kích hoạt' : 'vô hiệu hoá'} tài khoản`)
      fetchUsers()
    } catch (error) {
      console.error("Lỗi khi thay đổi trạng thái tài khoản:", error)
      toast.error("Không thể thay đổi trạng thái tài khoản")
    }
  }

  const handleBatchAction = async () => {
    if (!Array.isArray(selectedUsers) || selectedUsers.length === 0) return

    try {
      await adminUserService.batchAction(
        batchActionType,
        selectedUsers,
        batchActionReason || undefined
      )

      toast.success(`Đã ${batchActionType === 'activate' ? 'kích hoạt' : 'vô hiệu hoá'} ${selectedUsers.length} tài khoản`)
      setSelectedUsers([])
      setBatchActionOpen(false)
      fetchUsers()
    } catch (error) {
      console.error("Lỗi khi thực hiện hành động hàng loạt:", error)
      toast.error("Không thể thực hiện hành động hàng loạt")
    }
  }

  const handleSelectAllUsers = (checked: boolean) => {
    if (checked && Array.isArray(users)) {
      setSelectedUsers(users.map(user => user.id))
    } else {
      setSelectedUsers([])
    }
  }

  const handleSelectUser = (userId: number, checked: boolean) => {
    if (checked) {
      setSelectedUsers(prev => [...prev, userId])
    } else {
      setSelectedUsers(prev => prev.filter(id => id !== userId))
    }
  }

  const resetFilters = () => {
    setFilters({
      is_active: undefined,
      is_admin: undefined,
      has_restriction: undefined
    })
    setSearchTerm("")
  }

  const getUserStatusBadge = (user: UserType) => {
    // Kiểm tra nếu trường status tồn tại thì dùng, không thì xác định từ is_active
    const status = user.status || (user.is_active ? 'ACTIVE' : 'INACTIVE');

    if (status === 'RESTRICTED' || (user.has_chat_restriction && status !== 'INACTIVE')) {
      return (
        <Badge variant="destructive" className="bg-amber-600 hover:bg-amber-700">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Hạn chế
        </Badge>
      )
    } else if (status === 'ACTIVE') {
      return (
        <Badge variant="outline" className="bg-emerald-600/20 text-emerald-400 border-emerald-800">
          <Check className="w-3 h-3 mr-1" />
          Hoạt động
        </Badge>
      )
    } else {
      return (
        <Badge variant="outline" className="bg-zinc-600/20 text-zinc-400 border-zinc-800">
          <X className="w-3 h-3 mr-1" />
          Vô hiệu
        </Badge>
      )
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Quản lý người dùng</h1>

        <form onSubmit={handleSearch} className="relative max-w-xs">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-zinc-500" />
          <Input
            placeholder="Tìm kiếm người dùng..."
            className="pl-8 bg-zinc-800 border-zinc-700"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </form>
      </div>

      {stats && <UserStats stats={stats} />}

      <Card className="bg-zinc-800 border-zinc-700 text-white">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle>Danh sách người dùng</CardTitle>

            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 gap-1">
                    <Filter className="h-3.5 w-3.5" />
                    Bộ lọc
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="p-2">
                    <p className="mb-2 text-xs font-medium">Trạng thái</p>
                    <Select
                      value={filters.is_active === undefined ? "all" : filters.is_active ? "active" : "inactive"}
                      onValueChange={(value) => setFilters(prev => ({
                        ...prev,
                        is_active: value === "all" ? undefined : value === "active"
                      }))}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Tất cả trạng thái" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tất cả</SelectItem>
                        <SelectItem value="active">Hoạt động</SelectItem>
                        <SelectItem value="inactive">Vô hiệu</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="p-2">
                    <p className="mb-2 text-xs font-medium">Vai trò</p>
                    <Select
                      value={filters.is_admin === undefined ? "all" : filters.is_admin ? "admin" : "user"}
                      onValueChange={(value) => setFilters(prev => ({
                        ...prev,
                        is_admin: value === "all" ? undefined : value === "admin"
                      }))}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Tất cả vai trò" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tất cả</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="user">Người dùng</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="p-2">
                    <p className="mb-2 text-xs font-medium">Hạn chế</p>
                    <Select
                      value={filters.has_restriction === undefined ? "all" : filters.has_restriction ? "restricted" : "not_restricted"}
                      onValueChange={(value) => setFilters(prev => ({
                        ...prev,
                        has_restriction: value === "all" ? undefined : value === "restricted"
                      }))}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Tất cả" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tất cả</SelectItem>
                        <SelectItem value="restricted">Bị hạn chế</SelectItem>
                        <SelectItem value="not_restricted">Không bị hạn chế</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={resetFilters}
                    className="justify-center cursor-pointer"
                  >
                    Xóa bộ lọc
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {Array.isArray(selectedUsers) && selectedUsers.length > 0 && (
                <Dialog open={batchActionOpen} onOpenChange={setBatchActionOpen}>
                  <DialogTrigger asChild>
                    <Button variant="default" size="sm" className="h-8">
                      Thao tác ({selectedUsers.length})
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Thao tác hàng loạt</DialogTitle>
                      <DialogDescription>
                        Áp dụng thao tác cho {selectedUsers.length} người dùng đã chọn
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Hành động</label>
                        <Select
                          value={batchActionType}
                          onValueChange={(v) => setBatchActionType(v as 'activate' | 'deactivate')}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="activate">Kích hoạt tài khoản</SelectItem>
                            <SelectItem value="deactivate">Vô hiệu hóa tài khoản</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Lý do (tùy chọn)</label>
                        <Input
                          value={batchActionReason}
                          onChange={(e) => setBatchActionReason(e.target.value)}
                          placeholder="Nhập lý do thực hiện thao tác này"
                        />
                      </div>
                    </div>

                    <DialogFooter>
                      <Button variant="outline" onClick={() => setBatchActionOpen(false)}>Hủy</Button>
                      <Button onClick={handleBatchAction}>Xác nhận</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="rounded-md border border-zinc-700">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-zinc-800/50">
                  <TableHead className="w-12">
                    <Checkbox
                      checked={Array.isArray(selectedUsers) && Array.isArray(users) &&
                        selectedUsers.length > 0 && selectedUsers.length === users.length}
                      onCheckedChange={handleSelectAllUsers}
                    />
                  </TableHead>
                  <TableHead>Người dùng</TableHead>
                  <TableHead className="hidden md:table-cell">Email</TableHead>
                  <TableHead className="hidden md:table-cell">Ngày tham gia</TableHead>
                  <TableHead>Trạng thái</TableHead>
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
                ) : !Array.isArray(users) || users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      Không tìm thấy dữ liệu người dùng
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id} className="hover:bg-zinc-700/50">
                      <TableCell>
                        <Checkbox
                          checked={selectedUsers.includes(user.id)}
                          onCheckedChange={(checked) => handleSelectUser(user.id, checked as boolean)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-zinc-700 flex items-center justify-center overflow-hidden">
                            {user.avatar ? (
                              <img src={user.avatar} alt={user.username} className="h-full w-full object-cover" />
                            ) : (
                              <User className="h-5 w-5 text-zinc-400" />
                            )}
                          </div>
                          <div>
                            <Link href={`/admin/users/${user.id}`} className="font-medium hover:underline">
                              {user.username}
                            </Link>
                            {user.is_admin && (
                              <Badge variant="outline" className="ml-2 bg-purple-600/20 text-purple-400 border-purple-800">
                                Admin
                              </Badge>
                            )}
                            <p className="text-xs text-zinc-400">
                              {user.first_name} {user.last_name}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-zinc-400">
                        {user.email}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {new Date(user.date_joined).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {getUserStatusBadge(user)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end">
                          <TooltipProvider>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => router.push(`/admin/users/${user.id}`)}
                                >
                                  Chi tiết
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => router.push(`/admin/users/${user.id}/edit`)}
                                >
                                  Chỉnh sửa
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleToggleActive(user.id, !user.is_active)}
                                >
                                  {user.is_active ? 'Vô hiệu hóa' : 'Kích hoạt'}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TooltipProvider>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {pagination.totalCount > 0 && Array.isArray(users) && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-zinc-400">
                Hiển thị {users.length} trên {pagination.totalCount} người dùng
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
