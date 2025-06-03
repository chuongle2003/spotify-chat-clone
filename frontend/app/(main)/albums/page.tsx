"use client"

import { useEffect, useState } from "react"
import { AlbumType } from "@/components/music/AlbumCard"
import { AlbumCard } from "@/components/music/AlbumCard"
import { api } from "@/lib/api"
import { useAuth } from "@/context/auth-context"
import { useRouter } from "next/navigation"

export default function AlbumsPage() {
    const [albums, setAlbums] = useState<AlbumType[]>([])
    const [loading, setLoading] = useState(true)
    const { user } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!user) {
            router.push("/")
            return
        }

        async function fetchAlbums() {
            try {
                setLoading(true)
                const albumsData = await api.albums.getAlbums()
                // Chuyển đổi dữ liệu từ API về định dạng AlbumType
                const formattedAlbums = albumsData.map((album: any) => ({
                    id: album.id,
                    title: album.title,
                    release_date: album.release_date || new Date().toISOString(),
                    cover_image: album.cover_image,
                    artist: {
                        id: typeof album.artist === "string" ? 0 : album.artist?.id || 0,
                        name: typeof album.artist === "string" ? album.artist : album.artist?.name || "Unknown Artist",
                        avatar: null
                    },
                    songs_count: album.songs_count || 0,
                    created_at: album.created_at || new Date().toISOString(),
                    updated_at: album.updated_at || new Date().toISOString()
                }));
                setAlbums(formattedAlbums)
            } catch (error) {
                console.error("Lỗi khi lấy danh sách album:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchAlbums()
    }, [user, router])

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Tất cả album</h1>

            {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {[...Array(10)].map((_, i) => (
                        <div key={i} className="aspect-square bg-zinc-800/40 rounded-md animate-pulse" />
                    ))}
                </div>
            ) : albums.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {albums.map((album) => (
                        <AlbumCard key={album.id} album={album} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-10">
                    <p className="text-zinc-400 mb-4">Không có album nào được tìm thấy</p>
                </div>
            )}
        </div>
    )
} 