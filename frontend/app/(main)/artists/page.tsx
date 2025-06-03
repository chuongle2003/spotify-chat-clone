"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Play, Search, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

// Interface cho Artist
interface Artist {
    id: string
    name: string
    bio?: string
    image?: string
    songs_count: number
    play_count?: number
}

export default function ArtistsPage() {
    const [artists, setArtists] = useState<Artist[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState("")
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const { toast } = useToast()

    // Fetch artists
    useEffect(() => {
        const fetchArtists = async () => {
            try {
                setLoading(true)
                setError(null)

                // Fetch artists list
                const response = await fetch(`https://spotifybackend.shop/api/v1/music/artists/?page=${currentPage}&search=${searchTerm}`)
                if (!response.ok) {
                    throw new Error(`Lỗi khi tải danh sách nghệ sĩ: ${response.status}`)
                }

                const data = await response.json()

                // Check if the response has pagination format
                if (data.results && Array.isArray(data.results)) {
                    setArtists(data.results)
                    setTotalPages(Math.ceil(data.count / 20))
                } else if (Array.isArray(data)) {
                    // Handle case when API returns just an array
                    setArtists(data)
                    setTotalPages(1)
                }
            } catch (error) {
                console.error("Lỗi khi tải danh sách nghệ sĩ:", error)
                setError("Không thể tải danh sách nghệ sĩ. Vui lòng thử lại sau.")
                toast({
                    title: "Lỗi",
                    description: "Không thể tải danh sách nghệ sĩ. Vui lòng thử lại sau.",
                    variant: "destructive",
                })
            } finally {
                setLoading(false)
            }
        }

        fetchArtists()
    }, [currentPage, searchTerm, toast])

    // Handle page change
    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page)
        }
    }

    // Handle search
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        setCurrentPage(1) // Reset to first page when searching
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6">Nghệ sĩ</h1>

            {/* Search */}
            <form onSubmit={handleSearch} className="mb-8">
                <div className="relative max-w-md">
                    <Input
                        type="text"
                        placeholder="Tìm kiếm nghệ sĩ..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-zinc-800/70 border-zinc-700 focus:border-green-500 pr-10"
                    />
                    <Button
                        type="submit"
                        size="icon"
                        className="absolute right-0 top-0 bg-transparent hover:bg-transparent text-zinc-400"
                    >
                        <Search className="h-5 w-5" />
                    </Button>
                </div>
            </form>

            {/* Loading state */}
            {loading && (
                <div className="flex justify-center items-center h-40">
                    <Loader2 className="h-8 w-8 animate-spin text-green-500" />
                    <span className="ml-2 text-lg">Đang tải danh sách nghệ sĩ...</span>
                </div>
            )}

            {/* Error state */}
            {error && !loading && (
                <div className="bg-red-900/20 border border-red-800 rounded-md p-6 text-center">
                    <p className="text-red-200">{error}</p>
                    <Button
                        variant="outline"
                        className="mt-4 text-red-200 border-red-800 hover:bg-red-800/20"
                        onClick={() => setCurrentPage(1)}
                    >
                        Thử lại
                    </Button>
                </div>
            )}

            {/* Artists grid */}
            {!loading && !error && (
                <>
                    {artists.length === 0 ? (
                        <div className="text-center py-16 bg-zinc-800/30 rounded-lg">
                            <p className="text-zinc-400 mb-4">Không tìm thấy nghệ sĩ nào</p>
                            {searchTerm && (
                                <Button
                                    variant="outline"
                                    onClick={() => setSearchTerm("")}
                                >
                                    Xóa tìm kiếm
                                </Button>
                            )}
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                                {artists.map((artist) => (
                                    <Link
                                        href={`/artist/${artist.id}`}
                                        key={artist.id}
                                        className="bg-zinc-800/30 rounded-lg p-4 hover:bg-zinc-800/50 transition group"
                                    >
                                        <div className="relative mx-auto w-full aspect-square max-w-[200px] mb-4">
                                            <Image
                                                src={artist.image || "/artist-placeholder.svg"}
                                                alt={artist.name}
                                                fill
                                                className="rounded-full object-cover"
                                            />
                                            <Button
                                                size="icon"
                                                className="absolute bottom-2 right-2 rounded-full bg-green-500 text-black opacity-0 group-hover:opacity-100 transition shadow-lg"
                                            >
                                                <Play className="h-5 w-5 ml-0.5" />
                                            </Button>
                                        </div>
                                        <h3 className="font-semibold text-center truncate">{artist.name}</h3>
                                        {artist.bio && (
                                            <p className="text-sm text-zinc-400 text-center mt-1 line-clamp-2">
                                                {artist.bio.substring(0, 100) + '...'}
                                            </p>
                                        )}
                                        <p className="text-sm text-zinc-400 text-center mt-1">
                                            {artist.play_count ? `${artist.play_count.toLocaleString()} lượt nghe` :
                                                (artist.songs_count ? `${artist.songs_count} bài hát` : 'Nghệ sĩ')}
                                        </p>
                                    </Link>
                                ))}
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex justify-center mt-8 gap-2">
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
                                            // Show pages near current page, first and last page
                                            return page === 1 ||
                                                page === totalPages ||
                                                Math.abs(page - currentPage) <= 1;
                                        })
                                        .map((page, index, array) => {
                                            // Add ellipsis if needed
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
                </>
            )}
        </div>
    )
} 