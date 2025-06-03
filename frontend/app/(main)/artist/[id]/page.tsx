"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Play, Shuffle, Clock, Heart, MoreHorizontal, User, Loader2, Share2, Pause, PlusCircle, Download } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { usePlayer } from "@/components/player/PlayerContext"
import { SongCard } from "@/components/music/SongCard"
import { AlbumCard } from "@/components/music/AlbumCard"
import postmanApi from "@/lib/api/postman"
import { api } from "@/lib/api"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useDownload } from "@/context/offline-context"

interface Artist {
    id: string | number;
    name: string;
    image: string;
    bio?: string;
    monthly_listeners?: number;
    followers?: number;
    songs_count: number;
    play_count?: number;
}

interface Song {
    id: string;
    title: string;
    artist: any;
    album?: string;
    duration: number;
    audio_url?: string;
    audio_file?: string;
    cover_image?: string;
    play_count?: number;
    likes_count?: number;
}

interface Album {
    id: string | number;
    title: string;
    artist: any;
    cover_image: string;
    release_date: string;
    songs_count: number;
}

interface ArtistPageProps {
    params: {
        id: string
    }
}

interface SongItem {
    id: string | number
    title: string
    artist: string
    album: string | null
    duration: number
    audio_file: string
    cover_image: string | null
}

interface PaginatedSongResponse {
    count: number
    next: string | null
    previous: string | null
    results: SongItem[]
}

