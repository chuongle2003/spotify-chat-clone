"use client"

import { createContext, useContext } from "react"
import { SongType } from "@/components/music/SongCard"

interface PlayerContextType {
    currentSong: SongType | null
    playlist: SongType[]
    isPlaying: boolean
    isLoginPromptOpen: boolean
    isShuffle: boolean
    repeatMode: number // 0: off, 1: repeat all, 2: repeat one
    play: (song: SongType, songs?: SongType[]) => void
    pause: () => void
    resume: () => void
    playNext: () => void
    playPrevious: () => void
    togglePlay: () => void
    toggleShuffle: () => void
    toggleRepeat: () => void
    setRepeatMode: (mode: number) => void
    addToQueue: (song: SongType) => void
    removeFromQueue: (index: number) => void
    clearQueue: () => void
    likeSong: (songId: number | string) => Promise<boolean>
    closeLoginPrompt: () => void
    checkAuthBeforePlaying: (song: SongType, songs?: SongType[]) => boolean
    getDirectMediaUrl: (url: string | undefined | null) => string
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined)

export function usePlayer() {
    const context = useContext(PlayerContext)

    if (context === undefined) {
        throw new Error("usePlayer must be used within a PlayerProvider")
    }

    return context
}

export { PlayerContext } 