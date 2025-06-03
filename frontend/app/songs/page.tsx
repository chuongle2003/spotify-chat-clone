"use client"

import { useEffect, useState } from "react"
import { SongType } from "@/components/music/SongCard"
import { SongRow } from "@/components/music/SongRow"
import { SongListHeader } from "@/components/music/SongListHeader"
import { api } from "@/lib/api"
import { usePlayer } from "@/components/player/PlayerContext"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Plus, MoreHorizontal } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"
import postmanApi from "@/lib/api/postman"

interface ApiSongResponse {
    id: number
    title: string
    artist: string
    album: string
    duration: number
    audio_file: string
    cover_image: string | null
    genre: string
    likes_count: number
    play_count: number
    uploaded_by: {
        id: number
        username: string
        avatar: string | null
    }
    created_at: string
    release_date: string | null
    download_url: string
    stream_url: string
}

interface Playlist {
    id: number
    name: string
    description?: string
    is_public: boolean
    cover_image: string | null
    songs_count: number
}

export default function SongsPage() {
    const [songs, setSongs] = useState<SongType[]>([])
    const [playlists, setPlaylists] = useState<Playlist[]>([])
    const [loading, setLoading] = useState(true)
    const [loadingPlaylists, setLoadingPlaylists] = useState(true)
    const { currentSong } = usePlayer()
    const { toast } = useToast()
    const router = useRouter()

    // Fetch songs
    useEffect(() => {
        async function fetchSongs() {
            try {
                setLoading(true)
                const response = await api.songs.getSongs({ limit: 50 })

                if (response && Array.isArray(response)) {
                    const formattedSongs: SongType[] = response.map((song: ApiSongResponse) => ({
                        id: song.id,
                        title: song.title,
                        duration: song.duration.toString(),
                        file_url: song.audio_file,
                        image_url: song.cover_image,
                        album: song.album ? {
                            id: 0,
                            title: song.album
                        } : null,
                        artist: {
                            id: song.uploaded_by.id,
                            name: song.artist,
                            avatar: song.uploaded_by.avatar
                        },
                        created_at: song.created_at,
                        updated_at: song.created_at
                    }))
                    setSongs(formattedSongs)
                } else {
                    console.error("Dữ liệu không hợp lệ:", response)
                    setSongs([])
                }
            } catch (error) {
                console.error("Lỗi khi lấy danh sách bài hát:", error)
                setSongs([])
            } finally {
                setLoading(false)
            }
        }

        fetchSongs()
    }, [])

    // Fetch playlists
    useEffect(() => {
        async function fetchPlaylists() {
            try {
                setLoadingPlaylists(true)
                const response = await postmanApi.music.getPlaylists()
                if (Array.isArray(response)) {
                    setPlaylists(response)
                }
            } catch (error) {
                console.error("Lỗi khi lấy danh sách playlist:", error)
            } finally {
                setLoadingPlaylists(false)
            }
        }

        fetchPlaylists()
    }, [])

    const handleAddToPlaylist = async (songId: number, playlistId: number) => {
        try {
            await postmanApi.music.addSongToPlaylist(playlistId.toString(), songId.toString())
            toast({
                title: "Thành công",
                description: "Đã thêm bài hát vào playlist",
            })
        } catch (error) {
            console.error("Lỗi khi thêm bài hát vào playlist:", error)
            toast({
                title: "Lỗi",
                description: "Không thể thêm bài hát vào playlist. Vui lòng thử lại sau.",
                variant: "destructive",
            })
        }
    }

    return (
        <div className="container mx-auto px-6 py-8">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold">Danh sách bài hát</h1>
                <Button
                    onClick={() => router.push("/create-playlist")}
                    className="bg-green-500 hover:bg-green-600 text-black"
                >
                    <Plus className="h-4 w-4 mr-2" /> Tạo Playlist
                </Button>
            </div>

            {loading ? (
                <div className="space-y-4">
                    {[...Array(10)].map((_, i) => (
                        <div key={i} className="h-16 bg-zinc-800/40 rounded-md animate-pulse" />
                    ))}
                </div>
            ) : (
                <div className="rounded-lg overflow-hidden bg-zinc-900/30">
                    <SongListHeader />
                    <div className="space-y-1 py-2">
                        {Array.isArray(songs) && songs.length > 0 ? (
                            songs.map((song, index) => (
                                <div key={song.id} className="group">
                                    <div className="flex items-center">
                                        <div className="flex-1">
                                            <SongRow
                                                song={song}
                                                index={index}
                                                songs={songs}
                                                isActive={currentSong?.id === song.id}
                                            />
                                        </div>
                                        <div className="px-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                    >
                                                        <Plus className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-56">
                                                    <DropdownMenuItem
                                                        onClick={() => router.push("/create-playlist")}
                                                        className="cursor-pointer"
                                                    >
                                                        <Plus className="h-4 w-4 mr-2" />
                                                        Tạo playlist mới
                                                    </DropdownMenuItem>
                                                    {playlists.length > 0 && (
                                                        <>
                                                            <DropdownMenuItem className="text-xs text-zinc-400 cursor-default">
                                                                Thêm vào playlist
                                                            </DropdownMenuItem>
                                                            {playlists.map((playlist) => (
                                                                <DropdownMenuItem
                                                                    key={playlist.id}
                                                                    onClick={() => handleAddToPlaylist(song.id, playlist.id)}
                                                                    className="cursor-pointer"
                                                                >
                                                                    {playlist.name}
                                                                </DropdownMenuItem>
                                                            ))}
                                                        </>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-zinc-400">
                                Không có bài hát nào
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
} 