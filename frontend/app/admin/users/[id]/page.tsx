"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"
import {
    User,
    Calendar,
    Clock,
    ChevronLeft,
    Eye,
    EyeOff,
    AlertTriangle,
    Shield,
    Users,
    Edit,
    Key,
    Check,
    X,
    RefreshCw
} from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogDescription
} from "@/components/ui/dialog"
import { adminUserService, UserDetailResponse, ChatRestriction } from "@/lib/api/services/AdminUserService"

export default function UserDetailPage() {
    const params = useParams<{ id: string }>()
    const router = useRouter()
    const [userDetail, setUserDetail] = useState<UserDetailResponse | null>(null)
    const [loading, setLoading] = useState(true)
    const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)
    const [passwords, setPasswords] = useState({
        newPassword: "",
        confirmPassword: ""
    })
    const [passwordError, setPasswordError] = useState("")

    const userId = parseInt(params.id as string, 10)

    const fetchUserDetail = async () => {
        try {
            setLoading(true)
            const response = await adminUserService.getUserDetail(userId)

            // Đảm bảo response có các thuộc tính cần thiết
            const enhancedResponse = {
                ...response,
                followers: response.followers || [],
                following: response.following || [],
                chat_restrictions: response.chat_restrictions || []
            }

            setUserDetail(enhancedResponse)
        } catch (error) {
            console.error("Lỗi khi tải thông tin người dùng:", error)
            toast.error("Không thể tải thông tin người dùng")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (userId) {
            fetchUserDetail()
        }
    }, [userId])

    const handleToggleActive = async () => {
        if (!userDetail) return

        try {
            await adminUserService.toggleActive(userId, !userDetail.is_active)
            toast.success(`Đã ${!userDetail.is_active ? 'kích hoạt' : 'vô hiệu hoá'} tài khoản thành công`)
            fetchUserDetail()
        } catch (error) {
            console.error("Lỗi khi thay đổi trạng thái tài khoản:", error)
            toast.error("Không thể thay đổi trạng thái tài khoản")
        }
    }

    const handlePasswordChange = async () => {
        setPasswordError("")

        if (passwords.newPassword.length < 8) {
            setPasswordError("Mật khẩu phải có ít nhất 8 ký tự")
            return
        }

        if (passwords.newPassword !== passwords.confirmPassword) {
            setPasswordError("Mật khẩu xác nhận không khớp")
            return
        }

        try {
            await adminUserService.changePassword(
                userId,
                passwords.newPassword,
                passwords.confirmPassword
            )

            toast.success("Đã thay đổi mật khẩu thành công")
            setPasswordDialogOpen(false)
            setPasswords({ newPassword: "", confirmPassword: "" })
        } catch (error) {
            console.error("Lỗi khi đổi mật khẩu:", error)
            toast.error("Không thể đổi mật khẩu")
        }
    }

    const handleDeactivateRestriction = async (restrictionId: number) => {
        try {
            await adminUserService.deactivateChatRestriction(restrictionId)
            fetchUserDetail()
            toast.success("Đã hủy hạn chế chat thành công")
        } catch (error) {
            console.error("Lỗi khi hủy hạn chế chat:", error)
            toast.error("Không thể hủy hạn chế chat")
        }
    }

    const getUserStatusBadge = () => {
        if (!userDetail) return null

        // Xác định trạng thái dựa vào thuộc tính is_active nếu không có status
        const status = userDetail.status || (userDetail.is_active ? 'ACTIVE' : 'INACTIVE');

        if (status === 'RESTRICTED' || (userDetail.has_chat_restriction && status !== 'INACTIVE')) {
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

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center">
                <RefreshCw className="h-8 w-8 animate-spin text-zinc-500" />
            </div>
        )
    }

    if (!userDetail) {
        return (
            <div className="space-y-6">
                <div className="flex items-center">
                    <Button
                        variant="ghost"
                        className="mr-4"
                        onClick={() => router.back()}
                    >
                        <ChevronLeft className="h-5 w-5 mr-1" />
                        Quay lại
                    </Button>
                    <h1 className="text-3xl font-bold">Thông tin người dùng không tồn tại</h1>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center">
                    <Button
                        variant="ghost"
                        className="mr-4"
                        onClick={() => router.back()}
                    >
                        <ChevronLeft className="h-5 w-5 mr-1" />
                        Quay lại
                    </Button>
                    <h1 className="text-3xl font-bold">Thông tin người dùng</h1>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/admin/users/${userId}/edit`)}
                    >
                        <Edit className="h-4 w-4 mr-2" />
                        Chỉnh sửa
                    </Button>

                    <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                                <Key className="h-4 w-4 mr-2" />
                                Đổi mật khẩu
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Đổi mật khẩu</DialogTitle>
                                <DialogDescription>
                                    Thiết lập mật khẩu mới cho tài khoản {userDetail.username}
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Mật khẩu mới</label>
                                    <Input
                                        type="password"
                                        value={passwords.newPassword}
                                        onChange={(e) => setPasswords(prev => ({ ...prev, newPassword: e.target.value }))}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Xác nhận mật khẩu</label>
                                    <Input
                                        type="password"
                                        value={passwords.confirmPassword}
                                        onChange={(e) => setPasswords(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                    />
                                </div>

                                {passwordError && (
                                    <p className="text-sm font-medium text-red-500">{passwordError}</p>
                                )}
                            </div>

                            <DialogFooter>
                                <Button variant="outline" onClick={() => setPasswordDialogOpen(false)}>Hủy</Button>
                                <Button onClick={handlePasswordChange}>Lưu mật khẩu</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Button
                        variant={userDetail.is_active ? "destructive" : "default"}
                        size="sm"
                        onClick={handleToggleActive}
                    >
                        {userDetail.is_active ? (
                            <>
                                <EyeOff className="h-4 w-4 mr-2" />
                                Vô hiệu hóa
                            </>
                        ) : (
                            <>
                                <Eye className="h-4 w-4 mr-2" />
                                Kích hoạt
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Thông tin cơ bản người dùng */}
            <Card className="bg-zinc-800 border-zinc-700 text-white">
                <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                        <Avatar className="w-20 h-20 border border-zinc-700">
                            {userDetail.avatar ? (
                                <AvatarImage src={userDetail.avatar} alt={userDetail.username} />
                            ) : (
                                <AvatarFallback className="bg-zinc-700 text-zinc-300 text-2xl">
                                    {userDetail.username.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                            )}
                        </Avatar>

                        <div className="space-y-2 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                                <h2 className="text-2xl font-bold">{userDetail.username}</h2>
                                {userDetail.is_admin && (
                                    <Badge variant="outline" className="bg-purple-600/20 text-purple-400 border-purple-800">
                                        <Shield className="w-3 h-3 mr-1" />
                                        Admin
                                    </Badge>
                                )}
                                {getUserStatusBadge()}
                            </div>

                            <p className="text-zinc-400">{userDetail.email}</p>

                            <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-400">
                                <div className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    <span>Tham gia: {new Date(userDetail.date_joined).toLocaleDateString()}</span>
                                </div>
                                {userDetail.last_login && (
                                    <div className="flex items-center gap-1">
                                        <Clock className="w-4 h-4" />
                                        <span>Đăng nhập: {new Date(userDetail.last_login).toLocaleDateString()}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-1">
                                    <Users className="w-4 h-4" />
                                    <span>Người theo dõi: {userDetail.followers_count}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Users className="w-4 h-4" />
                                    <span>Đang theo dõi: {userDetail.following_count}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Tabs thông tin chi tiết */}
            <Tabs defaultValue="profile" className="space-y-6">
                <TabsList className="bg-zinc-800">
                    <TabsTrigger value="profile" className="data-[state=active]:bg-zinc-700">
                        Hồ sơ
                    </TabsTrigger>
                    <TabsTrigger value="followers" className="data-[state=active]:bg-zinc-700">
                        Quan hệ
                    </TabsTrigger>
                    <TabsTrigger value="restrictions" className="data-[state=active]:bg-zinc-700">
                        Hạn chế
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="profile" className="space-y-6">
                    <Card className="bg-zinc-800 border-zinc-700 text-white">
                        <CardHeader>
                            <CardTitle>Thông tin hồ sơ</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <h3 className="text-sm font-medium text-zinc-400">Họ tên</h3>
                                    <p>{userDetail.first_name} {userDetail.last_name}</p>
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-zinc-400">Tên người dùng</h3>
                                    <p>{userDetail.username}</p>
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-zinc-400">Email</h3>
                                    <p>{userDetail.email}</p>
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-zinc-400">Ngày tham gia</h3>
                                    <p>{new Date(userDetail.date_joined).toLocaleDateString()}</p>
                                </div>
                            </div>

                            <Separator className="my-4" />

                            <div>
                                <h3 className="text-sm font-medium text-zinc-400 mb-2">Tiểu sử</h3>
                                <p className="text-sm">{userDetail.bio || "Người dùng chưa cập nhật tiểu sử"}</p>
                            </div>

                            <Separator className="my-4" />

                            <div>
                                <h3 className="text-sm font-medium text-zinc-400 mb-2">Bài hát yêu thích</h3>
                                <p>{userDetail.favorite_songs_count} bài hát</p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="followers" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="bg-zinc-800 border-zinc-700 text-white">
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <span className="flex items-center gap-2">
                                        <Users className="h-5 w-5" />
                                        <span>Người theo dõi</span>
                                    </span>
                                    <Badge variant="outline">{userDetail.followers_count}</Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {Array.isArray(userDetail.followers) && userDetail.followers.length > 0 ? (
                                    userDetail.followers.map((follower) => (
                                        <div key={follower.id} className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-10 w-10">
                                                    {follower.avatar ? (
                                                        <AvatarImage src={follower.avatar} alt={follower.username} />
                                                    ) : (
                                                        <AvatarFallback className="bg-zinc-700">
                                                            {follower.username.substring(0, 2).toUpperCase()}
                                                        </AvatarFallback>
                                                    )}
                                                </Avatar>
                                                <div>
                                                    <p className="font-medium">{follower.username}</p>
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => router.push(`/admin/users/${follower.id}`)}
                                            >
                                                Chi tiết
                                            </Button>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-center py-4 text-zinc-500">Không có người theo dõi</p>
                                )}
                            </CardContent>

                            {userDetail.followers_count && Array.isArray(userDetail.followers) && userDetail.followers_count > userDetail.followers.length && (
                                <CardFooter>
                                    <Button variant="outline" className="w-full" size="sm">
                                        Xem thêm người theo dõi
                                    </Button>
                                </CardFooter>
                            )}
                        </Card>

                        <Card className="bg-zinc-800 border-zinc-700 text-white">
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <span className="flex items-center gap-2">
                                        <Users className="h-5 w-5" />
                                        <span>Đang theo dõi</span>
                                    </span>
                                    <Badge variant="outline">{userDetail.following_count}</Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {Array.isArray(userDetail.following) && userDetail.following.length > 0 ? (
                                    userDetail.following.map((following) => (
                                        <div key={following.id} className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-10 w-10">
                                                    {following.avatar ? (
                                                        <AvatarImage src={following.avatar} alt={following.username} />
                                                    ) : (
                                                        <AvatarFallback className="bg-zinc-700">
                                                            {following.username.substring(0, 2).toUpperCase()}
                                                        </AvatarFallback>
                                                    )}
                                                </Avatar>
                                                <div>
                                                    <p className="font-medium">{following.username}</p>
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => router.push(`/admin/users/${following.id}`)}
                                            >
                                                Chi tiết
                                            </Button>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-center py-4 text-zinc-500">Không theo dõi ai</p>
                                )}
                            </CardContent>

                            {userDetail.following_count && Array.isArray(userDetail.following) && userDetail.following_count > userDetail.following.length && (
                                <CardFooter>
                                    <Button variant="outline" className="w-full" size="sm">
                                        Xem thêm người đang theo dõi
                                    </Button>
                                </CardFooter>
                            )}
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="restrictions" className="space-y-6">
                    <Card className="bg-zinc-800 border-zinc-700 text-white">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5" />
                                <span>Hạn chế chat</span>
                            </CardTitle>
                            <CardDescription className="text-zinc-400">
                                Quản lý các hạn chế chat của người dùng
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {Array.isArray(userDetail.chat_restrictions) && userDetail.chat_restrictions.length > 0 ? (
                                <div className="space-y-4">
                                    {userDetail.chat_restrictions.map((restriction) => (
                                        <div key={restriction.id} className="border border-zinc-700 rounded-md p-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <Badge variant={restriction.is_active ? "destructive" : "outline"} className={restriction.is_active ? "bg-amber-600" : "bg-zinc-700"}>
                                                        {restriction.restriction_type}
                                                    </Badge>
                                                    <span className="text-sm text-zinc-400">
                                                        {new Date(restriction.created_at).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                {restriction.is_active && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleDeactivateRestriction(restriction.id)}
                                                    >
                                                        Hủy hạn chế
                                                    </Button>
                                                )}
                                            </div>
                                            <p className="text-sm mb-2">{restriction.reason}</p>
                                            {restriction.expires_at && (
                                                <p className="text-xs text-zinc-400">
                                                    Hết hạn: {new Date(restriction.expires_at).toLocaleString()}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center py-4 text-zinc-500">Người dùng không có hạn chế chat</p>
                            )}
                        </CardContent>
                        <CardFooter>
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button className="w-full">
                                        <AlertTriangle className="h-4 w-4 mr-2" />
                                        Thêm hạn chế mới
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Tạo hạn chế chat mới</DialogTitle>
                                        <DialogDescription>
                                            Thiết lập hạn chế chat cho người dùng {userDetail.username}
                                        </DialogDescription>
                                    </DialogHeader>

                                    <NewChatRestrictionForm userId={userId} onSuccess={fetchUserDetail} />
                                </DialogContent>
                            </Dialog>
                        </CardFooter>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}

function NewChatRestrictionForm({ userId, onSuccess }: { userId: number, onSuccess: () => void }) {
    const [data, setData] = useState({
        restrictionType: 'TEMPORARY' as 'TEMPORARY' | 'PERMANENT' | 'WARNING',
        reason: '',
        expiresAt: ''
    })
    const [loading, setLoading] = useState(false)

    const handleSubmit = async () => {
        if (!data.reason) {
            toast.error("Vui lòng nhập lý do hạn chế")
            return
        }

        if (data.restrictionType === 'TEMPORARY' && !data.expiresAt) {
            toast.error("Vui lòng nhập thời gian hết hạn")
            return
        }

        try {
            setLoading(true)
            await adminUserService.createChatRestriction(
                userId,
                data.restrictionType,
                data.reason,
                data.restrictionType === 'TEMPORARY' ? data.expiresAt : undefined
            )

            toast.success("Đã tạo hạn chế chat thành công")
            onSuccess()
        } catch (error) {
            console.error("Lỗi khi tạo hạn chế chat:", error)
            toast.error("Không thể tạo hạn chế chat")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-4 py-4">
            <div className="space-y-2">
                <label className="text-sm font-medium">Loại hạn chế</label>
                <select
                    className="w-full p-2 rounded-md bg-zinc-800 border border-zinc-700"
                    value={data.restrictionType}
                    onChange={(e) => setData(prev => ({
                        ...prev,
                        restrictionType: e.target.value as 'TEMPORARY' | 'PERMANENT' | 'WARNING'
                    }))}
                >
                    <option value="TEMPORARY">Tạm thời</option>
                    <option value="PERMANENT">Vĩnh viễn</option>
                    <option value="WARNING">Cảnh báo</option>
                </select>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium">Lý do</label>
                <Input
                    value={data.reason}
                    onChange={(e) => setData(prev => ({ ...prev, reason: e.target.value }))}
                    placeholder="Nhập lý do hạn chế chat"
                />
            </div>

            {data.restrictionType === 'TEMPORARY' && (
                <div className="space-y-2">
                    <label className="text-sm font-medium">Thời gian hết hạn</label>
                    <Input
                        type="datetime-local"
                        value={data.expiresAt}
                        onChange={(e) => setData(prev => ({ ...prev, expiresAt: e.target.value }))}
                    />
                </div>
            )}

            <DialogFooter>
                <Button variant="outline" type="button">Hủy</Button>
                <Button onClick={handleSubmit} disabled={loading}>
                    {loading && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
                    Tạo hạn chế
                </Button>
            </DialogFooter>
        </div>
    )
} 