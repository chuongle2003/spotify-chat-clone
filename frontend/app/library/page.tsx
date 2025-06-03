"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/auth-context"
import { useRouter } from "next/navigation"
import { postmanApi } from "@/lib/api/postman"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import {
  Heart,
  Clock,
  List,
  Music,
  Play,
  Pause,
  Plus,
  ListMusic,
  History,
  Grid
} from "lucide-react"

interface Song {
  id: string
  title: string
  artist: string
  duration: number
  cover_image: string
  audio_file: string
}

interface Playlist {
  id: string
  name: string
  description?: string
  cover_image?: string
  owner: string
  songs_count: number
  created_at: string
}

interface PlayHistory {
  id: string
  song: Song
  played_at: string
}

export default function LibraryPage() {
  const { user, isAuthenticated, loading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [likedSongs, setLikedSongs] = useState<Song[]>([])
  const [userPlaylists, setUserPlaylists] = useState<Playlist[]>([])
  const [playHistory, setPlayHistory] = useState<PlayHistory[]>([])
  const [currentlyPlaying, setCurrentlyPlaying] = useState<Song | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("all")
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null)
  const [allSongs, setAllSongs] = useState<Song[]>([])

  // Chuyển hướng nếu không đăng nhập
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login")
    }
  }, [isAuthenticated, loading, router])

  // Lấy dữ liệu thư viện
  useEffect(() => {
    if (isAuthenticated) {
      const fetchLibraryData = async () => {
        setIsLoading(true)
        try {
          // Lấy danh sách tất cả bài hát
          const songsData = await postmanApi.music.getSongs()
          setAllSongs(songsData.results || [])

          // Lấy danh sách bài hát đã thích
          const libraryData = await postmanApi.music.getLibrary()
          setLikedSongs(libraryData.liked_songs || [])

          // Lấy danh sách playlist của người dùng
          const playlistsData = await postmanApi.music.getPlaylists()
          setUserPlaylists(playlistsData.results || [])

          // Lấy lịch sử nghe
          const historyData = await postmanApi.music.getPlayHistory({
            page: 1,
            page_size: 30
          })
          setPlayHistory(historyData.results || [])
        } catch (error) {
          console.error("Error fetching library data:", error)
          toast({
            title: "Lỗi tải dữ liệu",
            description: "Không thể tải dữ liệu thư viện. Vui lòng thử lại sau.",
            variant: "destructive",
          })
        } finally {
          setIsLoading(false)
        }
      }

      fetchLibraryData()
    }
  }, [isAuthenticated, toast])

  // Xử lý phát nhạc
  const handlePlaySong = async (song: Song) => {
    try {
      if (currentlyPlaying?.id === song.id) {
        // Toggle play/pause nếu đang phát bài hát đó
        if (isPlaying) {
          audioElement?.pause()
        } else {
          audioElement?.play()
        }
        setIsPlaying(!isPlaying)
      } else {
        // Đổi bài hát
        if (audioElement) {
          audioElement.pause()
        }

        // Ghi nhận lượt phát
        await postmanApi.music.playSong(song.id)

        // Cập nhật trạng thái người dùng
        await postmanApi.music.updateUserStatus({
          currently_playing: song.id,
          is_listening: true,
          status_text: `Đang nghe ${song.title}`,
        })

        // Tạo audio element mới
        const audio = new Audio(song.audio_file)
        setAudioElement(audio)
        setCurrentlyPlaying(song)

        audio.onloadedmetadata = () => {
          audio.play()
          setIsPlaying(true)
        }

        audio.onended = () => {
          setIsPlaying(false)
        }
      }
    } catch (error) {
      console.error("Error playing song:", error)
      toast({
        title: "Lỗi phát nhạc",
        description: "Không thể phát bài hát. Vui lòng thử lại sau.",
        variant: "destructive",
      })
    }
  }

  // Xử lý bỏ thích bài hát
  const handleUnlikeSong = async (song: Song) => {
    try {
      await postmanApi.music.unlikeSong(song.id)

      // Cập nhật UI
      setLikedSongs(prev => prev.filter(s => s.id !== song.id))

      toast({
        title: "Đã bỏ thích",
        description: `"${song.title}" đã được xóa khỏi danh sách yêu thích`,
      })
    } catch (error) {
      console.error("Error unliking song:", error)
      toast({
        title: "Lỗi",
        description: "Không thể bỏ thích bài hát. Vui lòng thử lại sau.",
        variant: "destructive",
      })
    }
  }

  // Xử lý thêm vào hàng đợi
  const handleAddToQueue = async (song: Song) => {
    try {
      await postmanApi.music.addToQueue(song.id)
      toast({
        title: "Đã thêm vào hàng đợi",
        description: `Đã thêm "${song.title}" vào hàng đợi phát`,
      })
    } catch (error) {
      console.error("Error adding to queue:", error)
      toast({
        title: "Lỗi",
        description: "Không thể thêm vào hàng đợi. Vui lòng thử lại sau.",
        variant: "destructive",
      })
    }
  }

  // Tạo một playlist mới
  const handleCreatePlaylist = async () => {
    try {
      const name = prompt("Nhập tên playlist mới:")
      if (!name) return

      const newPlaylist = await postmanApi.music.createPlaylist({
        name,
        description: "",
        is_public: true
      })

      // Cập nhật UI
      setUserPlaylists(prev => [newPlaylist, ...prev])

      toast({
        title: "Playlist đã được tạo",
        description: `Playlist "${name}" đã được tạo thành công`,
      })
    } catch (error) {
      console.error("Error creating playlist:", error)
      toast({
        title: "Lỗi",
        description: "Không thể tạo playlist. Vui lòng thử lại sau.",
        variant: "destructive",
      })
    }
  }

  // Format thời gian
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Format thời gian lịch sử
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return 'Vừa xong'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút trước`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ trước`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} ngày trước`

    // Format date
    return date.toLocaleDateString('vi-VN')
  }

  // Xử lý thích bài hát
  const handleLikeSong = async (song: Song) => {
    try {
      await postmanApi.music.likeSong(song.id)
      toast({
        title: "Đã thích",
        description: `"${song.title}" đã được thêm vào danh sách yêu thích`,
      })

      // Thêm bài hát vào danh sách đã thích
      setLikedSongs(prev => [...prev, song])
    } catch (error) {
      console.error("Error liking song:", error)
      toast({
        title: "Lỗi",
        description: "Không thể thích bài hát. Vui lòng thử lại sau.",
        variant: "destructive",
      })
    }
  }

  // Loading state
  if (loading || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-zinc-900/80 backdrop-blur-sm border-b border-white/10 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="text-xl font-bold text-green-500">
              Spotify Clone
            </Link>
            <nav className="hidden md:flex space-x-4">
              <Link href="/dashboard" className="text-white/70 hover:text-green-500">
                Trang chủ
              </Link>
              <Link href="/library" className="text-white hover:text-green-500">
                Thư viện
              </Link>
              <Link href="/playlists" className="text-white/70 hover:text-green-500">
                Playlist
              </Link>
            </nav>
          </div>

          {user && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                {user.username || user.email}
              </span>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Thư viện của bạn</h1>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6 bg-zinc-800/40">
            <TabsTrigger value="all" className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-500">
              <Grid className="h-4 w-4 mr-2" />
              Tất cả
            </TabsTrigger>
            <TabsTrigger value="liked" className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-500">
              <Heart className="h-4 w-4 mr-2" />
              Bài hát đã thích
            </TabsTrigger>
            <TabsTrigger value="playlists" className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-500">
              <ListMusic className="h-4 w-4 mr-2" />
              Playlist của bạn
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-500">
              <History className="h-4 w-4 mr-2" />
              Lịch sử nghe
            </TabsTrigger>
          </TabsList>

          {/* Tất cả bài hát */}
          <TabsContent value="all">
            {allSongs.length > 0 ? (
              <div className="bg-zinc-900/30 rounded-md">
                <div className="grid grid-cols-[auto_1fr_auto_auto] gap-4 p-4 border-b border-white/5 text-sm text-zinc-400">
                  <div className="w-10 text-center">#</div>
                  <div>Tiêu đề</div>
                  <div className="w-32 text-right">Thời lượng</div>
                  <div className="w-20"></div>
                </div>

                {allSongs.map((song, index) => (
                  <div
                    key={song.id}
                    className="grid grid-cols-[auto_1fr_auto_auto] gap-4 p-4 hover:bg-white/5 items-center group"
                  >
                    <div className="w-10 text-center text-zinc-400">
                      <span className="group-hover:hidden">{index + 1}</span>
                      <button
                        className="hidden group-hover:block"
                        onClick={() => handlePlaySong(song)}
                      >
                        {currentlyPlaying?.id === song.id && isPlaying ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </button>
                    </div>

                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative h-10 w-10 flex-shrink-0">
                        {song.cover_image ? (
                          <Image
                            src={song.cover_image}
                            alt={song.title}
                            fill
                            className="object-cover rounded"
                          />
                        ) : (
                          <div className="h-10 w-10 bg-zinc-800 flex items-center justify-center rounded">
                            <Music className="h-5 w-5 text-zinc-500" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium truncate">{song.title}</div>
                        <div className="text-sm text-zinc-400 truncate">{song.artist}</div>
                      </div>
                    </div>

                    <div className="w-32 text-zinc-400 text-right">
                      {formatDuration(song.duration)}
                    </div>

                    <div className="w-20 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          const isLiked = likedSongs.some(likedSong => likedSong.id === song.id);
                          if (isLiked) {
                            handleUnlikeSong(song);
                          } else {
                            handleLikeSong(song);
                          }
                        }}
                        className="p-2 rounded-full hover:bg-white/10"
                        title={likedSongs.some(likedSong => likedSong.id === song.id) ? "Bỏ thích" : "Thích"}
                      >
                        {likedSongs.some(likedSong => likedSong.id === song.id) ? (
                          <Heart className="h-4 w-4 fill-green-500 text-green-500" />
                        ) : (
                          <Heart className="h-4 w-4" />
                        )}
                      </button>

                      <button
                        onClick={() => handleAddToQueue(song)}
                        className="p-2 rounded-full hover:bg-white/10"
                        title="Thêm vào hàng đợi"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-zinc-900/30 rounded-md">
                <Music className="h-16 w-16 mx-auto text-zinc-600 mb-4" />
                <h3 className="text-xl font-bold mb-2">Chưa có bài hát nào</h3>
                <p className="text-zinc-400 mb-6">Hãy thêm bài hát hoặc tìm kiếm bài hát mới</p>
                <Link href="/dashboard">
                  <Button className="bg-green-500 hover:bg-green-600 text-black font-bold">
                    Khám phá nhạc
                  </Button>
                </Link>
              </div>
            )}
          </TabsContent>

          {/* Bài hát đã thích */}
          <TabsContent value="liked">
            {likedSongs.length > 0 ? (
              <div className="bg-zinc-900/30 rounded-md">
                <div className="grid grid-cols-[auto_1fr_auto_auto] gap-4 p-4 border-b border-white/5 text-sm text-zinc-400">
                  <div className="w-10 text-center">#</div>
                  <div>Tiêu đề</div>
                  <div className="w-32 text-right">Thời lượng</div>
                  <div className="w-20"></div>
                </div>

                {likedSongs.map((song, index) => (
                  <div
                    key={song.id}
                    className="grid grid-cols-[auto_1fr_auto_auto] gap-4 p-4 hover:bg-white/5 items-center group"
                  >
                    <div className="w-10 text-center text-zinc-400">
                      <span className="group-hover:hidden">{index + 1}</span>
                      <button
                        className="hidden group-hover:block"
                        onClick={() => handlePlaySong(song)}
                      >
                        {currentlyPlaying?.id === song.id && isPlaying ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </button>
                    </div>

                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative h-10 w-10 flex-shrink-0">
                        {song.cover_image ? (
                          <Image
                            src={song.cover_image}
                            alt={song.title}
                            fill
                            className="object-cover rounded"
                          />
                        ) : (
                          <div className="h-10 w-10 bg-zinc-800 flex items-center justify-center rounded">
                            <Music className="h-5 w-5 text-zinc-500" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium truncate">{song.title}</div>
                        <div className="text-sm text-zinc-400 truncate">{song.artist}</div>
                      </div>
                    </div>

                    <div className="w-32 text-zinc-400 text-right">
                      {formatDuration(song.duration)}
                    </div>

                    <div className="w-20 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          const isLiked = likedSongs.some(likedSong => likedSong.id === song.id);
                          if (isLiked) {
                            handleUnlikeSong(song);
                          } else {
                            handleLikeSong(song);
                          }
                        }}
                        className="p-2 rounded-full hover:bg-white/10"
                        title={likedSongs.some(likedSong => likedSong.id === song.id) ? "Bỏ thích" : "Thích"}
                      >
                        {likedSongs.some(likedSong => likedSong.id === song.id) ? (
                          <Heart className="h-4 w-4 fill-green-500 text-green-500" />
                        ) : (
                          <Heart className="h-4 w-4" />
                        )}
                      </button>

                      <button
                        onClick={() => handleAddToQueue(song)}
                        className="p-2 rounded-full hover:bg-white/10"
                        title="Thêm vào hàng đợi"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-zinc-900/30 rounded-md">
                <Heart className="h-16 w-16 mx-auto text-zinc-600 mb-4" />
                <h3 className="text-xl font-bold mb-2">Chưa có bài hát nào được thích</h3>
                <p className="text-zinc-400 mb-6">Thích bài hát bằng cách nhấn biểu tượng trái tim</p>
                <Link href="/dashboard">
                  <Button className="bg-green-500 hover:bg-green-600 text-black font-bold">
                    Khám phá nhạc
                  </Button>
                </Link>
              </div>
            )}
          </TabsContent>

          {/* Playlist của bạn */}
          <TabsContent value="playlists">
            <div className="mb-6">
              <Button
                onClick={handleCreatePlaylist}
                className="bg-green-500 hover:bg-green-600 text-black font-bold"
              >
                <Plus className="h-4 w-4 mr-2" /> Tạo playlist mới
              </Button>
            </div>

            {userPlaylists.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {userPlaylists.map(playlist => (
                  <Link
                    key={playlist.id}
                    href={`/playlists/${playlist.id}`}
                    className="bg-zinc-800/60 rounded-md p-4 transition hover:bg-zinc-700/70"
                  >
                    <div className="aspect-square mb-4 overflow-hidden rounded-md bg-zinc-900/80 relative">
                      {playlist.cover_image ? (
                        <Image
                          src={playlist.cover_image}
                          alt={playlist.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-zinc-800">
                          <Music className="h-12 w-12 text-zinc-400" />
                        </div>
                      )}
                    </div>
                    <h3 className="font-semibold text-white truncate">{playlist.name}</h3>
                    <p className="text-sm text-zinc-400 truncate">
                      {playlist.songs_count} bài hát
                    </p>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-zinc-900/30 rounded-md">
                <ListMusic className="h-16 w-16 mx-auto text-zinc-600 mb-4" />
                <h3 className="text-xl font-bold mb-2">Chưa có playlist nào</h3>
                <p className="text-zinc-400 mb-6">Tạo playlist để lưu trữ và tổ chức nhạc yêu thích</p>
                <Button
                  onClick={handleCreatePlaylist}
                  className="bg-green-500 hover:bg-green-600 text-black font-bold"
                >
                  <Plus className="h-4 w-4 mr-2" /> Tạo playlist
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Lịch sử nghe */}
          <TabsContent value="history">
            {playHistory.length > 0 ? (
              <div className="bg-zinc-900/30 rounded-md">
                <div className="grid grid-cols-[1fr_auto_auto] gap-4 p-4 border-b border-white/5 text-sm text-zinc-400">
                  <div>Tiêu đề</div>
                  <div className="w-32 text-right">Thời gian</div>
                  <div className="w-20"></div>
                </div>

                {playHistory.map((history) => (
                  <div
                    key={history.id}
                    className="grid grid-cols-[1fr_auto_auto] gap-4 p-4 hover:bg-white/5 items-center group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative h-10 w-10 flex-shrink-0">
                        {history.song.cover_image ? (
                          <Image
                            src={history.song.cover_image}
                            alt={history.song.title}
                            fill
                            className="object-cover rounded"
                          />
                        ) : (
                          <div className="h-10 w-10 bg-zinc-800 flex items-center justify-center rounded">
                            <Music className="h-5 w-5 text-zinc-500" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium truncate">{history.song.title}</div>
                        <div className="text-sm text-zinc-400 truncate">{history.song.artist}</div>
                      </div>
                    </div>

                    <div className="w-32 text-zinc-400 text-right">
                      {formatTimeAgo(history.played_at)}
                    </div>

                    <div className="w-20 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handlePlaySong(history.song)}
                        className="p-2 rounded-full hover:bg-white/10"
                        title="Phát"
                      >
                        {currentlyPlaying?.id === history.song.id && isPlaying ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </button>

                      <button
                        onClick={() => handleAddToQueue(history.song)}
                        className="p-2 rounded-full hover:bg-white/10"
                        title="Thêm vào hàng đợi"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-zinc-900/30 rounded-md">
                <History className="h-16 w-16 mx-auto text-zinc-600 mb-4" />
                <h3 className="text-xl font-bold mb-2">Chưa có lịch sử nghe</h3>
                <p className="text-zinc-400 mb-6">Khi bạn nghe nhạc, nó sẽ xuất hiện ở đây</p>
                <Link href="/dashboard">
                  <Button className="bg-green-500 hover:bg-green-600 text-black font-bold">
                    Khám phá nhạc
                  </Button>
                </Link>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Player bar - only show if a song is playing */}
      {currentlyPlaying && (
        <footer className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-white/10 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative h-12 w-12 overflow-hidden rounded">
                {currentlyPlaying.cover_image ? (
                  <Image
                    src={currentlyPlaying.cover_image}
                    alt={currentlyPlaying.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-zinc-800">
                    <Music className="h-6 w-6 text-zinc-400" />
                  </div>
                )}
              </div>
              <div>
                <h4 className="font-medium">{currentlyPlaying.title}</h4>
                <p className="text-sm text-zinc-400">{currentlyPlaying.artist}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  if (isPlaying) {
                    audioElement?.pause()
                  } else {
                    audioElement?.play()
                  }
                  setIsPlaying(!isPlaying)
                }}
                className="p-3 rounded-full bg-white text-black hover:scale-105 transition-transform"
              >
                {isPlaying ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        </footer>
      )}
    </div>
  )
}
