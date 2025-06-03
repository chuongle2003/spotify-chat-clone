"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { ChevronLeft, Save, RefreshCw, AlertTriangle } from "lucide-react"
import { adminUserService, UserDetailResponse } from "@/lib/api/services/AdminUserService"
import { toast } from "sonner"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function NewChatRestrictionPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [userDetail, setUserDetail] = useState<UserDetailResponse | null>(null)
    const [loading, setLoading] = useState(false)
    const [creating, setCreating] = useState(false)
    const [formData, setFormData] = useState({
        userId: searchParams.get('user_id') ? parseInt(searchParams.get('user_id') as string) : 0,
        restrictionType: 'TEMPORARY' as 'TEMPORARY' | 'PERMANENT' | 'WARNING',
        reason: '',
        expiresAt: ''
    })

    useEffect(() => {
        const fetchUserIfNeeded = async () => {
            if (formData.userId) {
                try {
                    setLoading(true)
                    const response = await adminUserService.getUserDetail(formData.userId)
                    setUserDetail(response)
                } catch (error) {
                    console.error("Lỗi khi tải thông tin người dùng:", error)
                    toast.error("Không thể tải thông tin người dùng")
                } finally {
                    setLoading(false)
                }
            }
        }

        fetchUserIfNeeded()
    }, [formData.userId])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.userId) {
            toast.error("Vui lòng chọn người dùng")
            return
        }

        if (!formData.reason) {
            toast.error("Vui lòng nhập lý do hạn chế")
            return
        }

        if (formData.restrictionType === 'TEMPORARY' && !formData.expiresAt) {
            toast.error("Vui lòng nhập thời gian hết hạn")
            return
        }

        try {
            setCreating(true)
            await adminUserService.createChatRestriction(
                formData.userId,
                formData.restrictionType,
                formData.reason,
                formData.restrictionType === 'TEMPORARY' ? formData.expiresAt : undefined
            )

            toast.success("Đã tạo hạn chế chat thành công")

            // Chuyển hướng về trang chi tiết người dùng hoặc danh sách hạn chế
            if (formData.userId) {
                router.push(`/admin/users/${formData.userId}`)
            } else {
                router.push('/admin/chat-restrictions')
            }
        } catch (error) {
            console.error("Lỗi khi tạo hạn chế chat:", error)
            toast.error("Không thể tạo hạn chế chat")
        } finally {
            setCreating(false)
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
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
                    <h1 className="text-3xl font-bold">Tạo hạn chế chat mới</h1>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <Card className="bg-zinc-800 border-zinc-700 text-white">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-amber-500" />
                            <span>Thông tin hạn chế chat</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {userDetail ? (
                            <div className="flex items-center gap-4 p-4 bg-zinc-700/50 rounded-md">
                                <Avatar className="h-12 w-12">
                                    {userDetail.avatar ? (
                                        <AvatarImage src={userDetail.avatar} alt={userDetail.username} />
                                    ) : (
                                        <AvatarFallback className="bg-zinc-600">
                                            {userDetail.username.substring(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    )}
                                </Avatar>
                                <div>
                                    <h3 className="font-medium">{userDetail.username}</h3>
                                    <p className="text-sm text-zinc-400">{userDetail.email}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <Label htmlFor="userId">ID người dùng</Label>
                                <Input
                                    id="userId"
                                    name="userId"
                                    type="number"
                                    value={formData.userId || ''}
                                    onChange={(e) => setFormData(prev => ({ ...prev, userId: parseInt(e.target.value) || 0 }))}
                                    placeholder="Nhập ID người dùng"
                                    className="bg-zinc-950/50 border-zinc-700"
                                />
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="restrictionType">Loại hạn chế</Label>
                            <Select
                                value={formData.restrictionType}
                                onValueChange={(value) => setFormData(prev => ({
                                    ...prev,
                                    restrictionType: value as 'TEMPORARY' | 'PERMANENT' | 'WARNING'
                                }))}
                            >
                                <SelectTrigger className="bg-zinc-950/50 border-zinc-700">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="TEMPORARY">Tạm thời</SelectItem>
                                    <SelectItem value="PERMANENT">Vĩnh viễn</SelectItem>
                                    <SelectItem value="WARNING">Cảnh báo</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-zinc-400">
                                {formData.restrictionType === 'TEMPORARY' ? (
                                    "Hạn chế tạm thời sẽ hết hạn theo thời gian được chỉ định"
                                ) : formData.restrictionType === 'PERMANENT' ? (
                                    "Hạn chế vĩnh viễn chỉ có thể được gỡ bỏ thủ công bởi quản trị viên"
                                ) : (
                                    "Cảnh báo không giới hạn chức năng nhưng sẽ thông báo cho người dùng"
                                )}
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="reason">Lý do hạn chế</Label>
                            <Textarea
                                id="reason"
                                name="reason"
                                value={formData.reason}
                                onChange={handleChange}
                                placeholder="Nhập lý do hạn chế chat"
                                className="bg-zinc-950/50 border-zinc-700 min-h-[100px]"
                            />
                        </div>

                        {formData.restrictionType === 'TEMPORARY' && (
                            <div className="space-y-2">
                                <Label htmlFor="expiresAt">Thời gian hết hạn</Label>
                                <Input
                                    id="expiresAt"
                                    name="expiresAt"
                                    type="datetime-local"
                                    value={formData.expiresAt}
                                    onChange={handleChange}
                                    className="bg-zinc-950/50 border-zinc-700"
                                />
                            </div>
                        )}
                    </CardContent>
                    <CardFooter className="flex justify-end gap-2">
                        <Button
                            variant="outline"
                            type="button"
                            onClick={() => router.back()}
                        >
                            Hủy
                        </Button>
                        <Button
                            type="submit"
                            disabled={creating}
                        >
                            {creating && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
                            <Save className="h-4 w-4 mr-2" />
                            Tạo hạn chế
                        </Button>
                    </CardFooter>
                </Card>
            </form>
        </div>
    )
} 