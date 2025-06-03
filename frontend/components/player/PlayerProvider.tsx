"use client"

import { ReactNode, useState, useCallback, useEffect, useRef, createContext, useContext } from "react"
import { PlayerContext } from "./PlayerContext"
import { LoginPromptAlert } from "@/components/ui/LoginPromptAlert"
import { usePlayer } from "./PlayerContext"
import { SongType } from "@/components/music/SongCard"
import { toast } from "@/components/ui/use-toast"
import postmanApi from "@/lib/api/postman"

// Hàm xử lý URL cho file âm thanh và hình ảnh
const getDirectMediaUrl = (url: string | undefined | null) => {
    if (!url) return "/placeholder.jpg";

    // Nếu là URL đầy đủ, trả về nguyên bản
    if (url.startsWith('http')) {
        // console.log("URL đầy đủ:", url);
        return url;
    }

    // Kiểm tra xử lý các ký tự đặc biệt trong URL, đặc biệt là ký tự tiếng Việt
    try {
        // Đảm bảo URL được mã hóa đúng
        const encodedPath = url.split('/').map(segment =>
            // Chỉ mã hóa các phần chưa được mã hóa
            segment.includes('%') ? segment : encodeURIComponent(segment)
        ).join('/');

        // Sử dụng domain backend của server Nginx
        const fullUrl = `https://spotifybackend.shop${encodedPath.startsWith('/') ? '' : '/'}${encodedPath}`;
        // console.log("URL sau khi xử lý:", fullUrl);

        // Ghi chú: URL này có thể truy cập trực tiếp không cần token
        // Token chỉ được sử dụng để ghi nhận lượt phát trong postmanApi.music.playSong()

        return fullUrl;
    } catch (error) {
        console.error("Lỗi khi xử lý URL:", error);
        // Nếu có lỗi, vẫn trả về URL gốc
        return `https://spotifybackend.shop${url.startsWith('/') ? '' : '/'}${url}`;
    }
}

function PlayerControls({ children }: { children: ReactNode }) {
    const { isLoginPromptOpen, closeLoginPrompt } = usePlayer()

    return (
        <>
            {children}
            <LoginPromptAlert isOpen={isLoginPromptOpen} onClose={closeLoginPrompt} />
        </>
    )
}

