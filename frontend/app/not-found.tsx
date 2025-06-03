"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Music, AlertTriangle, Home, ArrowLeft } from "lucide-react"

export default function NotFound() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [message, setMessage] = useState<string>("Trang bạn tìm kiếm không tồn tại.")

    // Lấy thông điệp lỗi từ query params (nếu có)
    useEffect(() => {
        const customMessage = searchParams.get("message")
        if (customMessage) {
            setMessage(decodeURIComponent(customMessage))
        }
    }, [searchParams])

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md text-center">
                <div className="flex flex-col items-center mb-8">
                    <div className="relative mb-4">
                        <Music size={60} className="text-green-500" />
                        <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
                            !
                        </div>
                    </div>

                    <h1 className="text-7xl font-bold mb-2 text-green-500">404</h1>
                    <h2 className="text-2xl font-semibold mb-4">Không tìm thấy</h2>

                    <div className="bg-zinc-900 p-6 rounded-lg mb-6 max-w-md">
                        <AlertTriangle className="h-10 w-10 text-yellow-500 mx-auto mb-4" />
                        <p className="text-lg mb-2">{message}</p>
                        <p className="text-zinc-400 text-sm">
                            Đường dẫn bạn truy cập có thể đã bị xóa, thay đổi tên hoặc tạm thời không khả dụng.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
                        <Button
                            onClick={() => router.back()}
                            className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Quay lại
                        </Button>

                        <Link href="/" className="flex-1">
                            <Button className="w-full bg-green-500 hover:bg-green-600 text-black font-medium">
                                <Home className="h-4 w-4 mr-2" />
                                Trang chủ
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
} 