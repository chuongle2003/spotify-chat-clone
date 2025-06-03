"use client"

import { useState } from "react"
import { useChat } from "@/context/chat-context"
import { useAuth } from "@/context/auth-context"
import ChatSidebar from "./ChatSidebar"
import ChatWindow from "./ChatWindow"
import EmptyState from "./EmptyState"

const ChatLayout = () => {
    const { activeChat, chatRooms, setActiveChat, fetchMessageHistory, markMessagesAsRead } = useChat()
    const { user } = useAuth()
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

    // Xử lý chọn cuộc trò chuyện
    const handleSelectChat = async (chat) => {
        setActiveChat(chat)
        setIsMobileSidebarOpen(false)

        // Đánh dấu tin nhắn đã đọc
        if (chat.unreadCount > 0) {
            markMessagesAsRead(chat.id)
        }

        // Lấy lịch sử tin nhắn nếu user đã đăng nhập
        if (user && chat.partner) {
            fetchMessageHistory(user.id, chat.partner.id)
        }
    }

    // Xử lý refresh tin nhắn
    const handleRefresh = () => {
        if (activeChat && user) {
            console.log("Đang tải lại tin nhắn...");
            fetchMessageHistory(user.id, activeChat.partner.id);
        }
    }

    return (
        <div className="flex h-full overflow-hidden">
            {/* Sidebar - Hiển thị danh sách cuộc trò chuyện */}
            <div
                className={`bg-background border-r border-muted-foreground/10 transition-all duration-300 
          ${isMobileSidebarOpen ? 'w-full absolute z-10 md:relative md:w-80' : 'w-0 md:w-80'}`}
            >
                <ChatSidebar
                    chatRooms={chatRooms}
                    onSelectChat={handleSelectChat}
                    activeChat={activeChat}
                />
            </div>

            {/* Khu vực trò chuyện chính */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {activeChat ? (
                    <ChatWindow
                        onToggleSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
                        isMobileSidebarOpen={isMobileSidebarOpen}
                        onRefresh={handleRefresh}
                    />
                ) : (
                    <EmptyState onOpenSidebar={() => setIsMobileSidebarOpen(true)} />
                )}
            </div>
        </div>
    )
}

export default ChatLayout 