"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import {
    Search as SearchIcon,
    Play,
    PlusCircle,
    CheckCircle,
    Pause,
    MoreHorizontal,
    ChevronLeft,
    ChevronRight,
    Heart
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { postmanApi } from "@/lib/api/postman"
import { usePlayer } from "@/components/player/PlayerContext"
import { useToast } from "@/hooks/use-toast"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { api } from "@/lib/api"

export default function SearchPage() {
    const { user } = useAuth()
    const router = useRouter()
    const { toast } = useToast()
    const searchParams = useSearchParams()
    const searchQuery = searchParams.get("q") || ""
    const [query, setQuery] = useState(searchQuery)
    const [results, setResults] = useState<{
        songs: any[];
        albums: any[];
        playlists: any[];
    }>({
        songs: [],
        albums: [],
        playlists: [],
    })
    const [loading, setLoading] = useState(false)
    const [recentSearches, setRecentSearches] = useState<string[]>([])
    const [genres, setGenres] = useState<{ id: number; name: string }[]>([])
    const { currentSong, isPlaying, play, addToQueue, playlist: currentPlaylist } = usePlayer()

    // Kiểm tra nếu bài hát hiện tại có trùng với bài hát trong danh sách không
    const isSameId = (id1: any, id2: any): boolean => {
        return String(id1) === String(id2);
    }

    // If user is not logged in, redirect to home page
    useEffect(() => {
        if (!user) {
            router.push("/")
        }
    }, [user, router])

    // Load recent searches from localStorage
    useEffect(() => {
        const savedSearches = localStorage.getItem("recent_searches")
        if (savedSearches) {
            setRecentSearches(JSON.parse(savedSearches))
        }

        // Lấy danh sách thể loại
        const fetchGenres = async () => {
            try {
                const genresData = await api.genres.getGenres()
                setGenres(genresData)
            } catch (error) {
                console.error("Lỗi khi lấy danh sách thể loại:", error)
            }
        }

        fetchGenres()
    }, [])

    useEffect(() => {
        if (searchQuery) {
            setQuery(searchQuery)
            performSearch(searchQuery)
        }
    }, [searchQuery])

    const performSearch = async (searchTerm: string) => {
        if (!searchTerm.trim()) {
            setResults({
                songs: [],
                albums: [],
                playlists: [],
            })
            return
        }

        try {
            setLoading(true)
            const response = await postmanApi.music.search(searchTerm)
            setResults(response)

            // Save to recent searches
            const updatedSearches = [searchTerm, ...recentSearches.filter((s) => s !== searchTerm)].slice(0, 5)
            setRecentSearches(updatedSearches)
            localStorage.setItem("recent_searches", JSON.stringify(updatedSearches))
        } catch (error) {
            console.error("Search error:", error)
            toast({
                title: "Lỗi tìm kiếm",
                description: "Không thể thực hiện tìm kiếm. Vui lòng thử lại sau.",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    const handleSearch = () => {
        // Thêm query vào URL để có thể share được
        router.push(`/search?q=${encodeURIComponent(query)}`)
        performSearch(query)
    }

    const handlePlaySong = (song: any) => {
        // Xử lý chuyển đổi sang định dạng SongType
        const songToPlay = {
            id: Number(song.id),
            title: song.title,
            duration: formatDuration(song.duration),
            file_url: song.audio_file || song.audio_url || '',
            image_url: song.cover_image || null,
            album: song.album ? {
                id: 0,
                title: song.album
            } : null,
            artist: {
                id: typeof song.artist === 'string' ? 0 : Number(song.artist?.id || 0),
                name: typeof song.artist === 'string' ? song.artist : song.artist?.name || 'Unknown Artist',
                avatar: typeof song.artist === 'string' ? null : song.artist?.avatar
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        play(songToPlay);
    }

    // Xử lý thêm vào danh sách phát
    const handleAddToQueue = (e: React.MouseEvent, song: any) => {
        e.stopPropagation();

        // Kiểm tra nếu bài hát đang phát
        if (currentSong && isSameId(currentSong.id, song.id)) {
            toast({
                title: "Bài hát đang phát",
                description: `"${song.title}" đang được phát.`,
            });
            return;
        }

        // Kiểm tra nếu bài hát đã có trong hàng đợi
        if (currentPlaylist && currentPlaylist.some(item => isSameId(item.id, song.id) && !isSameId(item.id, currentSong?.id))) {
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
                duration: formatDuration(song.duration),
                file_url: audioSource,
                image_url: song.cover_image || null,
                album: song.album ? {
                    id: 0,
                    title: song.album
                } : null,
                artist: {
                    id: typeof song.artist === 'string' ? 0 : Number(song.artist?.id || 0),
                    name: typeof song.artist === 'string' ? song.artist : song.artist?.name || 'Unknown Artist',
                    avatar: typeof song.artist === 'string' ? null : song.artist?.avatar
                },
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

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = Math.floor(seconds % 60)
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    // Mock data for UI display when API data is not available
    const mockGenres = [
        { id: "1", name: "Pop" },
        { id: "2", name: "Hip-Hop" },
        { id: "3", name: "Rock" },
        { id: "4", name: "R&B" },
        { id: "5", name: "K-Pop" },
        { id: "6", name: "V-Pop" },
        { id: "7", name: "EDM" },
        { id: "8", name: "Jazz" },
        { id: "9", name: "Classical" },
        { id: "10", name: "Metal" },
    ]

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full bg-black/20 text-white"
                        onClick={() => router.back()}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full bg-black/20 text-white"
                        onClick={() => router.forward()}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Search input */}
            <div className="relative mb-8 max-w-3xl">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-zinc-400" />
                <Input
                    placeholder="Bạn muốn nghe gì?"
                    className="pl-10 bg-zinc-800 border-none h-12 text-white focus-visible:ring-0"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
                {query && (
                    <Button
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-green-500 hover:bg-green-600 text-black"
                        onClick={handleSearch}
                        disabled={loading}
                    >
                        Tìm kiếm
                    </Button>
                )}
            </div>

            {/* Search results */}
            {loading ? (
                <div className="space-y-8">
                    <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="h-16 bg-zinc-800/40 rounded-md animate-pulse" />
                        ))}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="aspect-square bg-zinc-800/40 rounded-md animate-pulse" />
                        ))}
                    </div>
                </div>
            ) : (
                <>
                    {query ? (
                        <>
                            {results.songs.length === 0 && results.playlists.length === 0 && results.albums.length === 0 ? (
                                <div className="text-center py-8">
                                    <p className="text-zinc-400">Không tìm thấy kết quả nào cho "{query}"</p>
                                </div>
                            ) : (
                                <div>
                                    {/* Bài hát */}
                                    {results.songs && results.songs.length > 0 && (
                                        <div className="mb-10">
                                            <h2 className="text-2xl font-bold mb-4">Bài hát</h2>
                                            <div className="bg-zinc-900/30 rounded-md">
                                                <div className="grid grid-cols-[auto_1fr_auto_auto] gap-4 p-4 border-b border-white/5 text-sm text-zinc-400">
                                                    <div className="w-10 text-center">#</div>
                                                    <div>Tiêu đề</div>
                                                    <div className="w-32 text-right">Thời lượng</div>
                                                    <div className="w-20"></div>
                                                </div>

                                                {results.songs.map((song, index) => (
                                                    <div
                                                        key={song.id}
                                                        className="grid grid-cols-[auto_1fr_auto_auto] gap-4 p-4 hover:bg-white/5 items-center group"
                                                        onClick={() => handlePlaySong(song)}
                                                    >
                                                        <div className="w-10 text-center text-zinc-400">
                                                            <span className="group-hover:hidden">{index + 1}</span>
                                                            <button
                                                                className="hidden group-hover:block"
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    handlePlaySong(song)
                                                                }}
                                                            >
                                                                {currentSong && isSameId(currentSong.id, song.id) && isPlaying ? (
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
                                                                    {typeof song.artist === 'string' ? song.artist : song.artist?.name || 'Unknown Artist'}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="w-32 text-zinc-400 text-right">
                                                            {formatDuration(song.duration)}
                                                        </div>

                                                        <div className="w-20 flex justify-end">
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="opacity-0 group-hover:opacity-100 h-8 w-8 text-zinc-400"
                                                                        onClick={(e) => e.stopPropagation()}
                                                                    >
                                                                        <MoreHorizontal className="h-4 w-4" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent className="w-56 bg-zinc-900 border-zinc-800 text-white">
                                                                    <DropdownMenuItem
                                                                        className="cursor-pointer hover:bg-zinc-800"
                                                                        onClick={(e) => handleAddToQueue(e, song)}
                                                                    >
                                                                        {currentSong && isSameId(currentSong.id, song.id) ? (
                                                                            <>
                                                                                <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                                                                                <span>Đang phát</span>
                                                                            </>
                                                                        ) : currentPlaylist && currentPlaylist.some(item => isSameId(item.id, song.id) && !isSameId(item.id, currentSong?.id)) ? (
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
                                                                    <DropdownMenuSeparator className="bg-zinc-800" />
                                                                    <DropdownMenuItem
                                                                        className="cursor-pointer hover:bg-zinc-800"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation()
                                                                            toast({
                                                                                title: "Tính năng đang phát triển",
                                                                                description: "Chức năng thêm vào playlist sẽ được cập nhật trong phiên bản tiếp theo."
                                                                            })
                                                                        }}
                                                                    >
                                                                        <Heart className="mr-2 h-4 w-4" />
                                                                        <span>Thêm vào danh sách yêu thích</span>
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Playlists */}
                                    {results.playlists && results.playlists.length > 0 && (
                                        <div className="mb-10">
                                            <h2 className="text-2xl font-bold mb-4">Playlist</h2>
                                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                                {results.playlists.map((playlist) => (
                                                    <Link href={`/playlist/${playlist.id}`} key={playlist.id}>
                                                        <div className="bg-zinc-800/50 p-4 rounded-lg hover:bg-zinc-800/80 transition cursor-pointer h-full">
                                                            <div className="relative aspect-square mb-4">
                                                                <Image
                                                                    src={playlist.cover_image || `/placeholder.svg?height=160&width=160&text=${playlist.name.charAt(0)}`}
                                                                    alt={playlist.name}
                                                                    fill
                                                                    className="object-cover rounded"
                                                                />
                                                            </div>
                                                            <h3 className="font-medium line-clamp-1">{playlist.name}</h3>
                                                            <p className="text-sm text-zinc-400 line-clamp-2 mt-1">
                                                                {playlist.description || 'Playlist'}
                                                            </p>
                                                            <div className="flex items-center mt-2 text-xs text-zinc-500">
                                                                <span>{playlist.songs_count} bài hát</span>
                                                                <span className="mx-1">•</span>
                                                                <span>{playlist.user?.username || 'User'}</span>
                                                            </div>
                                                        </div>
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Albums - if needed */}
                                    {results.albums && results.albums.length > 0 && (
                                        <div className="mb-10">
                                            <h2 className="text-2xl font-bold mb-4">Albums</h2>
                                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                                {results.albums.map((album) => (
                                                    <Link href={`/album/${album.id}`} key={album.id}>
                                                        <div className="bg-zinc-800/50 p-4 rounded-lg hover:bg-zinc-800/80 transition cursor-pointer">
                                                            <div className="relative aspect-square mb-4">
                                                                <Image
                                                                    src={album.cover_image || `/placeholder.svg?height=160&width=160&text=${album.title.charAt(0)}`}
                                                                    alt={album.title}
                                                                    fill
                                                                    className="object-cover rounded"
                                                                />
                                                            </div>
                                                            <h3 className="font-medium line-clamp-1">{album.title}</h3>
                                                            <p className="text-sm text-zinc-400 line-clamp-1 mt-1">
                                                                {album.artist}
                                                            </p>
                                                        </div>
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    ) : (
                        <>
                            {/* Search page content when no query */}
                            <div className="mb-8">
                                <h2 className="text-2xl font-bold mb-4">Tìm kiếm gần đây</h2>
                                {recentSearches.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {recentSearches.map((term) => (
                                            <Button
                                                key={term}
                                                variant="outline"
                                                className="bg-zinc-800 border-none hover:bg-zinc-700 text-white"
                                                onClick={() => {
                                                    setQuery(term)
                                                    router.push(`/search?q=${encodeURIComponent(term)}`)
                                                }}
                                            >
                                                {term}
                                            </Button>
                                        ))}
                                        <Button
                                            variant="outline"
                                            className="bg-zinc-800 border-none hover:bg-zinc-700 text-white"
                                            onClick={() => {
                                                setRecentSearches([])
                                                localStorage.removeItem("recent_searches")
                                            }}
                                        >
                                            Xóa lịch sử
                                        </Button>
                                    </div>
                                ) : (
                                    <p className="text-zinc-400">Chưa có tìm kiếm nào gần đây</p>
                                )}
                            </div>

                            <h2 className="text-2xl font-bold mb-4">Duyệt tất cả</h2>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                {(genres.length > 0 ? genres : mockGenres).map((genre) => {
                                    // Tạo màu gradient ngẫu nhiên cho từng thể loại
                                    const gradients = [
                                        "from-purple-500 to-blue-600",
                                        "from-red-500 to-orange-600",
                                        "from-blue-500 to-cyan-600",
                                        "from-green-500 to-emerald-600",
                                        "from-pink-500 to-rose-600",
                                        "from-yellow-500 to-amber-600",
                                        "from-indigo-500 to-violet-600",
                                    ];
                                    const gradientClass = gradients[Math.floor(Math.random() * gradients.length)];

                                    return (
                                        <div
                                            key={genre.id}
                                            className={`bg-gradient-to-br ${gradientClass} p-6 rounded-lg hover:opacity-90 transition cursor-pointer`}
                                            onClick={() => {
                                                setQuery(genre.name)
                                                router.push(`/search?q=${encodeURIComponent(genre.name)}`)
                                            }}
                                        >
                                            <h3 className="text-xl font-bold">{genre.name}</h3>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </>
            )}
        </div>
    )
}
