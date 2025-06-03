"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Play, Pause, Heart, PlusCircle, Download, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { usePlayer } from "@/components/player/PlayerContext"
import { useDownload } from "@/context/offline-context"

interface ArtistSongsProps {
    artistId: string
}

interface Song {
    id: string | number
    title: string
    artist: string
    album: string | null
    duration: number
    audio_file: string
    cover_image: string | null
}

interface PaginatedResponse {
    count: number
    next: string | null
    previous: string | null
    results: Song[]
}

export default function ArtistSongs({ artistId }: ArtistSongsProps) {
    const [songs, setSongs] = useState<Song[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [totalCount, setTotalCount] = useState(0)
    const [currentPage, setCurrentPage] = useState(1)
    const [limit] = useState(10)
    const [downloading, setDownloading] = useState<Record<string, boolean>>({})

    const { toast } = useToast()
    const { play, isPlaying, togglePlay, addToQueue, currentSong: playerCurrentSong, playlist: currentPlaylist } = usePlayer()
    const { directDownload, isDownloading } = useDownload()

    useEffect(() => {
        fetchSongs(currentPage)
    }, [artistId, currentPage])

    const fetchSongs = async (page: number) => {
        try {
            setLoading(true)
            const response = await fetch(`https://spotifybackend.shop/api/v1/music/artists/${artistId}/songs/?page=${page}&limit=${limit}`)

            if (!response.ok) {
                throw new Error(`Lỗi khi tải danh sách bài hát: ${response.status}`)
            }

            const data = await response.json()

            // Kiểm tra cấu trúc dữ liệu
            if (data && data.results && Array.isArray(data.results)) {
                setSongs(data.results)
                setTotalCount(data.count || 0)
            } else if (Array.isArray(data)) {
                // Trường hợp API trả về array trực tiếp
                setSongs(data)
                setTotalCount(data.length)
            } else {
                // Trường hợp dữ liệu không đúng định dạng
                console.error("Định dạng dữ liệu không đúng:", data)
                setSongs([])
                setTotalCount(0)
                throw new Error("Định dạng dữ liệu không đúng")
            }

            setError(null)
        } catch (error) {
            console.error("Lỗi khi tải danh sách bài hát:", error)
            setSongs([])
            setError("Không thể tải danh sách bài hát. Vui lòng thử lại sau.")
            toast({
                title: "Lỗi",
                description: "Không thể tải danh sách bài hát. Vui lòng thử lại sau.",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    // Hàm chuyển đổi ID sang chuỗi để so sánh
    const isSameId = (id1: any, id2: any): boolean => {
        return String(id1) === String(id2);
    }

    // Xử lý phát nhạc
    const handlePlaySong = async (song: Song) => {
        try {
            if (playerCurrentSong && isSameId(playerCurrentSong.id, song.id)) {
                // Toggle play/pause nếu đang phát bài hát đó
                togglePlay();
            } else {
                // Chuyển đổi sang định dạng SongType để sử dụng với PlayerContext
                const songToPlay = {
                    id: Number(song.id),
                    title: song.title,
                    duration: String(song.duration),
                    file_url: song.audio_file,
                    image_url: song.cover_image,
                    album: null,
                    artist: { id: 0, name: song.artist, avatar: null },
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                };

                // Phát bài hát sử dụng PlayerContext
                play(songToPlay);
            }
        } catch (error) {
            console.error("Lỗi phát nhạc:", error);
            toast({
                title: "Lỗi phát nhạc",
                description: "Không thể phát bài hát. Vui lòng thử lại sau.",
                variant: "destructive",
            });
        }
    }

    // Xử lý thêm vào danh sách phát
    const handleAddToQueue = (e: React.MouseEvent, song: Song) => {
        e.stopPropagation();

        // Kiểm tra nếu bài hát đang phát
        if (playerCurrentSong && isSameId(playerCurrentSong.id, song.id)) {
            toast({
                title: "Bài hát đang phát",
                description: `"${song.title}" đang được phát.`,
            });
            return;
        }

        // Kiểm tra nếu bài hát đã có trong hàng đợi
        if (currentPlaylist && currentPlaylist.some(item => isSameId(item.id, song.id) && !isSameId(item.id, playerCurrentSong?.id))) {
            toast({
                title: "Đã có trong hàng đợi",
                description: `"${song.title}" đã có trong danh sách phát.`,
            });
            return;
        }

        try {
            // Chuyển đổi sang định dạng SongType để sử dụng với PlayerContext
            const songToQueue = {
                id: Number(song.id),
                title: song.title,
                duration: String(song.duration),
                file_url: song.audio_file,
                image_url: song.cover_image,
                album: null,
                artist: { id: 0, name: song.artist, avatar: null },
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            // Thêm vào hàng đợi
            addToQueue(songToQueue);

            toast({
                title: "Đã thêm vào hàng đợi",
                description: `Đã thêm "${song.title}" vào danh sách phát.`,
            });
        } catch (error) {
            console.error("Lỗi khi thêm vào hàng đợi:", error);
            toast({
                title: "Lỗi",
                description: "Không thể thêm bài hát vào hàng đợi. Vui lòng thử lại sau.",
                variant: "destructive",
            });
        }
    }

    // Xử lý tải xuống bài hát
    const handleDownloadSong = async (e: React.MouseEvent, song: Song) => {
        e.stopPropagation();

        // Kiểm tra nếu đang tải xuống
        if (downloading[String(song.id)]) {
            toast({
                title: "Đang tải xuống",
                description: `Bài hát "${song.title}" đang được tải xuống.`,
            });
            return;
        }

        try {
            setDownloading(prev => ({ ...prev, [String(song.id)]: true }));

            // Gọi API tải xuống trực tiếp
            await directDownload(String(song.id), song.title, song.artist);

            toast({
                title: "Tải xuống thành công",
                description: `Bài hát "${song.title}" đã được tải xuống thiết bị của bạn.`,
            });
        } catch (error) {
            console.error("Lỗi khi tải bài hát:", error);
            toast({
                title: "Lỗi tải xuống",
                description: "Không thể tải bài hát. Vui lòng thử lại sau.",
                variant: "destructive",
            });
        } finally {
            setDownloading(prev => ({ ...prev, [String(song.id)]: false }));
        }
    };

    // Định dạng thời gian
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = Math.floor(seconds % 60)
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    // Tính toán số trang
    const totalPages = Math.ceil(totalCount / limit);

    // Xử lý chuyển trang
    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    if (loading && songs.length === 0) {
        return (
            <div className="flex justify-center items-center h-40">
                <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
                <span className="ml-2 text-zinc-400">Đang tải danh sách bài hát...</span>
            </div>
        )
    }

    if (error && songs.length === 0) {
        return (
            <div className="bg-red-900/20 border border-red-800 rounded-md p-4 text-center">
                <p className="text-red-200">{error}</p>
                <Button
                    variant="outline"
                    className="mt-2 text-red-200 border-red-800 hover:bg-red-800/20"
                    onClick={() => fetchSongs(currentPage)}
                >
                    Thử lại
                </Button>
            </div>
        )
    }

    return (
        <div className="mt-6">
            <h2 className="text-2xl font-bold mb-4">Bài hát nổi bật</h2>

            {songs.length === 0 ? (
                <p className="text-zinc-400 text-center py-8">Chưa có bài hát nào của nghệ sĩ này.</p>
            ) : (
                <>
                    <div className="bg-zinc-900/30 rounded-md">
                        <div className="grid grid-cols-[auto_1fr_auto_auto] gap-4 p-4 border-b border-white/5 text-sm text-zinc-400">
                            <div className="w-10 text-center">#</div>
                            <div>Tiêu đề</div>
                            <div className="w-32 text-right">Thời lượng</div>
                            <div className="w-20"></div>
                        </div>

                        {songs.map((song, index) => (
                            <div
                                key={`${song.id}-${index}`}
                                className="grid grid-cols-[auto_1fr_auto_auto] gap-4 p-4 hover:bg-white/5 items-center group cursor-pointer"
                                onClick={() => handlePlaySong(song)}
                            >
                                <div className="w-10 text-center text-zinc-400">
                                    <span className="group-hover:hidden">{(currentPage - 1) * limit + index + 1}</span>
                                    <button
                                        className="hidden group-hover:block"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handlePlaySong(song);
                                        }}
                                    >
                                        {playerCurrentSong && isSameId(playerCurrentSong.id, song.id) && isPlaying ? (
                                            <Pause className="h-4 w-4" />
                                        ) : (
                                            <Play className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>

                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="relative h-10 w-10 flex-shrink-0">
                                        <Image
                                            src={song.cover_image || "/placeholder.svg?height=40&width=40"}
                                            alt={song.title}
                                            fill
                                            className="object-cover rounded"
                                        />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="font-medium truncate">{song.title}</div>
                                        <div className="text-sm text-zinc-400 truncate">
                                            {song.album || ''}
                                        </div>
                                    </div>
                                </div>

                                <div className="w-32 text-zinc-400 text-right">
                                    {formatTime(song.duration)}
                                </div>

                                <div className="w-20 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={(e) => handleAddToQueue(e, song)}
                                        className="p-2 rounded-full hover:bg-white/10"
                                        title="Thêm vào hàng đợi"
                                    >
                                        <PlusCircle className="h-4 w-4" />
                                    </button>

                                    <button
                                        onClick={(e) => handleDownloadSong(e, song)}
                                        className="p-2 rounded-full hover:bg-white/10"
                                        title={downloading[String(song.id)] ? "Đang tải xuống" : "Tải xuống"}
                                    >
                                        {downloading[String(song.id)] ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Download className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Phân trang */}
                    {totalPages > 1 && (
                        <div className="flex justify-center items-center mt-6 gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                            >
                                Trước
                            </Button>

                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                                .filter(page => {
                                    // Hiển thị các trang gần trang hiện tại
                                    return page === 1 ||
                                        page === totalPages ||
                                        Math.abs(page - currentPage) <= 1;
                                })
                                .map((page, index, array) => {
                                    // Thêm dấu ... nếu có khoảng cách lớn giữa các trang
                                    if (index > 0 && array[index] - array[index - 1] > 1) {
                                        return (
                                            <div key={`ellipsis-${page}`} className="flex items-center">
                                                <span className="text-zinc-500 mx-1">...</span>
                                                <Button
                                                    variant={currentPage === page ? "default" : "outline"}
                                                    size="sm"
                                                    onClick={() => handlePageChange(page)}
                                                >
                                                    {page}
                                                </Button>
                                            </div>
                                        );
                                    }

                                    return (
                                        <Button
                                            key={page}
                                            variant={currentPage === page ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => handlePageChange(page)}
                                        >
                                            {page}
                                        </Button>
                                    );
                                })
                            }

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                            >
                                Sau
                            </Button>
                        </div>
                    )}
                </>
            )}
        </div>
    )
} 