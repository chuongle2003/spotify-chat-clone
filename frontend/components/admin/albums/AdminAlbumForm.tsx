"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import Image from "next/image"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"

interface AdminAlbumFormProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
    albumData?: {
        id?: number
        title: string
        artist: {
            id: number
            name: string
        }
        release_date: string
        cover_image?: string
        description?: string
    }
    mode: "add" | "edit"
    albumService: any
}

export default function AdminAlbumForm({
    isOpen,
    onClose,
    onSuccess,
    albumData,
    mode,
    albumService,
}: AdminAlbumFormProps) {
    const { toast } = useToast()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [formData, setFormData] = useState({
        title: "",
        artist: "",
        release_date: new Date().toISOString().split("T")[0],
        cover_image: "",
        description: "",
    })
    const [coverImageFile, setCoverImageFile] = useState<File | null>(null)
    const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null)
    const [date, setDate] = useState<Date | undefined>(new Date())

    useEffect(() => {
        if (albumData && isOpen) {
            setFormData({
                title: albumData.title || "",
                artist: albumData.artist?.name || "",
                release_date: albumData.release_date || new Date().toISOString().split("T")[0],
                cover_image: albumData.cover_image || "",
                description: albumData.description || "",
            })

            if (albumData.release_date) {
                setDate(new Date(albumData.release_date))
            }

            if (albumData.cover_image) {
                setCoverImagePreview(albumData.cover_image)
            } else {
                setCoverImagePreview(null)
            }
        } else {
            resetForm()
        }
    }, [albumData, isOpen])

    const resetForm = () => {
        setFormData({
            title: "",
            artist: "",
            release_date: new Date().toISOString().split("T")[0],
            cover_image: "",
            description: "",
        })
        setCoverImageFile(null)
        setCoverImagePreview(null)
        setDate(new Date())
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.title || !formData.artist) {
            toast({
                title: "Lỗi",
                description: "Vui lòng điền đầy đủ thông tin bắt buộc",
                variant: "destructive",
            })
            return
        }

        try {
            setIsSubmitting(true)

            // Tạo FormData để gửi lên server
            const submitFormData = new FormData()
            submitFormData.append("title", formData.title)
            submitFormData.append("artist_id", "1") // Tạm thời hardcode artist_id
            submitFormData.append("release_date", formData.release_date)
            if (formData.description) {
                submitFormData.append("description", formData.description)
            }

            // Nếu có file ảnh mới, thêm vào FormData
            if (coverImageFile) {
                submitFormData.append("cover_image", coverImageFile)
            }

            let response
            if (mode === "add") {
                response = await albumService.createAlbum(submitFormData)
            } else if (mode === "edit" && albumData?.id) {
                response = await albumService.updateAlbum(albumData.id, submitFormData)
            }

            toast({
                title: "Thành công",
                description: mode === "add" ? "Thêm album mới thành công" : "Cập nhật album thành công",
            })

            onSuccess()
            onClose()
            resetForm()
        } catch (error) {
            console.error("Lỗi khi lưu album:", error)
            toast({
                title: "Lỗi",
                description: "Có lỗi xảy ra khi lưu album",
                variant: "destructive",
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setCoverImageFile(file)
            const reader = new FileReader()
            reader.onloadend = () => {
                setCoverImagePreview(reader.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    const handleDateSelect = (date: Date | undefined) => {
        setDate(date)
        if (date) {
            setFormData({
                ...formData,
                release_date: date.toISOString().split("T")[0],
            })
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-zinc-900 text-white border-zinc-800 max-w-md">
                <DialogHeader>
                    <DialogTitle>{mode === "add" ? "Thêm album mới" : "Chỉnh sửa album"}</DialogTitle>
                    <DialogDescription className="text-zinc-400">
                        {mode === "add"
                            ? "Điền thông tin để tạo album mới"
                            : "Cập nhật thông tin album"}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-2">
                    <div className="space-y-2">
                        <label htmlFor="title" className="text-sm font-medium">
                            Tên album <span className="text-red-500">*</span>
                        </label>
                        <Input
                            id="title"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="bg-zinc-800 border-zinc-700 text-white"
                            placeholder="Nhập tên album"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="artist" className="text-sm font-medium">
                            Nghệ sĩ <span className="text-red-500">*</span>
                        </label>
                        <Input
                            id="artist"
                            value={formData.artist}
                            onChange={(e) => setFormData({ ...formData, artist: e.target.value })}
                            className="bg-zinc-800 border-zinc-700 text-white"
                            placeholder="Nhập tên nghệ sĩ"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">
                            Ngày phát hành
                        </label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={cn(
                                        "w-full justify-start text-left font-normal bg-zinc-800 border-zinc-700 text-white",
                                        !date && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {date ? format(date, "dd/MM/yyyy") : <span>Chọn ngày</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 bg-zinc-800 border-zinc-700">
                                <Calendar
                                    mode="single"
                                    selected={date}
                                    onSelect={handleDateSelect}
                                    initialFocus
                                    className="bg-zinc-800 text-white"
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="cover_image" className="text-sm font-medium">
                            Ảnh bìa album
                        </label>
                        <Input
                            id="cover_image"
                            type="file"
                            accept="image/jpeg, image/png"
                            onChange={handleImageChange}
                            className="bg-zinc-800 border-zinc-700 text-white"
                        />
                        {coverImagePreview && (
                            <div className="mt-2 relative aspect-square w-40 mx-auto border border-zinc-700 rounded-md overflow-hidden">
                                <Image
                                    src={coverImagePreview}
                                    fill
                                    alt="Album cover preview"
                                    className="object-cover"
                                />
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="description" className="text-sm font-medium">
                            Mô tả
                        </label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="bg-zinc-800 border-zinc-700 text-white min-h-[100px]"
                            placeholder="Nhập mô tả về album"
                        />
                    </div>

                    <DialogFooter className="pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={isSubmitting}
                        >
                            Hủy
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-green-600 text-white hover:bg-green-700"
                        >
                            {isSubmitting
                                ? "Đang lưu..."
                                : mode === "add"
                                    ? "Thêm album"
                                    : "Lưu thay đổi"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
} 