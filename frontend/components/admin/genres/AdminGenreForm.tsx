"use client";

import { useEffect, useState } from "react";
import { AdminGenre } from "@/lib/api/services/AdminGenreService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { UploadCloud, X } from "lucide-react";
import Image from "next/image";

interface AdminGenreFormProps {
    genre?: AdminGenre;
    isLoading: boolean;
    onSubmit: (formData: FormData) => Promise<void>;
    onCancel: () => void;
}

export default function AdminGenreForm({
    genre,
    isLoading,
    onSubmit,
    onCancel
}: AdminGenreFormProps) {
    const isEditMode = !!genre;
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [isFeatured, setIsFeatured] = useState(false);
    const [image, setImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    useEffect(() => {
        if (genre) {
            setName(genre.name || "");
            setDescription(genre.description || "");
            setIsFeatured(genre.is_featured || false);

            if (genre.image) {
                setImagePreview(genre.image);
            }
        }
    }, [genre]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setImage(file);

        if (file) {
            const url = URL.createObjectURL(file);
            setImagePreview(url);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name) {
            alert("Vui lòng điền tên thể loại");
            return;
        }

        const formData = new FormData();
        formData.append("name", name);

        if (description) {
            formData.append("description", description);
        }

        formData.append("is_featured", isFeatured.toString());

        if (image) {
            formData.append("image", image);
        }

        await onSubmit(formData);
    };

    const clearImage = () => {
        setImage(null);
        if (imagePreview && !genre?.image) {
            URL.revokeObjectURL(imagePreview);
        }
        setImagePreview(genre?.image || null);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
                <div>
                    <Label htmlFor="name">Tên thể loại <span className="text-red-500">*</span></Label>
                    <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="bg-zinc-800 border-zinc-700 text-white mt-1"
                        placeholder="Nhập tên thể loại"
                        required
                    />
                </div>

                <div>
                    <Label htmlFor="description">Mô tả</Label>
                    <Textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="bg-zinc-800 border-zinc-700 text-white mt-1 min-h-[100px]"
                        placeholder="Nhập mô tả về thể loại"
                    />
                </div>

                <div className="flex items-center justify-between">
                    <Label htmlFor="is_featured" className="cursor-pointer">
                        Thể loại nổi bật
                    </Label>
                    <Switch
                        id="is_featured"
                        checked={isFeatured}
                        onCheckedChange={setIsFeatured}
                    />
                </div>

                <div>
                    <Label>Ảnh thể loại</Label>
                    <div className="mt-2">
                        {imagePreview ? (
                            <div className="relative w-full h-40 mb-4">
                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="icon"
                                    className="absolute top-2 right-2 z-10 rounded-full w-8 h-8"
                                    onClick={clearImage}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                                <Image
                                    src={imagePreview}
                                    alt="Preview"
                                    fill
                                    className="object-contain rounded-md"
                                />
                            </div>
                        ) : (
                            <div className="flex items-center justify-center border-2 border-dashed border-zinc-700 rounded-md h-40 cursor-pointer mb-4">
                                <label htmlFor="image" className="cursor-pointer w-full h-full flex flex-col items-center justify-center">
                                    <UploadCloud className="h-10 w-10 text-zinc-500 mb-2" />
                                    <span className="text-sm text-zinc-500">Tải lên ảnh</span>
                                </label>
                                <input
                                    type="file"
                                    id="image"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-3">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={isLoading}
                    className="bg-transparent border-zinc-700 text-white hover:bg-zinc-800"
                >
                    Hủy
                </Button>
                <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Đang xử lý..." : isEditMode ? "Cập nhật" : "Tạo mới"}
                </Button>
            </div>
        </form>
    );
} 