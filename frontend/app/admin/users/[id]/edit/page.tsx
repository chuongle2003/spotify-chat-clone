"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { ChevronLeft, Save, RefreshCw } from "lucide-react"
import { adminUserService, UserDetailResponse } from "@/lib/api/services/AdminUserService"
import { toast } from "sonner"

export default function EditUserPage() {
    const params = useParams<{ id: string }>()
    const router = useRouter()
    const [userDetail, setUserDetail] = useState<UserDetailResponse | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [formData, setFormData] = useState({
        first_name: "",
        last_name: "",
        bio: "",
        is_active: false,
        is_admin: false
    })

    const userId = parseInt(params.id as string, 10)

    useEffect(() => {
        const fetchUserDetail = async () => {
            try {
                setLoading(true)
                const response = await adminUserService.getUserDetail(userId)
                setUserDetail(response)
                setFormData({
                    first_name: response.first_name || "",
                    last_name: response.last_name || "",
                    bio: response.bio || "",
                    is_active: response.is_active,
                    is_admin: response.is_admin
                })
            } catch (error) {
                console.error("Lỗi khi tải thông tin người dùng:", error)
                toast.error("Không thể tải thông tin người dùng")
            } finally {
                setLoading(false)
            }
        }

        if (userId) {
            fetchUserDetail()
        }
    }, [userId])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        try {
            setSaving(true)
            await adminUserService.updateUser(userId, formData)
            toast.success("Cập nhật thông tin người dùng thành công")
            router.push(`/admin/users/${userId}`)
        } catch (error) {
            console.error("Lỗi khi cập nhật thông tin người dùng:", error)
            toast.error("Không thể cập nhật thông tin người dùng")
        } finally {
            setSaving(false)
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSwitchChange = (name: string, checked: boolean) => {
        setFormData(prev => ({ ...prev, [name]: checked }))
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
                    <h1 className="text-3xl font-bold">Người dùng không tồn tại</h1>
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
                    <h1 className="text-3xl font-bold">Chỉnh sửa thông tin người dùng</h1>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <Card className="bg-zinc-800 border-zinc-700 text-white">
                    <CardHeader>
                        <CardTitle>Thông tin người dùng: {userDetail.username}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="first_name">Tên</Label>
                                <Input
                                    id="first_name"
                                    name="first_name"
                                    value={formData.first_name}
                                    onChange={handleChange}
                                    placeholder="Nhập tên"
                                    className="bg-zinc-950/50 border-zinc-700"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="last_name">Họ</Label>
                                <Input
                                    id="last_name"
                                    name="last_name"
                                    value={formData.last_name}
                                    onChange={handleChange}
                                    placeholder="Nhập họ"
                                    className="bg-zinc-950/50 border-zinc-700"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="bio">Tiểu sử</Label>
                            <Textarea
                                id="bio"
                                name="bio"
                                value={formData.bio}
                                onChange={handleChange}
                                placeholder="Nhập tiểu sử"
                                className="bg-zinc-950/50 border-zinc-700 min-h-[100px]"
                            />
                        </div>

                        <Separator className="my-4" />

                        <div className="space-y-4">
                            <h3 className="text-lg font-medium">Cài đặt tài khoản</h3>

                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label htmlFor="is_active">Trạng thái hoạt động</Label>
                                    <p className="text-sm text-zinc-400">
                                        Cho phép người dùng đăng nhập và sử dụng dịch vụ
                                    </p>
                                </div>
                                <Switch
                                    id="is_active"
                                    checked={formData.is_active}
                                    onCheckedChange={(checked) => handleSwitchChange("is_active", checked)}
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label htmlFor="is_admin">Quyền quản trị</Label>
                                    <p className="text-sm text-zinc-400">
                                        Cấp quyền quản trị viên cho người dùng
                                    </p>
                                </div>
                                <Switch
                                    id="is_admin"
                                    checked={formData.is_admin}
                                    onCheckedChange={(checked) => handleSwitchChange("is_admin", checked)}
                                />
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-end gap-2">
                        <Button
                            variant="outline"
                            type="button"
                            onClick={() => router.push(`/admin/users/${userId}`)}
                        >
                            Hủy
                        </Button>
                        <Button
                            type="submit"
                            disabled={saving}
                        >
                            {saving && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
                            <Save className="h-4 w-4 mr-2" />
                            Lưu thay đổi
                        </Button>
                    </CardFooter>
                </Card>
            </form>
        </div>
    )
} 