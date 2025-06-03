"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Repeat,
  Shuffle,
  Heart,
  MoreHorizontal,
  ListMusic,
  ChevronDown,
  Share2,
} from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import  postmanApi  from "@/lib/api/postman"
import type { Song } from "@/types"

export default function PlayerPage() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const songId = searchParams.get("id")

  const [currentSong, setCurrentSong] = useState<Song | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(70)
  const [isMuted, setIsMuted] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isLiked, setIsLiked] = useState(false)
  const [queue, setQueue] = useState<Song[]>([])
  const [relatedSongs, setRelatedSongs] = useState<Song[]>([])

  const audioRef = useRef<HTMLAudioElement>(null)

  // If user is not logged in, redirect to home page
  useEffect(() => {
    if (!user) {
      router.push("/")
    }
  }, [user, router])

  // Fetch song data
  useEffect(() => {
    const fetchSongData = async () => {
      if (!songId) return

      try {
        const song = await postmanApi.music.getSong(songId)
        setCurrentSong(song)

        // Fetch related songs (in a real app, you would have an API for this)
        const trending = await postmanApi.music.getTrendingSongs()
        setRelatedSongs(trending.filter((s: { id: string }) => s.id !== songId).slice(0, 5))

        // Set up queue (in a real app, this would be more sophisticated)
        setQueue([...trending.filter((s: { id: string }) => s.id !== songId).slice(0, 10)])
      } catch (error) {
        console.error("Error fetching song:", error)
      }
    }

    fetchSongData()
  }, [songId])

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
    }

    const handleLoadedMetadata = () => {
      setDuration(audio.duration)
    }

    const handleEnded = () => {
      setIsPlaying(false)
      // In a real app, you would play the next song in the queue
    }

    audio.addEventListener("timeupdate", handleTimeUpdate)
    audio.addEventListener("loadedmetadata", handleLoadedMetadata)
    audio.addEventListener("ended", handleEnded)

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate)
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata)
      audio.removeEventListener("ended", handleEnded)
    }
  }, [])

  // Play/pause control
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.play().catch((error) => {
        console.error("Error playing audio:", error)
        setIsPlaying(false)
      })
    } else {
      audio.pause()
    }
  }, [isPlaying])

  // Volume control
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    audio.volume = isMuted ? 0 : volume / 100
  }, [volume, isMuted])

  // Format time (seconds to MM:SS)
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  const togglePlay = () => {
    setIsPlaying(!isPlaying)
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
  }

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0])
    if (value[0] > 0 && isMuted) {
      setIsMuted(false)
    }
  }

  const handleTimeChange = (value: number[]) => {
    const newTime = value[0]
    setCurrentTime(newTime)
    if (audioRef.current) {
      audioRef.current.currentTime = newTime
    }
  }

  const toggleLike = async () => {
    if (!currentSong) return

    try {
      await postmanApi.music.likeSong(currentSong.id)
      setIsLiked(!isLiked)
    } catch (error) {
      console.error("Error liking song:", error)
    }
  }

  const playNextSong = () => {
    if (queue.length > 0) {
      const nextSong = queue[0]
      const newQueue = queue.slice(1)

      router.push(`/player?id=${nextSong.id}`)
      setQueue(newQueue)
    }
  }

  const playPreviousSong = () => {
    // In a real app, you would have a history of played songs
    router.back()
  }

  // Mock song data for UI display when API data is not available
  const mockSong = {
    id: "1",
    title: "Ngày Mai Em Đi",
    artist: "Lê Hiếu, SOOBIN, Touliver",
    album: "Single",
    duration: 218,
    cover_image: "/placeholder.svg?height=400&width=400",
    file_path: "https://example.com/song.mp3",
  }

  const displaySong = currentSong || mockSong

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-black text-white flex flex-col">
      {/* Top bar */}
      <div className="p-4 flex justify-between items-center">
        <Button variant="ghost" size="icon" className="rounded-full bg-black/20" onClick={() => router.back()}>
          <ChevronDown className="h-6 w-6" />
        </Button>
        <div className="text-center">
          <div className="text-xs text-white/70">Đang phát từ</div>
          <div className="font-medium">{displaySong.album || "Album"}</div>
        </div>
        <Button variant="ghost" size="icon" className="rounded-full bg-black/20">
          <MoreHorizontal className="h-6 w-6" />
        </Button>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-3xl mx-auto w-full">
        {/* Album art */}
        <div className="relative w-full max-w-md aspect-square mb-8">
          <Image
            src={displaySong.cover_image || "/placeholder.svg"}
            alt={displaySong.title}
            fill
            className="object-cover rounded-md shadow-2xl"
          />
        </div>

        {/* Song info */}
        <div className="w-full flex justify-between items-center mb-6">
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{displaySong.title}</h1>
            <p className="text-white/70">{displaySong.artist}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className={`rounded-full ${isLiked ? "text-green-500" : "text-white/70"}`}
            onClick={toggleLike}
          >
            <Heart className="h-6 w-6" fill={isLiked ? "currentColor" : "none"} />
          </Button>
        </div>

        {/* Progress bar */}
        <div className="w-full mb-6">
          <Slider
            value={[currentTime]}
            max={duration || 218}
            step={1}
            onValueChange={handleTimeChange}
            className="mb-2"
          />
          <div className="flex justify-between text-xs text-white/70">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration || 218)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="w-full flex justify-between items-center mb-8">
          <Button variant="ghost" size="icon" className="text-white/70 hover:text-white">
            <Shuffle className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-white/70 hover:text-white" onClick={playPreviousSong}>
            <SkipBack className="h-8 w-8" />
          </Button>
          <Button
            size="icon"
            className="rounded-full bg-white text-black hover:bg-white/90 h-16 w-16"
            onClick={togglePlay}
          >
            {isPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8 ml-1" />}
          </Button>
          <Button variant="ghost" size="icon" className="text-white/70 hover:text-white" onClick={playNextSong}>
            <SkipForward className="h-8 w-8" />
          </Button>
          <Button variant="ghost" size="icon" className="text-white/70 hover:text-white">
            <Repeat className="h-5 w-5" />
          </Button>
        </div>

        {/* Volume control */}
        <div className="w-full flex items-center gap-2 mb-8">
          <Button variant="ghost" size="icon" className="text-white/70 hover:text-white" onClick={toggleMute}>
            {isMuted || volume === 0 ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </Button>
          <Slider
            value={[isMuted ? 0 : volume]}
            max={100}
            step={1}
            onValueChange={handleVolumeChange}
            className="flex-1"
          />
        </div>

        {/* Additional buttons */}
        <div className="w-full flex justify-between">
          <Button variant="ghost" className="text-white/70 hover:text-white">
            <ListMusic className="h-5 w-5 mr-2" />
            <span>Danh sách phát</span>
          </Button>
          <Button variant="ghost" className="text-white/70 hover:text-white">
            <Share2 className="h-5 w-5 mr-2" />
            <span>Chia sẻ</span>
          </Button>
        </div>
      </div>

      {/* Hidden audio element */}
      <audio ref={audioRef} src={displaySong.file_path} preload="metadata" className="hidden" />
    </div>
  )
}
