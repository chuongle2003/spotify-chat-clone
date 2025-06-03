"use client"

import { useState } from "react"
import Image from "next/image"
import { Message } from "@/types"
import { formatDistanceToNow } from "date-fns"
import { vi } from "date-fns/locale"
import { PlayIcon, CheckCircle2, MoreVertical, Trash2, XCircle, Volume2 } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useChat } from "@/context/chat-context"
import { cn } from "@/lib/utils"

interface MessageItemProps {
    message: Message
    isCurrentUser: boolean
}

const MessageItem = ({ message, isCurrentUser }: MessageItemProps) => {
    const { deleteMessage } = useChat()
    const [isPlaying, setIsPlaying] = useState(false)
    const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null)

    const formattedTime = formatDistanceToNow(new Date(message.timestamp || Date.now()), {
        addSuffix: true,
        locale: vi
    })

    // Xử lý xóa tin nhắn
    const handleDelete = () => {
        if (window.confirm("Bạn có chắc chắn muốn xóa tin nhắn này?")) {
            deleteMessage(message.id)
        }
    }

    // Xử lý phát voice note
    const handlePlayVoiceNote = () => {
        if (!message.voice_note) return

        if (!audioElement) {
            const audio = new Audio(message.voice_note)
            audio.onended = () => setIsPlaying(false)
            audio.onpause = () => setIsPlaying(false)
            audio.onplay = () => setIsPlaying(true)
            setAudioElement(audio)
            audio.play().catch(err => console.error("Không thể phát voice note:", err))
            setIsPlaying(true)
        } else {
            if (isPlaying) {
                audioElement.pause()
                setIsPlaying(false)
            } else {
                audioElement.play().catch(err => console.error("Không thể phát voice note:", err))
                setIsPlaying(true)
            }
        }
    }

    // Render các loại tin nhắn khác nhau
    const renderMessageContent = () => {
        switch (message.message_type) {
            case 'TEXT':
                return <p className="whitespace-pre-wrap break-words">{message.content || ''}</p>

            case 'SONG':
                if (!message.shared_song) return <p className="whitespace-pre-wrap break-words">{message.content || ''}</p>
                return (
                    <div className="mt-2">
                        <p className="mb-2 whitespace-pre-wrap break-words">{message.content || ''}</p>
                        <div className={`rounded-lg p-3 flex items-center space-x-3 border ${isCurrentUser ? 'bg-blue-600/50 border-blue-700' : 'bg-gray-300 border-gray-400'}`}>
                            {message.shared_song.cover_image && (
                                <div className="relative h-12 w-12 rounded overflow-hidden flex-shrink-0">
                                    <Image
                                        src={message.shared_song.cover_image}
                                        alt={message.shared_song.title || 'Song'}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <h4 className={`font-medium truncate ${isCurrentUser ? 'text-white' : 'text-gray-800'}`}>
                                    {message.shared_song.title || 'Unknown Song'}
                                </h4>
                                <p className={`text-sm truncate ${isCurrentUser ? 'text-blue-100' : 'text-gray-600'}`}>
                                    {message.shared_song.artist || 'Unknown Artist'}
                                </p>
                            </div>
                            <button
                                className={`rounded-full p-2 flex-shrink-0 ${isCurrentUser ? 'bg-white text-blue-500' : 'bg-blue-500 text-white'}`}
                            >
                                <PlayIcon className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                )

            case 'PLAYLIST':
                if (!message.shared_playlist) return <p className="whitespace-pre-wrap break-words">{message.content || ''}</p>
                return (
                    <div className="mt-2">
                        <p className="mb-2 whitespace-pre-wrap break-words">{message.content || ''}</p>
                        <div className={`rounded-lg p-3 flex items-center space-x-3 border ${isCurrentUser ? 'bg-blue-600/50 border-blue-700' : 'bg-gray-300 border-gray-400'}`}>
                            {message.shared_playlist.cover_image && (
                                <div className="relative h-12 w-12 rounded overflow-hidden flex-shrink-0">
                                    <Image
                                        src={message.shared_playlist.cover_image}
                                        alt={message.shared_playlist.title || 'Playlist'}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <h4 className={`font-medium truncate ${isCurrentUser ? 'text-white' : 'text-gray-800'}`}>
                                    {message.shared_playlist.title || 'Unknown Playlist'}
                                </h4>
                                <p className={`text-sm truncate ${isCurrentUser ? 'text-blue-100' : 'text-gray-600'}`}>
                                    {(message.shared_playlist.songs?.length || 0)} bài hát
                                </p>
                            </div>
                            <button
                                className={`rounded-full p-2 flex-shrink-0 ${isCurrentUser ? 'bg-white text-blue-500' : 'bg-blue-500 text-white'}`}
                            >
                                <PlayIcon className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                )

            case 'IMAGE':
                if (!message.image) return <p className="whitespace-pre-wrap break-words">{message.content || ''}</p>
                return (
                    <div className="mt-2">
                        {message.content && <p className="mb-2 whitespace-pre-wrap break-words">{message.content}</p>}
                        <div className="relative max-h-[250px] rounded-lg overflow-hidden">
                            <a href={message.image} target="_blank" rel="noopener noreferrer">
                                <Image
                                    src={message.image}
                                    alt="Shared image"
                                    width={300}
                                    height={250}
                                    className="object-contain max-h-[250px] rounded-lg"
                                />
                            </a>
                        </div>
                    </div>
                )

            case 'ATTACHMENT':
                if (!message.attachment) return <p className="whitespace-pre-wrap break-words">{message.content || ''}</p>
                return (
                    <div className="mt-2">
                        <p className="mb-2 whitespace-pre-wrap break-words">{message.content || ''}</p>
                        <div className={`rounded-lg p-3 flex items-center space-x-3 border ${isCurrentUser ? 'bg-blue-600/50 border-blue-700' : 'bg-gray-300 border-gray-400'}`}>
                            <div className="flex-1 min-w-0">
                                <h4 className={`font-medium truncate ${isCurrentUser ? 'text-white' : 'text-gray-800'}`}>
                                    Tệp đính kèm
                                </h4>
                                <a
                                    href={message.attachment}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`text-sm truncate hover:underline ${isCurrentUser ? 'text-blue-100' : 'text-blue-600'}`}
                                >
                                    Tải xuống
                                </a>
                            </div>
                        </div>
                    </div>
                )

            case 'VOICE_NOTE':
                if (!message.voice_note) return <p className="whitespace-pre-wrap break-words">{message.content || ''}</p>
                return (
                    <div className="mt-2">
                        {message.content && <p className="mb-2 whitespace-pre-wrap break-words">{message.content}</p>}
                        <div className={`rounded-lg p-3 flex items-center space-x-3 border ${isCurrentUser ? 'bg-blue-600/50 border-blue-700' : 'bg-gray-300 border-gray-400'}`}>
                            <button
                                className={`rounded-full p-2 flex-shrink-0 ${isPlaying ? 'bg-red-500 text-white' : isCurrentUser ? 'bg-white text-blue-500' : 'bg-blue-500 text-white'}`}
                                onClick={handlePlayVoiceNote}
                            >
                                {isPlaying ? <XCircle className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                            </button>
                            <div className="flex-1 min-w-0">
                                <p className={`text-sm ${isCurrentUser ? 'text-white' : 'text-gray-800'}`}>
                                    Tin nhắn thoại
                                </p>
                            </div>
                        </div>
                    </div>
                )

            default:
                return <p className="whitespace-pre-wrap break-words">{message.content || ''}</p>
        }
    }

    return (
        <div className={`flex mb-4 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] flex ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'} items-end`}>

                {/* Avatar */}
                <div className={cn(
                    "relative h-8 w-8 rounded-full overflow-hidden flex-shrink-0",
                    isCurrentUser ? "ml-2 mt-1" : "mr-2 mt-1"
                )}>
                    {message.sender?.avatar ? (
                        <Image
                            src={message.sender.avatar}
                            alt={message.sender?.username || 'User'}
                            fill
                            className="object-cover"
                        />
                    ) : (
                        <div className="h-full w-full bg-primary/20 flex items-center justify-center rounded-full">
                            <span className="text-xs font-semibold">
                                {message.sender?.username ? message.sender.username.charAt(0).toUpperCase() : "?"}
                            </span>
                        </div>
                    )}
                </div>

                {/* Nội dung tin nhắn */}
                <div>
                    <div
                        className={cn(
                            "py-2 px-3 rounded-2xl relative group",
                            isCurrentUser
                                ? "bg-blue-500 text-white rounded-bl-none"
                                : "bg-gray-200 text-gray-800 rounded-br-none"
                        )}
                    >
                        {renderMessageContent()}

                        {/* Dropdown menu cho các tùy chọn của tin nhắn */}
                        <div className={`absolute ${isCurrentUser ? 'right-0' : 'left-0'} top-1/2 transform ${isCurrentUser ? 'translate-x-full -translate-y-1/2 -mr-1' : '-translate-x-full -translate-y-1/2 -ml-1'} opacity-0 group-hover:opacity-100 transition-opacity`}>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="p-1 bg-background rounded-full shadow-sm">
                                        <MoreVertical className="h-4 w-4 text-muted-foreground" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align={isCurrentUser ? "start" : "end"} className="w-40">
                                    {isCurrentUser && (
                                        <DropdownMenuItem onClick={handleDelete} className="text-destructive focus:text-destructive">
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            <span>Xóa tin nhắn</span>
                                        </DropdownMenuItem>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                    <div className={`flex items-center text-xs text-muted-foreground mt-1 ${isCurrentUser ? 'justify-start' : 'justify-end'}`}>
                        <span className="mr-1">{formattedTime}</span>
                        {isCurrentUser && (
                            <CheckCircle2
                                className={`h-3 w-3 ml-1 ${message.is_read === true ? 'text-blue-500' : 'text-gray-400'}`}
                                fill={message.is_read === true ? 'currentColor' : 'none'}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default MessageItem 