export default function ArtistPage({ params }: ArtistPageProps) {
    const { id } = params
    const router = useRouter()
    const { user } = useAuth()
    const { toast } = useToast()
    const { play, isPlaying, togglePlay, addToQueue, currentSong: playerCurrentSong, playlist: currentPlaylist } = usePlayer()
    const { directDownload, isDownloading } = useDownload()

    const [artist, setArtist] = useState<Artist | null>(null)
    const [popularSongs, setPopularSongs] = useState<Song[]>([])
    const [albums, setAlbums] = useState<Album[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!user) {
            router.push("/")
            return
        }

        async function fetchArtistDetails() {
            try {
                setLoading(true)
                setError(null)

                // Lấy thông tin chi tiết nghệ sĩ
                let artistResponse;
                try {
                    artistResponse = await postmanApi.music.getArtist(id);
                    if (!artistResponse || typeof artistResponse !== 'object') {
                        console.error("Không thể lấy thông tin nghệ sĩ", artistResponse);
                        throw new Error("Không thể lấy thông tin nghệ sĩ");
                    }
                } catch (err) {
                    console.error("Lỗi khi gọi API nghệ sĩ:", err);

                    // Thử gọi API trực tiếp nếu postmanApi không thành công
                    try {
                        const response = await fetch(`https://spotifybackend.shop/api/v1/music/artists/${id}/`);
                        if (!response.ok) {
                            throw new Error(`API lỗi: ${response.status}`);
                        }
                        artistResponse = await response.json();
                    } catch (directErr) {
                        console.error("Lỗi khi gọi API trực tiếp:", directErr);
                        throw new Error("Không thể lấy thông tin nghệ sĩ");
                    }
                }

                // Lấy bài hát phổ biến của nghệ sĩ (sẽ được thêm vào API sau)
                let songsData: Song[] = []
                let albumsData: Album[] = []

                try {
                    // Gọi API để lấy bài hát của nghệ sĩ
                    const response = await fetch(`https://spotifybackend.shop/api/v1/music/artists/${id}/songs/`);
                    if (!response.ok) throw new Error(`API lỗi: ${response.status}`);

                    const songsResponse = await response.json();
                    if (songsResponse && Array.isArray(songsResponse.data)) {
                        songsData = songsResponse.data;
                    } else if (songsResponse && Array.isArray(songsResponse)) {
                        songsData = songsResponse;
                    } else {
                        console.warn("Định dạng phản hồi bài hát không hợp lệ:", songsResponse);
                    }
                } catch (err) {
                    console.error("Lỗi khi tải bài hát:", err);
                    // Tiếp tục với mảng rỗng
                }

                try {
                    // Gọi API để lấy album của nghệ sĩ
                    const response = await fetch(`https://spotifybackend.shop/api/v1/music/artists/${id}/albums/`);
                    if (!response.ok) throw new Error(`API lỗi: ${response.status}`);

                    const albumsResponse = await response.json();
                    if (albumsResponse && Array.isArray(albumsResponse.data)) {
                        albumsData = albumsResponse.data;
                    } else if (albumsResponse && Array.isArray(albumsResponse)) {
                        albumsData = albumsResponse;
                    } else {
                        console.warn("Định dạng phản hồi album không hợp lệ:", albumsResponse);
                    }
                } catch (err) {
                    console.error("Lỗi khi tải album:", err);
                    // Tiếp tục với mảng rỗng
                }

                setArtist(artistResponse)
                setPopularSongs(songsData)
                setAlbums(albumsData)
                setLoading(false)
            } catch (error) {
                console.error("Lỗi khi lấy thông tin nghệ sĩ:", error)
                setError("Không thể tải thông tin nghệ sĩ. Vui lòng thử lại sau.")
                toast({
                    title: "Lỗi",
                    description: "Không thể tải thông tin nghệ sĩ. Vui lòng thử lại sau.",
                    variant: "destructive",
                })
            }
        }

        fetchArtistDetails()
    }, [id, user, router, toast])

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = Math.floor(seconds % 60)
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    const formatNumber = (num: number) => {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + ' triệu'
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + ' nghìn'
        }
        return num.toString()
    }

    // Các hàm xử lý phát nhạc
    function handlePlayAll() {
        if (!popularSongs || popularSongs.length === 0) {
            toast({
                title: "Không tìm thấy bài hát",
                description: "Không có bài hát nào của nghệ sĩ này để phát",
                variant: "destructive",
            })
            return;
        }

        const song = popularSongs[0];
        const songToPlay = {
            id: Number(song.id),
            title: song.title,
            duration: String(song.duration),
            file_url: song.audio_url || song.audio_file || '',
            image_url: song.cover_image || null,
            album: null,
            artist: {
                id: Number(artist?.id || 0),
                name: artist?.name || 'Unknown',
                avatar: null
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        play(songToPlay);

        toast({
            title: "Đang phát",
            description: `Bài hát phổ biến của ${artist?.name}`,
        });
    }

    function handlePlaySong(song: Song) {
        if (!popularSongs || popularSongs.length === 0) {
            toast({
                title: "Không tìm thấy bài hát",
                description: "Không thể phát bài hát này",
                variant: "destructive",
            })
            return;
        }

        const songToPlay = {
            id: Number(song.id),
            title: song.title,
            duration: String(song.duration),
            file_url: song.audio_url || song.audio_file || '',
            image_url: song.cover_image || null,
            album: null,
            artist: {
                id: Number(artist?.id || 0),
                name: artist?.name || 'Unknown',
                avatar: null
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        play(songToPlay);
    }

    function handleShufflePlay() {
        if (!popularSongs || popularSongs.length === 0) {
            toast({
                title: "Không tìm thấy bài hát",
                description: "Không có bài hát nào của nghệ sĩ này để phát",
                variant: "destructive",
            })
            return;
        }

        // Tạo danh sách đã xáo trộn
        const shuffledSongs = [...popularSongs].sort(() => Math.random() - 0.5);
        const song = shuffledSongs[0];

        const songToPlay = {
            id: Number(song.id),
            title: song.title,
            duration: String(song.duration),
            file_url: song.audio_url || song.audio_file || '',
            image_url: song.cover_image || null,
            album: null,
            artist: {
                id: Number(artist?.id || 0),
                name: artist?.name || 'Unknown',
                avatar: null
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        play(songToPlay);

        toast({
            title: "Đang phát ngẫu nhiên",
            description: `Bài hát của ${artist?.name}`,
        });
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-green-500" />
                <span className="ml-2 text-lg">Đang tải thông tin nghệ sĩ...</span>
            </div>
        )
    }

    if (error || !artist) {
        return (
            <div className="bg-red-900/20 border border-red-800 rounded-md p-8 text-center mt-8">
                <p className="text-red-200 text-lg">{error || "Không tìm thấy nghệ sĩ này"}</p>
                <Link href="/artists">
                    <Button variant="outline" className="mt-4 text-white border-red-800 hover:bg-red-800/20">
                        Quay lại danh sách nghệ sĩ
                    </Button>
                </Link>
            </div>
        )
    }

    // Format release date
    const formatReleaseDate = (dateString: string) => {
        const date = new Date(dateString)
        return new Intl.DateTimeFormat('vi-VN', { year: 'numeric', month: 'long', day: 'numeric' }).format(date)
    }

    return (
        <div>
            {/* Artist Header */}
            <div className="relative">
                {/* Background gradient for artist header */}
                <div className="absolute top-0 left-0 w-full h-80 bg-gradient-to-b from-blue-900/30 to-zinc-900 -z-10"></div>

                <div className="pt-10 pb-8 flex flex-col md:flex-row items-center md:items-end gap-8">
                    {/* Artist Image */}
                    <div className="w-52 h-52 relative shadow-xl">
                        <Image
                            src={artist.image || "/artist-placeholder.svg"}
                            alt={artist.name}
                            fill
                            className="object-cover"
                        />
                    </div>

                    {/* Artist Info */}
                    <div className="flex-1 text-center md:text-left">
                        <h1 className="text-4xl md:text-6xl font-bold mb-4">{artist.name}</h1>
                        <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                            <div className="text-white/70 text-sm">
                                {artist.songs_count} bài hát
                            </div>
                            {artist.play_count && (
                                <div className="text-white/70 text-sm">
                                    • {artist.play_count.toLocaleString()} lượt nghe
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                        <Button
                            size="lg"
                            className="bg-green-500 hover:bg-green-600 text-black"
                            onClick={handlePlayAll}
                        >
                            <Play className="mr-2 h-5 w-5" />
                            Phát
                        </Button>
                        <Button variant="outline" size="icon" className="rounded-full">
                            <Share2 className="h-5 w-5" />
                        </Button>
                    </div>
                </div>

                {/* Artist Bio */}
                {artist.bio && (
                    <div className="my-6 max-w-3xl">
                        <h3 className="text-xl font-semibold mb-2">Giới thiệu</h3>
                        <p className="text-white/80 leading-relaxed">{artist.bio}</p>
                    </div>
                )}
            </div>

            {/* Tabs Content */}
            <Tabs defaultValue="songs" className="mt-6">
                <TabsList className="mb-6">
                    <TabsTrigger value="songs">Bài hát</TabsTrigger>
                    <TabsTrigger value="albums">Album</TabsTrigger>
                    <TabsTrigger value="about">Thông tin</TabsTrigger>
                </TabsList>

                <TabsContent value="songs">
                    {/* Use ArtistSongs component with pagination */}
                    <ArtistSongs artistId={id} />
                </TabsContent>

                <TabsContent value="albums">
                    {albums.length === 0 ? (
                        <p className="text-zinc-400 text-center py-12">Chưa có album nào của nghệ sĩ này.</p>
                    ) : (
                        <div>
                            <h2 className="text-2xl font-bold mb-4">Album</h2>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                {albums.map((album) => (
                                    <Link
                                        href={`/album/${album.id}`}
                                        key={album.id}
                                        className="bg-zinc-800/30 p-4 rounded-lg hover:bg-zinc-800/50 transition group"
                                    >
                                        <div className="relative">
                                            <Image
                                                src={album.cover_image || `/playlist-placeholder.svg?height=160&width=160`}
                                                alt={album.title}
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
                                        <h3 className="font-semibold truncate">{album.title}</h3>
                                        <p className="text-sm text-zinc-400 mt-1">
                                            {formatReleaseDate(album.release_date)} • {album.songs_count} bài hát
                                        </p>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="about">
                    <div className="max-w-3xl">
                        <h2 className="text-2xl font-bold mb-4">Thông tin nghệ sĩ</h2>

                        {artist.bio ? (
                            <div className="mb-8">
                                <h3 className="text-xl font-semibold mb-2">Tiểu sử</h3>
                                <p className="text-white/80 leading-relaxed whitespace-pre-line">{artist.bio}</p>
                            </div>
                        ) : (
                            <p className="text-zinc-400 mb-8">Chưa có thông tin tiểu sử về nghệ sĩ này.</p>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <h3 className="text-xl font-semibold mb-2">Thống kê</h3>
                                <ul className="space-y-2">
                                    <li className="flex justify-between items-center border-b border-white/10 pb-2">
                                        <span className="text-white/70">Số bài hát:</span>
                                        <span className="font-medium">{artist.songs_count}</span>
                                    </li>
                                    {artist.play_count && (
                                        <li className="flex justify-between items-center border-b border-white/10 pb-2">
                                            <span className="text-white/70">Lượt nghe:</span>
                                            <span className="font-medium">{artist.play_count.toLocaleString()}</span>
                                        </li>
                                    )}
                                    <li className="flex justify-between items-center border-b border-white/10 pb-2">
                                        <span className="text-white/70">Số album:</span>
                                        <span className="font-medium">{albums.length}</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}

// ArtistSongs component được định nghĩa trong trang để tránh lỗi import
// TODO: Khi hệ thống build ổn định, nên chuyển component này vào file riêng tại app/components/artist/ArtistSongs.tsx

// Interface cho inline ArtistSongs

function ArtistSongs({ artistId }: { artistId: string }) {
    const [songs, setSongs] = useState<SongItem[]>([])
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
    const handlePlaySong = async (song: SongItem) => {
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
    const handleAddToQueue = (e: React.MouseEvent, song: SongItem) => {
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
    const handleDownloadSong = async (e: React.MouseEvent, song: SongItem) => {
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

    if (loading && (!songs || songs.length === 0)) {
        return (
            <div className="flex justify-center items-center h-40">
                <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
                <span className="ml-2 text-zinc-400">Đang tải danh sách bài hát...</span>
            </div>
        )
    }

    if (error && (!songs || songs.length === 0)) {
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

            {!songs || songs.length === 0 ? (
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
                            <li
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
                            </li>
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