export function PlayerProvider({ children }: { children: ReactNode }) {
    const [currentSong, setCurrentSong] = useState<SongType | null>(null)
    const [playlist, setPlaylist] = useState<SongType[]>([])
    const [isPlaying, setIsPlaying] = useState(false)
    const [currentIndex, setCurrentIndex] = useState(-1)
    const [isLoginPromptOpen, setIsLoginPromptOpen] = useState(false)
    const [isShuffle, setIsShuffle] = useState(false)
    const [repeatMode, setRepeatMode] = useState(0) // 0: off, 1: repeat all, 2: repeat one
    const [originalPlaylist, setOriginalPlaylist] = useState<SongType[]>([]) // Lưu trữ playlist gốc trước khi shuffle

    // Shuffle một mảng
    const shuffleArray = useCallback((array: SongType[]) => {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    }, []);

    // Đảm bảo LocalStorage chỉ được gọi phía client
    const checkAuthBeforePlaying = useCallback((song: SongType, songs: SongType[] = []): boolean => {
        let isAuthenticated = false;

        // Kiểm tra xem người dùng đã đăng nhập chưa
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem("spotify_token")
            isAuthenticated = !!token;
        }

        // Cho phép xem demo mà không cần đăng nhập
        // Chỉ hiển thị thông báo đăng nhập nhưng vẫn cho phép phát nhạc
        if (!isAuthenticated) {
            // Nếu chưa đăng nhập, hiển thị thông báo đăng nhập
            setIsLoginPromptOpen(true)
            // Trả về true để vẫn cho phép phát nhạc
            return true
        }

        return true
    }, [])

    // Đảm bảo không thể truy cập trong quá trình SSR
    useEffect(() => {
        // Chỉ thực hiện trên môi trường client
    }, [])

    const play = useCallback((song: SongType, songs?: SongType[]) => {
        // Cập nhật URL trực tiếp cho file âm thanh
        const processedSong = {
            ...song,
            file_url: getDirectMediaUrl(song.file_url),
            image_url: getDirectMediaUrl(song.image_url)
        };

        setCurrentSong(processedSong);

        if (songs && songs.length > 0) {
            // Xử lý URL cho toàn bộ playlist
            const processedSongs = songs.map(s => ({
                ...s,
                file_url: getDirectMediaUrl(s.file_url),
                image_url: getDirectMediaUrl(s.image_url)
            }));

            // Lưu trữ danh sách gốc
            setOriginalPlaylist(processedSongs);

            // Áp dụng shuffle nếu cần
            if (isShuffle) {
                const shuffledSongs = shuffleArray(processedSongs);
                setPlaylist(shuffledSongs);
                // Đảm bảo bài hát hiện tại ở vị trí đầu tiên
                const songIndex = shuffledSongs.findIndex(s => s.id === song.id);
                if (songIndex > 0) {
                    [shuffledSongs[0], shuffledSongs[songIndex]] = [shuffledSongs[songIndex], shuffledSongs[0]];
                    setPlaylist(shuffledSongs);
                }
                setCurrentIndex(0);
            } else {
                setPlaylist(processedSongs);
                // Tìm index của bài hát trong danh sách
                const songIndex = processedSongs.findIndex(s => s.id === song.id);
                setCurrentIndex(songIndex !== -1 ? songIndex : 0);
            }
        } else {
            // Nếu không có danh sách, thêm bài hát hiện tại vào playlist
            setPlaylist([processedSong]);
            setOriginalPlaylist([processedSong]);
            setCurrentIndex(0);
        }

        setIsPlaying(true);
    }, [isShuffle, shuffleArray]);

    const pause = useCallback(() => {
        // Chỉ thay đổi trạng thái isPlaying, không thay đổi bất kỳ thông tin nào khác
        setIsPlaying(false);
    }, []);

    const resume = useCallback(() => {
        if (currentSong) {
            // Đảm bảo không thay đổi thời gian hoặc bài hát khi resume
            setIsPlaying(true);
        }
    }, [currentSong]);

    const togglePlay = useCallback(() => {
        if (isPlaying) {
            pause()
        } else {
            resume()
        }
    }, [isPlaying, pause, resume])

    const playNext = useCallback(() => {
        if (playlist.length === 0 || currentIndex === -1) return;

        // Xử lý repeat mode
        if (currentIndex === playlist.length - 1 && repeatMode === 0) {
            // Nếu là bài cuối cùng và không lặp lại, dừng phát nhạc
            setIsPlaying(false);
            return;
        }

        const nextIndex = (currentIndex + 1) % playlist.length;
        setCurrentIndex(nextIndex);
        setCurrentSong(playlist[nextIndex]);
        setIsPlaying(true);
    }, [playlist, currentIndex, repeatMode]);

    const playPrevious = useCallback(() => {
        if (playlist.length === 0 || currentIndex === -1) return;

        const prevIndex = (currentIndex - 1 + playlist.length) % playlist.length;
        setCurrentIndex(prevIndex);
        setCurrentSong(playlist[prevIndex]);
        setIsPlaying(true);
    }, [playlist, currentIndex]);

    const toggleShuffle = useCallback(() => {
        const newShuffleState = !isShuffle;
        setIsShuffle(newShuffleState);

        // Nếu có danh sách phát
        if (playlist.length > 0) {
            if (newShuffleState) {
                // Bật shuffle
                const currentSongId = currentSong?.id;
                const shuffledPlaylist = shuffleArray(playlist);

                // Đảm bảo bài hát hiện tại được giữ lại ở vị trí hiện tại
                const currentSongIndexInShuffled = shuffledPlaylist.findIndex(
                    song => song.id === currentSongId
                );

                if (currentSongIndexInShuffled !== -1 && currentIndex !== -1) {
                    // Hoán đổi vị trí để bài hát hiện tại vẫn ở index hiện tại
                    [shuffledPlaylist[currentIndex], shuffledPlaylist[currentSongIndexInShuffled]] =
                        [shuffledPlaylist[currentSongIndexInShuffled], shuffledPlaylist[currentIndex]];
                }

                setPlaylist(shuffledPlaylist);
            } else {
                // Tắt shuffle, quay lại danh sách gốc
                if (originalPlaylist.length > 0) {
                    const currentSongId = currentSong?.id;
                    // Tìm vị trí của bài hát hiện tại trong danh sách gốc
                    const newIndex = originalPlaylist.findIndex(song => song.id === currentSongId);
                    setPlaylist(originalPlaylist);
                    if (newIndex !== -1) {
                        setCurrentIndex(newIndex);
                    }
                }
            }
        }
    }, [isShuffle, playlist, currentSong, currentIndex, originalPlaylist, shuffleArray]);

    const toggleRepeat = useCallback(() => {
        setRepeatMode((prevMode) => (prevMode + 1) % 3);
    }, []);

    const addToQueue = useCallback((song: SongType) => {
        const processedSong = {
            ...song,
            file_url: getDirectMediaUrl(song.file_url),
            image_url: getDirectMediaUrl(song.image_url)
        };
        setPlaylist(prev => [...prev, processedSong]);

        // Cập nhật cả danh sách gốc
        setOriginalPlaylist(prev => [...prev, processedSong]);
    }, []);

    const removeFromQueue = useCallback((index: number) => {
        if (index < 0 || index >= playlist.length) return;

        // Không thể xóa bài hát đang phát
        if (index === currentIndex) {
            toast({
                title: "Không thể xóa",
                description: "Không thể xóa bài hát đang phát",
                variant: "destructive",
            });
            return;
        }

        // Xóa khỏi playlist
        setPlaylist(prev => {
            const newPlaylist = [...prev];
            newPlaylist.splice(index, 1);
            return newPlaylist;
        });

        // Cập nhật currentIndex nếu bài hát bị xóa nằm trước bài hát hiện tại
        if (index < currentIndex) {
            setCurrentIndex(prev => prev - 1);
        }

        // Cập nhật playlist gốc tương ứng
        const currentSongId = playlist[index].id;
        setOriginalPlaylist(prev => {
            const songIndex = prev.findIndex(song => song.id === currentSongId);
            if (songIndex !== -1) {
                const newOriginal = [...prev];
                newOriginal.splice(songIndex, 1);
                return newOriginal;
            }
            return prev;
        });
    }, [playlist, currentIndex]);

    const clearQueue = useCallback(() => {
        // Giữ lại bài hát hiện tại nếu có
        if (currentSong) {
            setPlaylist([currentSong]);
            setOriginalPlaylist([currentSong]);
            setCurrentIndex(0);
        } else {
            setPlaylist([]);
            setOriginalPlaylist([]);
            setCurrentIndex(-1);
            setCurrentSong(null);
            setIsPlaying(false);
        }
    }, [currentSong]);

    const likeSong = useCallback(async (songId: number | string) => {
        try {
            // Kiểm tra đăng nhập
            if (typeof window !== 'undefined') {
                const token = localStorage.getItem("spotify_token");
                if (!token) {
                    setIsLoginPromptOpen(true);
                    return false;
                }

                // Gọi API để thêm/xóa bài hát khỏi yêu thích
                const response = await postmanApi.music.likeSong(String(songId));
                const isLiked = response.status === "liked";

                // Phát sự kiện để các trang khác (như trang favorites) có thể lắng nghe
                const event = new CustomEvent('favoriteChanged', {
                    detail: { songId: String(songId), isLiked }
                });
                document.dispatchEvent(event);

                return true;
            }
            return false;
        } catch (error) {
            console.error("Lỗi khi thích bài hát:", error);
            return false;
        }
    }, []);

    const closeLoginPrompt = useCallback(() => {
        setIsLoginPromptOpen(false);
    }, []);

    const providerValue = {
        currentSong,
        playlist,
        isPlaying,
        isLoginPromptOpen,
        isShuffle,
        repeatMode,
        play,
        pause,
        resume,
        playNext,
        playPrevious,
        togglePlay,
        toggleShuffle,
        toggleRepeat,
        setRepeatMode: setRepeatMode,
        addToQueue,
        removeFromQueue,
        clearQueue,
        likeSong,
        closeLoginPrompt,
        checkAuthBeforePlaying,
        getDirectMediaUrl
    };

    return (
        <PlayerContext.Provider value={providerValue}>
            <PlayerControls>{children}</PlayerControls>
        </PlayerContext.Provider>
    );
} 