"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Play, Shuffle, Clock, Heart, PlusCircle, User } from "lucide-react"
import { SongCard } from "@/components/music/SongCard"
import { usePlayer } from "@/components/player/PlayerContext"
import { useToast } from "@/hooks/use-toast"
import postmanApi from "@/lib/api/postman"
import { api } from "@/lib/api"

interface Song {
    id: string
    title: string
    artist: any
    album?: string
    duration: number
    audio_url?: string
    audio_file?: string
    cover_image?: string
    play_count?: number
    likes_count?: number
}

interface TopArtist {
    name: string
    songs_count: number
}

interface GenreDetails {
    id: number
    name: string
    description: string
    image: string | null
    top_songs: any[]
    top_artists: TopArtist[]
}

export default function GenrePage({ params }: { params: { name: string } }) {
    const { name } = params
    const decodedName = decodeURIComponent(name)
    const { user } = useAuth()
    const router = useRouter()
    const { toast } = useToast()
    const { play, isPlaying, currentSong, pause, resume } = usePlayer()

    const [genreData, setGenreData] = useState<GenreDetails | null>(null)
    const [songs, setSongs] = useState<Song[]>([])
    const [loading, setLoading] = useState(true)
    const [color, setColor] = useState("from-purple-600 to-indigo-800")
    const [likedSongs, setLikedSongs] = useState<Record<string, boolean>>({})

    useEffect(() => {
        if (!user) {
            router.push("/")
            return
        }

        async function fetchGenreDetails() {
            try {
                setLoading(true)

                // Đầu tiên lấy danh sách genres để tìm ID của genre từ tên
                const genres = await api.genres.getGenres()
                const genre = genres.find(g => g.name === decodedName)

                if (!genre) {
                    toast({
                        title: "Lỗi",
                        description: `Không tìm thấy thể loại ${decodedName}`,
                        variant: "destructive",
                    })
                    return
                }

                // Lấy chi tiết thể loại
                const genreDetails = await api.genres.getGenre(genre.id)
                setGenreData(genreDetails)

                // Lấy danh sách bài hát từ top_songs
                setSongs(genreDetails.top_songs)

                // Random một màu từ danh sách màu
                const colors = [
                    "from-purple-600 to-indigo-800",
                    "from-green-600 to-emerald-800",
                    "from-red-600 to-rose-800",
                    "from-blue-600 to-sky-800",
                    "from-pink-600 to-fuchsia-800",
                    "from-amber-600 to-yellow-800",
                    "from-teal-600 to-cyan-800",
                ]
                setColor(colors[Math.floor(Math.random() * colors.length)])
            } catch (error) {
                console.error("Lỗi khi lấy thông tin chi tiết thể loại:", error)
                toast({
                    title: "Lỗi",
                    description: "Không thể tải thông tin thể loại. Vui lòng thử lại sau.",
                    variant: "destructive",
                })
            } finally {
                setLoading(false)
            }
        }

        fetchGenreDetails()
    }, [user, router, decodedName, toast])

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = Math.floor(seconds % 60)
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    const handlePlayAll = () => {
        if (songs.length > 0) {
            const songsToPlay = songs.map(song => ({
                id: song.id,
                title: song.title,
                artist: typeof song.artist === 'string' ? song.artist : song.artist?.name || 'Unknown Artist',
                duration: typeof song.duration === 'string' ? song.duration : formatTime(song.duration),
                file_url: song.audio_file,
                image_url: song.cover_image,
                album: song.album
            }))
            play(songsToPlay[0], songsToPlay)
            toast({
                title: "Đang phát",
                description: `Danh sách nhạc thể loại ${decodedName}`,
            })
        }
    }

    const handlePlaySong = (song: any) => {
        if (songs.length > 0) {
            const songsToPlay = songs.map(s => ({
                id: s.id,
                title: s.title,
                artist: typeof s.artist === 'string' ? s.artist : s.artist?.name || 'Unknown Artist',
                duration: typeof s.duration === 'string' ? s.duration : formatTime(s.duration),
                file_url: s.audio_file,
                image_url: s.cover_image,
                album: s.album
            }))

            // Tìm index của bài hát được chọn
            const index = songsToPlay.findIndex(s => s.id === song.id)

            play(songsToPlay[index >= 0 ? index : 0], songsToPlay)
            toast({
                title: "Đang phát",
                description: `${song.title}`,
            })
        }
    }

    const handleShufflePlay = () => {
        if (songs.length > 0) {
            // Sắp xếp ngẫu nhiên danh sách nhạc
            const shuffled = [...songs].sort(() => Math.random() - 0.5)
            const songsToPlay = shuffled.map(song => ({
                id: song.id,
                title: song.title,
                artist: typeof song.artist === 'string' ? song.artist : song.artist?.name || 'Unknown Artist',
                duration: typeof song.duration === 'string' ? song.duration : formatTime(song.duration),
                file_url: song.audio_file,
                image_url: song.cover_image,
                album: song.album
            }))
            play(songsToPlay[0], songsToPlay)
            toast({
                title: "Đang phát ngẫu nhiên",
                description: `Danh sách nhạc thể loại ${decodedName}`,
            })
        }
    }

    const handleLikeSong = async (songId: string, event: React.MouseEvent) => {
        event.stopPropagation();
        try {
            if (likedSongs[songId]) {
                await postmanApi.music.unlikeSong(songId);
                setLikedSongs(prev => ({ ...prev, [songId]: false }));
                toast({
                    title: "Đã bỏ thích",
                    description: "Đã xóa khỏi bài hát yêu thích của bạn",
                });
            } else {
                await postmanApi.music.likeSong(songId);
                setLikedSongs(prev => ({ ...prev, [songId]: true }));
                toast({
                    title: "Đã thích",
                    description: "Đã thêm vào bài hát yêu thích của bạn",
                });
            }
        } catch (error) {
            console.error("Lỗi khi thích/bỏ thích bài hát:", error);
            toast({
                title: "Lỗi",
                description: "Không thể thích/bỏ thích bài hát. Vui lòng thử lại sau.",
                variant: "destructive",
            });
        }
    };

    const handleAddToQueue = (song: Song, event: React.MouseEvent) => {
        event.stopPropagation();

        try {
            const formattedSong = {
                id: song.id,
                title: song.title,
                artist: typeof song.artist === 'string' ? song.artist : song.artist?.name || 'Unknown Artist',
                duration: typeof song.duration === 'string' ? song.duration : formatTime(song.duration),
                file_url: song.audio_file,
                image_url: song.cover_image,
                album: song.album
            };

            if (usePlayer().addToQueue) {
                usePlayer().addToQueue(formattedSong);
                toast({
                    title: "Đã thêm vào hàng đợi",
                    description: `${song.title}`,
                });
            }
        } catch (error) {
            console.error("Lỗi khi thêm vào hàng đợi:", error);
            toast({
                title: "Lỗi",
                description: "Không thể thêm bài hát vào hàng đợi",
                variant: "destructive",
            });
        }
    };

    return (
        <div>
            {/* Header */}
            <div className={`flex items-end p-8 bg-gradient-to-b ${color} h-64 relative rounded-t-lg mb-6`}>
                <div className="absolute inset-0 bg-black/20 rounded-t-lg"></div>
                <div className="relative z-10">
                    <div className="text-sm font-medium mb-2">Thể loại</div>
                    <h1 className="text-5xl font-extrabold mb-6">{decodedName}</h1>
                    <div className="flex items-center gap-2">
                        <span>{songs.length} bài hát</span>
                        {genreData?.description && <span className="text-sm text-white/70">• {genreData.description}</span>}
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4 mb-6">
                <Button onClick={handlePlayAll} size="lg" className="bg-green-500 hover:bg-green-600 text-black gap-2">
                    <Play className="h-5 w-5" /> Phát
                </Button>
                <Button onClick={handleShufflePlay} variant="outline" size="lg" className="gap-2">
                    <Shuffle className="h-5 w-5" /> Trộn bài
                </Button>
            </div>

            {/* Songs list */}
            {loading ? (
                <div className="space-y-2">
                    {[...Array(10)].map((_, i) => (
                        <div key={i} className="h-16 bg-zinc-800/40 rounded-md animate-pulse" />
                    ))}
                </div>
            ) : songs.length > 0 ? (
                <div>
                    <h2 className="text-2xl font-bold mb-4">Bài hát hàng đầu</h2>
                    <div className="relative overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="text-sm text-zinc-400 border-b border-zinc-800">
                                <tr>
                                    <th className="px-4 py-3 w-12">#</th>
                                    <th className="px-4 py-3">Tiêu đề</th>
                                    <th className="px-4 py-3">Album</th>
                                    <th className="px-4 py-3 w-20">Hành động</th>
                                    <th className="px-4 py-3 text-center w-24">
                                        <Clock className="h-4 w-4 inline" />
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {songs.map((song, index) => (
                                    <tr
                                        key={song.id}
                                        className="hover:bg-white/5 cursor-pointer"
                                        onClick={() => handlePlaySong(song)}
                                    >
                                        <td className="px-4 py-3 text-zinc-400">{index + 1}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="relative h-10 w-10 flex-shrink-0">
                                                    <Image
                                                        src={song.cover_image || "/placeholder.svg"}
                                                        alt={song.title}
                                                        fill
                                                        className="object-cover rounded"
                                                    />
                                                </div>
                                                <div>
                                                    <div className="font-medium">{song.title}</div>
                                                    <div className="text-sm text-zinc-400">
                                                        {typeof song.artist === 'string' ? song.artist : song.artist?.name}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-zinc-400">{song.album}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-zinc-400 hover:text-white"
                                                    onClick={(e) => handleLikeSong(song.id, e)}
                                                >
                                                    <Heart
                                                        className={`h-4 w-4 ${likedSongs[song.id] ? "fill-red-500 text-red-500" : ""}`}
                                                    />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-zinc-400 hover:text-white"
                                                    onClick={(e) => handleAddToQueue(song, e)}
                                                >
                                                    <PlusCircle className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-zinc-400 text-center">
                                            {formatTime(song.duration)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Top Artists Section */}
                    {genreData?.top_artists && genreData.top_artists.length > 0 && (
                        <div className="mt-12">
                            <h2 className="text-2xl font-bold mb-4">Nghệ sĩ nổi bật</h2>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                                {genreData.top_artists.map((artist, index) => (
                                    <div key={index} className="bg-zinc-800/50 p-4 rounded-lg hover:bg-zinc-800/80 transition">
                                        <div className="aspect-square bg-zinc-700 rounded-full flex items-center justify-center mb-4">
                                            <User className="h-16 w-16 text-zinc-500" />
                                        </div>
                                        <h3 className="font-medium text-center truncate">{artist.name}</h3>
                                        <p className="text-sm text-zinc-400 text-center">{artist.songs_count} bài hát</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="text-center py-10">
                    <p className="text-zinc-400 mb-4">Không tìm thấy bài hát nào cho thể loại này</p>
                    <Link href="/genres">
                        <Button>Quay lại danh sách thể loại</Button>
                    </Link>
                </div>
            )}
        </div>
    )
} 