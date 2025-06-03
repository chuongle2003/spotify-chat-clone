"use client"

import { useRef, useState, useEffect } from "react"
import { Play, Pause, SkipBack, SkipForward, Volume, VolumeX, Repeat, Shuffle, Heart, ListMusic, Maximize2, XCircle, Trash2, Download, Loader2 } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { usePlayer } from "./PlayerContext"
import { toast } from "@/components/ui/use-toast"
import postmanApi from "@/lib/api/postman"
import { SongType } from "@/components/music/SongCard"
import { useDownload } from "@/context/offline-context"
import { useFavorite } from "@/context/favorite-context"

export function PlayerBar() {
    const {
        currentSong,
        playlist,
        isPlaying,
        togglePlay,
        playNext,
        playPrevious,
        isShuffle,
        toggleShuffle,
        repeatMode,
        toggleRepeat,
        addToQueue,
        removeFromQueue,
        clearQueue,
        play
    } = usePlayer()

    const { directDownload, isDownloading } = useDownload()
    const [downloading, setDownloading] = useState(false)
    const [currentTime, setCurrentTime] = useState(0)
    const [duration, setDuration] = useState(0)
    const [volume, setVolume] = useState(0.7)
    const [isMuted, setIsMuted] = useState(false)
    const [showQueue, setShowQueue] = useState(false)

    const audioRef = useRef<HTMLAudioElement | null>(null)
    const { toggleFavorite, isFavorite } = useFavorite()

    // Cập nhật isLiked dựa trên isFavorite từ context
    const isLiked = currentSong ? isFavorite(currentSong.id) : false;

    // Khởi tạo audio element khi component được mount
    useEffect(() => {
        const audio = new Audio()

        // Thêm thuộc tính crossOrigin để xử lý CORS
        audio.crossOrigin = "anonymous"

        audioRef.current = audio
        audio.volume = volume

        return () => {
            audio.pause()
            audio.src = ""
        }
    }, [])

    // Cập nhật src khi currentSong thay đổi
    useEffect(() => {
        if (!audioRef.current || !currentSong) return

        const audio = audioRef.current

        // Lưu thời gian hiện tại nếu là cùng một bài hát (chỉ pause/resume)
        const currentSongUrl = currentSong.file_url || ""
        const isSameSong = audio.src === currentSongUrl
        const currentPosition = isSameSong ? audio.currentTime : 0

        // Sử dụng URL đầy đủ từ API
        const audioUrl = currentSongUrl

        // Reset các trạng thái lỗi trước đó
        audio.onerror = null

        // Thiết lập xử lý lỗi chi tiết
        audio.onerror = (e) => {
            const errorCode = audio.error ? audio.error.code : "unknown"
            const errorMessage = audio.error ? audio.error.message : "unknown error"
            console.error(`Lỗi phát nhạc (${errorCode}): ${errorMessage}`)
            console.error("Audio source:", audioUrl)
            console.error("Network state:", audio.networkState)
            console.error("Ready state:", audio.readyState)

            toast({
                title: "Lỗi phát nhạc",
                description: `Không thể phát bài hát (mã lỗi: ${errorCode}). Vui lòng thử bài khác.`,
                variant: "destructive",
            });
        }

        // Sử dụng các thuộc tính để cải thiện khả năng phát
        audio.preload = "auto"  // Tải trước nội dung

        // Chỉ đặt source nếu khác với source hiện tại
        if (!isSameSong) {
            // Thiết lập audio source
            audio.src = audioUrl;
        }

        // Phát nhạc nếu cần
        if (isPlaying) {
            // Khôi phục vị trí phát nếu là cùng một bài
            if (isSameSong && currentPosition > 0) {
                audio.currentTime = currentPosition;
            }

            const playPromise = audio.play()
            if (playPromise !== undefined) {
                playPromise
                    .then(() => {
                        // Ghi nhận lượt phát nếu playback thành công và không phải là resume
                        if (currentSong.id && !isSameSong) {
                            // Lấy token không cần thiết ở đây vì API sẽ dùng cookies hoặc token từ header
                            postmanApi.music.playSong(String(currentSong.id))
                                .then(result => console.log("Ghi nhận lượt phát:", result))
                                .catch(err => console.error("Lỗi ghi nhận lượt phát:", err));
                        }
                    })
                    .catch(err => {
                        console.error("Lỗi phát nhạc:", err)
                        // Thử lại với một số tùy chọn khác
                        setTimeout(() => {
                            audio.load() // Tải lại audio
                            audio.play().catch(err => console.error("Lỗi khi thử lại:", err))
                        }, 1000)
                    })
            }
        }

        // Thiết lập các event listeners
        const onTimeUpdate = () => setCurrentTime(audio.currentTime)
        const onLoadedMetadata = () => {
            setDuration(audio.duration)
            // Nếu là cùng bài hát và có vị trí phát trước đó, khôi phục vị trí đó
            if (isSameSong && currentPosition > 0) {
                audio.currentTime = currentPosition;
            }
        }
        const onEnded = () => {
            if (repeatMode === 2) {
                // Repeat one - phát lại bài hát hiện tại
                audio.currentTime = 0
                audio.play().catch(err => console.error("Lỗi phát lại:", err))
            } else {
                // Repeat all hoặc off - chuyển bài
                playNext()
            }
        }

        audio.addEventListener("timeupdate", onTimeUpdate)
        audio.addEventListener("loadedmetadata", onLoadedMetadata)
        audio.addEventListener("ended", onEnded)

        return () => {
            audio.removeEventListener("timeupdate", onTimeUpdate)
            audio.removeEventListener("loadedmetadata", onLoadedMetadata)
            audio.removeEventListener("ended", onEnded)
        }
    }, [currentSong, playNext, isPlaying, repeatMode])

    // Xử lý khi isPlaying thay đổi
    useEffect(() => {
        if (!audioRef.current) return

        if (isPlaying) {
            // Không cần thiết lập lại thời gian khi resume
            audioRef.current.play().catch(err => console.error("Lỗi phát nhạc:", err))
        } else {
            audioRef.current.pause()
            // Quan trọng: không đặt lại currentTime khi pause
        }
    }, [isPlaying])

    // Xử lý khi volume thay đổi
    useEffect(() => {
        if (!audioRef.current) return

        audioRef.current.volume = isMuted ? 0 : volume
    }, [volume, isMuted])

    const handleSeek = (newTime: number[]) => {
        if (!audioRef.current) return

        audioRef.current.currentTime = newTime[0]
        setCurrentTime(newTime[0])
    }

    const handleVolumeChange = (newVolume: number[]) => {
        setVolume(newVolume[0])

        if (newVolume[0] > 0 && isMuted) {
            setIsMuted(false)
        }
    }

    const toggleMute = () => {
        setIsMuted(!isMuted)
    }

    const toggleQueuePanel = () => {
        setShowQueue(!showQueue)
    }

    const handleAddToQueue = async (songId: string | number) => {
        if (!songId) return;

        try {
            // Gọi API để lấy thông tin chi tiết về bài hát
            const response = await postmanApi.music.getSong(String(songId)) as { data?: SongType };
            if (response && response.data) {
                addToQueue(response.data);
                toast({
                    title: "Đã thêm vào hàng đợi",
                    description: `Đã thêm "${response.data.title}" vào danh sách phát.`,
                });
            }
        } catch (error) {
            console.error("Lỗi khi thêm bài hát vào hàng đợi:", error);
            toast({
                title: "Lỗi",
                description: "Không thể thêm bài hát vào hàng đợi.",
                variant: "destructive",
            });
        }
    }

    const handleRemoveFromQueue = (index: number) => {
        removeFromQueue(index);
    }

    const handleClearQueue = () => {
        clearQueue();
        toast({
            title: "Đã xóa danh sách phát",
            description: "Danh sách phát đã được xóa.",
        });
    }

    const handlePlaySong = (song: SongType, index: number) => {
        // Nếu bài hát đã đang phát, không làm gì
        if (currentSong?.id === song.id) return;

        // Cắt danh sách từ vị trí index để phát
        const remainingPlaylist = playlist.slice(index);
        play(song, remainingPlaylist);
    }

    const handleLike = async () => {
        if (!currentSong) return;

        try {
            // Sử dụng toggleFavorite từ favorite-context thay vì likeSong
            const success = await toggleFavorite(currentSong);

            if (success) {
                // Hiển thị thông báo
                toast({
                    title: isLiked ? "Đã xóa khỏi yêu thích" : "Đã thêm vào yêu thích",
                    description: `Bài hát "${currentSong.title}" đã được ${isLiked ? 'xóa khỏi' : 'thêm vào'} danh sách yêu thích.`,
                });
            }
        } catch (error) {
            console.error("Lỗi khi thao tác với yêu thích:", error);
            toast({
                title: "Lỗi",
                description: "Không thể thực hiện thao tác. Vui lòng thử lại sau.",
                variant: "destructive",
            });
        }
    }

    const handleDownload = async () => {
        if (!currentSong) return;

        try {
            setDownloading(true);

            // Lấy tên nghệ sĩ
            const artistName = typeof currentSong.artist === 'string'
                ? currentSong.artist
                : currentSong.artist?.name || '';

            // Gọi API tải xuống
            await directDownload(currentSong.id, currentSong.title, artistName);

        } catch (error) {
            console.error("Lỗi khi tải xuống bài hát:", error);
            toast({
                title: "Lỗi tải xuống",
                description: "Không thể tải xuống bài hát. Vui lòng thử lại sau.",
                variant: "destructive",
            });
        } finally {
            setDownloading(false);
        }
    }

    const formatTime = (time: number) => {
        if (isNaN(time)) return "0:00"
        const minutes = Math.floor(time / 60)
        const seconds = Math.floor(time % 60)
        return `${minutes}:${seconds.toString().padStart(2, "0")}`
    }

    // Kiểm tra trạng thái yêu thích khi bài hát thay đổi
    useEffect(() => {
        if (!currentSong) return;

        // Không cần gọi API để kiểm tra vì đã sử dụng isFavorite từ context
        // Đã được tính toán trong const isLiked = currentSong ? isFavorite(currentSong.id) : false;
    }, [currentSong, isFavorite]);

    // Hiển thị component rỗng nếu không có bài hát
    if (!currentSong) {
        return null;
    }

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 p-3 z-50">
            <div className="flex items-center justify-between max-w-screen-2xl mx-auto">
                {/* Thông tin bài hát */}
                <div className="flex items-center space-x-4 w-1/4">
                    <div className="relative h-14 w-14 shrink-0 rounded overflow-hidden">
                        <Image
                            src={currentSong.image_url || "/placeholder.jpg"}
                            alt={currentSong.title || "Album cover"}
                            fill
                            className="object-cover"
                            unoptimized
                        />
                    </div>
                    <div className="min-w-0">
                        <h4 className="font-medium truncate">{currentSong.title}</h4>
                        <p className="text-sm text-zinc-400 truncate">
                            {typeof currentSong.artist === 'string' ? currentSong.artist : currentSong.artist?.name}
                        </p>
                    </div>
                    <Button
                        onClick={handleLike}
                        variant="ghost"
                        size="icon"
                        className={`text-zinc-400 hover:text-white ${isLiked ? 'text-green-500' : ''}`}
                    >
                        <Heart size={20} className={isLiked ? 'fill-green-500' : ''} />
                    </Button>
                    <Button
                        onClick={handleDownload}
                        variant="ghost"
                        size="icon"
                        className="text-zinc-400 hover:text-white"
                        disabled={downloading}
                    >
                        {downloading ? (
                            <Loader2 size={20} className="animate-spin" />
                        ) : (
                            <Download size={20} />
                        )}
                    </Button>
                </div>

                {/* Điều khiển phát nhạc */}
                <div className="flex flex-col items-center w-2/4">
                    <div className="flex items-center justify-center space-x-4">
                        <Button
                            onClick={toggleShuffle}
                            variant="ghost"
                            size="icon"
                            className={`text-zinc-400 hover:text-white ${isShuffle ? 'text-green-500' : ''}`}
                        >
                            <Shuffle size={18} className={isShuffle ? 'fill-green-500' : ''} />
                        </Button>
                        <Button
                            onClick={playPrevious}
                            variant="ghost"
                            size="icon"
                            className="text-zinc-400 hover:text-white"
                        >
                            <SkipBack size={20} />
                        </Button>
                        <Button
                            onClick={togglePlay}
                            variant="default"
                            size="icon"
                            className="bg-white text-black hover:bg-white/90 h-10 w-10 rounded-full"
                        >
                            {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
                        </Button>
                        <Button
                            onClick={playNext}
                            variant="ghost"
                            size="icon"
                            className="text-zinc-400 hover:text-white"
                        >
                            <SkipForward size={20} />
                        </Button>
                        <Button
                            onClick={toggleRepeat}
                            variant="ghost"
                            size="icon"
                            className={`text-zinc-400 hover:text-white ${repeatMode > 0 ? 'text-green-500' : ''}`}
                        >
                            {repeatMode === 2 ? (
                                <div className="relative">
                                    <Repeat size={18} className="fill-green-500" />
                                    <div className="absolute -top-1 -right-1 text-[8px] bg-green-500 rounded-full w-3 h-3 flex items-center justify-center text-black font-bold">1</div>
                                </div>
                            ) : (
                                <Repeat size={18} className={repeatMode === 1 ? 'fill-green-500' : ''} />
                            )}
                        </Button>
                    </div>

                    <div className="flex items-center w-full max-w-md mt-2">
                        <span className="text-xs text-zinc-400 w-10 text-right mr-2">
                            {formatTime(currentTime)}
                        </span>
                        <Slider
                            value={[currentTime]}
                            max={duration || 100}
                            step={1}
                            onValueChange={handleSeek}
                            className="flex-1"
                        />
                        <span className="text-xs text-zinc-400 w-10 ml-2">
                            {formatTime(duration)}
                        </span>
                    </div>
                </div>

                {/* Điều khiển âm lượng và các tính năng khác */}
                <div className="flex items-center justify-end w-1/4">
                    <Button
                        onClick={toggleQueuePanel}
                        variant="ghost"
                        size="icon"
                        className={`text-zinc-400 hover:text-white mr-2 ${showQueue ? 'bg-zinc-700' : ''}`}
                    >
                        <ListMusic size={18} />
                    </Button>
                    <div className="flex items-center gap-2">
                        <Button
                            onClick={toggleMute}
                            variant="ghost"
                            size="icon"
                            className={`text-zinc-400 hover:text-white ${isMuted ? 'text-red-500' : ''}`}
                        >
                            {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume size={20} />}
                        </Button>
                        <Slider
                            value={[isMuted ? 0 : volume]}
                            max={1}
                            step={0.01}
                            onValueChange={handleVolumeChange}
                            className="w-24"
                        />
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-zinc-400 hover:text-white ml-2"
                    >
                        <Maximize2 size={18} />
                    </Button>
                </div>
            </div>

            {/* Panel danh sách phát */}
            {showQueue && (
                <div className="absolute bottom-full right-0 w-80 max-h-96 overflow-y-auto bg-zinc-900 border border-zinc-800 rounded-t-lg shadow-lg z-50">
                    <div className="p-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-lg">Danh sách phát</h3>
                            <div className="flex items-center space-x-2">
                                {playlist.length > 1 && (
                                    <Button
                                        onClick={handleClearQueue}
                                        variant="ghost"
                                        size="sm"
                                        className="text-xs hover:text-red-500"
                                    >
                                        <Trash2 size={16} className="mr-1" />
                                        Xóa tất cả
                                    </Button>
                                )}
                                <Button
                                    onClick={toggleQueuePanel}
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-zinc-400 hover:text-white"
                                >
                                    <XCircle size={18} />
                                </Button>
                            </div>
                        </div>

                        {playlist.length > 0 ? (
                            <div className="space-y-2">
                                {playlist.map((song, index) => (
                                    <div
                                        key={`${song.id}-${index}`}
                                        className={`flex items-center p-2 hover:bg-zinc-800 rounded-md ${currentSong?.id === song.id ? 'bg-zinc-800/50 text-green-500' : ''
                                            }`}
                                    >
                                        <div
                                            className="relative h-10 w-10 mr-3 shrink-0 cursor-pointer"
                                            onClick={() => handlePlaySong(song, index)}
                                        >
                                            <Image
                                                src={song.image_url || "/placeholder.jpg"}
                                                alt={song.title || "Song cover"}
                                                fill
                                                className="object-cover rounded"
                                                unoptimized
                                            />
                                            {currentSong?.id !== song.id && (
                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                                    <Play size={16} className="text-white" />
                                                </div>
                                            )}
                                            {currentSong?.id === song.id && isPlaying && (
                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                                    <div className="w-5 h-5 flex items-center justify-center">
                                                        <span className="sr-only">Đang phát</span>
                                                        <span className="w-1 h-1 bg-green-500 rounded-full animate-ping"></span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <div
                                            className="min-w-0 flex-1 cursor-pointer"
                                            onClick={() => handlePlaySong(song, index)}
                                        >
                                            <p className={`text-sm font-medium truncate ${currentSong?.id === song.id ? 'text-green-500' : ''}`}>
                                                {song.title}
                                            </p>
                                            <p className="text-xs text-zinc-400 truncate">
                                                {typeof song.artist === 'string' ? song.artist : song.artist?.name}
                                            </p>
                                        </div>
                                        {/* Chỉ hiển thị nút xóa nếu không phải bài đang phát */}
                                        {currentSong?.id !== song.id && (
                                            <Button
                                                onClick={() => handleRemoveFromQueue(index)}
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 text-zinc-400 hover:text-red-500"
                                            >
                                                <XCircle size={14} />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-6 text-zinc-500">
                                <ListMusic size={24} className="mx-auto mb-2 opacity-50" />
                                <p>Chưa có bài hát nào trong danh sách phát</p>
                            </div>
                        )}

                        <div className="mt-4 border-t border-zinc-800 pt-4">
                            <p className="text-xs text-zinc-500 mb-2">Thêm bài hát vào hàng đợi</p>
                            <div className="flex items-center">
                                <input
                                    type="text"
                                    placeholder="Nhập ID bài hát..."
                                    className="flex-1 bg-zinc-800 rounded-l-md border-r border-zinc-700 px-3 py-1 text-sm outline-none focus:ring-1 focus:ring-green-500"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            const input = e.currentTarget;
                                            handleAddToQueue(input.value);
                                            input.value = '';
                                        }
                                    }}
                                />
                                <Button
                                    onClick={(e) => {
                                        const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                                        handleAddToQueue(input.value);
                                        input.value = '';
                                    }}
                                    className="bg-green-600 hover:bg-green-700 text-white rounded-r-md px-3 py-1 text-sm"
                                >
                                    Thêm
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
} 