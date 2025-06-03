"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import { Music, Upload, X, Loader2, Check } from "lucide-react"
import { AdminPlaylistService } from "@/lib/api/services/AdminPlaylistService"

interface AdminPlaylistFormProps {
    playlistId?: number
}

export default function AdminPlaylistForm({ playlistId }: AdminPlaylistFormProps) {
    const router = useRouter()
    const { toast } = useToast()
    const [isLoading, setIsLoading] = useState(false)
    const [isFetching, setIsFetching] = useState(false)
    const [imagePreview, setImagePreview] = useState<string | null>(null)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)

    const [formData, setFormData] = useState({
        name: "",
        description: "",
        is_public: true,
        is_collaborative: false,
    })

    const playlistService = new AdminPlaylistService()
    const isEditing = Boolean(playlistId)

    // Tải thông tin playlist nếu đang chỉnh sửa
    useEffect(() => {
        if (playlistId) {
            const fetchPlaylist = async () => {
                try {
                    setIsFetching(true)
                    const playlist = await playlistService.getPlaylist(playlistId)

                    setFormData({
                        name: playlist.name,
                        description: playlist.description || "",
                        is_public: playlist.is_public,
                        is_collaborative: playlist.is_collaborative,
                    })

                    if (playlist.cover_image) {
                        setImagePreview(playlist.cover_image)
                    }
                } catch (error) {
                    console.error("Lỗi khi tải thông tin playlist:", error)
                    toast({
                        title: "Lỗi",
                        description: "Không thể tải thông tin playlist. Vui lòng thử lại sau.",
                        variant: "destructive",
                    })
                } finally {
                    setIsFetching(false)
                }
            }

            fetchPlaylist()
        }
    }, [playlistId])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData((prev) => ({ ...prev, [name]: value }))
    }

    const handleSwitchChange = (name: string, checked: boolean) => {
        setFormData((prev) => ({ ...prev, [name]: checked }))
    }

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (file.size > 5 * 1024 * 1024) {
            toast({
                title: "Lỗi",
                description: "Kích thước ảnh không được vượt quá 5MB",
                variant: "destructive",
            })
            return
        }

        if (!file.type.startsWith("image/")) {
            toast({
                title: "Lỗi",
                description: "Vui lòng chọn file ảnh hợp lệ",
                variant: "destructive",
            })
            return
        }

        setSelectedFile(file)

        // Tạo URL xem trước ảnh
        const previewUrl = URL.createObjectURL(file)
        setImagePreview(previewUrl)
    }

    const handleRemoveImage = () => {
        setSelectedFile(null)
        if (imagePreview) {
            URL.revokeObjectURL(imagePreview)
        }
        setImagePreview(null)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        try {
            setIsLoading(true)

            if (isEditing) {
                // Cập nhật playlist hiện có
                await playlistService.partialUpdatePlaylist(playlistId!, {
                    name: formData.name,
                    description: formData.description,
                    is_public: formData.is_public,
                    is_collaborative: formData.is_collaborative,
                })

                // Upload ảnh bìa nếu có chọn ảnh mới
                if (selectedFile) {
                    await playlistService.uploadCover(playlistId!, selectedFile)
                }

                toast({
                    title: "Thành công",
                    description: "Đã cập nhật playlist thành công",
                })
            } else {
                // Tạo playlist mới
                const newPlaylist = await playlistService.createPlaylist({
                    name: formData.name,
                    description: formData.description,
                    is_public: formData.is_public,
                    is_collaborative: formData.is_collaborative,
                })

                // Upload ảnh bìa nếu có chọn ảnh
                if (selectedFile && newPlaylist.id) {
                    await playlistService.uploadCover(newPlaylist.id, selectedFile)
                }

                toast({
                    title: "Thành công",
                    description: "Đã tạo playlist mới thành công",
                })
            }

            // Chuyển hướng về trang danh sách playlist
            router.push("/admin/playlists")

        } catch (error) {
            console.error("Lỗi khi lưu playlist:", error)
            toast({
                title: "Lỗi",
                description: `Không thể ${isEditing ? "cập nhật" : "tạo"} playlist. Vui lòng thử lại sau.`,
                variant: "destructive",
            })
        } finally {
            setIsLoading(false)
        }
    }

    if (isFetching) {
        return (
            <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-green-500" />
            </div>
        )
    }

    return (
        <Card>
            <form onSubmit={handleSubmit}>
                <CardHeader>
                    <CardTitle>{isEditing ? "Chỉnh sửa playlist" : "Thêm playlist mới"}</CardTitle>
                    <CardDescription>
                        {isEditing
                            ? "Cập nhật thông tin playlist hiện có"
                            : "Tạo một playlist mới trong hệ thống"}
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                    {/* Ảnh bìa */}
                    <div className="space-y-2">
                        <Label htmlFor="cover_image">Ảnh bìa playlist</Label>
                        <div className="mt-2 flex items-center gap-4">
                            <div className="aspect-square w-40 overflow-hidden rounded-md bg-gray-100 dark:bg-gray-800">
                                {imagePreview ? (
                                    <div className="relative h-full">
                                        <img
                                            src={imagePreview}
                                            alt="Preview"
                                            className="h-full w-full object-cover"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleRemoveImage}
                                            className="absolute top-1 right-1 rounded-full bg-gray-800/60 p-1 text-white hover:bg-gray-800/80"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex h-full items-center justify-center">
                                        <Music className="h-10 w-10 text-gray-400" />
                                    </div>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="cover_image" className="cursor-pointer">
                                    <div className="flex items-center gap-2 rounded-md border px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800">
                                        <Upload className="h-4 w-4" />
                                        <span>{imagePreview ? "Thay đổi ảnh" : "Tải ảnh lên"}</span>
                                    </div>
                                </Label>
                                <Input
                                    id="cover_image"
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleImageChange}
                                />
                                <p className="mt-2 text-xs text-gray-500">
                                    Định dạng: PNG, JPG. Tối đa: 5MB
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Tên playlist */}
                    <div className="space-y-2">
                        <Label htmlFor="name">Tên playlist</Label>
                        <Input
                            id="name"
                            name="name"
                            placeholder="Nhập tên playlist"
                            value={formData.name}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    {/* Mô tả */}
                    <div className="space-y-2">
                        <Label htmlFor="description">Mô tả</Label>
                        <Textarea
                            id="description"
                            name="description"
                            placeholder="Mô tả về playlist (không bắt buộc)"
                            value={formData.description}
                            onChange={handleChange}
                            rows={5}
                        />
                    </div>

                    {/* Trạng thái */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium">Trạng thái</h3>

                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label htmlFor="is_public" className="text-base">Công khai</Label>
                                <p className="text-sm text-gray-500">
                                    Playlist công khai sẽ hiển thị cho tất cả người dùng
                                </p>
                            </div>
                            <Switch
                                id="is_public"
                                name="is_public"
                                checked={formData.is_public}
                                onCheckedChange={(checked) => handleSwitchChange("is_public", checked)}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label htmlFor="is_collaborative" className="text-base">Cộng tác</Label>
                                <p className="text-sm text-gray-500">
                                    Cho phép người dùng khác cộng tác chỉnh sửa playlist
                                </p>
                            </div>
                            <Switch
                                id="is_collaborative"
                                name="is_collaborative"
                                checked={formData.is_collaborative}
                                onCheckedChange={(checked) => handleSwitchChange("is_collaborative", checked)}
                            />
                        </div>
                    </div>
                </CardContent>

                <CardFooter className="flex justify-between">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.push("/admin/playlists")}
                        disabled={isLoading}
                    >
                        Hủy
                    </Button>

                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Đang lưu...
                            </>
                        ) : (
                            <>
                                <Check className="mr-2 h-4 w-4" />
                                {isEditing ? "Cập nhật" : "Tạo mới"}
                            </>
                        )}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    )
}
