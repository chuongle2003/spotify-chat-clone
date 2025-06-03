"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { useRouter, useParams } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { PlayIcon, ShuffleIcon, Clock, Heart, MoreHorizontal, UserPlus, ShareIcon, Pencil, Plus, PlusCircle, Globe, Lock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { usePlayer } from "@/components/player/PlayerContext"
import postmanApi from "@/lib/api/postman"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import PlaylistFollowersModal from "@/components/music/PlaylistFollowersModal"
import PlaylistPrivacyToggle from "@/components/music/PlaylistPrivacyToggle"
import PlaylistSharingComponent from "@/components/music/PlaylistSharingComponent"
import DeletePlaylistButton from "@/components/music/DeletePlaylistButton"
import { usePlaylist } from "@/context/playlist-context"

interface Song {
    id: string
    title: string
    artist: any
    album?: string
    duration: number
    audio_url?: string
    audio_file?: string
    cover_image?: string
    play_count?: number
    likes_count?: number
    is_liked?: boolean
}

interface Playlist {
    id: string | number
    name: string
    description?: string
    is_public: boolean
    cover_image: string | null
    user?: {
        id: number | string
        username: string
        avatar: string | null
    }
    songs_count: number
    created_at: string
    updated_at: string
    songs?: Song[]
    is_following?: boolean
}

