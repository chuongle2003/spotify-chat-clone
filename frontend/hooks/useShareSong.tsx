"use client"

import { useState } from 'react'
import { User, Song, Playlist } from '@/types'
import { useChat } from '@/context/chat-context'
import { useRouter } from 'next/navigation'

interface ShareItemProps {
    type: 'song' | 'playlist'
    id: string
    onSuccess?: () => void
    onError?: (error: any) => void
}

export const useShareItem = () => {
    const router = useRouter()
    let chatContext;

    try {
        chatContext = useChat()
    } catch (error) {
        // Nếu không có ChatContext, chúng ta sẽ chuyển sang modal thông báo
        console.warn("ChatProvider không được tìm thấy, chuyển hướng sẽ được sử dụng thay thế")
    }

    const { shareSong, sharePlaylist, chatRooms } = chatContext || {
        shareSong: null,
        sharePlaylist: null,
        chatRooms: []
    }

    const [isSharing, setIsSharing] = useState(false)
    const [selectedReceiverId, setSelectedReceiverId] = useState<string | null>(null)
    const [message, setMessage] = useState('')
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [shareItem, setShareItem] = useState<ShareItemProps | null>(null)

    // Mở modal chia sẻ
    const openShareModal = (itemProps: ShareItemProps) => {
        if (!chatContext) {
            // Nếu không có ChatContext, chuyển hướng đến trang messages
            router.push('/messages')
            return
        }

        setShareItem(itemProps)
        setIsModalOpen(true)
        setMessage(itemProps.type === 'song' ? 'Nghe thử bài hát này nhé!' : 'Nghe thử playlist này nhé!')
    }

    // Đóng modal chia sẻ
    const closeShareModal = () => {
        setIsModalOpen(false)
        setSelectedReceiverId(null)
        setMessage('')
        setShareItem(null)
    }

    // Xử lý chia sẻ
    const handleShare = async () => {
        if (!shareItem || !selectedReceiverId || !message.trim() || !chatContext) return

        setIsSharing(true)

        try {
            if (shareItem.type === 'song' && shareSong) {
                await shareSong(shareItem.id, selectedReceiverId, message)
            } else if (shareItem.type === 'playlist' && sharePlaylist) {
                await sharePlaylist(shareItem.id, selectedReceiverId, message)
            }

            if (shareItem.onSuccess) {
                shareItem.onSuccess()
            }

            closeShareModal()
        } catch (error) {
            console.error('Lỗi khi chia sẻ:', error)

            if (shareItem.onError) {
                shareItem.onError(error)
            }
        } finally {
            setIsSharing(false)
        }
    }

    // Component Modal để chia sẻ
    const ShareModal = () => {
        if (!isModalOpen || !shareItem || !chatContext) return null

        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-background rounded-lg max-w-md w-full p-5">
                    <h3 className="text-lg font-bold mb-4">
                        Chia sẻ {shareItem.type === 'song' ? 'bài hát' : 'playlist'}
                    </h3>

                    <div className="space-y-4">
                        <div>
                            <label className="block mb-2 text-sm font-medium">Người nhận</label>
                            <select
                                className="w-full px-3 py-2 bg-muted rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                                value={selectedReceiverId || ''}
                                onChange={(e) => setSelectedReceiverId(e.target.value)}
                            >
                                <option value="">Chọn người để chia sẻ</option>
                                {chatRooms.map((room) => (
                                    <option key={room.id} value={room.partner.id}>
                                        {room.partner.username}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block mb-2 text-sm font-medium">Tin nhắn</label>
                            <textarea
                                className="w-full px-3 py-2 bg-muted rounded-md focus:outline-none focus:ring-1 focus:ring-primary min-h-[80px]"
                                placeholder="Nhập tin nhắn..."
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                            ></textarea>
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3 mt-5">
                        <button
                            className="px-4 py-2 rounded-md text-muted-foreground hover:bg-muted"
                            onClick={closeShareModal}
                        >
                            Hủy
                        </button>
                        <button
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-md disabled:opacity-50"
                            onClick={handleShare}
                            disabled={!selectedReceiverId || !message.trim() || isSharing}
                        >
                            {isSharing ? 'Đang chia sẻ...' : 'Chia sẻ'}
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return {
        openShareModal,
        closeShareModal,
        isModalOpen,
        ShareModal,
    }
} 