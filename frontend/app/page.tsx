"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { SongCard, SongType } from "@/components/music/SongCard"
import { ArtistType } from "@/components/music/ArtistCard"
import { api } from "@/lib/api"
import { Sidebar } from "@/components/Sidebar"
import { toast } from "@/components/ui/use-toast"
import { Suspense } from "react"

// Placeholder components để hiển thị khi đang loading
const SongCardSkeleton = () => (
  <div className="bg-zinc-800/40 rounded-md aspect-square animate-pulse" />
)

const TrendingSongs = () => {
  const [trendingSongs, setTrendingSongs] = useState<SongType[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchTrendingSongs = async () => {
      try {
        setLoading(true)
        const trendingResponse = await api.songs.getTrendingSongs();

        if (trendingResponse && trendingResponse.results) {
          const mappedSongs = trendingResponse.results.map(song => ({
            id: parseInt(song.id),
            title: song.title,
            artist: {
              id: song.uploaded_by?.id ? parseInt(song.uploaded_by.id) : 0,
              name: song.artist,
              avatar: null
            },
            album: {
              id: 0,
              title: song.album || "Unknown Album"
            },
            duration: song.duration.toString(),
            play_count: song.play_count,
            image_url: song.cover_image || null,
            file_url: song.audio_file,
            created_at: song.created_at,
            updated_at: song.created_at
          }));

          setTrendingSongs(mappedSongs);
        }
      } catch (error) {
        console.error("Lỗi khi lấy dữ liệu:", error)
      } finally {
        setLoading(false)
      }
    };

    fetchTrendingSongs();
  }, [])

  const handlePlaySong = () => {
    // Chuyển hướng đến trang đăng nhập khi người dùng cố gắng phát nhạc
    toast({
      title: "Cần đăng nhập",
      description: "Bạn cần đăng nhập để nghe nhạc.",
      variant: "default"
    })
    router.push("/login");
  }

  return (
    <>
      <h2 className="text-2xl font-bold mb-4 flex justify-between items-center">
        Bài hát thịnh hành trong 7 ngày qua
      </h2>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, index) => (
            <SongCardSkeleton key={index} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {trendingSongs.map((song) => (
            <SongCard
              key={song.id}
              song={song}
              onPlay={() => handlePlaySong()}
              playlist={[]}
            />
          ))}
        </div>
      )}
    </>
  )
}

const PopularArtists = () => {
  const [popularArtists, setPopularArtists] = useState<ArtistType[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchArtists = async () => {
      try {
        setLoading(true)
        const artistsResponse = await api.songs.getArtists({ limit: 6 })

        // Map dữ liệu từ API sang định dạng ArtistType
        const mappedArtists = artistsResponse.results.map(artist => ({
          id: artist.id,
          name: artist.name,
          bio: artist.bio || "Nghệ sĩ âm nhạc",
          image: artist.image || null
        }));

        setPopularArtists(mappedArtists);
      } catch (error) {
        console.error("Lỗi khi lấy dữ liệu nghệ sĩ:", error)
      } finally {
        setLoading(false)
      }
    };

    fetchArtists();
  }, [])

  const handleArtistClick = (artistId: number) => {
    router.push('/login');
    toast({
      title: "Cần đăng nhập",
      description: "Bạn cần đăng nhập để xem chi tiết nghệ sĩ.",
      variant: "default"
    })
  }

  return (
    <>
      <h2 className="text-2xl font-bold mb-4 flex justify-between items-center mt-8">
        Nghệ sĩ phổ biến
      </h2>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, index) => (
            <SongCardSkeleton key={index} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {popularArtists.map((artist) => (
            <div
              key={artist.id}
              className="bg-zinc-800/40 hover:bg-zinc-700/40 rounded-md p-4 cursor-pointer transition-colors"
              onClick={() => handleArtistClick(artist.id)}
            >
              <div className="aspect-square bg-zinc-900 rounded-full mb-4 overflow-hidden">
                {artist.image && (
                  <img
                    src={artist.image}
                    alt={artist.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                )}
              </div>
              <h3 className="font-medium truncate">{artist.name}</h3>
              <p className="text-sm text-zinc-400">Nghệ sĩ</p>
            </div>
          ))}
        </div>
      )}
    </>
  )
}

