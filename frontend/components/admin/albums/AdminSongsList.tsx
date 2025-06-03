"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Play, Search } from "lucide-react"
import Image from "next/image"
import { useToast } from "@/components/ui/use-toast"
import { AdminAlbum } from "@/lib/api/services/AdminAlbumService"
import { AdminSong } from "@/lib/api/services/AdminSongService"

interface AdminSongsListProps {
    isOpen: boolean
    onClose: () => void
    album: AdminAlbum | null
    albumService: any
}

export default function AdminSongsList({
    isOpen,
    onClose,
    album,
    albumService,
}: AdminSongsListProps) {
    const { toast } = useToast()
    const [loading, setLoading] = useState(true)
    const [songs, setSongs] = useState<AdminSong[]>([])
    const [albumSongs, setAlbumSongs] = useState<AdminSong[]>([])
    const [selectedSongs, setSelectedSongs] = useState<number[]>([])
    const [searchQuery, setSearchQuery] = useState("")
    const [isSaving, setIsSaving] = useState(false)

    // Tải danh sách tất cả bài hát và bài hát trong album
    useEffect(() => {
        const fetchData = async () => {
            if (!album || !isOpen) return

            try {
                setLoading(true)

                // Lấy danh sách bài hát trong album
                const albumSongsResponse = await albumService.getAlbumSongs(album.id)
                setAlbumSongs(albumSongsResponse.results || [])

                // Lấy danh sách tất cả bài hát (giả định có api.adminSongs.getSongs())
                // const allSongsResponse = await api.adminSongs.getSongs()
                // setSongs(allSongsResponse.results || [])

                // Giả lập - trong thực tế, bạn cần lấy danh sách từ API
                setSongs([
                    {
                        id: 1,
                        title: "Chúng Ta Của Hiện Tại",
                        artist: { id: 1, name: "Sơn Tùng M-TP" },
                        album: { id: 1, title: "Chúng Ta Của Hiện Tại (Single)" },
                        duration: 289,
                        file_path: "https://example.com/song1.mp3",
                        cover_image: "/placeholder.svg?height=60&width=60&text=ST",
                        created_at: new Date().toISOString(),
                    },
                    {
                        id: 2,
                        title: "Có Chắc Yêu Là Đây",
                        artist: { id: 1, name: "Sơn Tùng M-TP" },
                        album: { id: 2, title: "Có Chắc Yêu Là Đây (Single)" },
                        duration: 218,
                        file_path: "https://example.com/song2.mp3",
                        cover_image: "/placeholder.svg?height=60&width=60&text=ST",
                        created_at: new Date().toISOString(),
                    },
                    {
                        id: 3,
                        title: "Chạy Ngay Đi",
                        artist: { id: 1, name: "Sơn Tùng M-TP" },
                        album: { id: 3, title: "Chạy Ngay Đi (Single)" },
                        duration: 248,
                        file_path: "https://example.com/song3.mp3",
                        cover_image: "/placeholder.svg?height=60&width=60&text=ST",
                        created_at: new Date().toISOString(),
                    },
                ]);

                // Set danh sách ID bài hát đã chọn
                setSelectedSongs(albumSongsResponse.results.map((song: AdminSong) => song.id))
            } catch (error) {
                console.error("Lỗi khi tải dữ liệu:", error)
                toast({
                    title: "Lỗi",
                    description: "Không thể tải danh sách bài hát",
                    variant: "destructive",
                })
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [album, isOpen, albumService])

    const handleSaveSongs = async () => {
        if (!album) return

        try {
            setIsSaving(true)

            // Xác định bài hát cần thêm và xóa
            const songsToRemove = albumSongs
                .filter(song => !selectedSongs.includes(song.id))
                .map(song => song.id)

            const songsToAdd = selectedSongs
                .filter(songId => !albumSongs.some(song => song.id === songId))

            // Gọi API để xóa bài hát
            for (const songId of songsToRemove) {
                await albumService.removeSongFromAlbum(album.id, songId)
            }

            // Gọi API để thêm bài hát
            for (const songId of songsToAdd) {
                await albumService.addSongToAlbum(album.id, songId)
            }

            toast({
                title: "Thành công",
                description: "Đã cập nhật danh sách bài hát trong album",
            })

            onClose()
        } catch (error) {
            console.error("Lỗi khi cập nhật bài hát trong album:", error)
            toast({
                title: "Lỗi",
                description: "Có lỗi xảy ra khi cập nhật bài hát trong album",
                variant: "destructive",
            })
        } finally {
            setIsSaving(false)
        }
    }

    const toggleSongSelection = (songId: number) => {
        if (selectedSongs.includes(songId)) {
            setSelectedSongs(selectedSongs.filter(id => id !== songId))
        } else {
            setSelectedSongs([...selectedSongs, songId])
        }
    }

    const filteredSongs = songs.filter(song =>
        song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        song.artist.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-zinc-900 text-white border-zinc-800 max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Quản lý bài hát trong album</DialogTitle>
                    <DialogDescription className="text-zinc-400">
                        {album && `Chọn bài hát cho album "${album.title}"`}
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
                        <Input
                            placeholder="Tìm kiếm bài hát..."
                            className="pl-10 bg-zinc-800 border-zinc-700 text-white"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {loading ? (
                        <div className="text-center py-8 text-zinc-500">Đang tải dữ liệu...</div>
                    ) : (
                        <ScrollArea className="h-[400px] pr-4">
                            <div className="space-y-2">
                                {filteredSongs.length === 0 ? (
                                    <div className="text-center py-4 text-zinc-500">Không tìm thấy bài hát nào</div>
                                ) : (
                                    filteredSongs.map((song) => (
                                        <div key={song.id} className="flex items-center gap-3 p-3 bg-zinc-800 rounded-md">
                                            <Checkbox
                                                id={`song-${song.id}`}
                                                checked={selectedSongs.includes(song.id)}
                                                onCheckedChange={() => toggleSongSelection(song.id)}
                                            />
                                            <Image
                                                src={song.cover_image || "/placeholder.svg?height=40&width=40"}
                                                width={40}
                                                height={40}
                                                alt={song.title}
                                                className="rounded"
                                            />
                                            <div className="flex-1">
                                                <label htmlFor={`song-${song.id}`} className="font-medium cursor-pointer">
                                                    {song.title}
                                                </label>
                                                <div className="text-xs text-zinc-400">{song.artist.name}</div>
                                            </div>
                                            <Button variant="ghost" size="icon" className="rounded-full">
                                                <Play className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </ScrollArea>
                    )}
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={isSaving}
                        className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
                    >
                        Hủy
                    </Button>
                    <Button
                        onClick={handleSaveSongs}
                        disabled={loading || isSaving}
                        className="bg-green-600 text-white hover:bg-green-700"
                    >
                        {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
} 