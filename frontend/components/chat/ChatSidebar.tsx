"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Search, UserPlus, Loader2 } from "lucide-react"
import { ChatRoom, User } from "@/types"
import { useChat } from "@/context/chat-context"
import { useAuth } from "@/context/auth-context"

interface ChatSidebarProps {
    chatRooms: ChatRoom[]
    onSelectChat: (chat: ChatRoom) => void
    activeChat: ChatRoom | null
}

const ChatSidebar = ({ chatRooms, onSelectChat, activeChat }: ChatSidebarProps) => {
    const { user } = useAuth()
    const { searchUsers, searchResults, searchTerm, isSearching, startNewConversation, fetchMessageHistory, markMessagesAsRead } = useChat()
    const [localSearchTerm, setLocalSearchTerm] = useState("")
    const [isCreatingChat, setIsCreatingChat] = useState(false)
    const [showSearchResults, setShowSearchResults] = useState(false)

    // Xử lý tìm kiếm với debounce
    useEffect(() => {
        const timerId = setTimeout(() => {
            if (localSearchTerm.length >= 3) {
                searchUsers(localSearchTerm)
                setShowSearchResults(true)
            } else {
                setShowSearchResults(false)
            }
        }, 500)

        return () => clearTimeout(timerId)
    }, [localSearchTerm, searchUsers])

    // Lọc chat rooms theo từ khóa tìm kiếm
    const filteredRooms = chatRooms.filter(room =>
        room.partner.username.toLowerCase().includes(localSearchTerm.toLowerCase())
    )

    // Xử lý chọn cuộc trò chuyện
    const handleSelectChat = async (chat: ChatRoom) => {
        onSelectChat(chat)

        // Đánh dấu tin nhắn đã đọc
        if (chat.unreadCount > 0) {
            markMessagesAsRead(chat.id)
        }

        // Lấy lịch sử tin nhắn nếu user đã đăng nhập
        if (user && chat.partner) {
            fetchMessageHistory(user.id, chat.partner.id)
        }
    }

    // Xử lý bắt đầu cuộc trò chuyện với người dùng từ kết quả tìm kiếm
    const handleStartChat = async (user: User) => {
        setIsCreatingChat(true)
        try {
            const newChat = await startNewConversation(user.id)
            handleSelectChat(newChat)
            setLocalSearchTerm("")
            setShowSearchResults(false)
        } catch (error) {
            console.error("Lỗi khi bắt đầu cuộc trò chuyện:", error)
        } finally {
            setIsCreatingChat(false)
        }
    }

    return (
        <div className="h-full flex flex-col">
            <div className="p-4 border-b border-muted-foreground/10">
                <h2 className="text-xl font-bold mb-4">Tin nhắn</h2>

                {/* Tìm kiếm */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <input
                        type="text"
                        placeholder="Tìm kiếm người dùng..."
                        className="w-full pl-10 pr-4 py-2 rounded-full bg-muted/50 focus:outline-none focus:ring-1 focus:ring-primary"
                        value={localSearchTerm}
                        onChange={(e) => setLocalSearchTerm(e.target.value)}
                        onFocus={() => {
                            if (localSearchTerm.length >= 3) {
                                setShowSearchResults(true)
                            }
                        }}
                        onBlur={() => {
                            // Để tránh đóng ngay trước khi người dùng kịp nhấp vào kết quả
                            setTimeout(() => setShowSearchResults(false), 200)
                        }}
                    />
                    {isSearching && (
                        <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-primary" />
                    )}
                </div>

                {/* Kết quả tìm kiếm người dùng */}
                {showSearchResults && localSearchTerm.length >= 3 && (
                    <div className="absolute z-10 mt-1 w-[calc(100%-2rem)] bg-background rounded-md shadow-lg border border-muted-foreground/10 overflow-hidden">
                        {isSearching ? (
                            <div className="p-4 text-center">
                                <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                                <p className="mt-2 text-sm text-muted-foreground">Đang tìm kiếm...</p>
                            </div>
                        ) : searchResults.length > 0 ? (
                            <div className="max-h-60 overflow-y-auto">
                                {searchResults.map((user) => (
                                    <div
                                        key={user.id}
                                        className="p-3 hover:bg-muted/50 cursor-pointer flex items-center gap-3"
                                        onClick={() => handleStartChat(user)}
                                    >
                                        <div className="relative h-10 w-10 rounded-full overflow-hidden">
                                            {user.avatar ? (
                                                <Image
                                                    src={user.avatar}
                                                    alt={user.username}
                                                    fill
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <div className="h-full w-full bg-primary/20 flex items-center justify-center rounded-full">
                                                    <span className="text-sm font-semibold">
                                                        {user.username.charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate">{user.username}</p>
                                            <p className="text-xs text-muted-foreground truncate">
                                                {user.email}
                                            </p>
                                        </div>

                                        <button
                                            className="p-2 rounded-full hover:bg-primary/10 text-primary"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleStartChat(user)
                                            }}
                                            disabled={isCreatingChat}
                                        >
                                            {isCreatingChat ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <UserPlus className="h-4 w-4" />
                                            )}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-4 text-center">
                                <p className="text-sm text-muted-foreground">
                                    Không tìm thấy người dùng nào khớp với "{localSearchTerm}"
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Danh sách chat */}
            <div className="flex-1 overflow-y-auto">
                {filteredRooms.length > 0 ? (
                    <div className="divide-y divide-muted-foreground/10">
                        {filteredRooms.map((room) => (
                            <div
                                key={room.id}
                                className={`p-4 hover:bg-muted/50 cursor-pointer flex items-center space-x-3 transition-colors ${activeChat?.id === room.id ? 'bg-muted/80' : ''
                                    }`}
                                onClick={() => handleSelectChat(room)}
                            >
                                {/* Avatar */}
                                <div className="relative h-12 w-12 rounded-full overflow-hidden">
                                    {room.partner.avatar ? (
                                        <Image
                                            src={room.partner.avatar}
                                            alt={room.partner.username}
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="h-full w-full bg-primary/20 flex items-center justify-center rounded-full">
                                            <span className="text-lg font-semibold">
                                                {room.partner.username.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Chi tiết tin nhắn */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-baseline">
                                        <h3 className="font-semibold truncate">{room.partner.username}</h3>
                                        {room.lastMessage && (
                                            <span className="text-xs text-muted-foreground">
                                                {new Date(room.lastMessage.timestamp).toLocaleDateString()}
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex justify-between items-center">
                                        <p className="text-sm text-muted-foreground truncate">
                                            {room.lastMessage ? (
                                                room.lastMessage.message_type === 'TEXT' ?
                                                    room.lastMessage.content :
                                                    room.lastMessage.message_type === 'SONG' ?
                                                        '🎵 Đã chia sẻ một bài hát' :
                                                        room.lastMessage.message_type === 'PLAYLIST' ?
                                                            '🎧 Đã chia sẻ một playlist' :
                                                            room.lastMessage.message_type === 'IMAGE' ?
                                                                '📷 Đã gửi một hình ảnh' :
                                                                room.lastMessage.message_type === 'VOICE_NOTE' ?
                                                                    '🎤 Đã gửi tin nhắn thoại' :
                                                                    'Tin nhắn media'
                                            ) : 'Bắt đầu trò chuyện'}
                                        </p>

                                        {room.unreadCount > 0 && (
                                            <span className="inline-flex items-center justify-center bg-primary text-primary-foreground text-xs rounded-full h-5 min-w-5 px-1.5">
                                                {room.unreadCount}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                        <p className="text-muted-foreground">
                            {localSearchTerm ?
                                'Không tìm thấy cuộc trò chuyện nào' :
                                'Chưa có cuộc trò chuyện nào'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}

export default ChatSidebar 