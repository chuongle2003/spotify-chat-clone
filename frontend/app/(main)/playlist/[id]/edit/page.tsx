"use client"

import { EditPlaylistForm } from "@/components/music/EditPlaylistForm"

interface EditPlaylistPageProps {
    params: {
        id: string
    }
}

export default function EditPlaylistPage({ params }: EditPlaylistPageProps) {
    return (
        <div className="container mx-auto px-6 py-8">
            <EditPlaylistForm playlistId={params.id} />
        </div>
    )
} 