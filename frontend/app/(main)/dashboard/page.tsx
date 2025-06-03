"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { ChevronRight, Play, Pause, Heart, PlusCircle, CheckCircle, MoreHorizontal, Download, Check, X, Loader2 } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { usePlayer } from "@/components/player/PlayerContext"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { ListMusic } from "lucide-react"
import postmanApi from "@/lib/api/postman"
import { PlayButton } from "@/components/music/PlayButton"
import { useDownload } from "@/context/offline-context"

// Định nghĩa interface cho Artist
interface Artist {
    id: string
    name: string
    bio?: string
    image?: string
    monthly_listeners?: number
    songs_count?: number
    play_count?: number
    type?: string
}

// Mở rộng interface Song để chấp nhận cả chuỗi và đối tượng Artist
interface ArtistObject {
    id: string;
    name: string;
}

type ArtistType = string | ArtistObject;

interface CustomSong {
    id: string;
    title: string;
    artist: ArtistType;
    album?: string;
    genre?: string;
    duration: number;
    lyrics?: string;
    audio_url?: string | null | undefined;
    audio_file?: string | null | undefined;
    cover_image?: string | null | undefined;
    play_count?: number;
    likes_count?: number;
}

// Interface phù hợp với API response cho playlist
interface CustomPlaylist {
    id: string | number;
    name: string;
    description?: string;
    is_public: boolean;
    cover_image: string | null;
    user?: {
        id: number | string;
        username: string;
        avatar: string | null;
    };
    songs_count: number;
    created_at: string;
    updated_at: string;
}

