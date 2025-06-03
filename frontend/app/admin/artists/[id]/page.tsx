"use client"

import { AdminArtistForm } from "@/components/admin/artists/artist-form"

interface EditArtistPageProps {
    params: {
        id: string
    }
}

export default function EditArtistPage({ params }: EditArtistPageProps) {
    const artistId = parseInt(params.id)

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6">Chỉnh sửa nghệ sĩ</h1>
            <AdminArtistForm artistId={artistId} />
        </div>
    )
} 