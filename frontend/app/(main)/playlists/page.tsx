"use client"

import { useEffect, useState } from "react"
import { PlaylistType } from "@/components/music/PlaylistCard"
import { PlaylistCard } from "@/components/music/PlaylistCard"
import { postmanApi } from "@/lib/api/postman"
import { useAuth } from "@/context/auth-context"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"

// Định nghĩa kiểu dữ liệu API trả về
interface PlaylistApiResponse {
    id: number;
    name: string;
    description?: string;
    is_public: boolean;
    cover_image?: string | null;
    user?: {
        id: number;
        username: string;
    };
    songs_count?: number;
    created_at?: string;
    updated_at?: string;
}

interface FeaturedPlaylistsResponse {
    playlists: PlaylistApiResponse[];
    total: number;
    page: number;
    page_size: number;
}

export default function PlaylistsPage() {
    const [playlists, setPlaylists] = useState<PlaylistType[]>([])
    const [featuredPlaylists, setFeaturedPlaylists] = useState<PlaylistType[]>([])
    const [myPlaylists, setMyPlaylists] = useState<PlaylistType[]>([])
    const [loading, setLoading] = useState(true)
    const { user } = useAuth()
    const router = useRouter()
    const { toast } = useToast()

    useEffect(() => {
        if (!user) {
            router.push("/")
            return
        }

        async function fetchPlaylists() {
            try {
                setLoading(true)

                // Biến để lưu dữ liệu
                let playlistsData = [];
                let featuredData: { playlists: PlaylistApiResponse[]; total: number; page: number; page_size: number; } = {
                    playlists: [],
                    total: 0,
                    page: 1,
                    page_size: 20
                };

                try {
                    // Lấy tất cả playlist
                    const response = await postmanApi.music.getPlaylists();

                    // Kiểm tra dữ liệu trả về có đúng định dạng không
                    if (!Array.isArray(response)) {
                        console.error("Dữ liệu playlists không phải là mảng:", response);
                        // Nếu không phải là mảng, kiểm tra xem có phải là định dạng phân trang không
                        if (response && typeof response === 'object' && 'results' in response && Array.isArray(response.results)) {
                            playlistsData = response.results as PlaylistApiResponse[];
                        } else {
                            // Nếu không, sử dụng mock data
                            playlistsData = getUserPlaylists();
                        }
                    } else {
                        playlistsData = response as PlaylistApiResponse[];
                    }
                } catch (error) {
                    console.error("Lỗi khi lấy playlists:", error);
                    // Mock data nếu API gặp lỗi
                    playlistsData = getUserPlaylists();
                }

                try {
                    // Lấy playlist nổi bật
                    featuredData = await postmanApi.music.getFeaturedPlaylists() as FeaturedPlaylistsResponse;
                    // Đảm bảo dữ liệu trả về có định dạng đúng
                    if (!featuredData || !featuredData.playlists) {
                        console.error("Dữ liệu featured playlists không đúng định dạng:", featuredData);
                        featuredData = {
                            playlists: getFeaturedPlaylists(),
                            total: 10,
                            page: 1,
                            page_size: 20
                        };
                    }
                } catch (error) {
                    console.error("Lỗi khi lấy featured playlists:", error);
                    // Mock data nếu API gặp lỗi
                    featuredData = {
                        playlists: getFeaturedPlaylists(),
                        total: 10,
                        page: 1,
                        page_size: 20
                    };
                }

                // Chuyển đổi định dạng dữ liệu cho phù hợp với PlaylistType
                const formatApiPlaylist = (playlist: PlaylistApiResponse): PlaylistType => ({
                    id: playlist.id,
                    name: playlist.name,
                    description: playlist.description || "",
                    is_public: playlist.is_public,
                    cover_image: playlist.cover_image || null,
                    user: {
                        id: playlist.user?.id || 0,
                        username: playlist.user?.username || "Unknown User",
                        avatar: null
                    },
                    songs_count: playlist.songs_count || 0,
                    created_at: playlist.created_at || new Date().toISOString(),
                    updated_at: playlist.updated_at || new Date().toISOString()
                })

                // Định dạng dữ liệu playlist
                const formattedPlaylists = Array.isArray(playlistsData)
                    ? playlistsData.map((playlist: PlaylistApiResponse) => formatApiPlaylist(playlist))
                    : [];

                // Định dạng dữ liệu playlist nổi bật
                const formattedFeatured = featuredData && featuredData.playlists && Array.isArray(featuredData.playlists)
                    ? featuredData.playlists.map((playlist: PlaylistApiResponse) => formatApiPlaylist(playlist))
                    : [];

                // Lọc playlist của người dùng hiện tại
                const currentUserPlaylists = formattedPlaylists.filter(
                    (playlist) => user && String(playlist.user.id) === String(user.id)
                )

                setPlaylists(formattedPlaylists)
                setFeaturedPlaylists(formattedFeatured)
                setMyPlaylists(currentUserPlaylists)
            } catch (error) {
                console.error("Lỗi khi lấy danh sách playlist:", error)
                toast({
                    title: "Lỗi",
                    description: "Không thể tải danh sách playlist. Vui lòng thử lại sau.",
                    variant: "destructive",
                })
            } finally {
                setLoading(false)
            }
        }

        // Hàm tạo mock data cho các playlists nếu API gặp lỗi
        function getUserPlaylists(): PlaylistApiResponse[] {
            return [
                {
                    id: 1,
                    name: "Nhạc Chill Cuối Tuần",
                    description: "Những bài hát nhẹ nhàng, thư giãn cho cuối tuần",
                    is_public: true,
                    cover_image: "https://spotifybackend.shop/media/covers/2025/05/01/M%E1%BA%A5t_K%E1%BA%BFt_N%E1%BB%91i.jpg",
                    user: {
                        id: user?.id ? Number(user.id) : 11,
                        username: user?.username || "admin"
                    },
                    songs_count: 15,
                    created_at: "2025-05-03T15:21:47.958044Z",
                    updated_at: "2025-05-03T15:21:47.970474Z",
                },
                {
                    id: 2,
                    name: "Top hits 2025",
                    description: "Những bài hát được nghe nhiều nhất năm 2025",
                    is_public: true,
                    cover_image: "https://spotifybackend.shop/media/covers/2025/05/01/Wrong_Times.jpg",
                    user: {
                        id: user?.id ? Number(user.id) : 11,
                        username: user?.username || "admin"
                    },
                    songs_count: 20,
                    created_at: "2025-05-03T15:21:47.932170Z",
                    updated_at: "2025-05-03T15:21:47.953474Z",
                }
            ];
        }

        // Hàm tạo mock data cho featured playlists nếu API gặp lỗi
        function getFeaturedPlaylists(): PlaylistApiResponse[] {
            return [
                {
                    id: 61,
                    name: "Nhạc Trịnh Công Sơn #2",
                    description: "Tuyển tập nhạc Trịnh Công Sơn hay nhất",
                    is_public: true,
                    cover_image: "https://spotifybackend.shop/media/covers/2025/05/01/S%C3%A0i_G%C3%B2n_Bu%E1%BB%93n_Qu%C3%A1_Em_%C6%A0i_Jazzhop.jpg",
                    user: {
                        id: 39,
                        username: "newuser1"
                    },
                    songs_count: 10,
                    created_at: "2025-05-03T15:21:47.826733Z",
                    updated_at: "2025-05-03T15:21:47.847073Z",
                },
                {
                    id: 64,
                    name: "Top hits 2025 #2",
                    description: "Những bài hát được nghe nhiều nhất năm 2025",
                    is_public: true,
                    cover_image: "https://spotifybackend.shop/media/covers/2025/05/01/%E1%BB%9E_Trong_Th%C3%A0nh_Ph%E1%BB%91_Masew_Mix.jpg",
                    user: {
                        id: 40,
                        username: "newuser2"
                    },
                    songs_count: 12,
                    created_at: "2025-05-03T15:21:47.892160Z",
                    updated_at: "2025-05-03T15:21:47.912351Z",
                }
            ];
        }

        fetchPlaylists()
    }, [user, router, toast])

    const handleCreatePlaylist = () => {
        router.push("/create-playlist")
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold">Playlists</h1>
                <Button
                    onClick={handleCreatePlaylist}
                    className="bg-green-500 hover:bg-green-600 text-black"
                >
                    <Plus className="h-4 w-4 mr-2" /> Tạo Playlist
                </Button>
            </div>

            <Tabs defaultValue="all" className="w-full">
                <TabsList className="mb-6">
                    <TabsTrigger value="all">Tất cả</TabsTrigger>
                    <TabsTrigger value="featured">Nổi bật</TabsTrigger>
                    <TabsTrigger value="my-playlists">Playlist của tôi</TabsTrigger>
                </TabsList>

                <TabsContent value="all">
                    {loading ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                            {[...Array(10)].map((_, i) => (
                                <div key={i} className="aspect-square bg-zinc-800/40 rounded-md animate-pulse" />
                            ))}
                        </div>
                    ) : playlists.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                            {playlists.map((playlist) => (
                                <PlaylistCard key={playlist.id} playlist={playlist} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10">
                            <p className="text-zinc-400 mb-4">Không có playlist nào được tìm thấy</p>
                            <Button onClick={handleCreatePlaylist}>Tạo playlist mới</Button>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="featured">
                    {loading ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                            {[...Array(10)].map((_, i) => (
                                <div key={i} className="aspect-square bg-zinc-800/40 rounded-md animate-pulse" />
                            ))}
                        </div>
                    ) : featuredPlaylists.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                            {featuredPlaylists.map((playlist) => (
                                <PlaylistCard key={playlist.id} playlist={playlist} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10">
                            <p className="text-zinc-400">Không có playlist nổi bật nào</p>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="my-playlists">
                    {loading ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="aspect-square bg-zinc-800/40 rounded-md animate-pulse" />
                            ))}
                        </div>
                    ) : myPlaylists.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                            {myPlaylists.map((playlist) => (
                                <PlaylistCard key={playlist.id} playlist={playlist} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10">
                            <p className="text-zinc-400 mb-4">Bạn chưa có playlist nào</p>
                            <Button onClick={handleCreatePlaylist}>Tạo playlist đầu tiên</Button>
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    )
} 