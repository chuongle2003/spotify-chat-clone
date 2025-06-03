"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { SongCard, SongType } from "@/components/music/SongCard"
import { AlbumCard, AlbumType } from "@/components/music/AlbumCard"
import { musicApi } from "@/app/api/music"
import { usePlayer } from "@/components/player/PlayerContext"

export default function HomePage() {
    const [trendingSongs, setTrendingSongs] = useState<SongType[]>([])
    const [popularAlbums, setPopularAlbums] = useState<AlbumType[]>([])
    const [loading, setLoading] = useState(true)
    const { play } = usePlayer()

    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true)
                // Lấy danh sách bài hát thịnh hành
                const songsResponse = await musicApi.getSongs({ limit: 6 })
                setTrendingSongs(songsResponse.data)

                // Lấy danh sách album phổ biến
                const albumsResponse = await musicApi.getAlbums({ limit: 6 })
                setPopularAlbums(albumsResponse.data)
            } catch (error) {
                console.error("Lỗi khi lấy dữ liệu:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [])

    const handlePlaySong = (song: SongType) => {
        play(song, trendingSongs)
    }

    return (
        <main className="p-8">
            <section className="mb-10">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">Những bài hát thịnh hành</h2>
                    <Link href="/songs" className="text-sm text-zinc-400 hover:text-white flex items-center">
                        Hiển thị tất cả
                        <ChevronRight className="h-4 w-4 ml-1" />
                    </Link>
                </div>

                {loading ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        {[...Array(6)].map((_, index) => (
                            <div key={index} className="bg-zinc-800/40 rounded-md aspect-square animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        {trendingSongs.map((song) => (
                            <SongCard
                                key={song.id}
                                song={song}
                                onPlay={() => handlePlaySong(song)}
                            />
                        ))}
                    </div>
                )}
            </section>

            <section>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">Nghệ sĩ phổ biến</h2>
                    <Link href="/albums" className="text-sm text-zinc-400 hover:text-white flex items-center">
                        Hiển thị tất cả
                        <ChevronRight className="h-4 w-4 ml-1" />
                    </Link>
                </div>

                {loading ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        {[...Array(6)].map((_, index) => (
                            <div key={index} className="bg-zinc-800/40 rounded-md aspect-square animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        {popularAlbums.map((album) => (
                            <AlbumCard key={album.id} album={album} />
                        ))}
                    </div>
                )}
            </section>
        </main>
    )
} 