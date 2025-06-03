"use client"

import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from "react"
import { User, Message, ChatRoom, WebSocketMessage } from "@/types"
import { api } from "@/lib/api"
import { useAuth } from "./auth-context"
import { toast } from "@/components/ui/use-toast"

type ChatContextType = {
    activeChat: ChatRoom | null
    chatRooms: ChatRoom[]
    messages: Message[]
    isLoading: boolean
    searchResults: User[]
    searchTerm: string
    isSearching: boolean
    sendMessage: (receiverId: string, content: string) => Promise<void>
    shareSong: (songId: string, receiverId: string, content: string) => Promise<Message>
    sharePlaylist: (playlistId: string, receiverId: string, content: string) => Promise<Message>
    searchUsers: (term: string) => Promise<void>
    startNewConversation: (userId: string) => Promise<ChatRoom>
    setActiveChat: (chat: ChatRoom | null) => void
    setMessages: (messages: Message[] | ((prev: Message[]) => Message[])) => void
    isConnected: boolean
    markMessagesAsRead: (conversationId: string) => Promise<void>
    deleteMessage: (messageId: number) => Promise<void>
    fetchMessageHistory: (user1Id: string, user2Id: string) => Promise<Message[]>
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

export function ChatProvider({ children }: { children: ReactNode }) {
    const { user, accessToken } = useAuth()
    const [activeChat, setActiveChat] = useState<ChatRoom | null>(null)
    const [chatRooms, setChatRooms] = useState<ChatRoom[]>([])
    const [messages, setMessages] = useState<Message[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [isConnected, setIsConnected] = useState(false)
    const [searchResults, setSearchResults] = useState<User[]>([])
    const [searchTerm, setSearchTerm] = useState("")
    const [isSearching, setIsSearching] = useState(false)
    const socketRef = useRef<WebSocket | null>(null)
    const socketReconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    // Tìm kiếm người dùng
    const searchUsers = useCallback(async (term: string) => {
        if (term.length < 3) {
            setSearchResults([])
            setSearchTerm("")
            return
        }

        setSearchTerm(term)
        setIsSearching(true)

        try {
            const users = await api.chat.searchUsers(term)
            setSearchResults(users)
        } catch (error) {
            console.error("Lỗi khi tìm kiếm người dùng:", error)
            toast({
                title: "Lỗi tìm kiếm",
                description: "Không thể tìm kiếm người dùng. Vui lòng thử lại sau.",
                variant: "destructive"
            })
        } finally {
            setIsSearching(false)
        }
    }, [])

    // Bắt đầu cuộc trò chuyện mới
    const startNewConversation = useCallback(async (userId: string) => {
        try {
            const newChat = await api.chat.startConversation(userId)

            // Cập nhật danh sách chat rooms sử dụng đúng conversation.id
            setChatRooms(prev => {
                // Kiểm tra xem chat room đã tồn tại chưa
                const exists = prev.some(room => room.id === newChat.id)
                if (exists) {
                    return prev
                }
                return [newChat, ...prev]
            })

            setActiveChat(newChat)
            return newChat
        } catch (error) {
            console.error("Lỗi khi bắt đầu cuộc trò chuyện:", error)
            toast({
                title: "Lỗi",
                description: "Không thể bắt đầu cuộc trò chuyện. Vui lòng thử lại sau.",
                variant: "destructive"
            })
            throw error
        }
    }, [])

    // Đánh dấu tin nhắn là đã đọc
    const markMessagesAsRead = useCallback(async (conversationId: string) => {
        if (!user) return

        try {
            // Gọi API đánh dấu tin nhắn đã đọc
            await api.chat.markMessagesAsRead(conversationId)

            // Cập nhật trạng thái read ở local first
            setMessages(prev =>
                prev.map(msg => {
                    if (msg.receiver.id === user.id && !msg.is_read) {
                        return { ...msg, is_read: true }
                    }
                    return msg
                })
            )

            // Cập nhật unread count ở chat room
            setChatRooms(prev =>
                prev.map(room => {
                    if (room.id === conversationId) {
                        return { ...room, unreadCount: 0 }
                    }
                    return room
                })
            )
        } catch (error) {
            console.error("Lỗi khi đánh dấu tin nhắn đã đọc:", error)
        }
    }, [user])

    // Xóa tin nhắn
    const deleteMessage = useCallback(async (messageId: number) => {
        try {
            await api.chat.deleteMessage(messageId)

            // Cập nhật danh sách tin nhắn
            setMessages(prev => prev.filter(msg => msg.id !== messageId))

            toast({
                title: "Thành công",
                description: "Tin nhắn đã được xóa",
            })
        } catch (error) {
            console.error("Lỗi khi xóa tin nhắn:", error)
            toast({
                title: "Lỗi",
                description: "Không thể xóa tin nhắn. Vui lòng thử lại sau.",
                variant: "destructive"
            })
        }
    }, [])

    // Lấy lịch sử tin nhắn
    const fetchMessageHistory = useCallback(async (user1Id: string, user2Id: string) => {
        try {
            setIsLoading(true)
            console.log("Đang lấy lịch sử tin nhắn giữa", user1Id, "và", user2Id)
            const messages = await api.chat.getMessageHistory(user1Id, user2Id)
            console.log("Lịch sử tin nhắn nhận được:", messages)

            if (Array.isArray(messages)) {
                setMessages(messages)
            } else {
                console.error("Dữ liệu tin nhắn không phải mảng:", messages)
                setMessages([])
            }

            return messages
        } catch (error) {
            console.error("Lỗi khi lấy lịch sử tin nhắn:", error)
            toast({
                title: "Lỗi",
                description: "Không thể lấy lịch sử tin nhắn. Vui lòng thử lại sau.",
                variant: "destructive"
            })
            setMessages([])
            return []
        } finally {
            setIsLoading(false)
        }
    }, [])

    // Tải tin nhắn từ API
    useEffect(() => {
        if (!user || !accessToken) return

        const fetchData = async () => {
            setIsLoading(true)
            try {
                // Lấy danh sách cuộc trò chuyện
                const conversations = await api.chat.getConversations()
                setChatRooms(conversations)

                // Nếu có active chat, lấy tin nhắn của cuộc trò chuyện đó
                if (activeChat) {
                    const messages = await api.chat.getConversationMessages(activeChat.id)
                    setMessages(messages)

                    // Đánh dấu tin nhắn là đã đọc
                    if (activeChat.unreadCount > 0) {
                        markMessagesAsRead(activeChat.id)
                    }
                }
            } catch (error) {
                console.error("Lỗi khi tải dữ liệu chat:", error)
                toast({
                    title: "Lỗi kết nối",
                    description: "Không thể tải tin nhắn. Vui lòng thử lại sau.",
                    variant: "destructive"
                })
            } finally {
                setIsLoading(false)
            }
        }

        fetchData()
    }, [user, accessToken, activeChat, markMessagesAsRead])

    // Thiết lập kết nối WebSocket khi active chat thay đổi
    useEffect(() => {
        if (!user || !activeChat || !accessToken) {
            if (socketRef.current) {
                socketRef.current.close()
                socketRef.current = null
                setIsConnected(false)
            }
            // Xóa timeout tái kết nối nếu có
            if (socketReconnectTimeoutRef.current) {
                clearTimeout(socketReconnectTimeoutRef.current)
                socketReconnectTimeoutRef.current = null
            }
            return
        }

        // Hàm kết nối WebSocket
        const connectWebSocket = () => {
            // Đóng kết nối cũ nếu có
            if (socketRef.current) {
                socketRef.current.close()
            }

            // Tạo URL WebSocket với token trong query string
            const baseWsUrl = process.env.NEXT_PUBLIC_WS_URL || 'wss://spotifybackend.shop/ws/chat'
            const wsUrl = `${baseWsUrl}/${activeChat.id}/?token=${encodeURIComponent(accessToken)}`

            console.log("Đang kết nối WebSocket:", wsUrl)

            // Khởi tạo WebSocket tiêu chuẩn với token trong URL
            socketRef.current = new WebSocket(wsUrl)

            // Xử lý sự kiện WebSocket
            socketRef.current.onopen = () => {
                console.log('WebSocket kết nối thành công')
                setIsConnected(true)

                // Xóa timeout tái kết nối nếu có
                if (socketReconnectTimeoutRef.current) {
                    clearTimeout(socketReconnectTimeoutRef.current)
                    socketReconnectTimeoutRef.current = null
                }
            }

            socketRef.current.onmessage = (event) => {
                const data = JSON.parse(event.data)
                console.log("Nhận tin nhắn WebSocket:", data)

                if (data.type === 'message' && data.data) {
                    // Xử lý tin nhắn mới
                    const msgData = data.data

                    // Tìm thông tin người gửi và người nhận từ tham số msgData
                    const sender: User = {
                        id: msgData.sender_id,
                        username: msgData.sender_username || "Unknown",
                        email: msgData.sender_email || "",
                        avatar: msgData.sender_avatar || undefined
                    }

                    const receiver: User = {
                        id: msgData.receiver_id,
                        username: msgData.receiver_username || "Unknown",
                        email: msgData.receiver_email || "",
                        avatar: msgData.receiver_avatar || undefined
                    }

                    // Tạo đối tượng tin nhắn mới
                    const newMessage: Message = {
                        id: msgData.id,
                        sender,
                        receiver,
                        content: msgData.message,
                        timestamp: msgData.timestamp,
                        is_read: sender.id !== user.id, // Tự động đánh dấu là đã đọc nếu người dùng hiện tại không phải người gửi
                        message_type: msgData.message_type || 'TEXT',
                        shared_song: msgData.song_id ? { id: msgData.song_id, title: msgData.song_title || "Loading...", artist: msgData.song_artist || "", duration: msgData.song_duration || 0 } : null,
                        shared_playlist: msgData.playlist_id ? { id: msgData.playlist_id, title: msgData.playlist_title || "Loading...", created_by: msgData.playlist_created_by || "", created_at: msgData.playlist_created_at || "", is_public: msgData.playlist_is_public !== false } : null,
                        attachment: msgData.attachment || null,
                        image: msgData.image || null,
                        voice_note: msgData.voice_note || null
                    }

                    // Cập nhật danh sách tin nhắn
                    setMessages(prev => [...prev, newMessage])

                    // Cập nhật chat room với tin nhắn mới nhất
                    setChatRooms(prev => {
                        const updatedRooms = [...prev]
                        const roomIndex = updatedRooms.findIndex(room => room.id === activeChat.id)

                        if (roomIndex >= 0) {
                            updatedRooms[roomIndex] = {
                                ...updatedRooms[roomIndex],
                                lastMessage: newMessage,
                                unreadCount: sender.id !== user.id ?
                                    updatedRooms[roomIndex].unreadCount + 1 :
                                    updatedRooms[roomIndex].unreadCount
                            }

                            // Sắp xếp lại để phòng có tin nhắn mới nhất lên đầu
                            updatedRooms.sort((a, b) => {
                                const timeA = new Date(a.lastMessage?.timestamp || 0).getTime()
                                const timeB = new Date(b.lastMessage?.timestamp || 0).getTime()
                                return timeB - timeA
                            })
                        }

                        return updatedRooms
                    })
                } else if (data.type === 'error') {
                    // Xử lý lỗi từ server
                    console.error("WebSocket error từ server:", data.message)
                    toast({
                        title: "Lỗi chat",
                        description: data.message || "Có lỗi xảy ra",
                        variant: "destructive"
                    })
                }
            }

            socketRef.current.onclose = (event) => {
                console.log('WebSocket đã đóng', event.code, event.reason)
                setIsConnected(false)

                // Mã lỗi từ tài liệu API
                const errorMessages: { [key: number]: string } = {
                    4001: "Bạn chưa đăng nhập",
                    4004: "Không tìm thấy người dùng",
                    4005: "Không tìm thấy cuộc trò chuyện",
                    4006: "Tài khoản bị hạn chế chat",
                    4007: "Tin nhắn không hợp lệ",
                    4008: "Lỗi máy chủ"
                }

                // Kiểm tra nếu là lỗi từ máy chủ
                if (errorMessages[event.code]) {
                    toast({
                        title: "Lỗi kết nối",
                        description: errorMessages[event.code],
                        variant: "destructive"
                    })
                }

                // Kết nối lại sau 5 giây nếu không phải lỗi nghiêm trọng
                if (event.code !== 4001 && event.code !== 4004 && event.code !== 4005 && event.code !== 4006) {
                    socketReconnectTimeoutRef.current = setTimeout(() => {
                        console.log("Đang thử kết nối lại WebSocket...")
                        connectWebSocket()
                    }, 5000)
                }
            }

            socketRef.current.onerror = (error) => {
                console.error('WebSocket error:', error)
                setIsConnected(false)

                toast({
                    title: "Lỗi kết nối",
                    description: "Không thể kết nối đến server chat",
                    variant: "destructive"
                })
            }
        }

        // Kết nối WebSocket ban đầu
        connectWebSocket()

        // Cleanup khi component unmount hoặc active chat thay đổi
        return () => {
            if (socketRef.current) {
                socketRef.current.close()
            }
            if (socketReconnectTimeoutRef.current) {
                clearTimeout(socketReconnectTimeoutRef.current)
            }
        }
    }, [user, activeChat, accessToken])

    // Gửi tin nhắn văn bản
    const sendMessage = useCallback(async (receiverId: string, content: string): Promise<void> => {
        if (!user || !accessToken) {
            throw new Error("Bạn cần đăng nhập để gửi tin nhắn")
        }

        // Kiểm tra WebSocket
        if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
            toast({
                title: "Lỗi kết nối",
                description: "Không thể gửi tin nhắn. WebSocket chưa sẵn sàng.",
                variant: "destructive"
            })
            return
        }

        // Gửi qua WebSocket
        socketRef.current.send(JSON.stringify({
            message: content,
            message_type: "TEXT"
        }))

        // Không cần xử lý newMessage ở đây nữa, vì sẽ nhận lại tin nhắn từ server qua socket.onmessage
    }, [user, accessToken])

    // Chia sẻ bài hát
    const shareSong = useCallback(async (songId: string, receiverId: string, content: string): Promise<Message> => {
        if (!user || !accessToken) {
            throw new Error("Bạn cần đăng nhập để chia sẻ bài hát")
        }

        try {
            let targetChatRoom = activeChat

            // Tương tự như sendMessage, kiểm tra và tạo cuộc trò chuyện nếu cần
            if (!targetChatRoom || targetChatRoom.partner.id !== receiverId) {
                const existingRoom = chatRooms.find(r => r.partner.id === receiverId)

                if (existingRoom) {
                    targetChatRoom = existingRoom
                    setActiveChat(existingRoom)
                } else {
                    targetChatRoom = await startNewConversation(receiverId)
                }
            }

            // Gửi tin nhắn chia sẻ bài hát qua API
            const newMessage = await api.chat.shareSong(receiverId, songId, content)

            // Cập nhật danh sách tin nhắn
            setMessages(prev => [...prev, newMessage])

            // Gửi tin nhắn qua WebSocket nếu đã kết nối
            if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
                socketRef.current.send(JSON.stringify({
                    message: content,
                    message_type: "SONG",
                    song_id: songId
                }));
            }

            // Cập nhật chat rooms
            setChatRooms(prev => {
                const updatedRooms = [...prev]
                const roomIndex = updatedRooms.findIndex(room => room.id === targetChatRoom!.id)

                if (roomIndex >= 0) {
                    updatedRooms[roomIndex] = {
                        ...updatedRooms[roomIndex],
                        lastMessage: newMessage
                    }

                    const updatedRoom = updatedRooms.splice(roomIndex, 1)[0]
                    updatedRooms.unshift(updatedRoom)
                } else {
                    updatedRooms.unshift({
                        id: targetChatRoom!.id,
                        partner: newMessage.receiver.id === user.id ? newMessage.sender : newMessage.receiver,
                        lastMessage: newMessage,
                        unreadCount: 0
                    })
                }

                return updatedRooms
            })

            return newMessage
        } catch (error) {
            console.error("Lỗi khi chia sẻ bài hát:", error)
            toast({
                title: "Lỗi",
                description: "Không thể chia sẻ bài hát. Vui lòng thử lại sau.",
                variant: "destructive"
            })
            throw error
        }
    }, [user, accessToken, activeChat, chatRooms, startNewConversation])

    // Chia sẻ playlist
    const sharePlaylist = useCallback(async (playlistId: string, receiverId: string, content: string): Promise<Message> => {
        if (!user || !accessToken) {
            throw new Error("Bạn cần đăng nhập để chia sẻ playlist")
        }

        try {
            let targetChatRoom = activeChat

            // Tương tự như sendMessage, kiểm tra và tạo cuộc trò chuyện nếu cần
            if (!targetChatRoom || targetChatRoom.partner.id !== receiverId) {
                const existingRoom = chatRooms.find(r => r.partner.id === receiverId)

                if (existingRoom) {
                    targetChatRoom = existingRoom
                    setActiveChat(existingRoom)
                } else {
                    targetChatRoom = await startNewConversation(receiverId)
                }
            }

            // Gửi tin nhắn chia sẻ playlist qua API
            const newMessage = await api.chat.sharePlaylist(receiverId, playlistId, content)

            // Cập nhật danh sách tin nhắn
            setMessages(prev => [...prev, newMessage])

            // Gửi tin nhắn qua WebSocket nếu đã kết nối
            if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
                socketRef.current.send(JSON.stringify({
                    message: content,
                    message_type: "PLAYLIST",
                    playlist_id: playlistId
                }));
            }

            // Cập nhật chat rooms
            setChatRooms(prev => {
                const updatedRooms = [...prev]
                const roomIndex = updatedRooms.findIndex(room => room.id === targetChatRoom!.id)

                if (roomIndex >= 0) {
                    updatedRooms[roomIndex] = {
                        ...updatedRooms[roomIndex],
                        lastMessage: newMessage
                    }

                    const updatedRoom = updatedRooms.splice(roomIndex, 1)[0]
                    updatedRooms.unshift(updatedRoom)
                } else {
                    updatedRooms.unshift({
                        id: targetChatRoom!.id,
                        partner: newMessage.receiver.id === user.id ? newMessage.sender : newMessage.receiver,
                        lastMessage: newMessage,
                        unreadCount: 0
                    })
                }

                return updatedRooms
            })

            return newMessage
        } catch (error) {
            console.error("Lỗi khi chia sẻ playlist:", error)
            toast({
                title: "Lỗi",
                description: "Không thể chia sẻ playlist. Vui lòng thử lại sau.",
                variant: "destructive"
            })
            throw error
        }
    }, [user, accessToken, activeChat, chatRooms, startNewConversation])

    return (
        <ChatContext.Provider value={{
            activeChat,
            chatRooms,
            messages,
            isLoading,
            searchResults,
            searchTerm,
            isSearching,
            sendMessage,
            shareSong,
            sharePlaylist,
            searchUsers,
            startNewConversation,
            setActiveChat,
            setMessages,
            isConnected,
            markMessagesAsRead,
            deleteMessage,
            fetchMessageHistory
        }}>
            {children}
        </ChatContext.Provider>
    )
}

export function useChat() {
    const context = useContext(ChatContext)
    if (context === undefined) {
        throw new Error("useChat must be used within a ChatProvider")
    }
    return context
} 