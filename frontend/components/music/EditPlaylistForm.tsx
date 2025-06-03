"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ChevronLeft, Upload, Image as ImageIcon, AlertCircle, Loader2 } from "lucide-react"
import postmanApi from "@/lib/api/postman"
import { usePlaylist } from "@/context/playlist-context"
import DeletePlaylistButton from "./DeletePlaylistButton"

// Kích thước file ảnh tối đa (5MB)
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

interface EditPlaylistFormProps {
    playlistId: string;
    onSuccess?: () => void;
}

export function EditPlaylistForm({ playlistId, onSuccess }: EditPlaylistFormProps) {
    const router = useRouter()
    const { toast } = useToast()
    const { getPlaylist, updatePlaylistInState, removeSongFromPlaylist } = usePlaylist();

    const [name, setName] = useState("")
    const [description, setDescription] = useState("")
    const [isPublic, setIsPublic] = useState(true)
    const [coverImage, setCoverImage] = useState<File | null>(null)
    const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null)
    const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [isFetching, setIsFetching] = useState(true)
    const [imageError, setImageError] = useState<string | null>(null)
    const [isDragging, setIsDragging] = useState(false);
    const [errors, setErrors] = useState<{
        name?: string;
        image?: string;
    }>({});

    // Validation client-side
    const validateForm = () => {
        const newErrors: { name?: string; image?: string } = {};
        let isValid = true;

        if (!name.trim()) {
            newErrors.name = "Tên playlist không được để trống";
            isValid = false;
        } else if (name.length > 100) {
            newErrors.name = "Tên playlist không được quá 100 ký tự";
            isValid = false;
        }

        if (imageError) {
            newErrors.image = imageError;
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    // Fetch dữ liệu playlist hiện tại
    useEffect(() => {
        const fetchPlaylistDetails = async () => {
            try {
                setIsFetching(true);
                const playlist = await getPlaylist(playlistId);

                if (playlist) {
                    setName(playlist.name);
                    setDescription(playlist.description || "");
                    setIsPublic(playlist.is_public);
                    setCoverImageUrl(playlist.cover_image);
                    setCoverImagePreview(playlist.cover_image);
                } else {
                    toast({
                        title: "Lỗi",
                        description: "Không thể tải thông tin playlist. Vui lòng thử lại sau.",
                        variant: "destructive",
                    });
                    router.push(`/playlist/${playlistId}`);
                }
            } catch (error) {
                console.error("Lỗi khi tải thông tin playlist:", error);
                toast({
                    title: "Lỗi",
                    description: "Không thể tải thông tin playlist. Vui lòng thử lại sau.",
                    variant: "destructive",
                });
                router.push(`/playlist/${playlistId}`);
            } finally {
                setIsFetching(false);
            }
        };

        if (playlistId) {
            fetchPlaylistDetails();
        }
    }, [playlistId, getPlaylist, router, toast]);

    // Xử lý khi thay đổi ảnh
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            validateAndSetImage(file);
        }
    };

    // Xử lý drag and drop
    const onDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const onDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const onDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            validateAndSetImage(files[0]);
        }
    }, []);

    // Kiểm tra và thiết lập ảnh
    const validateAndSetImage = (file: File) => {
        // Kiểm tra kích thước ảnh
        if (file.size > MAX_IMAGE_SIZE) {
            setImageError(`Kích thước ảnh quá lớn. Tối đa 5MB (ảnh hiện tại: ${(file.size / (1024 * 1024)).toFixed(2)}MB).`);
            return;
        }

        // Kiểm tra định dạng ảnh
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        if (!validTypes.includes(file.type)) {
            setImageError("Định dạng ảnh không hợp lệ. Chỉ hỗ trợ JPEG, JPG và PNG.");
            return;
        }

        // Xóa thông báo lỗi nếu có
        setImageError(null);
        setCoverImage(file);

        // Tạo URL xem trước cho hình ảnh
        const reader = new FileReader();
        reader.onload = (event) => {
            if (event.target && typeof event.target.result === 'string') {
                setCoverImagePreview(event.target.result);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate form trước khi submit
        if (!validateForm()) {
            return;
        }

        try {
            setLoading(true);

            // Tạo FormData
            const formData = new FormData();
            formData.append('name', name);

            if (description.trim()) {
                formData.append('description', description);
            }

            formData.append('is_public', isPublic.toString());

            // Thêm ảnh bìa nếu có
            if (coverImage) {
                formData.append('cover_image', coverImage);
            }

            // Gọi API cập nhật
            // @ts-ignore - Bỏ qua lỗi type check tạm thời
            const updatedPlaylist = await postmanApi.music.updatePlaylist(playlistId, formData);

            // Cập nhật state global
            if (updatedPlaylist) {
                updatePlaylistInState(updatedPlaylist);
            }

            toast({
                title: "Thành công",
                description: "Đã cập nhật playlist thành công",
            });

            // Callback hoặc chuyển hướng
            if (onSuccess) {
                onSuccess();
            } else {
                router.push(`/playlist/${playlistId}`);
            }
        } catch (error) {
            console.error("Lỗi khi cập nhật playlist:", error);

            // Xử lý lỗi từ server nếu có
            let errorMessage = "Không thể cập nhật playlist. Vui lòng thử lại sau.";

            if (error instanceof Error) {
                errorMessage = error.message;
            }

            toast({
                title: "Lỗi",
                description: errorMessage,
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    if (isFetching) {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-green-500 mb-4" />
                <p className="text-zinc-400">Đang tải thông tin playlist...</p>
            </div>
        );
    }

    return (
        <div>
            <div className="flex items-center mb-8">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.push(`/playlist/${playlistId}`)}
                    className="mr-4"
                >
                    <ChevronLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-3xl font-bold">Chỉnh sửa Playlist</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex flex-col md:flex-row gap-8">
                    <div className="w-full md:w-1/3">
                        <div
                            className={`aspect-square bg-zinc-800 rounded-md overflow-hidden relative ${isDragging ? 'border-2 border-dashed border-green-500' : ''}`}
                            onDragOver={onDragOver}
                            onDragLeave={onDragLeave}
                            onDrop={onDrop}
                        >
                            {coverImagePreview ? (
                                <Image
                                    src={coverImagePreview}
                                    alt="Ảnh bìa"
                                    className="object-cover"
                                    fill
                                />
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-zinc-400">
                                    <ImageIcon className="h-20 w-20 mb-2" />
                                    <span>Chọn ảnh bìa</span>
                                </div>
                            )}
                            {isDragging && (
                                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center text-white">
                                    <p>Thả ảnh ở đây</p>
                                </div>
                            )}
                        </div>
                        <div className="mt-4">
                            <Label htmlFor="cover-image" className="cursor-pointer">
                                <div className="flex items-center justify-center py-2 px-4 border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 rounded-md text-center">
                                    <Upload className="h-4 w-4 mr-2" />
                                    {coverImagePreview ? "Thay đổi ảnh" : "Tải ảnh lên"}
                                </div>
                                <Input
                                    id="cover-image"
                                    type="file"
                                    accept="image/jpeg,image/jpg,image/png"
                                    className="hidden"
                                    onChange={handleImageChange}
                                />
                            </Label>
                            <p className="mt-2 text-xs text-zinc-400">
                                Định dạng: PNG, JPG. Tối đa: 5MB
                            </p>
                            {errors.image && (
                                <p className="mt-1 text-xs text-red-500">{errors.image}</p>
                            )}
                        </div>
                    </div>

                    <div className="flex-1 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Tên playlist <span className="text-red-500">*</span></Label>
                            <Input
                                id="name"
                                placeholder="Nhập tên playlist"
                                value={name}
                                onChange={(e) => {
                                    setName(e.target.value);
                                    if (errors.name) {
                                        setErrors({ ...errors, name: undefined });
                                    }
                                }}
                                className={errors.name ? "border-red-500" : ""}
                                required
                            />
                            {errors.name && (
                                <p className="text-xs text-red-500">{errors.name}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Mô tả (không bắt buộc)</Label>
                            <Textarea
                                id="description"
                                placeholder="Mô tả về playlist này..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={4}
                            />
                        </div>

                        <div className="flex items-center space-x-2 pt-4">
                            <Switch
                                id="isPublic"
                                checked={isPublic}
                                onCheckedChange={setIsPublic}
                            />
                            <Label htmlFor="isPublic" className="cursor-pointer">
                                {isPublic ? "Công khai" : "Riêng tư"}
                            </Label>
                        </div>

                        <div className="pt-6 flex flex-col-reverse sm:flex-row sm:justify-between sm:space-x-2">
                            <DeletePlaylistButton
                                playlistId={playlistId}
                                playlistName={name}
                                onSuccess={() => router.push('/playlists')}
                            />

                            <div className="flex gap-2 mb-4 sm:mb-0">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => router.push(`/playlist/${playlistId}`)}
                                    disabled={loading}
                                >
                                    Hủy
                                </Button>
                                <Button type="submit" disabled={loading}>
                                    {loading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Đang lưu...
                                        </>
                                    ) : (
                                        "Cập nhật"
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    )
} 