"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { AdminArtist, AdminArtistService } from "@/lib/api/services/AdminArtistService"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Upload, X, Save, ArrowLeft } from "lucide-react"

interface AdminArtistFormProps {
    artistId?: number
}

export function AdminArtistForm({ artistId }: AdminArtistFormProps) {
    const router = useRouter()
    const { toast } = useToast()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const artistService = new AdminArtistService()

    // State cho form
    const [name, setName] = useState("")
    const [bio, setBio] = useState("")
    const [isFeatured, setIsFeatured] = useState(false)
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Lấy thông tin nghệ sĩ nếu là chế độ sửa
    useEffect(() => {
        if (artistId) {
            setIsLoading(true)
            artistService.getArtist(artistId)
                .then((artist) => {
                    setName(artist.name)
                    setBio(artist.bio || "")
                    setIsFeatured(artist.is_featured)
                    if (artist.image) {
                        setImagePreview(artist.image)
                    }
                })
                .catch((error) => {
                    console.error("Lỗi khi lấy thông tin nghệ sĩ:", error)
                    toast({
                        variant: "destructive",
                        title: "Đã xảy ra lỗi",
                        description: "Không thể tải thông tin nghệ sĩ. Vui lòng thử lại sau."
                    })
                })
                .finally(() => {
                    setIsLoading(false)
                })
        }
    }, [artistId])

    // Xử lý khi chọn file ảnh
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Kiểm tra loại file
        const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/jpg"]
        if (!allowedTypes.includes(file.type)) {
            toast({
                variant: "destructive",
                title: "Định dạng không hỗ trợ",
                description: "Vui lòng chọn file ảnh JPG, PNG, hoặc GIF."
            })
            return
        }

        // Kiểm tra kích thước file (5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast({
                variant: "destructive",
                title: "File quá lớn",
                description: "Kích thước file tối đa là 5MB."
            })
            return
        }

        setImageFile(file)

        // Tạo preview URL
        const reader = new FileReader()
        reader.onload = () => {
            setImagePreview(reader.result as string)
        }
        reader.readAsDataURL(file)
    }

    // Xóa ảnh đã chọn
    const handleRemoveImage = () => {
        setImageFile(null)
        setImagePreview(null)
        if (fileInputRef.current) {
            fileInputRef.current.value = ""
        }
    }

    // Trigger click cho input file
    const handleUploadClick = () => {
        fileInputRef.current?.click()
    }

    // Xử lý submit form
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        setError(null)

        try {
            // Chuẩn bị formData
            const formData = new FormData()
            formData.append("name", name)
            formData.append("bio", bio)
            formData.append("is_featured", String(isFeatured))

            // Thêm file ảnh nếu có
            if (imageFile) {
                formData.append("image", imageFile)
            }

            let response: AdminArtist

            if (artistId) {
                // Cập nhật nghệ sĩ
                response = await artistService.updateArtist(artistId, formData)
                toast({
                    title: "Cập nhật thành công",
                    description: `Đã cập nhật nghệ sĩ "${response.name}"`
                })
            } else {
                // Thêm mới nghệ sĩ
                response = await artistService.createArtist(formData)
                toast({
                    title: "Tạo mới thành công",
                    description: `Đã tạo nghệ sĩ "${response.name}"`
                })
            }

            // Chuyển hướng về trang danh sách
            router.push("/admin/artists")
        } catch (error: any) {
            console.error("Lỗi khi lưu nghệ sĩ:", error)
            setError(error?.response?.data?.error?.message || "Đã xảy ra lỗi khi lưu nghệ sĩ")
            toast({
                variant: "destructive",
                title: "Đã xảy ra lỗi",
                description: error?.response?.data?.error?.message || "Không thể lưu nghệ sĩ. Vui lòng thử lại sau."
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    // Render component loading khi đang tải dữ liệu
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-green-500 mb-2" />
                <p>Đang tải dữ liệu...</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <Button
                variant="outline"
                onClick={() => router.push("/admin/artists")}
                className="mb-4"
            >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Quay lại
            </Button>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Thông tin cơ bản */}
                <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-base">
                                Tên nghệ sĩ <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="h-10"
                                required
                                maxLength={200}
                            />
                            <p className="text-xs text-muted-foreground">Tối đa 200 ký tự</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="bio" className="text-base">Tiểu sử</Label>
                            <Textarea
                                id="bio"
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                className="min-h-[200px]"
                                placeholder="Nhập tiểu sử của nghệ sĩ..."
                            />
                        </div>

                        <div className="flex items-center space-x-2">
                            <Switch
                                id="is_featured"
                                checked={isFeatured}
                                onCheckedChange={setIsFeatured}
                            />
                            <Label htmlFor="is_featured" className="cursor-pointer">
                                Đánh dấu là nghệ sĩ nổi bật
                            </Label>
                        </div>
                    </div>

                    {/* Upload ảnh */}
                    <div>
                        <Label className="text-base mb-2 block">Ảnh đại diện</Label>
                        <Card className="border-dashed p-8">
                            <CardContent className="flex flex-col items-center justify-center p-0">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/gif,image/jpg"
                                    onChange={handleImageChange}
                                    className="hidden"
                                />

                                {imagePreview ? (
                                    <div className="relative mb-4">
                                        <div className="relative h-[200px] w-[200px] rounded-md overflow-hidden">
                                            <Image
                                                src={imagePreview}
                                                alt="Preview"
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="icon"
                                            className="absolute -top-2 -right-2 rounded-full"
                                            onClick={handleRemoveImage}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ) : (
                                    <div
                                        onClick={handleUploadClick}
                                        className="w-full h-[200px] border-2 border-dashed border-zinc-700 rounded-md flex flex-col items-center justify-center cursor-pointer hover:border-green-500 transition-colors"
                                    >
                                        <Upload className="h-10 w-10 mb-2 text-zinc-500" />
                                        <p className="text-sm text-zinc-400">
                                            Kéo thả hoặc nhấn để chọn ảnh
                                        </p>
                                        <p className="text-xs text-zinc-500 mt-2">
                                            JPG, PNG, GIF (tối đa 5MB)
                                        </p>
                                    </div>
                                )}

                                {imagePreview && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="mt-2"
                                        onClick={handleUploadClick}
                                    >
                                        <Upload className="h-4 w-4 mr-2" />
                                        Thay đổi ảnh
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Hiển thị lỗi nếu có */}
                {error && (
                    <div className="bg-red-500/10 border border-red-500 rounded-md p-4 text-red-500">
                        {error}
                    </div>
                )}

                {/* Nút submit */}
                <div className="flex justify-end">
                    <Button
                        type="button"
                        variant="outline"
                        className="mr-2"
                        onClick={() => router.push("/admin/artists")}
                        disabled={isSubmitting}
                    >
                        Hủy
                    </Button>
                    <Button
                        type="submit"
                        className="bg-green-600 hover:bg-green-700"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Đang lưu...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                {artistId ? "Cập nhật nghệ sĩ" : "Tạo nghệ sĩ mới"}
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    )
} 