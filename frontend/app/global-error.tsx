"use client"

import { Button } from "@/components/ui/button"
import { AlertTriangle, RefreshCcw } from "lucide-react"

// Định nghĩa props cho component lỗi toàn cầu
interface GlobalErrorProps {
    error: Error & { digest?: string }
    reset: () => void
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
    return (
        <html>
            <body>
                <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
                    <div className="w-full max-w-md text-center">
                        <div className="bg-zinc-900 p-8 rounded-lg mb-6">
                            <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-6" />
                            <h1 className="text-3xl font-bold mb-4">Đã xảy ra lỗi nghiêm trọng</h1>
                            <p className="text-zinc-400 mb-8">
                                Rất tiếc, đã xảy ra lỗi không mong muốn. Vui lòng thử tải lại trang hoặc quay lại sau.
                            </p>

                            <div className="text-xs text-zinc-500 mb-6 border border-zinc-800 p-3 rounded bg-zinc-950">
                                <p className="font-mono">{error.message || "Lỗi ứng dụng không xác định"}</p>
                                {error.digest && (
                                    <p className="mt-2 font-mono">Mã lỗi: {error.digest}</p>
                                )}
                            </div>

                            <Button
                                onClick={reset}
                                className="w-full bg-green-500 hover:bg-green-600 text-black font-medium"
                            >
                                <RefreshCcw className="h-4 w-4 mr-2" />
                                Tải lại trang
                            </Button>
                        </div>

                        <div className="text-sm text-zinc-500">
                            <p>
                                Nếu vấn đề vẫn tiếp diễn, vui lòng liên hệ{" "}
                                <a href="mailto:support@spotify-clone.com" className="text-green-500 hover:underline">
                                    hỗ trợ kỹ thuật
                                </a>
                            </p>
                        </div>
                    </div>
                </div>
            </body>
        </html>
    )
} 