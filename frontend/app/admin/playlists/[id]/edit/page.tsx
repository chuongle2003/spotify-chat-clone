"use client"

import { Suspense } from "react"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import AdminPlaylistForm from "@/components/admin/playlists/AdminPlaylistForm"
import { useRouter } from "next/navigation"

export default function EditPlaylistPage({
    params,
}: {
    params: { id: string }
}) {
    const router = useRouter()
    const playlistId = parseInt(params.id, 10)

    return (
        <div className="p-6 space-y-4">
            <Button
                variant="ghost"
                className="flex items-center gap-2 mb-4"
                onClick={() => router.back()}
            >
                <ArrowLeft className="h-4 w-4" />
                Quay lại
            </Button>

            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Chỉnh Sửa Playlist</h1>
            </div>

            <Suspense fallback={<div>Đang tải...</div>}>
                <AdminPlaylistForm playlistId={playlistId} />
            </Suspense>
        </div>
    )
} 