export default function HomePage() {
  const { user } = useAuth()
  const router = useRouter()

  // Nếu user đã đăng nhập, chuyển hướng đến trang chính
  useEffect(() => {
    if (user) {
      router.push("/dashboard")
    }
  }, [user, router])

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="flex items-center justify-between p-4 bg-black">
        <div>
          <svg viewBox="0 0 78 24" width="78" height="24" className="text-white">
            <path
              fill="currentColor"
              d="M18.616 10.639c-3.77-2.297-9.99-2.509-13.59-1.388a1.077 1.077 0 0 1-1.164-.363 1.14 1.14 0 0 1-.119-1.237c.136-.262.37-.46.648-.548 4.132-1.287 11-1.038 15.342 1.605a1.138 1.138 0 0 1 .099 1.863 1.081 1.081 0 0 1-.813.213c-.142-.02-.28-.07-.403-.145Zm-.124 3.402a.915.915 0 0 1-.563.42.894.894 0 0 1-.69-.112c-3.144-1.983-7.937-2.557-11.657-1.398a.898.898 0 0 1-.971-.303.952.952 0 0 1-.098-1.03.929.929 0 0 1 .54-.458c4.248-1.323 9.53-.682 13.14 1.595a.95.95 0 0 1 .3 1.286Zm-1.43 3.267a.73.73 0 0 1-.45.338.712.712 0 0 1-.553-.089c-2.748-1.722-6.204-2.111-10.276-1.156a.718.718 0 0 1-.758-.298.745.745 0 0 1-.115-.265.757.757 0 0 1 .092-.563.737.737 0 0 1 .457-.333c4.455-1.045 8.277-.595 11.361 1.338a.762.762 0 0 1 .241 1.028ZM11.696 0C5.237 0 0 5.373 0 12c0 6.628 5.236 12 11.697 12 6.46 0 11.698-5.372 11.698-12 0-6.627-5.238-12-11.699-12h.001Z"
            />
          </svg>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/register">
            <Button variant="ghost" className="text-white hover:text-white hover:bg-transparent">
              Đăng ký
            </Button>
          </Link>
          <Link href="/login">
            <Button className="bg-white text-black hover:bg-white/90 rounded-full px-8">Đăng nhập</Button>
          </Link>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-black p-4">
          <nav className="mt-2">
            <ul className="space-y-1 px-2">
              <li>
                <Link href="/">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-white"
                  >
                    <svg className="h-5 w-5 mr-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                      <polyline points="9 22 9 12 15 12 15 22"></polyline>
                    </svg>
                    Trang chủ
                  </Button>
                </Link>
              </li>
              <li>
                <Link href="/login">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-zinc-400 hover:text-white"
                  >
                    <svg className="h-5 w-5 mr-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8"></circle>
                      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                    Tìm kiếm
                  </Button>
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        {/* Main content */}
        <div className="flex-1 bg-gradient-to-b from-zinc-900 to-black p-6 overflow-auto">
          <Suspense fallback={<div className="w-full h-40 flex items-center justify-center">Đang tải...</div>}>
            <TrendingSongs />
          </Suspense>

          <Suspense fallback={<div className="w-full h-40 flex items-center justify-center">Đang tải...</div>}>
            <PopularArtists />
          </Suspense>
        </div>
      </div>

      {/* Footer banner */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-purple-700 to-pink-500 p-3 flex justify-between items-center">
        <div>
          <h3 className="font-bold">Xem trước Spotify</h3>
          <p className="text-sm">
            Đăng ký để nghe không giới hạn các bài hát và podcast với quảng cáo không thường xuyên. Không cần thẻ tín
            dụng.
          </p>
        </div>
        <Link href="/register">
          <Button className="bg-white text-black hover:bg-white/90 rounded-full px-8">Đăng ký miễn phí</Button>
        </Link>
      </div>
    </div>
  )
}
