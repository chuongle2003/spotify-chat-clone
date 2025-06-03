"use client"

import {
    createContext,
    useContext,
    ReactNode,
    useState,
    useEffect,
    useCallback,
    useMemo
} from "react"
import { useAuth } from "@/context/auth-context"
import { toast } from "@/components/ui/use-toast"
import { SongType } from "@/components/music/SongCard"
import { api } from "@/lib/api"
import postmanApi from "@/lib/api/postman"

type FavoriteContextType = {
    favoriteSongs: SongType[]
    isLoading: boolean
    isFavorite: (songId: string | number) => boolean
    toggleFavorite: (song: SongType) => Promise<boolean>
    addToFavorites: (song: SongType) => Promise<boolean>
    removeFromFavorites: (song: SongType) => Promise<boolean>
    refreshFavorites: () => Promise<void>
    fetchUserLibrary: () => Promise<any>
    fetchSongDetails: (songId: string | number) => Promise<SongType | null>
}

const FavoriteContext = createContext<FavoriteContextType | undefined>(undefined)

export function FavoriteProvider({ children }: { children: ReactNode }) {
    const { user, isAuthenticated } = useAuth()
    const [favoriteSongs, setFavoriteSongs] = useState<SongType[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

    // Thêm phương thức fetchUserLibrary
    const fetchUserLibrary = useCallback(async () => {
        if (!isAuthenticated) return null

        try {
            // Sử dụng postmanApi thay vì gọi fetch trực tiếp
            const response = await postmanApi.music.getLibrary();

            // Xử lý dữ liệu trả về đảm bảo là mảng
            if (!response) {
                console.error('Dữ liệu trả về từ API là null hoặc undefined');
                return [];
            }

            // Đảm bảo dữ liệu trả về là một mảng
            if (Array.isArray(response)) {
                return response;
            } else if (response && typeof response === 'object') {
                // Nếu response là object, thử trích xuất mảng
                if (Array.isArray(response.songs)) {
                    return response.songs;
                } else if (Array.isArray(response.items)) {
                    return response.items;
                } else if (Array.isArray(response.results)) {
                    return response.results;
                }
            }

            console.error('Dữ liệu trả về không phải là mảng:', response);
            return [];
        } catch (error) {
            console.error('Lỗi khi lấy thư viện người dùng:', error)
            toast({
                title: "Lỗi",
                description: "Không thể lấy thư viện người dùng. Vui lòng thử lại sau.",
                variant: "destructive",
            })
            return []
        }
    }, [isAuthenticated])

    // Lấy danh sách bài hát yêu thích khi người dùng đăng nhập
    useEffect(() => {
        if (isAuthenticated) {
            refreshFavorites()
        } else {
            // Xóa cache khi người dùng đăng xuất
            setFavoriteSongs([])
            localStorage.removeItem('favoriteSongs')
        }
    }, [isAuthenticated])

    // Lấy danh sách yêu thích từ API
    const fetchFavorites = useCallback(async () => {
        try {
            setIsLoading(true)
            // Sử dụng postmanApi thay vì gọi fetch trực tiếp
            const response = await postmanApi.music.getLibrary();

            // Kiểm tra dữ liệu trả về
            if (!response) {
                console.error('Dữ liệu trả về từ API là null hoặc undefined');
                return [];
            }

            // Đảm bảo dữ liệu trả về là một mảng hoặc object có thuộc tính favorites
            if (Array.isArray(response)) {
                return response;
            } else if (response && typeof response === 'object') {
                // Nếu response là object, thử trích xuất mảng favorites
                if (Array.isArray(response.favorites)) {
                    return response.favorites;
                } else if (Array.isArray(response.songs)) {
                    return response.songs;
                } else if (Array.isArray(response.items)) {
                    return response.items;
                } else if (Array.isArray(response.results)) {
                    return response.results;
                } else {
                    // Nếu không tìm thấy mảng nào phù hợp, log lỗi và trả về mảng rỗng
                    console.error('Không tìm thấy mảng bài hát yêu thích trong dữ liệu:', response);
                    return [];
                }
            }

            console.error('Dữ liệu trả về không phải là mảng hoặc object:', response);
            return [];
        } catch (error) {
            console.error('Lỗi khi lấy danh sách bài hát yêu thích:', error)
            return []
        } finally {
            setIsLoading(false)
        }
    }, [])

    // Làm mới danh sách bài hát yêu thích
    const refreshFavorites = useCallback(async () => {
        if (!isAuthenticated) return

        try {
            setIsLoading(true)
            // Thực hiện chức năng caching
            const cachedFavs = localStorage.getItem('favoriteSongs')
            const cachedTime = localStorage.getItem('favoriteSongsTime')

            // Nếu có cache và dưới 5 phút, sử dụng cache
            if (cachedFavs && cachedTime) {
                const timeElapsed = Date.now() - parseInt(cachedTime)
                if (timeElapsed < 300000) { // 5 phút
                    setFavoriteSongs(JSON.parse(cachedFavs))
                    setLastUpdated(new Date(parseInt(cachedTime)))
                    setIsLoading(false)
                    return
                }
            }

            // Không có cache hoặc cache đã cũ, gọi API
            const favorites = await fetchFavorites()
            setFavoriteSongs(favorites)

            // Lưu vào cache
            localStorage.setItem('favoriteSongs', JSON.stringify(favorites))
            localStorage.setItem('favoriteSongsTime', Date.now().toString())
            setLastUpdated(new Date())
        } catch (error) {
            console.error('Lỗi khi làm mới danh sách bài hát yêu thích:', error)
        } finally {
            setIsLoading(false)
        }
    }, [isAuthenticated, fetchFavorites])

    // Kiểm tra xem bài hát có trong danh sách yêu thích không
    const isFavorite = useCallback((songId: string | number) => {
        if (!Array.isArray(favoriteSongs)) {
            console.error('favoriteSongs không phải là mảng:', favoriteSongs);
            return false;
        }
        return favoriteSongs.some(song => song && song.id && song.id.toString() === songId.toString());
    }, [favoriteSongs])

    // Thêm bài hát vào danh sách yêu thích
    const addToFavorites = useCallback(async (song: SongType) => {
        if (!isAuthenticated) {
            toast({
                title: "Yêu cầu đăng nhập",
                description: "Vui lòng đăng nhập để thêm bài hát vào danh sách yêu thích.",
                variant: "destructive",
            })
            return false
        }

        // Kiểm tra song_id hợp lệ
        if (!song?.id) {
            toast({
                title: "Lỗi",
                description: "ID bài hát không hợp lệ",
                variant: "destructive",
            })
            return false
        }

        try {
            // Gọi API để thêm vào yêu thích
            await postmanApi.music.addToFavorites(song.id.toString())

            // Cập nhật state và cache
            const currentFavorites = Array.isArray(favoriteSongs) ? favoriteSongs : [];

            // Kiểm tra xem bài hát đã có trong danh sách chưa
            if (!currentFavorites.some(s => s.id === song.id)) {
                // Kiểm tra xem song có đầy đủ thông tin không
                let songToAdd = song;

                // Nếu thiếu thông tin quan trọng, gọi API để lấy thông tin chi tiết
                if (!song.title || !song.artist || !song.image_url) {
                    try {
                        const songDetails = await postmanApi.music.getSong(song.id.toString());
                        if (songDetails) {
                            songToAdd = songDetails;
                        }
                    } catch (error) {
                        console.error('Lỗi khi lấy thông tin chi tiết bài hát:', error);
                        // Vẫn tiếp tục sử dụng thông tin hiện có
                    }
                }

                const updatedFavorites = [...currentFavorites, songToAdd];
                setFavoriteSongs(updatedFavorites)

                // Cập nhật cache trong localStorage
                localStorage.setItem('favoriteSongs', JSON.stringify(updatedFavorites))
                localStorage.setItem('favoriteSongsTime', Date.now().toString())
                setLastUpdated(new Date())

                // Phát sự kiện để các trang khác có thể lắng nghe
                dispatchFavoriteChangeEvent(song.id.toString(), true)
            }

            toast({
                title: "Đã thêm vào yêu thích",
                description: `Bài hát "${song.title}" đã được thêm vào danh sách yêu thích.`,
            })

            return true
        } catch (error) {
            console.error('Lỗi khi thêm bài hát vào yêu thích:', error)
            toast({
                title: "Lỗi",
                description: "Không thể thêm bài hát vào yêu thích. Vui lòng thử lại sau.",
                variant: "destructive",
            })
            return false
        }
    }, [isAuthenticated, favoriteSongs, setLastUpdated])

    // Xóa bài hát khỏi danh sách yêu thích
    const removeFromFavorites = useCallback(async (song: SongType) => {
        if (!isAuthenticated) return false

        // Kiểm tra song_id hợp lệ
        if (!song?.id) {
            toast({
                title: "Lỗi",
                description: "ID bài hát không hợp lệ",
                variant: "destructive",
            })
            return false
        }

        try {
            await postmanApi.music.removeFromFavorites(song.id.toString())

            // Cập nhật state và cache
            if (!Array.isArray(favoriteSongs)) {
                console.error('favoriteSongs không phải là mảng:', favoriteSongs);
                setFavoriteSongs([]);
                localStorage.removeItem('favoriteSongs');
                return true;
            }

            const updatedFavorites = favoriteSongs.filter(s => s.id !== song.id)
            setFavoriteSongs(updatedFavorites)

            // Cập nhật cache trong localStorage
            localStorage.setItem('favoriteSongs', JSON.stringify(updatedFavorites))
            localStorage.setItem('favoriteSongsTime', Date.now().toString())
            setLastUpdated(new Date())

            // Phát sự kiện để các trang khác có thể lắng nghe
            dispatchFavoriteChangeEvent(song.id.toString(), false)

            toast({
                title: "Đã xóa khỏi yêu thích",
                description: `Bài hát "${song.title}" đã được xóa khỏi danh sách yêu thích.`,
            })

            return true
        } catch (error) {
            console.error('Lỗi khi xóa bài hát khỏi yêu thích:', error)
            toast({
                title: "Lỗi",
                description: "Không thể xóa bài hát khỏi yêu thích. Vui lòng thử lại sau.",
                variant: "destructive",
            })
            return false
        }
    }, [isAuthenticated, favoriteSongs, setLastUpdated])

    // Thay đổi trạng thái yêu thích (toggle)
    const toggleFavorite = useCallback(async (song: SongType) => {
        if (!isAuthenticated) {
            toast({
                title: "Yêu cầu đăng nhập",
                description: "Vui lòng đăng nhập để thao tác với danh sách yêu thích.",
                variant: "destructive",
            })
            return false
        }

        // Kiểm tra song_id hợp lệ
        if (!song?.id) {
            toast({
                title: "Lỗi",
                description: "ID bài hát không hợp lệ",
                variant: "destructive",
            })
            return false
        }

        try {
            // Sử dụng API toggle đã có sẵn
            const response = await postmanApi.music.likeSong(song.id.toString())
            const result = response.status === "liked"

            // Kiểm tra và đảm bảo favoriteSongs là mảng
            const currentFavorites = Array.isArray(favoriteSongs) ? favoriteSongs : [];

            // Cập nhật state và cache dựa trên kết quả từ API
            let updatedFavorites
            if (result) {
                // Kiểm tra xem bài hát đã có trong danh sách chưa
                if (!currentFavorites.some(s => s.id === song.id)) {
                    // Đã thêm vào yêu thích
                    updatedFavorites = [...currentFavorites, song]
                } else {
                    updatedFavorites = currentFavorites;
                }

                toast({
                    title: "Đã thêm vào yêu thích",
                    description: `Bài hát "${song.title}" đã được thêm vào danh sách yêu thích.`,
                })
            } else {
                // Đã xóa khỏi yêu thích
                updatedFavorites = currentFavorites.filter(s => s && s.id && s.id !== song.id)
                toast({
                    title: "Đã xóa khỏi yêu thích",
                    description: `Bài hát "${song.title}" đã được xóa khỏi danh sách yêu thích.`,
                })
            }

            setFavoriteSongs(updatedFavorites)

            // Cập nhật cache trong localStorage
            localStorage.setItem('favoriteSongs', JSON.stringify(updatedFavorites))
            localStorage.setItem('favoriteSongsTime', Date.now().toString())
            setLastUpdated(new Date())

            // Phát sự kiện để các trang khác có thể lắng nghe
            dispatchFavoriteChangeEvent(song.id.toString(), result)

            return result
        } catch (error) {
            console.error('Lỗi khi thao tác với yêu thích:', error)
            toast({
                title: "Lỗi",
                description: "Không thể thực hiện thao tác. Vui lòng thử lại sau.",
                variant: "destructive",
            })
            return false
        }
    }, [isAuthenticated, favoriteSongs, setLastUpdated])

    // Thêm hàm phát sự kiện khi có thay đổi yêu thích
    const dispatchFavoriteChangeEvent = useCallback((songId: string, isLiked: boolean) => {
        // Tạo sự kiện tùy chỉnh
        const event = new CustomEvent('favoriteChanged', {
            detail: { songId, isLiked }
        });

        // Phát sự kiện để các component khác có thể lắng nghe
        document.dispatchEvent(event);
    }, []);

    // Thêm hàm lấy thông tin chi tiết bài hát
    const fetchSongDetails = useCallback(async (songId: string | number): Promise<SongType | null> => {
        try {
            // Kiểm tra xem bài hát có trong cache không
            if (Array.isArray(favoriteSongs)) {
                const cachedSong = favoriteSongs.find(s => s.id.toString() === songId.toString());
                if (cachedSong) {
                    return cachedSong;
                }
            }

            // Nếu không có trong cache, gọi API để lấy thông tin
            const response = await postmanApi.music.getSong(songId.toString());

            if (!response) {
                console.error('Không thể lấy thông tin bài hát:', songId);
                return null;
            }

            return response;
        } catch (error) {
            console.error('Lỗi khi lấy thông tin bài hát:', error);
            return null;
        }
    }, [favoriteSongs]);

    // Memoize context value để tránh re-render không cần thiết
    const contextValue = useMemo(() => ({
        favoriteSongs,
        isLoading,
        isFavorite,
        toggleFavorite,
        addToFavorites,
        removeFromFavorites,
        refreshFavorites,
        fetchUserLibrary,
        fetchSongDetails
    }), [
        favoriteSongs,
        isLoading,
        isFavorite,
        toggleFavorite,
        addToFavorites,
        removeFromFavorites,
        refreshFavorites,
        fetchUserLibrary,
        fetchSongDetails
    ])

    return (
        <FavoriteContext.Provider value={contextValue}>
            {children}
        </FavoriteContext.Provider>
    )
}

// Hook để dễ dàng sử dụng context
export function useFavorite() {
    const context = useContext(FavoriteContext)

    if (context === undefined) {
        throw new Error('useFavorite phải được sử dụng trong FavoriteProvider')
    }

    return context
} 