export default function PlaylistPage() {
    const params = useParams()
    const playlistId = params?.id as string
    const router = useRouter()
    const { user } = useAuth()
    const { toast } = useToast()
    const { play, isPlaying, currentSong, pause, resume, addToQueue } = usePlayer()
    const {
        currentPlaylist,
        getPlaylist,
        isLoading,
        followPlaylist,
        unfollowPlaylist,
        togglePlaylistPrivacy,
        removeSongFromPlaylist
    } = usePlaylist()

    const [isFollowing, setIsFollowing] = useState(false)
    const [isOwner, setIsOwner] = useState(false)
    const [privacyStatus, setPrivacyStatus] = useState<boolean>(true)
    const [followersCount, setFollowersCount] = useState<number>(0)
    const [songs, setSongs] = useState<Song[]>([])

    useEffect(() => {
        if (!user) {
            router.push("/")
            return
        }

        if (!playlistId) return

        // Tải chi tiết playlist
        const fetchPlaylistDetails = async () => {
            try {
                // Thêm tham số để biết là mã này chỉ chạy một lần
                const loadingFlag = isLoading;
                if (!loadingFlag) return; // Đã tải rồi thì không tải lại nữa

                const playlist = await getPlaylist(playlistId)

                if (!playlist) {
                    toast({
                        title: "Lỗi",
                        description: "Không thể tải thông tin playlist. Vui lòng thử lại sau.",
                        variant: "destructive",
                    })
                    return
                }

                // Kiểm tra xem user hiện tại có phải là chủ sở hữu không
                if (playlist.user && user) {
                    const isUserOwner = String(playlist.user.id) === String(user.id);
                    console.log('DEBUG: User ID:', user.id, 'Playlist Owner ID:', playlist.user.id, 'IsOwner:', isUserOwner);
                    setIsOwner(isUserOwner)
                }

                // Lưu trạng thái public và số lượng người theo dõi
                setPrivacyStatus(playlist.is_public)
                setFollowersCount(playlist.followers_count || 0)
                setIsFollowing(!!playlist.is_following)

                // Xử lý danh sách bài hát
                if (playlist.songs && playlist.songs.length > 0) {
                    setSongs(playlist.songs)
                }
            } catch (error) {
                console.error("Lỗi khi tải thông tin playlist:", error)
                toast({
                    title: "Lỗi",
                    description: "Không thể tải thông tin playlist. Vui lòng thử lại sau.",
                    variant: "destructive",
                })
            }
        }

        fetchPlaylistDetails()
    }, [playlistId, user, router, toast, getPlaylist, isLoading])

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = Math.floor(seconds % 60)
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return new Intl.DateTimeFormat('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }).format(date)
    }

    const handlePlayAll = () => {
        if (songs.length > 0) {
            // Định dạng lại các bài hát để phù hợp với định dạng SongType
            const songsToPlay = songs.map(song => ({
                id: Number(song.id),
                title: song.title,
                duration: formatTime(song.duration),
                file_url: song.audio_url || song.audio_file || '',
                image_url: song.cover_image || currentPlaylist?.cover_image || '/placeholder-song.jpg',
                album: song.album ? {
                    id: 0,
                    title: song.album
                } : null,
                artist: {
                    id: typeof song.artist === 'string' ? 0 : Number(song.artist?.id || 0),
                    name: typeof song.artist === 'string' ? song.artist : song.artist?.name || 'Unknown Artist',
                    avatar: typeof song.artist === 'string' ? null : song.artist?.avatar
                },
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }))

            // Gọi hàm play
            if (songsToPlay.length > 0) {
                play(songsToPlay[0], songsToPlay)
            }

            // Hiển thị thông báo
            toast({
                title: "Đang phát",
                description: `Playlist: ${currentPlaylist?.name}`,
            })
        }
    }

    const handlePlaySong = (index: number) => {
        if (songs.length > index) {
            // Định dạng lại các bài hát để phù hợp với định dạng SongType
            const songsToPlay = songs.map(song => ({
                id: Number(song.id),
                title: song.title,
                duration: formatTime(song.duration),
                file_url: song.audio_url || song.audio_file || '',
                image_url: song.cover_image || currentPlaylist?.cover_image || '/placeholder-song.jpg',
                album: song.album ? {
                    id: 0,
                    title: song.album
                } : null,
                artist: {
                    id: typeof song.artist === 'string' ? 0 : Number(song.artist?.id || 0),
                    name: typeof song.artist === 'string' ? song.artist : song.artist?.name || 'Unknown Artist',
                    avatar: typeof song.artist === 'string' ? null : song.artist?.avatar
                },
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }))

            // Gọi hàm play với bài hát được chọn
            if (songsToPlay.length > index) {
                play(songsToPlay[index], songsToPlay)
            }

            // Hiển thị thông báo
            toast({
                title: "Đang phát",
                description: `${songs[index].title}`,
            })
        }
    }

    const handleShufflePlay = () => {
        if (songs.length > 0) {
            // Sắp xếp ngẫu nhiên danh sách nhạc
            const shuffledSongs = [...songs].sort(() => Math.random() - 0.5)

            // Định dạng lại các bài hát để phù hợp với định dạng SongType
            const songsToPlay = shuffledSongs.map(song => ({
                id: Number(song.id),
                title: song.title,
                duration: formatTime(song.duration),
                file_url: song.audio_url || song.audio_file || '',
                image_url: song.cover_image || currentPlaylist?.cover_image || '/placeholder-song.jpg',
                album: song.album ? {
                    id: 0,
                    title: song.album
                } : null,
                artist: {
                    id: typeof song.artist === 'string' ? 0 : Number(song.artist?.id || 0),
                    name: typeof song.artist === 'string' ? song.artist : song.artist?.name || 'Unknown Artist',
                    avatar: typeof song.artist === 'string' ? null : song.artist?.avatar
                },
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }))

            // Gọi hàm play với danh sách đã trộn
            if (songsToPlay.length > 0) {
                play(songsToPlay[0], songsToPlay)
            }

            // Hiển thị thông báo
            toast({
                title: "Đang phát ngẫu nhiên",
                description: `Playlist: ${currentPlaylist?.name}`,
            })
        }
    }

    const handleFollowPlaylist = async () => {
        try {
            if (isFollowing) {
                const success = await unfollowPlaylist(playlistId)

                if (success) {
                    setIsFollowing(false)
                    setFollowersCount(prev => Math.max(prev - 1, 0))

                    toast({
                        title: "Đã hủy theo dõi",
                        description: `Đã hủy theo dõi playlist "${currentPlaylist?.name}"`,
                    })
                }
            } else {
                const success = await followPlaylist(playlistId)

                if (success) {
                    setIsFollowing(true)
                    setFollowersCount(prev => prev + 1)

                    toast({
                        title: "Đã theo dõi",
                        description: `Đã theo dõi playlist "${currentPlaylist?.name}"`,
                    })
                }
            }
        } catch (error) {
            console.error("Lỗi khi thay đổi trạng thái theo dõi:", error)
            toast({
                title: "Lỗi",
                description: "Không thể thay đổi trạng thái theo dõi. Vui lòng thử lại sau.",
                variant: "destructive",
            })
        }
    }

    const handleEditPlaylist = () => {
        router.push(`/playlist/${playlistId}/edit`)
    }

    const handleShare = async () => {
        // Đã có component PlaylistSharingComponent xử lý việc chia sẻ
    }

    const handleAddToQueue = (song: Song) => {
        // Chuyển đổi định dạng bài hát để phù hợp với SongType
        const songToQueue = {
            id: Number(song.id),
            title: song.title,
            duration: formatTime(song.duration),
            file_url: song.audio_url || song.audio_file || '',
            image_url: song.cover_image || currentPlaylist?.cover_image || '/placeholder-song.jpg',
            album: song.album ? {
                id: 0,
                title: song.album
            } : null,
            artist: {
                id: typeof song.artist === 'string' ? 0 : Number(song.artist?.id || 0),
                name: typeof song.artist === 'string' ? song.artist : song.artist?.name || 'Unknown Artist',
                avatar: typeof song.artist === 'string' ? null : song.artist?.avatar
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }

        // Thêm vào hàng đợi
        addToQueue(songToQueue);

        toast({
            title: "Đã thêm vào hàng đợi",
            description: `${song.title}`,
        })
    }

    const handleLikeSong = async (song: Song) => {
        try {
            // Gọi API để thích/bỏ thích bài hát
            const success = await postmanApi.music.likeSong(song.id);
            if (success) {
                // Cập nhật UI khi thích/bỏ thích thành công
                setSongs(prevSongs => prevSongs.map(s =>
                    s.id === song.id ? { ...s, is_liked: !s.is_liked } : s
                ));

                toast({
                    title: song.is_liked ? "Đã bỏ thích" : "Đã thích",
                    description: `${song.is_liked ? "Đã bỏ thích" : "Đã thích"} bài hát "${song.title}"`,
                });
            }
        } catch (error) {
            console.error("Lỗi khi thích bài hát:", error);
            toast({
                title: "Lỗi",
                description: "Không thể thích bài hát. Vui lòng thử lại sau.",
                variant: "destructive",
            });
        }
    };

    const handleRemoveSongFromPlaylist = async (song: Song) => {
        if (!isOwner || !currentPlaylist) return;

        try {
            const success = await removeSongFromPlaylist(String(currentPlaylist.id), String(song.id));

            if (success) {
                // Cập nhật UI sau khi xóa thành công
                setSongs(prevSongs => prevSongs.filter(s => s.id !== song.id));

                toast({
                    title: "Đã xóa khỏi playlist",
                    description: `Đã xóa "${song.title}" khỏi playlist "${currentPlaylist.name}"`,
                });
            } else {
                toast({
                    title: "Lỗi",
                    description: "Không thể xóa bài hát khỏi playlist. Vui lòng thử lại sau.",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error("Lỗi khi xóa bài hát khỏi playlist:", error);
            toast({
                title: "Lỗi",
                description: "Không thể xóa bài hát khỏi playlist. Vui lòng thử lại sau.",
                variant: "destructive",
            });
        }
    };

    const handlePrivacyChange = async (newStatus: boolean) => {
        try {
            const updatedPlaylist = await togglePlaylistPrivacy(playlistId);

            if (updatedPlaylist) {
                setPrivacyStatus(updatedPlaylist.is_public);

                // Hiển thị thông báo
                toast({
                    title: "Đã cập nhật",
                    description: updatedPlaylist.is_public
                        ? "Playlist của bạn đã chuyển sang chế độ công khai"
                        : "Playlist của bạn đã chuyển sang chế độ riêng tư",
                });
            }
        } catch (error) {
            console.error("Lỗi khi chuyển đổi chế độ riêng tư:", error);
            toast({
                title: "Lỗi",
                description: "Không thể chuyển đổi chế độ riêng tư. Vui lòng thử lại sau.",
                variant: "destructive",
            });
        }
    }

    const handleAddSongs = () => {
        router.push(`/playlist/${playlistId}/add-songs`)
    }

    return (
        <div>
            {isLoading ? (
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
                    {/* Header */}
                    <div className="flex flex-col md:flex-row gap-6 mb-8">
                        <div className="w-52 h-52 flex-shrink-0">
                            <div className="relative w-full h-full overflow-hidden rounded-lg shadow-lg">
                                <Image
                                    src={currentPlaylist?.cover_image || "/placeholder-playlist.jpg"}
                                    alt={currentPlaylist?.name || "Playlist"}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col justify-end">
                            <div className="flex items-center gap-2 mb-1">
                                <div className="text-sm font-medium">Playlist</div>
                                {isOwner ? (
                                    <PlaylistPrivacyToggle
                                        playlistId={playlistId}
                                        isPublic={privacyStatus}
                                        onToggle={handlePrivacyChange}
                                    />
                                ) : (
                                    <div className="text-sm text-zinc-400">
                                        {privacyStatus ? (
                                            <Globe className="h-3.5 w-3.5" />
                                        ) : (
                                            <Lock className="h-3.5 w-3.5" />
                                        )}
                                    </div>
                                )}
                            </div>
                            <h1 className="text-5xl font-extrabold mb-6">{currentPlaylist?.name}</h1>

                            {currentPlaylist?.description && (
                                <p className="text-zinc-400 mb-3">{currentPlaylist.description}</p>
                            )}

                            <div className="flex items-center gap-1 text-sm text-zinc-400">
                                <span className="font-medium text-white">
                                    {currentPlaylist?.user?.username || "Unknown User"}
                                </span>
                                <span>•</span>
                                <span>{songs.length} bài hát</span>
                                <span>•</span>
                                <span>Tạo ngày {currentPlaylist?.created_at ? formatDate(currentPlaylist.created_at) : "Unknown"}</span>
                                <span>•</span>
                                <PlaylistFollowersModal
                                    playlistId={playlistId}
                                    followersCount={followersCount}
                                />
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
                            <PlayIcon className="h-5 w-5" /> Phát
                        </Button>

                        <Button
                            onClick={handleShufflePlay}
                            variant="outline"
                            className="gap-2"
                        >
                            <ShuffleIcon className="h-5 w-5" />
                        </Button>

                        <Button
                            onClick={handleAddSongs}
                            variant="outline"
                            className="gap-2"
                        >
                            <Plus className="h-4 w-4" /> Thêm bài hát
                        </Button>

                        {isOwner ? (
                            <Button
                                onClick={handleEditPlaylist}
                                variant="outline"
                                size="sm"
                                className="gap-2"
                            >
                                <Pencil className="h-4 w-4" /> Sửa
                            </Button>
                        ) : (
                            <Button
                                onClick={handleFollowPlaylist}
                                variant={isFollowing ? "outline" : "default"}
                                size="sm"
                                className="gap-2"
                            >
                                {isFollowing ? "Đã theo dõi" : "Theo dõi"}
                            </Button>
                        )}

                        <PlaylistSharingComponent
                            playlistId={playlistId}
                            playlistName={currentPlaylist?.name || "Playlist"}
                            playlistCover={currentPlaylist?.cover_image || undefined}
                        />

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-10 w-10"
                                >
                                    <MoreHorizontal className="h-5 w-5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                {isOwner ? (
                                    <>
                                        <DropdownMenuItem onClick={handleEditPlaylist}>
                                            <Pencil className="h-4 w-4 mr-2" /> Sửa playlist
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem asChild>
                                            <DeletePlaylistButton
                                                playlistId={playlistId}
                                                playlistName={currentPlaylist?.name || "Playlist"}
                                                variant="ghost"
                                                className="w-full justify-start px-2 text-red-500 cursor-pointer hover:bg-transparent hover:text-red-600"
                                            />
                                        </DropdownMenuItem>
                                    </>
                                ) : (
                                    <DropdownMenuItem onClick={handleFollowPlaylist}>
                                        {isFollowing ? (
                                            <>
                                                <UserPlus className="h-4 w-4 mr-2" /> Hủy theo dõi
                                            </>
                                        ) : (
                                            <>
                                                <UserPlus className="h-4 w-4 mr-2" /> Theo dõi
                                            </>
                                        )}
                                    </DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {/* Songs list */}
                    {songs.length > 0 ? (
                        <div className="relative overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="text-sm text-zinc-400 border-b border-zinc-800">
                                    <tr>
                                        <th className="px-4 py-3 w-12">#</th>
                                        <th className="px-4 py-3">Tiêu đề</th>
                                        <th className="px-4 py-3">Album</th>
                                        <th className="px-4 py-3 text-center w-24">
                                            <Clock className="h-4 w-4 inline" />
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {songs.map((song, index) => (
                                        <tr
                                            key={song.id}
                                            className="hover:bg-zinc-800/50 text-sm group"
                                        >
                                            <td className="px-4 py-3 w-12 group-hover:bg-zinc-800/50">
                                                <div className="flex items-center justify-center h-full relative">
                                                    <span className="group-hover:hidden">{index + 1}</span>
                                                    <button
                                                        className="hidden group-hover:block"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handlePlaySong(index);
                                                        }}
                                                    >
                                                        <PlayIcon className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3" onClick={() => handlePlaySong(index)}>
                                                <div className="flex items-center gap-3">
                                                    <div className="flex-shrink-0 w-10 h-10 relative">
                                                        <Image
                                                            src={song.cover_image || "/placeholder-song.jpg"}
                                                            alt={song.title}
                                                            className="object-cover rounded-sm"
                                                            fill
                                                        />
                                                    </div>
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
                                            <td className="px-4 py-3 text-zinc-400">{song.album || "-"}</td>
                                            <td className="px-4 py-3 text-right flex items-center justify-end gap-2">
                                                <button
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleLikeSong(song);
                                                    }}
                                                >
                                                    <Heart className={`h-4 w-4 ${song.is_liked ? 'fill-red-500 text-red-500' : 'text-zinc-400 hover:text-white'}`} />
                                                </button>
                                                <span className="text-zinc-400">{formatTime(song.duration)}</span>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <button
                                                            className="opacity-0 group-hover:opacity-100 transition-opacity ml-2"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <MoreHorizontal className="h-4 w-4 text-zinc-400 hover:text-white" />
                                                        </button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-56 bg-zinc-800 border-zinc-700">
                                                        <DropdownMenuItem
                                                            className="text-white hover:bg-zinc-700 cursor-pointer"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleAddToQueue(song);
                                                            }}
                                                        >
                                                            <PlusCircle className="h-4 w-4 mr-2" /> Thêm vào hàng đợi
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="text-white hover:bg-zinc-700 cursor-pointer"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleLikeSong(song);
                                                            }}
                                                        >
                                                            <Heart className={`h-4 w-4 mr-2 ${song.is_liked ? 'fill-red-500 text-red-500' : ''}`} />
                                                            {song.is_liked ? 'Đã thích' : 'Thêm vào yêu thích'}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator className="bg-zinc-700" />
                                                        <DropdownMenuItem
                                                            className="text-white hover:bg-zinc-700 cursor-pointer"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                window.open(`/song/${song.id}`, '_blank');
                                                            }}
                                                        >
                                                            Chi tiết bài hát
                                                        </DropdownMenuItem>
                                                        {isOwner && (
                                                            <DropdownMenuItem
                                                                className="text-red-500 hover:bg-zinc-700 cursor-pointer"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleRemoveSongFromPlaylist(song);
                                                                }}
                                                            >
                                                                Xóa khỏi playlist
                                                            </DropdownMenuItem>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-zinc-900/30 rounded-lg">
                            <p className="text-zinc-400 mb-4">Playlist này chưa có bài hát nào</p>
                            <Button
                                onClick={() => router.push("/songs")}
                                className="bg-green-500 hover:bg-green-600 text-black"
                            >
                                Thêm bài hát
                            </Button>
                        </div>
                    )}
                </>
            )}
        </div>
    )
} 