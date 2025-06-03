"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { useFavorite } from "@/context/favorite-context"
import { usePlayer } from "@/components/player/PlayerContext"
import { Play, Shuffle, Clock, Heart, Plus, ChevronLeft, Music, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import Link from "next/link"
import { toast } from "@/components/ui/use-toast"
import { formatDuration } from "@/lib/utils"

export default function FavoritesPage() {
    const router = useRouter()
    const { user, isAuthenticated, loading } = useAuth()
    const { favoriteSongs, isLoading, refreshFavorites, toggleFavorite } = useFavorite()
    const { play, addToQueue, currentSong, isPlaying, togglePlay } = usePlayer()

    useEffect(() => {
        // Nếu không đăng nhập, chuyển hướng về trang chủ
        if (!loading && !isAuthenticated) {
            router.push("/")
            toast({
                title: "Yêu cầu đăng nhập",
                description: "Vui lòng đăng nhập để xem danh sách bài hát yêu thích.",
                variant: "destructive",
            })
        }
    }, [isAuthenticated, loading, router])

    useEffect(() => {
        // Làm mới danh sách yêu thích khi trang được tải
        if (isAuthenticated) {
            refreshFavorites().catch(error => {
                console.error("Lỗi khi làm mới danh sách yêu thích:", error);
                toast({
                    title: "Lỗi",
                    description: "Không thể tải danh sách bài hát yêu thích. Vui lòng thử lại sau.",
                    variant: "destructive",
                });
            });
        }
    }, [isAuthenticated, refreshFavorites])

    // Thêm lắng nghe sự kiện favoriteChanged để cập nhật UI khi có thay đổi từ các trang khác
    useEffect(() => {
        // Hàm xử lý sự kiện khi có thay đổi về bài hát yêu thích
        const handleFavoriteChange = (event: Event) => {
            const customEvent = event as CustomEvent<{ songId: string, isLiked: boolean }>;
            const { songId, isLiked } = customEvent.detail;

            console.log(`Nhận sự kiện thay đổi yêu thích: songId=${songId}, isLiked=${isLiked}`);

            // Nếu không đăng nhập, bỏ qua
            if (!isAuthenticated) return;

            // Nếu xóa bài hát khỏi yêu thích, cập nhật UI ngay lập tức
            if (!isLiked && Array.isArray(favoriteSongs)) {
                const updatedFavorites = favoriteSongs.filter(song => song.id.toString() !== songId);
                // Cập nhật UI (sẽ được xử lý bởi refreshFavorites)
            }

            // Làm mới danh sách yêu thích để đồng bộ với server
            refreshFavorites().catch(error => {
                console.error("Lỗi khi cập nhật danh sách yêu thích:", error);
            });
        };

        // Đăng ký lắng nghe sự kiện
        document.addEventListener('favoriteChanged', handleFavoriteChange as EventListener);

        // Hủy đăng ký khi component unmount
        return () => {
            document.removeEventListener('favoriteChanged', handleFavoriteChange as EventListener);
        };
    }, [isAuthenticated, refreshFavorites, favoriteSongs]);

    const handlePlayAll = () => {
        if (Array.isArray(favoriteSongs) && favoriteSongs.length > 0) {
            play(favoriteSongs[0], favoriteSongs)
        }
    }

    const handlePlayShuffle = () => {
        if (Array.isArray(favoriteSongs) && favoriteSongs.length > 0) {
            // Sắp xếp ngẫu nhiên danh sách
            const shuffled = [...favoriteSongs].sort(() => Math.random() - 0.5)
            play(shuffled[0], shuffled)
        }
    }

    const handlePlaySong = (song: any, index: number) => {
        // Nếu bài hát đã đang phát, chuyển sang trạng thái tạm dừng
        if (currentSong?.id === song.id && isPlaying) {
            togglePlay()
            return
        }

        // Kiểm tra nếu favoriteSongs là mảng
        if (!Array.isArray(favoriteSongs)) {
            console.error('favoriteSongs không phải là mảng:', favoriteSongs);
            // Phát bài hát đơn lẻ
            play(song, [song]);
            return;
        }

        // Tạo danh sách phát từ vị trí bài hát được chọn
        const playlist = favoriteSongs.slice(index)
        play(song, playlist)
    }

    const handleAddToQueue = (song: any) => {
        addToQueue(song)
        toast({
            title: "Đã thêm vào hàng đợi",
            description: `Bài hát "${song.title}" đã được thêm vào danh sách phát.`,
        })
    }

    const handleUnlikeSong = async (song: any) => {
        await toggleFavorite(song)
    }

    // Trạng thái loading
    if (loading || isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
            </div>
        )
    }

    // Nếu chưa đăng nhập, không hiển thị gì cả (sẽ được chuyển hướng bởi useEffect)
    if (!isAuthenticated) {
        return null
    }

    return (
        <div className="px-6 py-3">
            {/* Header */}
            <div className="flex items-center mb-6">
                <Button
                    variant="ghost"
                    size="icon"
                    className="mr-4"
                    onClick={() => router.back()}
                >
                    <ChevronLeft className="h-6 w-6" />
                </Button>
                <h1 className="text-2xl font-bold">Bài hát yêu thích</h1>
            </div>

            {/* Cover và thông tin */}
            <div className="flex flex-col md:flex-row gap-6 mb-8">
                <div className="relative w-48 h-48 bg-gradient-to-br from-pink-500 to-purple-700 rounded-lg shadow-lg flex items-center justify-center">
                    <Heart className="h-24 w-24 text-white" />
                </div>
                <div className="flex flex-col justify-end">
                    <p className="text-sm font-medium uppercase text-zinc-400 mb-2">Danh sách phát</p>
                    <h1 className="text-3xl font-bold mb-2">Bài hát yêu thích của bạn</h1>
                    <p className="text-zinc-400 mb-6">
                        {user?.name || user?.username} • {Array.isArray(favoriteSongs) ? favoriteSongs.length : 0} bài hát
                    </p>
                    <div className="flex gap-4">
                        <Button
                            className="flex items-center gap-2 rounded-full"
                            onClick={handlePlayAll}
                            disabled={favoriteSongs.length === 0}
                        >
                            <Play className="h-5 w-5" /> Phát
                        </Button>
                        <Button
                            variant="secondary"
                            className="flex items-center gap-2 rounded-full"
                            onClick={handlePlayShuffle}
                            disabled={favoriteSongs.length === 0}
                        >
                            <Shuffle className="h-5 w-5" /> Phát ngẫu nhiên
                        </Button>
                    </div>
                </div>
            </div>

            {/* Danh sách bài hát */}
            {favoriteSongs.length > 0 ? (
                <div className="bg-black/20 rounded-md">
                    {/* Header của danh sách */}
                    <div className="grid grid-cols-12 gap-4 px-4 py-2 border-b border-zinc-800 text-sm font-medium text-zinc-400">
                        <div className="col-span-1 text-center">#</div>
                        <div className="col-span-5">Bài hát</div>
                        <div className="col-span-3">Album</div>
                        <div className="col-span-2 text-right">
                            <Clock className="h-4 w-4 ml-auto" />
                        </div>
                        <div className="col-span-1"></div>
                    </div>

                    {/* Danh sách bài hát */}
                    {favoriteSongs.map((song, index) => (
                        <div
                            key={`${song.id}-${index}`}
                            className={`grid grid-cols-12 gap-4 px-4 py-2 hover:bg-white/5 group ${currentSong?.id === song.id ? "bg-white/10" : ""
                                }`}
                            onClick={() => handlePlaySong(song, index)}
                        >
                            <div className="col-span-1 flex items-center justify-center">
                                {currentSong?.id === song.id && isPlaying ? (
                                    <div className="w-4 h-4 relative flex justify-center items-center">
                                        <div className="w-1 h-4 bg-green-500 absolute animate-sound-wave-1"></div>
                                        <div className="w-1 h-3 bg-green-500 mx-[3px] absolute animate-sound-wave-2"></div>
                                        <div className="w-1 h-4 bg-green-500 absolute animate-sound-wave-3"></div>
                                    </div>
                                ) : (
                                    <span className="text-zinc-400 group-hover:hidden">{index + 1}</span>
                                )}
                                <Play className="h-4 w-4 hidden group-hover:block text-white" />
                            </div>

                            <div className="col-span-5 flex items-center gap-3 min-w-0">
                                <div className="relative h-10 w-10 shrink-0">
                                    <Image
                                        src={song.image_url || "/placeholder.jpg"}
                                        alt={song.title}
                                        fill
                                        className="object-cover rounded"
                                        unoptimized
                                    />
                                </div>
                                <div className="truncate">
                                    <p className={`font-medium truncate ${currentSong?.id === song.id ? "text-green-500" : ""
                                        }`}>
                                        {song.title}
                                    </p>
                                    <Link
                                        href={`/artist/${song.artist.id}`}
                                        className="text-sm text-zinc-400 hover:underline truncate block"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {song.artist.name}
                                    </Link>
                                </div>
                            </div>

                            <div className="col-span-3 flex items-center">
                                {song.album ? (
                                    <Link
                                        href={`/album/${song.album.id}`}
                                        className="text-sm text-zinc-400 hover:underline truncate"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {song.album.title}
                                    </Link>
                                ) : (
                                    <span className="text-sm text-zinc-500">Single</span>
                                )}
                            </div>

                            <div className="col-span-2 flex items-center justify-end text-zinc-400 text-sm">
                                {formatDuration(Number(song.duration))}
                            </div>

                            <div className="col-span-1 flex items-center justify-end">
                                <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleUnlikeSong(song);
                                        }}
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-zinc-400 hover:text-white"
                                    >
                                        <Heart className="h-4 w-4 fill-green-500 text-green-500" />
                                    </Button>
                                    <Button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleAddToQueue(song);
                                        }}
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-zinc-400 hover:text-white"
                                    >
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <Music className="h-16 w-16 text-zinc-600 mb-4" />
                    <h3 className="text-xl font-bold mb-2">Chưa có bài hát yêu thích</h3>
                    <p className="text-zinc-400 mb-6 max-w-md">
                        Nhấn vào biểu tượng trái tim khi nghe bài hát để thêm vào danh sách yêu thích
                    </p>
                    <Button onClick={() => router.push("/")}>
                        Khám phá âm nhạc
                    </Button>
                </div>
            )}
        </div>
    )
} 