"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, Loader2, Plus, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { usePlaylist } from "@/context/playlist-context";
import Image from "next/image";

// Giới hạn bài hát trong playlist
const MAX_SONGS_PER_PLAYLIST = 1000;

interface AddToPlaylistModalProps {
    songId: string;
    songTitle: string;
    children?: React.ReactNode;
}

export default function AddToPlaylistModal({
    songId,
    songTitle,
    children,
}: AddToPlaylistModalProps) {
    const router = useRouter();
    const { toast } = useToast();
    const { userPlaylists, isLoading, addSongToPlaylist, refreshPlaylists } = usePlaylist();

    const [open, setOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [addingToPlaylist, setAddingToPlaylist] = useState<string | null>(null);
    const [recentlyAddedTo, setRecentlyAddedTo] = useState<string[]>([]);

    useEffect(() => {
        if (open) {
            refreshPlaylists();
        }
    }, [open, refreshPlaylists]);

    // Lọc playlist dựa theo tìm kiếm
    const filteredPlaylists = userPlaylists.filter(playlist =>
        playlist.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAddToPlaylist = async (playlistId: string, songCount: number) => {
        // Kiểm tra tính hợp lệ của playlistId và songId
        if (!playlistId || !songId) {
            toast({
                title: "Lỗi",
                description: "Thông tin playlist hoặc bài hát không hợp lệ",
                variant: "destructive",
            });
            return;
        }

        // Kiểm tra giới hạn bài hát
        if (songCount >= MAX_SONGS_PER_PLAYLIST) {
            toast({
                title: "Đã đạt giới hạn",
                description: `Playlist đã đạt giới hạn tối đa ${MAX_SONGS_PER_PLAYLIST} bài hát.`,
                variant: "destructive",
            });
            return;
        }

        try {
            setAddingToPlaylist(playlistId);
            const success = await addSongToPlaylist(playlistId, songId);

            if (success) {
                toast({
                    title: "Thành công",
                    description: `Đã thêm "${songTitle}" vào playlist`,
                });
                // Lưu trữ playlist đã thêm gần đây
                setRecentlyAddedTo(prev => [playlistId, ...prev.filter(id => id !== playlistId)]);
            } else {
                toast({
                    title: "Thông báo",
                    description: "Bài hát đã có trong playlist này",
                });
            }
        } catch (error: any) {
            console.error("Lỗi khi thêm bài hát vào playlist:", error);
            toast({
                title: "Lỗi",
                description: "Không thể thêm bài hát vào playlist",
                variant: "destructive",
            });
        } finally {
            setAddingToPlaylist(null);
        }
    };

    const handleCreatePlaylist = () => {
        setOpen(false);
        router.push("/create-playlist");
    };

    // Render playlist item
    const renderPlaylistItem = (playlist: any) => (
        <div
            key={playlist?.id || Math.random()}
            className="flex items-center justify-between p-3 rounded-md hover:bg-zinc-800/60 cursor-pointer transition-colors group"
            onClick={() => {
                if (!playlist || !playlist.id) {
                    toast({
                        title: "Lỗi",
                        description: "Thông tin playlist không hợp lệ",
                        variant: "destructive",
                    });
                    return;
                }
                handleAddToPlaylist(String(playlist.id), playlist.songs_count || 0);
            }}
        >
            <div className="flex items-center">
                <div className="h-12 w-12 bg-zinc-900 rounded-md overflow-hidden relative flex-shrink-0">
                    {playlist?.cover_image ? (
                        <Image
                            src={playlist.cover_image}
                            alt={playlist.name || "Playlist"}
                            className="object-cover"
                            fill
                        />
                    ) : (
                        <div className="h-full w-full flex items-center justify-center text-zinc-600">
                            <Plus className="h-5 w-5" />
                        </div>
                    )}
                </div>
                <div className="ml-3">
                    <div className="font-medium group-hover:text-white transition-colors">
                        {playlist?.name || "Playlist không tên"}
                    </div>
                    <div className="text-xs text-zinc-400 flex items-center gap-2">
                        <span>{playlist?.songs_count || 0} bài hát</span>
                        {(playlist?.songs_count || 0) >= MAX_SONGS_PER_PLAYLIST && (
                            <span className="text-red-500">(Đã đạt giới hạn)</span>
                        )}
                        {!playlist.is_public && (
                            <span className="bg-zinc-700 text-zinc-300 text-xs px-1.5 py-0.5 rounded-sm">
                                Riêng tư
                            </span>
                        )}
                    </div>
                </div>
            </div>
            <div>
                {addingToPlaylist === String(playlist?.id) ? (
                    <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
                ) : (playlist?.songs_count || 0) >= MAX_SONGS_PER_PLAYLIST ? (
                    <span className="text-xs text-red-500">Đầy</span>
                ) : recentlyAddedTo.includes(String(playlist?.id)) ? (
                    <Check className="h-5 w-5 text-green-500" />
                ) : (
                    <Plus className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity text-zinc-400" />
                )}
            </div>
        </div>
    );

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children || (
                    <Button variant="ghost" size="sm" className="gap-1">
                        <Plus className="h-4 w-4" />
                        <span>Thêm vào playlist</span>
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Thêm vào playlist</DialogTitle>
                    <DialogDescription>
                        Chọn playlist để thêm bài hát "{songTitle}"
                    </DialogDescription>
                </DialogHeader>

                <div className="relative my-4">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <Input
                        placeholder="Tìm playlist..."
                        className="pl-9 bg-zinc-800 border-zinc-700"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="max-h-[60vh] overflow-y-auto pr-1 py-2">
                    {isLoading ? (
                        // Loading state
                        Array(4)
                            .fill(0)
                            .map((_, i) => (
                                <div key={`skeleton-${i}`} className="flex items-center p-3 mb-2">
                                    <Skeleton className="h-12 w-12 rounded-md" />
                                    <div className="ml-3 flex-1">
                                        <Skeleton className="h-4 w-32" />
                                        <Skeleton className="h-3 w-16 mt-1" />
                                    </div>
                                </div>
                            ))
                    ) : filteredPlaylists.length > 0 ? (
                        <div className="grid gap-1">
                            {filteredPlaylists.map(renderPlaylistItem)}
                        </div>
                    ) : searchTerm ? (
                        <div className="py-6 text-center text-zinc-500">
                            <p>Không tìm thấy playlist nào phù hợp với "{searchTerm}"</p>
                            <Button
                                variant="link"
                                className="mt-2"
                                onClick={() => setSearchTerm("")}
                            >
                                Xem tất cả playlist
                            </Button>
                        </div>
                    ) : userPlaylists.length === 0 ? (
                        <div className="py-8 text-center">
                            <p className="text-zinc-500 mb-4">Bạn chưa có playlist nào</p>
                            <Button onClick={handleCreatePlaylist}>
                                <Plus className="h-4 w-4 mr-2" />
                                Tạo playlist mới
                            </Button>
                        </div>
                    ) : null}
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
                        Đóng
                    </Button>
                    <Button onClick={handleCreatePlaylist} className="gap-2">
                        <Plus className="h-4 w-4" />
                        Tạo playlist mới
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
} 