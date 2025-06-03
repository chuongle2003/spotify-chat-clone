"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { AlertTriangle, ArrowLeft, RefreshCcw } from "lucide-react"

// Định nghĩa props cho component lỗi
interface ErrorProps {
    error: Error & { digest?: string; status?: number }
    reset: () => void
}

export default function Error({ error, reset }: ErrorProps) {
    const router = useRouter()

    useEffect(() => {
        // Ghi log lỗi vào console
        console.error("Application error:", error)

        // Điều hướng đến trang 404 nếu lỗi là 404
        if (error.status === 404) {
            let message = "Trang bạn tìm kiếm không tồn tại."
            if (error.message && error.message !== "Not Found") {
                message = error.message
            }
            router.push(`/not-found?message=${encodeURIComponent(message)}`)
        }
    }, [error, router])

    // Nếu là lỗi 404, component này sẽ chỉ hiển thị tạm thời
    // trong khi chờ chuyển hướng đến trang not-found
    if (error.status === 404) {
        return <div className="min-h-screen bg-black" />
    }

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md text-center">
                <div className="bg-zinc-900 p-6 rounded-lg mb-6">
                    <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold mb-2">Đã xảy ra lỗi</h1>
                    <p className="text-zinc-400 mb-6">
                        {error.message || "Có lỗi đã xảy ra. Vui lòng thử lại sau."}
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <Button
                            onClick={() => router.back()}
                            className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white"
                            variant="outline"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Quay lại
                        </Button>

                        <Button
                            onClick={reset}
                            className="flex-1 bg-green-500 hover:bg-green-600 text-black font-medium"
                        >
                            <RefreshCcw className="h-4 w-4 mr-2" />
                            Thử lại
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
} 