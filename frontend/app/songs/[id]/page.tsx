"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { api } from "@/lib/api"
import { redirectTo404 } from "@/lib/error-handling"
import { Loader2 } from "lucide-react"

export default function SongDetailPage() {
    const params = useParams()
    const router = useRouter()
    const [song, setSong] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    const songId = params?.id as string

    useEffect(() => {
        // Kiểm tra id hợp lệ
        if (!songId) {
            redirectTo404(router, "Không tìm thấy thông tin bài hát")
            return
        }

        const fetchSongDetail = async () => {
            try {
                setLoading(true)
                const data = await api.songs.getSongById(songId)
                setSong(data)
            } catch (error: any) {
                console.error("Error fetching song:", error)

                // Xử lý lỗi 404 - Chuyển hướng đến trang not-found
                if (error?.status === 404 || error?.response?.status === 404) {
                    redirectTo404(router, "Bài hát không tồn tại hoặc đã bị xóa")
                }
            } finally {
                setLoading(false)
            }
        }

        fetchSongDetail()
    }, [songId, router])

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="flex flex-col items-center">
                    <Loader2 className="h-10 w-10 text-green-500 animate-spin" />
                    <p className="text-white mt-4">Đang tải thông tin bài hát...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-black text-white p-6">
            {/* Nội dung chi tiết bài hát sẽ được hiển thị ở đây */}
            <h1 className="text-3xl font-bold">{song?.title}</h1>
            {/* Các thông tin khác về bài hát */}
        </div>
    )
} 