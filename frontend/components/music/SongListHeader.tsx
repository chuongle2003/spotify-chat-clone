"use client"

import { Clock } from "lucide-react"

interface SongListHeaderProps {
    showAlbum?: boolean
}

export function SongListHeader({ showAlbum = true }: SongListHeaderProps) {
    return (
        <div className="grid grid-cols-12 gap-4 px-4 py-2 border-b border-zinc-800 text-sm font-medium text-zinc-400">
            <div className="col-span-1 text-center">#</div>
            <div className="col-span-4">Bài hát</div>
            {showAlbum && <div className="col-span-3">Album</div>}
            <div className="col-span-3"></div>
            <div className="col-span-1 flex justify-center"></div>
            <div className="col-span-1 flex justify-end">
                <Clock className="h-4 w-4" />
            </div>
            <div className="col-span-1"></div>
        </div>
    )
} 