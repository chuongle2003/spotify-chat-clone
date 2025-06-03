"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import {
    Play,
    Pause,
    SkipBack,
    SkipForward,
    Volume2,
    VolumeX,
    Repeat,
    Shuffle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { SongType } from "./SongCard"

interface MusicPlayerProps {
    song?: SongType | null
    songs?: SongType[]
    onNext?: () => void
    onPrevious?: () => void
}

export function MusicPlayer({ song, songs = [], onNext, onPrevious }: MusicPlayerProps) {
    const [isPlaying, setIsPlaying] = useState(false)
    const [currentTime, setCurrentTime] = useState(0)
    const [duration, setDuration] = useState(0)
    const [volume, setVolume] = useState(0.8)
    const [isMuted, setIsMuted] = useState(false)
    const [isRepeat, setIsRepeat] = useState(false)
    const [isShuffle, setIsShuffle] = useState(false)

    const audioRef = useRef<HTMLAudioElement | null>(null)

    // Khởi tạo audio khi song thay đổi
    useEffect(() => {
        if (!song) return

        // Reset player state
        setCurrentTime(0)
        setDuration(0)

        if (audioRef.current) {
            // Sử dụng stream_url nếu có, nếu không thì dùng file_url
            const audioUrl = song.stream_url || song.file_url;
            audioRef.current.src = audioUrl;
            audioRef.current.load()

            // Tự động phát khi có bài hát mới
            audioRef.current.play()
                .then(() => setIsPlaying(true))
                .catch(error => {
                    console.error("Không thể phát nhạc:", error)
                    setIsPlaying(false)
                })
        }
    }, [song])

    // Cập nhật thời gian và thời lượng
    useEffect(() => {
        if (!audioRef.current) return

        const audio = audioRef.current

        const handleTimeUpdate = () => setCurrentTime(audio.currentTime)
        const handleDurationChange = () => setDuration(audio.duration)
        const handleEnded = () => {
            if (isRepeat) {
                audio.currentTime = 0
                audio.play()
            } else if (onNext) {
                onNext()
            }
        }

        audio.addEventListener('timeupdate', handleTimeUpdate)
        audio.addEventListener('durationchange', handleDurationChange)
        audio.addEventListener('ended', handleEnded)

        return () => {
            audio.removeEventListener('timeupdate', handleTimeUpdate)
            audio.removeEventListener('durationchange', handleDurationChange)
            audio.removeEventListener('ended', handleEnded)
        }
    }, [isRepeat, onNext])

    // Cập nhật âm lượng
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = isMuted ? 0 : volume
        }
    }, [volume, isMuted])

    const togglePlay = () => {
        if (!audioRef.current || !song) return

        if (isPlaying) {
            audioRef.current.pause()
        } else {
            audioRef.current.play()
        }

        setIsPlaying(!isPlaying)
    }

    const handleVolumeChange = (newVolume: number[]) => {
        setVolume(newVolume[0])
        if (isMuted && newVolume[0] > 0) {
            setIsMuted(false)
        }
    }

    const toggleMute = () => {
        setIsMuted(!isMuted)
    }

    const handleTimeChange = (newTime: number[]) => {
        if (audioRef.current) {
            const targetTime = newTime[0];

            // Cập nhật giao diện ngay lập tức để trải nghiệm mượt mà hơn
            setCurrentTime(targetTime);

            // Cập nhật thời gian phát thực tế 
            audioRef.current.currentTime = targetTime;
        }
    }

    const formatTime = (seconds: number) => {
        if (isNaN(seconds)) return "0:00"
        const mins = Math.floor(seconds / 60)
        const secs = Math.floor(seconds % 60)
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    if (!song) {
        return (
            <div className="fixed bottom-0 left-0 right-0 h-20 bg-zinc-900 border-t border-zinc-800 flex items-center justify-center text-zinc-500">
                Chưa chọn bài hát
            </div>
        )
    }

    return (
        <div className="fixed bottom-0 left-0 right-0 h-20 bg-zinc-900 border-t border-zinc-800 flex items-center px-4">
            <audio ref={audioRef} />

            {/* Thông tin bài hát */}
            <div className="flex items-center gap-3 w-1/4">
                <div className="relative h-12 w-12 rounded overflow-hidden">
                    <Image
                        src={song.image_url || "/placeholder.jpg"}
                        alt={song.title}
                        fill
                        className="object-cover"
                    />
                </div>
                <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{song.title}</p>
                    <p className="text-xs text-zinc-400 truncate">{song.artist.name}</p>
                </div>
            </div>

            {/* Điều khiển phát nhạc */}
            <div className="flex-1 flex flex-col items-center gap-1 px-6">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-zinc-400 hover:text-white"
                        onClick={() => setIsShuffle(!isShuffle)}
                    >
                        <Shuffle className={`h-4 w-4 ${isShuffle ? 'text-green-500' : ''}`} />
                    </Button>

                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-zinc-400 hover:text-white"
                        onClick={onPrevious}
                        disabled={!onPrevious}
                    >
                        <SkipBack className="h-5 w-5" />
                    </Button>

                    <Button
                        size="icon"
                        className="rounded-full bg-white hover:bg-gray-100 text-black h-8 w-8"
                        onClick={togglePlay}
                    >
                        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
                    </Button>

                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-zinc-400 hover:text-white"
                        onClick={onNext}
                        disabled={!onNext}
                    >
                        <SkipForward className="h-5 w-5" />
                    </Button>

                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-zinc-400 hover:text-white"
                        onClick={() => setIsRepeat(!isRepeat)}
                    >
                        <Repeat className={`h-4 w-4 ${isRepeat ? 'text-green-500' : ''}`} />
                    </Button>
                </div>

                <div className="w-full flex items-center gap-2 text-xs text-zinc-400">
                    <span>{formatTime(currentTime)}</span>
                    <Slider
                        value={[currentTime]}
                        min={0}
                        max={duration || 0}
                        step={1}
                        className="flex-1"
                        onValueChange={handleTimeChange}
                    />
                    <span>{formatTime(duration)}</span>
                </div>
            </div>

            {/* Điều khiển âm lượng */}
            <div className="w-1/4 flex justify-end items-center gap-2">
                <Button
                    variant="ghost"
                    size="icon"
                    className="text-zinc-400 hover:text-white"
                    onClick={toggleMute}
                >
                    {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                </Button>

                <Slider
                    value={[isMuted ? 0 : volume]}
                    min={0}
                    max={1}
                    step={0.01}
                    className="w-24"
                    onValueChange={handleVolumeChange}
                />
            </div>
        </div>
    )
} 