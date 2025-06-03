"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter, useParams } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Play, Shuffle, Clock, Heart, MoreHorizontal } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { usePlayer } from "@/components/player/PlayerContext"
import { api } from "@/lib/api"

interface Album {
    id: string | number;
    title: string;
    artist: any;
    cover_image: string;
    release_date: string;
    songs_count: number;
    description?: string;
    songs?: Song[];
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
    track_number?: number;
    play_count?: number;
    likes_count?: number;
}

export default function AlbumPage() {
    const params = useParams()
    const albumId = params?.id as string
    const router = useRouter()
    const { user } = useAuth()
    const { toast } = useToast()
    const { play } = usePlayer()

    const [album, setAlbum] = useState<Album | null>(null)
    const [songs, setSongs] = useState<Song[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!user) {
            router.push("/")
            return
        }

        if (!albumId) return

        async function fetchAlbumDetails() {
            try {
                setLoading(true)

                // Lấy chi tiết album
                const albumResponse = await api.albums.getAlbum(albumId)

                // Xử lý dữ liệu album
                const albumData = {
                    ...albumResponse,
                    songs: albumResponse.songs || []
                }

                // Định dạng lại dữ liệu bài hát nếu cần
                const formattedSongs = (albumData.songs || []).map((song: any, index: number) => ({
                    id: song.id,
                    title: song.title || song.name,
                    artist: song.artist || albumData.artist,
                    album: albumData.title,
                    duration: song.duration || 0,
                    audio_url: song.audio_url || song.audio_file,
                    audio_file: song.audio_file,
                    cover_image: song.cover_image || albumData.cover_image,
                    track_number: song.track_number || index + 1,
                    play_count: song.play_count || 0,
                    likes_count: song.likes_count || 0
                }))

                setAlbum(albumData)
                setSongs(formattedSongs)
            } catch (error) {
                console.error("Lỗi khi lấy chi tiết album:", error)
                toast({
                    title: "Lỗi",
                    description: "Không thể tải thông tin album. Vui lòng thử lại sau.",
                    variant: "destructive",
                })
            } finally {
                setLoading(false)
            }
        }

        fetchAlbumDetails()
    }, [albumId, user, router, toast])

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = Math.floor(seconds % 60)
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    const formatDate = (dateString: string) => {
        if (!dateString) return ""
        const date = new Date(dateString)
        return new Intl.DateTimeFormat('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }).format(date)
    }

    const getTotalDuration = () => {
        const totalSeconds = songs.reduce((total, song) => total + (song.duration || 0), 0)
        const minutes = Math.floor(totalSeconds / 60)
        return `${minutes} phút`
    }

    const handlePlayAll = () => {
        if (songs.length > 0) {
            const songsToPlay = songs.map(song => ({
                id: Number(song.id),
                title: song.title,
                duration: formatTime(song.duration),
                file_url: song.audio_url || song.audio_file || '',
                image_url: song.cover_image || album?.cover_image || '/placeholder-song.jpg',
                album: {
                    id: 0,
                    title: album?.title || ''
                },
                artist: {
                    id: typeof song.artist === 'string' ? 0 : Number(song.artist?.id || 0),
                    name: typeof song.artist === 'string' ? song.artist : song.artist?.name || 'Unknown Artist',
                    avatar: typeof song.artist === 'string' ? null : song.artist?.avatar
                },
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }))

            if (songsToPlay.length > 0) {
                play(songsToPlay[0], songsToPlay)
            }

            toast({
                title: "Đang phát",
                description: `Album: ${album?.title}`,
            })
        }
    }

    const handlePlaySong = (index: number) => {
        if (songs.length > index) {
            const songsToPlay = songs.map(song => ({
                id: Number(song.id),
                title: song.title,
                duration: formatTime(song.duration),
                file_url: song.audio_url || song.audio_file || '',
                image_url: song.cover_image || album?.cover_image || '/placeholder-song.jpg',
                album: {
                    id: 0,
                    title: album?.title || ''
                },
                artist: {
                    id: typeof song.artist === 'string' ? 0 : Number(song.artist?.id || 0),
                    name: typeof song.artist === 'string' ? song.artist : song.artist?.name || 'Unknown Artist',
                    avatar: typeof song.artist === 'string' ? null : song.artist?.avatar
                },
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }))

            if (songsToPlay.length > index) {
                play(songsToPlay[index], songsToPlay)
            }

            toast({
                title: "Đang phát",
                description: `${songs[index].title}`,
            })
        }
    }

    const handleShufflePlay = () => {
        if (songs.length > 0) {
            // Sắp xếp ngẫu nhiên danh sách nhạc
            const shuffled = [...songs].sort(() => Math.random() - 0.5)

            const songsToPlay = shuffled.map(song => ({
                id: Number(song.id),
                title: song.title,
                duration: formatTime(song.duration),
                file_url: song.audio_url || song.audio_file || '',
                image_url: song.cover_image || album?.cover_image || '/placeholder-song.jpg',
                album: {
                    id: 0,
                    title: album?.title || ''
                },
                artist: {
                    id: typeof song.artist === 'string' ? 0 : Number(song.artist?.id || 0),
                    name: typeof song.artist === 'string' ? song.artist : song.artist?.name || 'Unknown Artist',
                    avatar: typeof song.artist === 'string' ? null : song.artist?.avatar
                },
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }))

            if (songsToPlay.length > 0) {
                play(songsToPlay[0], songsToPlay)
            }

            toast({
                title: "Đang phát ngẫu nhiên",
                description: `Album: ${album?.title}`,
            })
        }
    }

    return (
        <div>
            {loading ? (
                <div className="space-y-4">
                    <div className="flex gap-6">
                        <div className="w-52 h-52 bg-zinc-800/40 rounded-lg animate-pulse"></div>
                        <div className="flex-1 space-y-4">
                            <div className="h-8 w-1/3 bg-zinc-800/40 rounded animate-pulse"></div>
                            <div className="h-12 w-2/3 bg-zinc-800/40 rounded animate-pulse"></div>
                            <div className="h-4 w-1/4 bg-zinc-800/40 rounded animate-pulse"></div>
                        </div>
                    </div>
                    <div className="h-12 w-72 bg-zinc-800/40 rounded animate-pulse mt-6"></div>
                    <div className="space-y-2 mt-8">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="h-16 bg-zinc-800/40 rounded-md animate-pulse" />
                        ))}
                    </div>
                </div>
            ) : (
                <>
                    {/* Album Header */}
                    <div className="flex flex-col md:flex-row gap-6 mb-8">
                        <div className="w-52 h-52 flex-shrink-0">
                            <div className="relative w-full h-full overflow-hidden rounded-lg shadow-lg">
                                <Image
                                    src={album?.cover_image || "/placeholder-album.jpg"}
                                    alt={album?.title || "Album"}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col justify-end">
                            <div className="text-sm font-medium mb-1">Album</div>
                            <h1 className="text-5xl font-extrabold mb-6">{album?.title}</h1>

                            {album?.description && (
                                <p className="text-zinc-400 mb-3">{album.description}</p>
                            )}

                            <div className="flex items-center gap-1 text-sm text-zinc-400">
                                <Link href={`/artist/${album?.artist?.id || '#'}`} className="font-medium text-white hover:underline">
                                    {typeof album?.artist === 'string'
                                        ? album?.artist
                                        : album?.artist?.name || "Unknown Artist"}
                                </Link>
                                <span>•</span>
                                <span>{album?.release_date ? new Date(album.release_date).getFullYear() : ''}</span>
                                <span>•</span>
                                <span>{songs.length} bài hát</span>
                                <span>•</span>
                                <span>{getTotalDuration()}</span>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-4 mb-8">
                        <Button
                            onClick={handlePlayAll}
                            size="lg"
                            className="bg-green-500 hover:bg-green-600 text-black gap-2"
                        >
                            <Play className="h-5 w-5" /> Phát
                        </Button>

                        <Button
                            onClick={handleShufflePlay}
                            variant="outline"
                            size="icon"
                            className="h-10 w-10"
                        >
                            <Shuffle className="h-5 w-5" />
                        </Button>
                    </div>

                    {/* Songs list */}
                    {songs.length > 0 ? (
                        <div className="relative overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="text-sm text-zinc-400 border-b border-zinc-800">
                                    <tr>
                                        <th className="px-4 py-3 w-12">#</th>
                                        <th className="px-4 py-3">Tiêu đề</th>
                                        <th className="px-4 py-3 text-center w-24">
                                            <Clock className="h-4 w-4 inline" />
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {songs.map((song, index) => (
                                        <tr
                                            key={song.id}
                                            className="hover:bg-zinc-800/50 text-sm cursor-pointer"
                                            onClick={() => handlePlaySong(index)}
                                        >
                                            <td className="px-4 py-3 w-12">{song.track_number || index + 1}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div>
                                                        <div className="font-medium">{song.title}</div>
                                                        <div className="text-zinc-400">
                                                            {typeof song.artist === 'string'
                                                                ? song.artist
                                                                : song.artist?.name || 'Unknown Artist'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-center text-zinc-400">
                                                {formatTime(song.duration)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-zinc-900/30 rounded-lg">
                            <p className="text-zinc-400">Album này chưa có bài hát nào</p>
                        </div>
                    )}

                    {/* Album Info */}
                    <div className="mt-12 bg-zinc-900/30 p-6 rounded-lg">
                        <p className="text-sm text-zinc-400">
                            Phát hành ngày {album?.release_date ? formatDate(album.release_date) : 'Unknown'}
                        </p>
                        {album?.description && (
                            <div className="mt-4">
                                <h3 className="text-lg font-semibold mb-2">Giới thiệu về album</h3>
                                <p className="text-zinc-300">{album.description}</p>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    )
} 