"use client"

import { MessageSquare, ChevronLeft } from "lucide-react"

interface EmptyStateProps {
    onOpenSidebar: () => void
}

const EmptyState = ({ onOpenSidebar }: EmptyStateProps) => {
    return (
        <div className="h-full flex flex-col items-center justify-center p-4 text-center">
            <button
                className="md:hidden p-3 mb-4 rounded-full bg-primary text-primary-foreground self-start"
                onClick={onOpenSidebar}
            >
                <ChevronLeft className="h-5 w-5" />
            </button>

            <div className="p-6 rounded-full bg-muted/50 mb-4">
                <MessageSquare className="h-12 w-12 text-primary" />
            </div>

            <h2 className="text-2xl font-bold mb-2">Tin nhắn của bạn</h2>
            <p className="text-muted-foreground max-w-md mb-6">
                Chọn một cuộc trò chuyện hoặc bắt đầu cuộc trò chuyện mới để gửi tin nhắn, chia sẻ bài hát và playlist.
            </p>
        </div>
    )
}

export default EmptyState