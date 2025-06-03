"use client";

import { useEffect, useState } from "react";
import { AdminSong } from "@/lib/api/services/AdminSongService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UploadCloud, X } from "lucide-react";
import Image from "next/image";

interface AdminSongFormProps {
    song?: AdminSong;
    artists: string[];
    genres: string[];
    albums: string[];
    isLoading: boolean;
    onSubmit: (formData: FormData) => Promise<void>;
    onCancel: () => void;
}

export default function AdminSongForm({
    song,
    artists,
    genres,
    albums,
    isLoading,
    onSubmit,
    onCancel
}: AdminSongFormProps) {
    const isEditMode = !!song;
    const [title, setTitle] = useState("");
    const [artist, setArtist] = useState<string>("");
    const [album, setAlbum] = useState<string>("");
    const [genre, setGenre] = useState<string>("");
    const [lyrics, setLyrics] = useState("");
    const [duration, setDuration] = useState<string>("");
    const [releaseDate, setReleaseDate] = useState("");
    const [isApproved, setIsApproved] = useState(false);
    const [audioFile, setAudioFile] = useState<File | null>(null);
    const [coverImage, setCoverImage] = useState<File | null>(null);

    // Thêm preview cho ảnh và file âm thanh
    const [audioPreview, setAudioPreview] = useState<string | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    // State để hiển thị lỗi
    const [fileErrors, setFileErrors] = useState<{
        audio_file?: string;
        cover_image?: string;
        general?: string;
    }>({});

    // Kiểm tra form có hợp lệ không
    const isFormValid = title && artist && genre && (isEditMode || audioFile);

    useEffect(() => {
        if (song) {
            setTitle(song.title);
            setArtist(song.artist);
            setAlbum(song.album || "");
            setGenre(song.genre || "");
            setLyrics(song.lyrics || "");
            setDuration(song.duration ? song.duration.toString() : "");
            setReleaseDate(song.release_date || "");
            setIsApproved(song.is_approved);

            if (song.audio_file) {
                // Thêm timestamp để tránh cache
                setAudioPreview(`${song.audio_file}?t=${Date.now()}`);
            }

            if (song.cover_image) {
                // Thêm timestamp để tránh cache
                setImagePreview(`${song.cover_image}?t=${Date.now()}`);
            }
        }
    }, [song]);

    const validateAudioFile = (file: File): string | null => {
        const validTypes = ['audio/mp3', 'audio/wav', 'audio/flac', 'audio/mpeg'];
        const maxSizeInBytes = 50 * 1024 * 1024; // 50MB

        if (!validTypes.includes(file.type)) {
            return "File nhạc không hợp lệ. Hỗ trợ định dạng: MP3, WAV, FLAC.";
        }

        if (file.size > maxSizeInBytes) {
            return "File nhạc vượt quá kích thước tối đa (50MB).";
        }

        return null;
    };

    const validateImageFile = (file: File): string | null => {
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        const maxSizeInBytes = 10 * 1024 * 1024; // 10MB

        if (!validTypes.includes(file.type)) {
            return "Ảnh bìa không hợp lệ. Hỗ trợ định dạng: JPEG, PNG.";
        }

        if (file.size > maxSizeInBytes) {
            return "Ảnh bìa vượt quá kích thước tối đa (10MB).";
        }

        return null;
    };

    const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;

        if (file) {
            const errorMessage = validateAudioFile(file);
            if (errorMessage) {
                setFileErrors(prev => ({ ...prev, audio_file: errorMessage }));
                return;
            }

            setFileErrors(prev => ({ ...prev, audio_file: undefined }));
            setAudioFile(file);
            const url = URL.createObjectURL(file);
            setAudioPreview(url);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;

        if (file) {
            const errorMessage = validateImageFile(file);
            if (errorMessage) {
                setFileErrors(prev => ({ ...prev, cover_image: errorMessage }));
                return;
            }

            setFileErrors(prev => ({ ...prev, cover_image: undefined }));
            setCoverImage(file);
            const url = URL.createObjectURL(file);
            setImagePreview(url);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFileErrors({});

        if (!title || !artist || !genre) {
            setFileErrors(prev => ({ ...prev, general: "Vui lòng điền đầy đủ thông tin bắt buộc (tên bài hát, nghệ sĩ, thể loại)" }));
            return;
        }

        if (!isEditMode && !audioFile) {
            setFileErrors(prev => ({ ...prev, audio_file: "Vui lòng tải lên file nhạc" }));
            return;
        }

        const formData = new FormData();
        formData.append("title", title);
        formData.append("artist", artist);
        formData.append("genre", genre);

        if (album) formData.append("album", album);
        if (duration) formData.append("duration", duration);
        if (lyrics) formData.append("lyrics", lyrics);
        if (releaseDate) formData.append("release_date", releaseDate);
        formData.append("is_approved", isApproved.toString());

        if (audioFile) formData.append("audio_file", audioFile);
        if (coverImage) formData.append("cover_image", coverImage);

        try {
            await onSubmit(formData);
        } catch (error: any) {
            const errorData = error.response?.data;
            if (errorData?.error?.details) {
                const details = errorData.error.details;
                setFileErrors(prevErrors => ({
                    ...prevErrors,
                    general: details.non_field_errors ? details.non_field_errors[0] : undefined,
                    audio_file: details.audio_file ? details.audio_file[0] : undefined,
                    cover_image: details.cover_image ? details.cover_image[0] : undefined,
                }));
            } else {
                setFileErrors(prevErrors => ({
                    ...prevErrors,
                    general: "Có lỗi xảy ra, vui lòng thử lại sau."
                }));
            }
        }
    };

    const clearAudioFile = () => {
        setAudioFile(null);
        if (audioPreview && !song?.audio_file) {
            URL.revokeObjectURL(audioPreview);
        }
        setAudioPreview(song?.audio_file ? `${song.audio_file}?t=${Date.now()}` : null);
        setFileErrors(prev => ({ ...prev, audio_file: undefined }));
    };

    const clearCoverImage = () => {
        setCoverImage(null);
        if (imagePreview && !song?.cover_image) {
            URL.revokeObjectURL(imagePreview);
        }
        setImagePreview(song?.cover_image ? `${song.cover_image}?t=${Date.now()}` : null);
        setFileErrors(prev => ({ ...prev, cover_image: undefined }));
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {fileErrors.general && (
                <div className="bg-red-900/50 border border-red-800 text-white px-4 py-2 rounded-md">
                    {fileErrors.general}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div>
                        <Label htmlFor="title">Tên bài hát <span className="text-red-500">*</span></Label>
                        <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="bg-zinc-800 border-zinc-700 text-white mt-1"
                            placeholder="Nhập tên bài hát"
                            required
                        />
                    </div>

                    <div>
                        <Label htmlFor="artist">Nghệ sĩ <span className="text-red-500">*</span></Label>
                        <Select value={artist} onValueChange={(value) => setArtist(value)}>
                            <SelectTrigger id="artist" className="bg-zinc-800 border-zinc-700 text-white mt-1">
                                <SelectValue placeholder="Chọn nghệ sĩ" />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                                {artists.map((artistName) => (
                                    <SelectItem key={artistName} value={artistName}>
                                        {artistName}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label htmlFor="album">Album</Label>
                        <Select value={album} onValueChange={(value) => setAlbum(value)}>
                            <SelectTrigger id="album" className="bg-zinc-800 border-zinc-700 text-white mt-1">
                                <SelectValue placeholder="Chọn album" />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                                {albums.map((albumName) => (
                                    <SelectItem key={albumName} value={albumName}>
                                        {albumName}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label htmlFor="genre">Thể loại <span className="text-red-500">*</span></Label>
                        <Select value={genre} onValueChange={(value) => setGenre(value)}>
                            <SelectTrigger id="genre" className="bg-zinc-800 border-zinc-700 text-white mt-1">
                                <SelectValue placeholder="Chọn thể loại" />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                                {genres.map((genreName) => (
                                    <SelectItem key={genreName} value={genreName}>
                                        {genreName}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label htmlFor="release_date">Ngày phát hành</Label>
                        <Input
                            id="release_date"
                            type="date"
                            value={releaseDate}
                            onChange={(e) => setReleaseDate(e.target.value)}
                            className="bg-zinc-800 border-zinc-700 text-white mt-1"
                        />
                    </div>

                    <div>
                        <Label htmlFor="duration">Thời lượng (giây)</Label>
                        <Input
                            id="duration"
                            type="number"
                            value={duration}
                            onChange={(e) => setDuration(e.target.value)}
                            className="bg-zinc-800 border-zinc-700 text-white mt-1"
                            placeholder="Thời lượng bài hát (giây)"
                        />
                        <div className="text-xs text-zinc-400 mt-1">
                            Không bắt buộc, nếu không nhập sẽ được tự động tính từ file nhạc.
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="is_approved">Trạng thái</Label>
                        <Select
                            value={isApproved ? "true" : "false"}
                            onValueChange={(value) => setIsApproved(value === "true")}
                        >
                            <SelectTrigger
                                id="is_approved"
                                className="bg-zinc-800 border-zinc-700 text-white mt-1"
                            >
                                <SelectValue placeholder="Chọn trạng thái" />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                                <SelectItem value="true">Đã phê duyệt</SelectItem>
                                <SelectItem value="false">Chưa phê duyệt</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <Label htmlFor="audio_file">
                            File nhạc {!isEditMode && <span className="text-red-500">*</span>}
                        </Label>
                        <div className="mt-1">
                            <div className="flex items-center gap-2 mb-2">
                                <Input
                                    id="audio_file"
                                    type="file"
                                    accept="audio/*"
                                    onChange={handleAudioChange}
                                    className="bg-zinc-800 border-zinc-700 text-white file:border-0 file:bg-zinc-700 file:text-zinc-300 file:rounded-md"
                                />
                                {audioFile && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={clearAudioFile}
                                        className="h-10 w-10"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                            {fileErrors.audio_file && (
                                <div className="text-red-500 text-sm mt-1">
                                    {fileErrors.audio_file}
                                </div>
                            )}
                            {audioPreview && (
                                <audio controls className="w-full mt-2 h-10">
                                    <source src={audioPreview} type="audio/mpeg" />
                                </audio>
                            )}
                            <div className="text-xs text-zinc-400 mt-1">
                                Định dạng hỗ trợ: MP3, WAV, FLAC. Kích thước tối đa: 50MB.
                            </div>
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="cover_image">Ảnh bìa</Label>
                        <div className="mt-1">
                            <div className="flex items-center gap-2 mb-2">
                                <Input
                                    id="cover_image"
                                    type="file"
                                    accept="image/jpeg,image/jpg,image/png"
                                    onChange={handleImageChange}
                                    className="bg-zinc-800 border-zinc-700 text-white file:border-0 file:bg-zinc-700 file:text-zinc-300 file:rounded-md"
                                />
                                {coverImage && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={clearCoverImage}
                                        className="h-10 w-10"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                            {fileErrors.cover_image && (
                                <div className="text-red-500 text-sm mt-1">
                                    {fileErrors.cover_image}
                                </div>
                            )}
                            {imagePreview && (
                                <div className="relative h-40 w-40 mt-2 rounded-md overflow-hidden">
                                    <Image src={imagePreview} alt="Preview" fill className="object-cover" />
                                </div>
                            )}
                            <div className="text-xs text-zinc-400 mt-1">
                                Định dạng hỗ trợ: JPG, PNG. Kích thước tối đa: 10MB.
                            </div>
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="lyrics">Lời bài hát</Label>
                        <Textarea
                            id="lyrics"
                            value={lyrics}
                            onChange={(e) => setLyrics(e.target.value)}
                            className="bg-zinc-800 border-zinc-700 text-white mt-1 h-40"
                            placeholder="Nhập lời bài hát"
                        />
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-2">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={isLoading}
                >
                    Hủy
                </Button>
                <Button
                    type="submit"
                    disabled={isLoading || !isFormValid}
                >
                    {isLoading ? "Đang xử lý..." : isEditMode ? "Cập nhật" : "Thêm mới"}
                </Button>
            </div>
        </form>
    );
} 