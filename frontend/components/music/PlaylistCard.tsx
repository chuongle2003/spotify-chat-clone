"use client"

import Image from "next/image"
import Link from "next/link"
import { Card } from "@/components/ui/card"

export interface PlaylistType {
    id: number
    name: string
    description: string
    is_public: boolean
    cover_image: string | null
    user: {
        id: number
        username: string
        avatar: string | null
    }
    songs_count: number
    created_at: string
    updated_at: string
}

interface PlaylistCardProps {
    playlist: PlaylistType
    className?: string
}

export function PlaylistCard({ playlist, className = "" }: PlaylistCardProps) {
    return (
        <Link href={`/playlist/${playlist.id}`}>
            <Card className={`group bg-zinc-900/40 hover:bg-zinc-800/80 transition border-none p-4 ${className}`}>
                <div className="space-y-3">
                    <div className="relative aspect-square overflow-hidden rounded-md">
                        <Image
                            src={playlist.cover_image || "/placeholder.jpg"}
                            alt={playlist.name}
                            fill
                            className="object-cover transition-all group-hover:scale-105"
                        />
                    </div>

                    <div>
                        <h3 className="font-medium text-sm truncate">{playlist.name}</h3>
                        <p className="text-xs text-zinc-400 line-clamp-2 h-8">{playlist.description}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-zinc-500">
                            <span>Tạo bởi {playlist.user.username}</span>
                            <span>•</span>
                            <span>{playlist.songs_count} bài hát</span>
                        </div>
                    </div>
                </div>
            </Card>
        </Link>
    )
} 