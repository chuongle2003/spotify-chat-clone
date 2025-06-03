"use client"

import { createContext, useContext, ReactNode, useState, useCallback } from "react"
import { useAuth } from "@/context/auth-context"
import { toast } from "@/components/ui/use-toast"
import { api } from "@/lib/api"
import { SongType } from "@/components/music/SongCard"

// === DOWNLOAD CONTEXT (MỚI) ===
type DownloadContextType = {
    directDownload: (songId: number | string, songTitle: string, artistName: string) => Promise<void>
    isDownloading: boolean
}

const DownloadContext = createContext<DownloadContextType | undefined>(undefined)

export function DownloadProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth()
    const [isDownloading, setIsDownloading] = useState(false)

    // Hàm tải xuống trực tiếp bài hát từ server
    const directDownload = useCallback(async (songId: number | string, songTitle: string, artistName: string) => {
        // Kiểm tra đăng nhập
        if (!user) {
            toast({
                title: "Cần đăng nhập",
                description: "Vui lòng đăng nhập để tải bài hát.",
                variant: "destructive",
            })
            throw new Error("Bạn cần đăng nhập để tải bài hát")
        }

        // Kiểm tra token
        const token = localStorage.getItem("spotify_token")
        if (!token || !token.startsWith("ey")) {
            toast({
                title: "Lỗi xác thực",
                description: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
                variant: "destructive",
            })
            throw new Error("Token không hợp lệ hoặc đã hết hạn")
        }

        try {
            setIsDownloading(true)
            console.log(`DownloadProvider: Bắt đầu tải xuống bài hát "${songTitle}" (ID: ${songId})`)

            // Gọi API tải xuống với hỗ trợ Range header
            console.log(`Sử dụng token: ${token.substring(0, 15)}...`)

            // Tạo một Promise chứa logic tải xuống để có thể tracking tiến trình
            const response = await api.songs.downloadSong(songId);
            console.log("Nhận được response blob:", response);

            if (!response || !(response instanceof Blob)) {
                throw new Error("Không nhận được dữ liệu bài hát từ server")
            }

            // Xác định tên file dựa trên Content-Disposition hoặc từ các tham số truyền vào
            const fileName = `${songTitle} - ${artistName}.mp3`;

            // Tạo URL từ Blob
            const url = window.URL.createObjectURL(response as Blob);

            // Tạo thẻ a để tải xuống
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;

            // Đưa link vào document và kích hoạt tải xuống
            document.body.appendChild(link);
            link.click();

            // Dọn dẹp
            window.URL.revokeObjectURL(url);
            document.body.removeChild(link);

            toast({
                title: "Tải xuống thành công",
                description: `Bài hát "${songTitle}" đã được tải xuống thiết bị của bạn.`,
            })
            console.log(`Tải xuống bài hát thành công: ${fileName}`)

        } catch (error) {
            console.error("Lỗi khi tải xuống bài hát:", error)
            toast({
                title: "Lỗi tải xuống",
                description: "Không thể tải xuống bài hát. Vui lòng thử lại sau.",
                variant: "destructive",
            })
            throw error
        } finally {
            setIsDownloading(false)
        }
    }, [user])

    return (
        <DownloadContext.Provider value={{ directDownload, isDownloading }}>
            {children}
        </DownloadContext.Provider>
    )
}

export function useDownload() {
    const context = useContext(DownloadContext)
    if (context === undefined) {
        throw new Error("useDownload must be used within a DownloadProvider")
    }
    return context
}

// === OFFLINE CONTEXT (GIẢ LẬP) ===
// Phiên bản tương thích để hỗ trợ các component chưa được cập nhật
export interface OfflineDownload {
    id: number
    song_details: SongType
    status: 'COMPLETED' | 'FAILED'
    progress: number
    is_available: boolean
}

// Giả lập các chức năng cũ để tránh lỗi ở components chưa cập nhật
export function useOffline() {
    const { directDownload, isDownloading } = useDownload()

    return {
        offlineDownloads: [] as OfflineDownload[],
        isLoading: false,
        downloadSong: async (songId: number | string) => {
            console.warn('Chức năng offline downloads đã bị loại bỏ. Vui lòng cập nhật component để sử dụng directDownload.')
            return {} as OfflineDownload
        },
        deleteDownload: async () => {
            console.warn('Chức năng offline downloads đã bị loại bỏ.')
        },
        isDownloaded: () => false,
        getDownloadById: () => undefined,
        refreshDownloads: async () => { },
        directDownload, // Thêm tính năng mới vào phiên bản giả lập
        isDownloading
    }
} 