export default function DashboardPage() {
    const { user } = useAuth()
    const router = useRouter()
    const { toast } = useToast()
    const { play, isPlaying, togglePlay, addToQueue, currentSong: playerCurrentSong, playlist: currentPlaylist } = usePlayer()
    const { directDownload, isDownloading } = useDownload()
    const [trendingSongs, setTrendingSongs] = useState<CustomSong[]>([])
    const [recommendedSongs, setRecommendedSongs] = useState<CustomSong[]>([])
    const [playlists, setPlaylists] = useState<CustomPlaylist[]>([])
    const [artists, setArtists] = useState<Artist[]>([])
    const [loading, setLoading] = useState(true)
    const [recentPlays, setRecentPlays] = useState<any[]>([])
    const [topGenres, setTopGenres] = useState<any[]>([])
    const [downloading, setDownloading] = useState<Record<string, boolean>>({})

    // If user is not logged in, redirect to home page
    useEffect(() => {
        if (!user) {
            router.push("/")
        }
    }, [user, router])

    // Fetch data
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true)
                // Gọi các API đúng theo định nghĩa trong postman.ts
                let trendingData: CustomSong[] = [];
                let recommendedData: CustomSong[] = [];
                let playlistsData: CustomPlaylist[] = [];
                let artistsData: Artist[] = [];
                let personalData: any = { recent_plays: [], top_genres: [] };

                try {
                    const trendingResponse: any = await postmanApi.music.getTrendingSongs();
                    trendingData = trendingResponse.results || trendingResponse;
                    trendingData = trendingData.map((song: any) => ({
                        ...song,
                        audio_url: song.audio_file,
                        cover_image: song.cover_image
                    }));
                } catch (err) {
                    console.error("Error fetching trending songs:", err);
                }

                try {
                    const recommendedResponse: any = await postmanApi.music.getRecommendedSongs();
                    recommendedData = recommendedResponse.results || recommendedResponse;
                    recommendedData = recommendedData.map((song: any) => ({
                        ...song,
                        audio_url: song.audio_file,
                        cover_image: song.cover_image
                    }));
                } catch (err) {
                    console.error("Error fetching recommended songs:", err);
                }

                try {
                    const playlistsResponse: any = await postmanApi.music.getPlaylists();
                    if (Array.isArray(playlistsResponse)) {
                        playlistsData = playlistsResponse;
                    } else if (playlistsResponse.results && Array.isArray(playlistsResponse.results)) {
                        playlistsData = playlistsResponse.results;
                    } else if (playlistsResponse.data && Array.isArray(playlistsResponse.data)) {
                        playlistsData = playlistsResponse.data;
                    }
                } catch (err) {
                    console.error("Error fetching playlists:", err);
                }

                try {
                    // Gọi API lấy danh sách nghệ sĩ phổ biến thay vì gọi qua postmanApi
                    const response = await fetch('https://spotifybackend.shop/api/v1/music/artists/popular/');
                    if (!response.ok) throw new Error('Failed to fetch popular artists');
                    const popularArtists = await response.json();
                    setArtists(popularArtists);
                } catch (err) {
                    console.error("Error fetching artists:", err);
                }

                try {
                    const personalResponse: any = await postmanApi.music.getPersonalTrends();
                    personalData = personalResponse;
                } catch (err) {
                    console.error("Error fetching personal data:", err);
                }

                setTrendingSongs(trendingData)
                setRecommendedSongs(recommendedData)
                setPlaylists(playlistsData)
                setRecentPlays(personalData.recent_plays || [])
                setTopGenres(personalData.top_genres || [])
            } catch (error) {
                console.error("Error fetching dashboard data:", error)
            } finally {
                setLoading(false)
            }
        }

        if (user) {
            fetchData()
        }
    }, [user])

    // Hàm chuyển đổi ID sang chuỗi để so sánh
    const isSameId = (id1: any, id2: any): boolean => {
        return String(id1) === String(id2);
    }

    // Xử lý thêm vào danh sách phát
    const handleAddToQueue = (e: React.MouseEvent, song: any) => {
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
            // Lấy URL audio từ audio_file hoặc audio_url
            const audioSource = song.audio_file || song.audio_url || '';

            // Chuyển đổi sang định dạng SongType để sử dụng với PlayerContext
            const songToQueue = {
                id: Number(song.id),
                title: song.title,
                duration: String(song.duration),
                file_url: audioSource,
                image_url: song.cover_image || null,
                album: null,
                artist: typeof song.artist === 'string'
                    ? { id: 0, name: song.artist, avatar: null }
                    : { id: Number(song.artist.id), name: song.artist.name, avatar: null },
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

    // Xử lý phát nhạc từ recent plays
    const playRecentSong = async (songData: any) => {
        try {
            // Lấy URL audio từ audio_file hoặc audio_url
            const audioSource = songData.audio_file || songData.audio_url || '';

            // Tạo đối tượng SongType từ dữ liệu API
            const songToPlay = {
                id: Number(songData.id),
                title: songData.title,
                duration: String(songData.duration),
                file_url: audioSource,
                image_url: songData.cover_image || null,
                album: null,
                artist: typeof songData.artist === 'string'
                    ? { id: 0, name: songData.artist, avatar: null }
                    : { id: Number(songData.artist.id), name: songData.artist.name, avatar: null },
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            // Sử dụng PlayerContext để phát nhạc
            play(songToPlay);

        } catch (error) {
            console.error("Error playing recent song:", error);
            toast({
                title: "Lỗi phát nhạc",
                description: "Không thể phát bài hát từ lịch sử. Vui lòng thử lại sau.",
                variant: "destructive",
            });
        }
    };

    // Định dạng thời gian
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = Math.floor(seconds % 60)
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    // Xử lý thích bài hát
    const handleLikeSong = async (song: CustomSong) => {
        try {
            await postmanApi.music.likeSong(song.id)
            toast({
                title: "Đã thích",
                description: `Đã thêm "${song.title}" vào danh sách yêu thích`,
            })
        } catch (error) {
            console.error("Error liking song:", error)
            toast({
                title: "Lỗi",
                description: "Không thể thích bài hát. Vui lòng thử lại sau.",
                variant: "destructive",
            })
        }
    }

    // Xử lý phát nhạc
    const handlePlaySong = async (song: CustomSong) => {
        try {
            // Kiểm tra song.audio_url, nếu không có thì dùng song.audio_file
            const audioSource = song.audio_url || song.audio_file;

            if (playerCurrentSong && isSameId(playerCurrentSong.id, song.id)) {
                // Toggle play/pause nếu đang phát bài hát đó
                if (isPlaying) {
                    togglePlay();
                } else {
                    togglePlay();
                }
            } else {
                // Ghi nhận lượt phát
                await postmanApi.music.playSong(String(song.id));

                // Chuyển đổi sang định dạng SongType để sử dụng với PlayerContext
                const songToPlay = {
                    id: Number(song.id),
                    title: song.title,
                    duration: String(song.duration),
                    file_url: audioSource || '',
                    image_url: song.cover_image || null,
                    album: null,
                    artist: typeof song.artist === 'string'
                        ? { id: 0, name: song.artist, avatar: null }
                        : { id: Number(song.artist.id), name: song.artist.name, avatar: null },
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                };

                // Phát bài hát sử dụng PlayerContext
                play(songToPlay);
            }
        } catch (error) {
            console.error("Error playing song:", error);
            toast({
                title: "Lỗi phát nhạc",
                description: "Không thể phát bài hát. Vui lòng thử lại sau.",
                variant: "destructive",
            });
        }
    }

    // Hàm xử lý tải xuống bài hát
    const handleDownloadSong = async (e: React.MouseEvent, song: CustomSong) => {
        e.stopPropagation();

        // Kiểm tra đăng nhập
        if (!user) {
            toast({
                title: "Yêu cầu đăng nhập",
                description: "Vui lòng đăng nhập để tải bài hát xuống.",
            });
            return;
        }

        // Kiểm tra token
        const token = localStorage.getItem("spotify_token");
        if (!token || !token.startsWith("ey")) {
            toast({
                title: "Phiên đăng nhập hết hạn",
                description: "Vui lòng đăng nhập lại để tải bài hát.",
                variant: "destructive",
            });
            return;
        }

        // Kiểm tra nếu đang tải xuống
        if (downloading[song.id]) {
            toast({
                title: "Đang tải xuống",
                description: `Bài hát "${song.title}" đang được tải xuống.`,
            });
            return;
        }

        try {
            console.log(`Bắt đầu tải xuống bài hát: ${song.title} (ID: ${song.id})`);
            setDownloading(prev => ({ ...prev, [song.id]: true }));

            // Lấy tên nghệ sĩ
            const artistName = typeof song.artist === 'string'
                ? song.artist
                : song.artist.name;

            // Gọi API tải xuống trực tiếp
            await directDownload(song.id, song.title, artistName);

            toast({
                title: "Tải xuống thành công",
                description: `Bài hát "${song.title}" đã được tải xuống thiết bị của bạn.`,
            });
        } catch (error) {
            console.error("Lỗi khi tải bài hát:", error);
            let errorMessage = "Không thể tải bài hát. Vui lòng thử lại sau.";

            // Kiểm tra lỗi cụ thể và hiển thị thông báo phù hợp
            if (error instanceof Error) {
                if (error.message.includes("Unauthorized") || error.message.includes("token")) {
                    errorMessage = "Lỗi xác thực. Vui lòng đăng nhập lại.";
                } else if (error.message.includes("network") || error.message.includes("fetch")) {
                    errorMessage = "Lỗi kết nối mạng. Vui lòng kiểm tra kết nối internet.";
                }
            }

            toast({
                title: "Lỗi tải xuống",
                description: errorMessage,
                variant: "destructive",
            });
        } finally {
            setDownloading(prev => ({ ...prev, [song.id]: false }));
        }
    };

    // Hàm xử lý xóa bài hát đã tải xuống
    const handleDeleteDownload = async (e: React.MouseEvent, song: CustomSong) => {
        e.stopPropagation();

        try {
            // Hiển thị thông báo chức năng chưa được hỗ trợ
            toast({
                title: "Tính năng đang phát triển",
                description: "Chức năng xóa bài hát đã tải xuống sẽ được cập nhật trong phiên bản tiếp theo.",
            });
        } catch (error) {
            console.error("Lỗi khi xóa bài hát tải xuống:", error);
            toast({
                title: "Lỗi",
                description: "Không thể xóa bài hát. Vui lòng thử lại sau.",
                variant: "destructive",
            });
        }
    };

    if (!user) {
        return null // Don't render anything while checking authentication
    }

    return (
        <div>
            {/* Lịch sử phát gần đây */}
            {recentPlays.length > 0 && (
                <section className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-bold">Phát gần đây</h2>
                        <Button variant="link" className="text-white/70 hover:text-white">
                            Xem lịch sử
                        </Button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {recentPlays.slice(0, 4).map((item, index) => (
                            <div
                                key={item.id}
                                className="bg-zinc-800/50 p-4 rounded-lg hover:bg-zinc-800/80 transition cursor-pointer group"
                                onClick={() => playRecentSong(item.song)}
                            >
                                <div className="relative">
                                    <Image
                                        src={item.song.cover_image || `/placeholder.svg?height=160&width=160&text=${index + 1}`}
                                        width={160}
                                        height={160}
                                        alt={item.song.title}
                                        className="rounded mb-4 w-full"
                                    />
                                    <div className="absolute bottom-6 left-4 bg-blue-500 text-black px-2 py-1 text-xs font-medium rounded">
                                        Gần đây
                                    </div>
                                    <Button
                                        size="icon"
                                        className="absolute bottom-20 right-4 rounded-full bg-green-500 text-black opacity-0 group-hover:opacity-100 transition shadow-lg"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            playRecentSong(item.song)
                                        }}
                                    >
                                        <Play className="h-5 w-5 ml-0.5" />
                                    </Button>
                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 rounded-full bg-black/60 hover:bg-black/80 text-white"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent className="w-56 bg-zinc-900 border-zinc-800 text-white">
                                                <DropdownMenuItem
                                                    className="cursor-pointer hover:bg-zinc-800"
                                                    onClick={(e) => handleAddToQueue(e, item.song)}
                                                >
                                                    {playerCurrentSong && isSameId(playerCurrentSong.id, item.song.id) ? (
                                                        <>
                                                            <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                                                            <span>Đang phát</span>
                                                        </>
                                                    ) : currentPlaylist && currentPlaylist.some(pItem => isSameId(pItem.id, item.song.id) && !isSameId(pItem.id, playerCurrentSong?.id)) ? (
                                                        <>
                                                            <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                                                            <span>Đã có trong hàng đợi</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <PlusCircle className="mr-2 h-4 w-4" />
                                                            <span>Thêm vào hàng đợi</span>
                                                        </>
                                                    )}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="cursor-pointer hover:bg-zinc-800"
                                                    onClick={(e) => handleDownloadSong(e, item.song)}
                                                >
                                                    {downloading[item.song.id] ? (
                                                        <>
                                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                            <span>Đang tải xuống...</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Download className="mr-2 h-4 w-4" />
                                                            <span>Tải xuống</span>
                                                        </>
                                                    )}
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator className="bg-zinc-800" />
                                                <DropdownMenuItem
                                                    className="cursor-pointer hover:bg-zinc-800"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toast({
                                                            title: "Tính năng đang phát triển",
                                                            description: "Chức năng thêm vào playlist sẽ được cập nhật trong phiên bản tiếp theo.",
                                                        });
                                                    }}
                                                >
                                                    <ListMusic className="mr-2 h-4 w-4" />
                                                    <span>Thêm vào playlist</span>
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                                <div className="text-sm font-medium line-clamp-1">{item.song.title}</div>
                                <div className="text-xs text-white/70 line-clamp-1 mt-1">
                                    {item.song.artist}
                                </div>
                                <div className="text-xs text-white/50 mt-1">
                                    {new Date(item.played_at).toLocaleDateString('vi-VN')}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Playlists nổi bật */}
            {playlists.length > 0 && (
                <section className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-bold">Playlist nổi bật</h2>
                        <Link href="/playlists" className="text-sm text-zinc-400 hover:text-white flex items-center">
                            Hiển thị tất cả
                            <ChevronRight className="h-4 w-4 ml-1" />
                        </Link>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {playlists.slice(0, 5).map((playlist) => (
                            <Link
                                href={`/playlist/${playlist.id}`}
                                key={playlist.id}
                                className="bg-zinc-800/30 p-4 rounded-lg hover:bg-zinc-800/50 transition group"
                            >
                                <div className="relative">
                                    <Image
                                        src={playlist.cover_image || `/playlist-placeholder.svg?height=160&width=160`}
                                        alt={playlist.name}
                                        width={200}
                                        height={200}
                                        className="w-full aspect-square object-cover rounded mb-3"
                                    />
                                    <Button
                                        size="icon"
                                        className="absolute bottom-4 right-4 rounded-full bg-green-500 text-black opacity-0 group-hover:opacity-100 transition shadow-lg"
                                    >
                                        <Play className="h-5 w-5 ml-0.5" />
                                    </Button>
                                </div>
                                <h3 className="font-semibold truncate">{playlist.name}</h3>
                                <p className="text-sm text-zinc-400 mt-1">
                                    {playlist.songs_count} bài hát • {playlist.user?.username || "Unknown"}
                                </p>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {/* Bài hát đề xuất */}
            {recommendedSongs.length > 0 && (
                <section className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-bold">Đề xuất cho bạn</h2>
                        <Link href="/recommended" className="text-sm text-zinc-400 hover:text-white flex items-center">
                            Hiển thị tất cả
                            <ChevronRight className="h-4 w-4 ml-1" />
                        </Link>
                    </div>
                    <div className="bg-zinc-900/30 rounded-md">
                        <div className="grid grid-cols-[auto_1fr_auto_auto] gap-4 p-4 border-b border-white/5 text-sm text-zinc-400">
                            <div className="w-10 text-center">#</div>
                            <div>Tiêu đề</div>
                            <div className="w-32 text-right">Thời lượng</div>
                            <div className="w-20"></div>
                        </div>

                        {recommendedSongs.slice(0, 5).map((song, index) => (
                            <div
                                key={`${song.id}-${index}`}
                                className="grid grid-cols-[auto_1fr_auto_auto] gap-4 p-4 hover:bg-white/5 items-center group"
                            >
                                <div className="w-10 text-center text-zinc-400">
                                    <span className="group-hover:hidden">{index + 1}</span>
                                    <button
                                        className="hidden group-hover:block"
                                        onClick={() => handlePlaySong(song)}
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
                                            {typeof song.artist === 'string' ? song.artist : (song.artist as ArtistObject)?.name || 'Unknown Artist'}
                                        </div>
                                    </div>
                                </div>

                                <div className="w-32 text-zinc-400 text-right">
                                    {formatTime(song.duration)}
                                </div>

                                <div className="w-20 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleLikeSong(song);
                                        }}
                                        className="p-2 rounded-full hover:bg-white/10"
                                        title="Thích"
                                    >
                                        <Heart className="h-4 w-4" />
                                    </button>

                                    <button
                                        onClick={(e) => handleDownloadSong(e, song)}
                                        className="p-2 rounded-full hover:bg-white/10"
                                        title={downloading[song.id] ? "Đang tải xuống" : "Tải xuống"}
                                    >
                                        {downloading[song.id] ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Download className="h-4 w-4" />
                                        )}
                                    </button>

                                    <button
                                        onClick={(e) => handleAddToQueue(e, song)}
                                        className="p-2 rounded-full hover:bg-white/10"
                                        title="Thêm vào hàng đợi"
                                    >
                                        <PlusCircle className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Nghệ sĩ nổi bật */}
            {artists.length > 0 && (
                <section className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-bold">Nghệ sĩ phổ biến</h2>
                        <Link href="/artists" className="text-sm text-zinc-400 hover:text-white flex items-center">
                            Hiển thị tất cả
                            <ChevronRight className="h-4 w-4 ml-1" />
                        </Link>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                        {artists.slice(0, 6).map((artist) => (
                            <Link
                                href={`/artist/${artist.id}`}
                                key={artist.id}
                                className="bg-zinc-800/30 p-4 rounded-lg hover:bg-zinc-800/50 transition text-center group"
                            >
                                <div className="relative mx-auto w-36 h-36 mb-4">
                                    <Image
                                        src={artist.image || `/artist-placeholder.svg?height=150&width=150`}
                                        alt={artist.name}
                                        fill
                                        className="rounded-full object-cover"
                                    />
                                    <Button
                                        size="icon"
                                        className="absolute bottom-0 right-0 rounded-full bg-green-500 text-black opacity-0 group-hover:opacity-100 transition shadow-lg"
                                    >
                                        <Play className="h-5 w-5 ml-0.5" />
                                    </Button>
                                </div>
                                <h3 className="font-semibold truncate">{artist.name}</h3>
                                <p className="text-sm text-zinc-400 mt-1 line-clamp-2">
                                    {artist.bio ? artist.bio.substring(0, 100) + '...' : 'Nghệ sĩ'}
                                </p>
                                <p className="text-sm text-zinc-400 mt-1">
                                    {artist.play_count ? `${artist.play_count.toLocaleString()} lượt nghe` : (artist.songs_count ? `${artist.songs_count} bài hát` : 'Nghệ sĩ')}
                                </p>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {/* Thể loại yêu thích */}
            {topGenres.length > 0 && (
                <section className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-bold">Thể loại bạn yêu thích</h2>
                        <Link href="/genres" className="text-sm text-zinc-400 hover:text-white flex items-center">
                            Tất cả thể loại
                            <ChevronRight className="h-4 w-4 ml-1" />
                        </Link>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {topGenres.slice(0, 4).map((genre, index) => (
                            <Link
                                href={`/genre/${encodeURIComponent(genre.name)}`}
                                key={index}
                                className="relative h-40 rounded-lg overflow-hidden group"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-600"
                                    style={{ backgroundColor: genre.color || '#4f46e5' }}></div>
                                <div className="absolute inset-0 bg-black/20"></div>
                                <div className="absolute bottom-4 left-4 right-4">
                                    <h3 className="text-xl font-bold">{genre.name}</h3>
                                    <p className="text-sm text-white/80">
                                        {genre.song_count || 0} bài hát
                                    </p>
                                </div>
                                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button size="icon" className="rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20">
                                        <Play className="h-5 w-5" />
                                    </Button>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            )}
        </div>
    )
}
