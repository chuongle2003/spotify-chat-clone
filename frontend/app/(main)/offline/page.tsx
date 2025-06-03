"use client"

import { useEffect, useState } from "react"
import { Download, X, Loader2, CheckCircle, Trash2 } from "lucide-react"
import { useOffline } from "@/context/offline-context"
import { useAuth } from "@/context/auth-context"
import { usePlayer } from "@/components/player/PlayerContext"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import Image from "next/image"
import Link from "next/link"
import { toast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"

// Định nghĩa interface cho đối tượng download
interface DownloadItem {
    id: number;
    status: string;
    progress?: number;
    song_details: any;
    status_display?: string;
    download_time?: string;
    expiry_time?: string;
}

export default function OfflinePage() {
    const router = useRouter()
    const { user, isLoading: authLoading } = useAuth()
    const { offlineDownloads, refreshDownloads, isLoading, deleteDownload } = useOffline()
    const { play } = usePlayer()
    const [activeTab, setActiveTab] = useState("all")

    // Khi component mount, refresh danh sách tải xuống
    useEffect(() => {
        if (user) {
            refreshDownloads()
        }
    }, [user])

    // Kiểm tra xem người dùng đã đăng nhập chưa
    useEffect(() => {
        if (!authLoading && !user) {
            toast({
                title: "Cần đăng nhập",
                description: "Vui lòng đăng nhập để xem trang này.",
                variant: "destructive",
            })
            router.push("/login")
        }
    }, [user, authLoading, router])

    // Lọc bài hát theo trạng thái
    const allDownloads = offlineDownloads || []
    const completedDownloads = allDownloads.filter(download => download.status === 'COMPLETED')
    const pendingDownloads = allDownloads.filter(download =>
        download.status === 'PENDING' || download.status === 'DOWNLOADING'
    )
    const failedDownloads = allDownloads.filter(download => download.status === 'FAILED')
    const expiredDownloads = allDownloads.filter(download => download.status === 'EXPIRED')

    // Hàm xử lý khi click play
    const handlePlay = (download: DownloadItem) => {
        if (download.status === 'COMPLETED') {
            play(download.song_details)
        }
    }

    // Hàm xử lý xóa bài hát
    const handleDelete = async (downloadId: number) => {
        try {
            await deleteDownload(downloadId)
        } catch (error) {
            console.error("Lỗi khi xóa bài hát:", error)
        }
    }

    // Format date-time
    const formatDate = (dateString?: string) => {
        if (!dateString) return "-"
        const date = new Date(dateString)
        return new Intl.DateTimeFormat('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date)
    }

    // Hiển thị biểu tượng trạng thái
    const renderStatusIcon = (status: string) => {
        switch (status) {
            case 'COMPLETED':
                return <CheckCircle className="h-5 w-5 text-green-500" />
            case 'PENDING':
            case 'DOWNLOADING':
                return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
            case 'FAILED':
                return <X className="h-5 w-5 text-red-500" />
            case 'EXPIRED':
                return <X className="h-5 w-5 text-yellow-500" />
            default:
                return null
        }
    }

    if (authLoading) {
        return (
            <div className="p-8 h-full flex justify-center items-center">
                <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
            </div>
        )
    }

    if (!user) {
        return null // Sẽ được chuyển hướng bởi useEffect
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Bài hát offline</h1>
                <Button
                    variant="outline"
                    onClick={() => refreshDownloads()}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                        <Download className="h-4 w-4 mr-2" />
                    )}
                    Làm mới
                </Button>
            </div>

            <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="mb-6">
                    <TabsTrigger value="all" className="relative">
                        Tất cả
                        <span className="ml-1 text-xs bg-zinc-700 rounded-full px-1.5 py-0.5">
                            {allDownloads.length}
                        </span>
                    </TabsTrigger>
                    <TabsTrigger value="completed" className="relative">
                        Đã tải xuống
                        <span className="ml-1 text-xs bg-zinc-700 rounded-full px-1.5 py-0.5">
                            {completedDownloads.length}
                        </span>
                    </TabsTrigger>
                    <TabsTrigger value="pending" className="relative">
                        Đang tải xuống
                        <span className="ml-1 text-xs bg-zinc-700 rounded-full px-1.5 py-0.5">
                            {pendingDownloads.length}
                        </span>
                    </TabsTrigger>
                    <TabsTrigger value="failed" className="relative">
                        Thất bại
                        <span className="ml-1 text-xs bg-zinc-700 rounded-full px-1.5 py-0.5">
                            {failedDownloads.length}
                        </span>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="all">
                    {renderDownloadsList(allDownloads)}
                </TabsContent>

                <TabsContent value="completed">
                    {renderDownloadsList(completedDownloads)}
                </TabsContent>

                <TabsContent value="pending">
                    {renderDownloadsList(pendingDownloads)}
                </TabsContent>

                <TabsContent value="failed">
                    {renderDownloadsList(failedDownloads)}
                </TabsContent>
            </Tabs>
        </div>
    )

    function renderDownloadsList(downloads: DownloadItem[]) {
        if (isLoading) {
            return (
                <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
                </div>
            )
        }

        if (downloads.length === 0) {
            return (
                <div className="text-center py-12 text-zinc-500">
                    <Download className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">Không có bài hát nào</p>
                    {activeTab === "all" && (
                        <p className="mt-2">Tải xuống bài hát để nghe offline</p>
                    )}
                </div>
            )
        }

        return (
            <div className="space-y-2">
                {downloads.map((download) => (
                    <div
                        key={download.id}
                        className="grid grid-cols-12 gap-4 p-3 rounded-md hover:bg-zinc-800/50 items-center"
                    >
                        {/* Thông tin bài hát */}
                        <div
                            className="col-span-5 flex items-center gap-3 cursor-pointer"
                            onClick={() => handlePlay(download)}
                        >
                            <div className="relative w-12 h-12 flex-shrink-0">
                                <Image
                                    src={download.song_details.image_url || "/placeholder.jpg"}
                                    alt={download.song_details.title}
                                    fill
                                    className="object-cover rounded"
                                />
                                {download.status === 'COMPLETED' && (
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100">
                                        <Download className="h-5 w-5 text-white" />
                                    </div>
                                )}
                            </div>
                            <div>
                                <p className="font-medium truncate">{download.song_details.title}</p>
                                <Link
                                    href={`/artist/${download.song_details.artist.id}`}
                                    className="text-sm text-zinc-400 hover:underline"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {download.song_details.artist.name}
                                </Link>
                            </div>
                        </div>

                        {/* Trạng thái */}
                        <div className="col-span-2 flex items-center gap-2">
                            {renderStatusIcon(download.status)}
                            <span className="text-sm">{download.status_display}</span>
                        </div>

                        {/* Tiến trình */}
                        <div className="col-span-3">
                            {(download.status === 'PENDING' || download.status === 'DOWNLOADING') && (
                                <div className="w-full space-y-1">
                                    <Progress value={download.progress} className="h-2" />
                                    <p className="text-xs text-zinc-400 text-right">{download.progress}%</p>
                                </div>
                            )}
                            {download.status === 'COMPLETED' && (
                                <div className="text-sm text-zinc-400">
                                    <p>Tải xuống: {formatDate(download.download_time)}</p>
                                    <p>Hết hạn: {formatDate(download.expiry_time)}</p>
                                </div>
                            )}
                        </div>

                        {/* Hành động */}
                        <div className="col-span-2 flex justify-end">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(download.id)}
                                className="text-zinc-400 hover:text-white"
                            >
                                <Trash2 className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        )
    }
} 