"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Search, AlertTriangle, UserX, Clock, CheckCircle, X, User } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { postmanApi } from "@/lib/api/postman"
import { DatePicker } from "@/components/ui/date-picker"

// Định nghĩa kiểu dữ liệu cho ChatRestriction
interface ChatRestriction {
    id: number
    user: {
        id: number
        username: string
    }
    restriction_type: string
    reason: string
    created_at: string
    expires_at: string | null
    created_by: {
        id: number
        username: string
    }
    is_active: boolean
    is_expired: boolean
}

export default function AdminRestrictionsPage() {
    const [restrictions, setRestrictions] = useState<ChatRestriction[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [typeFilter, setTypeFilter] = useState<string>("all")
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [selectedRestriction, setSelectedRestriction] = useState<ChatRestriction | null>(null)
    const [newRestriction, setNewRestriction] = useState({
        user_id: "",
        restriction_type: "TEMPORARY",
        reason: "",
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 ngày từ hiện tại
        is_active: true
    })

    useEffect(() => {
        const fetchRestrictions = async () => {
            try {
                setLoading(true)
                const data = await postmanApi.chat.getChatRestrictions()
                setRestrictions(data as ChatRestriction[])
            } catch (error) {
                console.error("Error fetching restrictions:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchRestrictions()
    }, [])

    // Chuyển đổi timestamp sang định dạng thân thiện với người dùng
    const formatDate = (timestamp: string | null) => {
        if (!timestamp) return "Không giới hạn"
        const date = new Date(timestamp)
        return date.toLocaleString("vi-VN")
    }

    // Kiểm tra nếu hạn chế đã hết hạn
    const isExpired = (expires_at: string | null): boolean => {
        if (!expires_at) return false
        return new Date(expires_at) < new Date()
    }

    // Lọc hạn chế
    const filteredRestrictions = restrictions.filter((restriction) => {
        // Lọc theo loại
        if (typeFilter !== "all" && restriction.restriction_type !== typeFilter) {
            return false
        }

        // Tìm kiếm theo người dùng hoặc lý do
        const searchLower = searchQuery.toLowerCase()
        return (
            restriction.user.username.toLowerCase().includes(searchLower) ||
            restriction.reason.toLowerCase().includes(searchLower)
        )
    })

    // Xử lý tạo hạn chế mới
    const handleCreateRestriction = async () => {
        try {
            // Kiểm tra dữ liệu
            if (!newRestriction.user_id || !newRestriction.reason) {
                alert("Vui lòng điền đầy đủ thông tin")
                return
            }

            // Gọi API để tạo hạn chế mới
            const createdRestriction = await postmanApi.chat.createChatRestriction(newRestriction)

            // Cập nhật danh sách hạn chế
            setRestrictions([...restrictions, createdRestriction as ChatRestriction])

            // Đóng dialog và reset form
            setIsCreateOpen(false)
            setNewRestriction({
                user_id: "",
                restriction_type: "TEMPORARY",
                reason: "",
                expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                is_active: true
            })
        } catch (error) {
            console.error("Error creating restriction:", error)
            alert("Có lỗi xảy ra khi tạo hạn chế")
        }
    }

    // Xử lý cập nhật hạn chế
    const handleUpdateRestriction = async () => {
        if (!selectedRestriction) return

        try {
            // Chuẩn bị dữ liệu cập nhật
            const updateData = {
                is_active: !selectedRestriction.is_active
            }

            // Gọi API để cập nhật hạn chế
            await postmanApi.chat.updateChatRestriction(selectedRestriction.id.toString(), updateData)

            // Cập nhật danh sách hạn chế
            setRestrictions(restrictions.map((restriction) => {
                if (restriction.id === selectedRestriction.id) {
                    return {
                        ...restriction,
                        is_active: !restriction.is_active
                    }
                }
                return restriction
            }))

            // Đóng dialog
            setIsEditOpen(false)
            setSelectedRestriction(null)
        } catch (error) {
            console.error("Error updating restriction:", error)
            alert("Có lỗi xảy ra khi cập nhật hạn chế")
        }
    }

    // Lấy badge class theo loại hạn chế và trạng thái
    const getStatusBadgeClass = (restriction: ChatRestriction) => {
        if (!restriction.is_active) {
            return "bg-zinc-600 hover:bg-zinc-700"
        }

        if (isExpired(restriction.expires_at)) {
            return "bg-zinc-600 hover:bg-zinc-700"
        }

        if (restriction.restriction_type === "PERMANENT") {
            return "bg-red-600 hover:bg-red-700"
        }

        return "bg-yellow-600 hover:bg-yellow-700"
    }

    // Lấy trạng thái hiển thị
    const getStatusDisplay = (restriction: ChatRestriction) => {
        if (!restriction.is_active) {
            return "Đã hủy bỏ"
        }

        if (isExpired(restriction.expires_at)) {
            return "Đã hết hạn"
        }

        if (restriction.restriction_type === "PERMANENT") {
            return "Vĩnh viễn"
        }

        return "Tạm thời"
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Quản lý hạn chế chat</h1>
                <Button onClick={() => setIsCreateOpen(true)}>
                    <UserX className="h-4 w-4 mr-2" />
                    Thêm hạn chế mới
                </Button>
            </div>

            <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <Input
                        placeholder="Tìm kiếm người dùng hoặc lý do..."
                        className="pl-10 bg-zinc-800 border-zinc-700 text-white"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <Select
                    value={typeFilter}
                    onValueChange={(value) => setTypeFilter(value)}
                >
                    <SelectTrigger className="w-[180px] bg-zinc-800 border-zinc-700 text-white">
                        <SelectValue placeholder="Loại hạn chế" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                        <SelectItem value="all">Tất cả loại</SelectItem>
                        <SelectItem value="TEMPORARY">Tạm thời</SelectItem>
                        <SelectItem value="PERMANENT">Vĩnh viễn</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="bg-zinc-800 rounded-md border border-zinc-700 overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-zinc-700/50">
                            <TableHead className="text-zinc-400">ID</TableHead>
                            <TableHead className="text-zinc-400">Người dùng</TableHead>
                            <TableHead className="text-zinc-400">Loại hạn chế</TableHead>
                            <TableHead className="text-zinc-400">Lý do</TableHead>
                            <TableHead className="text-zinc-400">Ngày tạo</TableHead>
                            <TableHead className="text-zinc-400">Ngày hết hạn</TableHead>
                            <TableHead className="text-zinc-400">Trạng thái</TableHead>
                            <TableHead className="text-zinc-400 text-right">Thao tác</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center py-10 text-zinc-500">
                                    Đang tải dữ liệu...
                                </TableCell>
                            </TableRow>
                        ) : filteredRestrictions.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center py-10 text-zinc-500">
                                    Không tìm thấy hạn chế nào
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredRestrictions.map((restriction) => (
                                <TableRow key={restriction.id} className="hover:bg-zinc-700/50">
                                    <TableCell>{restriction.id}</TableCell>
                                    <TableCell>{restriction.user.username}</TableCell>
                                    <TableCell>
                                        {restriction.restriction_type === "PERMANENT" ? (
                                            <Badge variant="destructive">Vĩnh viễn</Badge>
                                        ) : (
                                            <Badge variant="outline">Tạm thời</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="max-w-md truncate">
                                            {restriction.reason}
                                        </div>
                                    </TableCell>
                                    <TableCell>{formatDate(restriction.created_at)}</TableCell>
                                    <TableCell>{formatDate(restriction.expires_at)}</TableCell>
                                    <TableCell>
                                        <Badge className={getStatusBadgeClass(restriction)}>
                                            {getStatusDisplay(restriction)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                setSelectedRestriction(restriction)
                                                setIsEditOpen(true)
                                            }}
                                        >
                                            {restriction.is_active ? "Hủy bỏ" : "Kích hoạt"}
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Dialog tạo hạn chế mới */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="bg-zinc-900 text-white border-zinc-700">
                    <DialogHeader>
                        <DialogTitle>Thêm hạn chế mới</DialogTitle>
                        <DialogDescription className="text-zinc-400">
                            Tạo hạn chế chat cho người dùng vi phạm
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium mb-2 block">ID người dùng</label>
                            <Input
                                placeholder="Nhập ID người dùng"
                                className="bg-zinc-800 border-zinc-700 text-white"
                                value={newRestriction.user_id}
                                onChange={(e) => setNewRestriction({ ...newRestriction, user_id: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium mb-2 block">Loại hạn chế</label>
                            <Select
                                value={newRestriction.restriction_type}
                                onValueChange={(value) => setNewRestriction({ ...newRestriction, restriction_type: value })}
                            >
                                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                                    <SelectValue placeholder="Chọn loại hạn chế" />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                                    <SelectItem value="TEMPORARY">Tạm thời</SelectItem>
                                    <SelectItem value="PERMANENT">Vĩnh viễn</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {newRestriction.restriction_type === "TEMPORARY" && (
                            <div>
                                <label className="text-sm font-medium mb-2 block">Ngày hết hạn</label>
                                <Input
                                    type="datetime-local"
                                    className="bg-zinc-800 border-zinc-700 text-white"
                                    value={newRestriction.expires_at ? new Date(newRestriction.expires_at).toISOString().substr(0, 16) : ""}
                                    onChange={(e) => setNewRestriction({ ...newRestriction, expires_at: new Date(e.target.value).toISOString() })}
                                />
                            </div>
                        )}

                        <div>
                            <label className="text-sm font-medium mb-2 block">Lý do</label>
                            <Textarea
                                placeholder="Nhập lý do hạn chế"
                                className="bg-zinc-800 border-zinc-700 text-white"
                                value={newRestriction.reason}
                                onChange={(e) => setNewRestriction({ ...newRestriction, reason: e.target.value })}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="ghost"
                            onClick={() => setIsCreateOpen(false)}
                        >
                            <X className="h-4 w-4 mr-2" /> Hủy
                        </Button>
                        <Button
                            onClick={handleCreateRestriction}
                        >
                            <CheckCircle className="h-4 w-4 mr-2" /> Tạo
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Dialog cập nhật hạn chế */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="bg-zinc-900 text-white border-zinc-700">
                    <DialogHeader>
                        <DialogTitle>Cập nhật hạn chế</DialogTitle>
                        <DialogDescription className="text-zinc-400">
                            Thay đổi trạng thái hạn chế chat
                        </DialogDescription>
                    </DialogHeader>

                    {selectedRestriction && (
                        <div className="space-y-4">
                            <div>
                                <h4 className="text-sm font-medium mb-1">Người dùng</h4>
                                <p className="text-zinc-300">{selectedRestriction.user.username}</p>
                            </div>

                            <div>
                                <h4 className="text-sm font-medium mb-1">Loại hạn chế</h4>
                                <p className="text-zinc-300">
                                    {selectedRestriction.restriction_type === "PERMANENT" ? "Vĩnh viễn" : "Tạm thời"}
                                </p>
                            </div>

                            <div>
                                <h4 className="text-sm font-medium mb-1">Lý do</h4>
                                <p className="text-zinc-300">{selectedRestriction.reason}</p>
                            </div>

                            <div>
                                <h4 className="text-sm font-medium mb-1">Trạng thái</h4>
                                <Badge className={getStatusBadgeClass(selectedRestriction)}>
                                    {getStatusDisplay(selectedRestriction)}
                                </Badge>
                            </div>

                            <div>
                                <p className="text-zinc-400 text-sm">
                                    {selectedRestriction.is_active
                                        ? "Hủy bỏ hạn chế sẽ cho phép người dùng tiếp tục trò chuyện."
                                        : "Kích hoạt hạn chế sẽ ngăn người dùng trò chuyện."}
                                </p>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            variant="ghost"
                            onClick={() => setIsEditOpen(false)}
                        >
                            <X className="h-4 w-4 mr-2" /> Hủy
                        </Button>
                        <Button
                            onClick={handleUpdateRestriction}
                            disabled={!selectedRestriction}
                            variant={selectedRestriction?.is_active ? "destructive" : "default"}
                        >
                            {selectedRestriction?.is_active ? (
                                <>
                                    <User className="h-4 w-4 mr-2" /> Hủy bỏ hạn chế
                                </>
                            ) : (
                                <>
                                    <UserX className="h-4 w-4 mr-2" /> Kích hoạt lại
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
} 