"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SongType } from "@/components/music/SongCard"
import { SongRow } from "@/components/music/SongRow"
import { SongListHeader } from "@/components/music/SongListHeader"
import { usePlayer } from "@/components/player/PlayerContext"
import { useToast } from "@/hooks/use-toast"
import { usePlaylist } from "@/context/playlist-context"
import { ArrowLeft, Plus, Search, CheckCircle2, Check } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
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

export default function AddSongsToPlaylistPage() {
    const params = useParams()
    const playlistId = params?.id as string
    const router = useRouter()
    const { toast } = useToast()
    const { currentSong } = usePlayer()
    const { currentPlaylist, getPlaylist, addSongToPlaylist } = usePlaylist()

    const [songs, setSongs] = useState<SongType[]>([])
    const [filteredSongs, setFilteredSongs] = useState<SongType[]>([])
    const [selectedSongs, setSelectedSongs] = useState<Set<number>>(new Set())
    const [searchTerm, setSearchTerm] = useState("")
    const [loading, setLoading] = useState(true)
    const [playlistSongs, setPlaylistSongs] = useState<Set<number>>(new Set())
    const [addingSongs, setAddingSongs] = useState(false)
    const [recentlyAdded, setRecentlyAdded] = useState<Set<number>>(new Set())
    const [addedCount, setAddedCount] = useState<number>(0)

    // Lấy thông tin playlist và các bài hát đã có trong playlist
    useEffect(() => {
        if (!playlistId) return

        const fetchPlaylistDetails = async () => {
            try {
                const playlist = await getPlaylist(playlistId)

                if (!playlist) {
                    toast({
                        title: "Lỗi",
                        description: "Không thể tải thông tin playlist. Vui lòng thử lại sau.",
                        variant: "destructive",
                    })
                    router.push(`/playlist/${playlistId}`)
                    return
                }

                // Lưu các ID bài hát đã có trong playlist để đánh dấu
                if (playlist.songs && Array.isArray(playlist.songs)) {
                    const songIds = new Set(playlist.songs.map(song => Number(song.id)))
                    setPlaylistSongs(songIds)
                }
            } catch (error) {
                console.error("Lỗi khi tải thông tin playlist:", error)
                toast({
                    title: "Lỗi",
                    description: "Không thể tải thông tin playlist.",
                    variant: "destructive",
                })
                router.push(`/playlist/${playlistId}`)
            }
        }

        fetchPlaylistDetails()
    }, [playlistId, getPlaylist, toast, router])

    // Lấy danh sách tất cả bài hát
    useEffect(() => {
        async function fetchSongs() {
            try {
                setLoading(true)
                const response = await postmanApi.music.getSongs({ limit: 50 })

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
                    setFilteredSongs(formattedSongs)
                } else {
                    console.error("Dữ liệu không hợp lệ:", response)
                    setSongs([])
                    setFilteredSongs([])
                }
            } catch (error) {
                console.error("Lỗi khi lấy danh sách bài hát:", error)
                setSongs([])
                setFilteredSongs([])
            } finally {
                setLoading(false)
            }
        }

        fetchSongs()
    }, [])

    // Lọc bài hát khi tìm kiếm
    useEffect(() => {
        if (searchTerm.trim() === "") {
            setFilteredSongs(songs)
        } else {
            const lowerCaseSearch = searchTerm.toLowerCase()
            const filtered = songs.filter(song =>
                song.title.toLowerCase().includes(lowerCaseSearch) ||
                song.artist.name.toLowerCase().includes(lowerCaseSearch) ||
                (song.album?.title?.toLowerCase().includes(lowerCaseSearch) || false)
            )
            setFilteredSongs(filtered)
        }
    }, [searchTerm, songs])

    const handleSelectSong = (songId: number) => {
        setSelectedSongs(prev => {
            const newSet = new Set(prev)
            if (newSet.has(songId)) {
                newSet.delete(songId)
            } else {
                newSet.add(songId)
            }
            return newSet
        })
    }

    const handleSelectAll = () => {
        if (selectedSongs.size === filteredSongs.length) {
            // Bỏ chọn tất cả
            setSelectedSongs(new Set())
        } else {
            // Chọn tất cả bài hát trong danh sách đã lọc
            const newSelected = new Set<number>()
            filteredSongs.forEach(song => {
                newSelected.add(song.id)
            })
            setSelectedSongs(newSelected)
        }
    }

    const handleAddSelectedToPlaylist = async () => {
        if (selectedSongs.size === 0) {
            toast({
                title: "Thông báo",
                description: "Vui lòng chọn ít nhất một bài hát để thêm vào playlist.",
            })
            return
        }

        try {
            setAddingSongs(true)
            let successCount = 0
            let failCount = 0

            // Thêm từng bài hát vào playlist
            for (const songId of selectedSongs) {
                if (!playlistSongs.has(songId) && !recentlyAdded.has(songId)) {
                    const success = await addSongToPlaylist(playlistId, songId.toString())
                    if (success) {
                        successCount++
                        // Cập nhật danh sách bài hát vừa thêm và bài hát đã có trong playlist
                        setRecentlyAdded(prev => new Set(prev).add(songId))
                        setPlaylistSongs(prev => new Set(prev).add(songId))
                    } else {
                        failCount++
                    }
                } else {
                    // Bài hát đã có trong playlist
                    failCount++
                }
            }

            // Cập nhật số lượng bài hát đã thêm thành công để hiển thị
            setAddedCount(prev => prev + successCount)

            // Hiển thị thông báo
            if (successCount > 0) {
                toast({
                    title: "Thành công",
                    description: `Đã thêm ${successCount} bài hát vào playlist "${currentPlaylist?.name}".`,
                })
            }

            if (failCount > 0) {
                toast({
                    description: `${failCount} bài hát đã có trong playlist hoặc không thể thêm.`,
                })
            }

            // Xóa lựa chọn sau khi thêm
            setSelectedSongs(new Set())
        } catch (error) {
            console.error("Lỗi khi thêm bài hát vào playlist:", error)
            toast({
                title: "Lỗi",
                description: "Không thể thêm bài hát vào playlist. Vui lòng thử lại sau.",
                variant: "destructive",
            })
        } finally {
            setAddingSongs(false)
        }
    }

    const handleFinishAndReturn = () => {
        if (addedCount > 0) {
            // Hiển thị thông báo nếu đã thêm ít nhất 1 bài hát
            toast({
                title: "Hoàn tất",
                description: `Đã thêm ${addedCount} bài hát vào playlist "${currentPlaylist?.name}".`,
            })
        }
        // Chuyển hướng về trang chi tiết playlist
        router.push(`/playlist/${playlistId}`)
    }

    return (
        <div className="container mx-auto px-6 py-8">
            <div className="flex items-center gap-4 mb-6">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.push(`/playlist/${playlistId}`)}
                    className="rounded-full"
                >
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-2xl font-bold">Thêm bài hát vào playlist</h1>
                <span className="text-green-500 font-medium">
                    {currentPlaylist?.name}
                </span>
                {addedCount > 0 && (
                    <span className="bg-green-500/20 text-green-500 text-sm px-2 py-1 rounded-md flex items-center gap-1">
                        <Check className="h-3.5 w-3.5" />
                        Đã thêm {addedCount} bài hát
                    </span>
                )}
            </div>

            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
                        <Input
                            placeholder="Tìm kiếm bài hát theo tên, nghệ sĩ hoặc album..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 pr-4 bg-zinc-800 border-zinc-700"
                        />
                    </div>
                    <Button
                        onClick={handleAddSelectedToPlaylist}
                        disabled={selectedSongs.size === 0 || addingSongs}
                        className="bg-green-500 hover:bg-green-600 text-black"
                    >
                        {addingSongs ? (
                            <>Đang thêm...</>
                        ) : (
                            <>
                                <Plus className="h-4 w-4 mr-2" />
                                Thêm {selectedSongs.size} bài hát đã chọn
                            </>
                        )}
                    </Button>
                    <Button
                        onClick={handleFinishAndReturn}
                        variant="outline"
                        className="border-zinc-700"
                    >
                        <Check className="h-4 w-4 mr-2" />
                        Hoàn tất
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
                        <div className="grid grid-cols-12 px-4 py-2 border-b border-zinc-800 text-sm font-medium text-zinc-400">
                            <div className="col-span-1 flex items-center">
                                <Checkbox
                                    id="select-all"
                                    checked={selectedSongs.size > 0 && selectedSongs.size === filteredSongs.length}
                                    onCheckedChange={handleSelectAll}
                                    className="rounded-sm h-4 w-4"
                                />
                            </div>
                            <div className="col-span-1 text-center">#</div>
                            <div className="col-span-5">Bài hát</div>
                            <div className="col-span-3">Album</div>
                            <div className="col-span-2 text-right">Thời lượng</div>
                        </div>

                        <div className="space-y-1 py-2">
                            {filteredSongs.length > 0 ? (
                                filteredSongs.map((song, index) => {
                                    const isInPlaylist = playlistSongs.has(song.id) || recentlyAdded.has(song.id);
                                    const isSelected = selectedSongs.has(song.id);

                                    return (
                                        <div key={song.id} className="group">
                                            <div className="grid grid-cols-12 px-4 py-2 rounded-md group-hover:bg-zinc-800/50">
                                                <div className="col-span-1 flex items-center">
                                                    {isInPlaylist ? (
                                                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                                                    ) : (
                                                        <Checkbox
                                                            id={`song-${song.id}`}
                                                            checked={isSelected}
                                                            onCheckedChange={() => handleSelectSong(song.id)}
                                                            className="rounded-sm h-4 w-4"
                                                        />
                                                    )}
                                                </div>
                                                <div className="col-span-1 flex items-center justify-center text-sm text-zinc-400">
                                                    {index + 1}
                                                </div>
                                                <div className="col-span-5">
                                                    <SongRow
                                                        song={song}
                                                        index={index}
                                                        songs={filteredSongs}
                                                        isActive={currentSong?.id === song.id}
                                                        hideOptions={true}
                                                    />
                                                </div>
                                                <div className="col-span-3 flex items-center text-sm text-zinc-400">
                                                    {song.album?.title || "Single"}
                                                </div>
                                                <div className="col-span-2 flex items-center justify-end text-sm text-zinc-400">
                                                    {typeof song.duration === 'number'
                                                        ? `${Math.floor(song.duration / 60)}:${(song.duration % 60).toString().padStart(2, '0')}`
                                                        : song.duration}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })
                            ) : (
                                <div className="text-center py-8 text-zinc-400">
                                    {searchTerm
                                        ? `Không tìm thấy bài hát nào phù hợp với "${searchTerm}"`
                                        : "Không có bài hát nào"}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
} 