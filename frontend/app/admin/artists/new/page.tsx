"use client"

import { AdminArtistForm } from "@/components/admin/artists/artist-form"

export default function NewArtistPage() {
    return (
        <div>
            <h1 className="text-2xl font-bold mb-6">Thêm nghệ sĩ mới</h1>
            <AdminArtistForm />
        </div>
    )
} 