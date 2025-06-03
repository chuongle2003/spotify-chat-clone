"use client"

import Image from "next/image"
import Link from "next/link"
import { Card } from "@/components/ui/card"

export interface AlbumType {
    id: number
    title: string
    release_date: string
    cover_image: string | null
    artist: {
        id: number
        name: string
        avatar: string | null
    }
    songs_count: number
    created_at: string
    updated_at: string
}

interface AlbumCardProps {
    album: AlbumType
    className?: string
}

export function AlbumCard({ album, className = "" }: AlbumCardProps) {
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.getFullYear();
    };

    return (
        <Link href={`/album/${album.id}`}>
            <Card className={`group bg-zinc-900/40 hover:bg-zinc-800/80 transition border-none p-4 ${className}`}>
                <div className="space-y-3">
                    <div className="relative aspect-square overflow-hidden rounded-md">
                        <Image
                            src={album.cover_image || "/placeholder.jpg"}
                            alt={album.title}
                            fill
                            className="object-cover transition-all group-hover:scale-105"
                        />
                    </div>

                    <div>
                        <h3 className="font-medium text-sm truncate">{album.title}</h3>
                        <div className="text-xs text-zinc-400 flex items-center gap-2">
                            <span>{formatDate(album.release_date)}</span>
                            <span>•</span>
                            <span>{album.artist.name}</span>
                        </div>
                        <p className="text-xs text-zinc-500 mt-1">{album.songs_count} bài hát</p>
                    </div>
                </div>
            </Card>
        </Link>
    )
} 