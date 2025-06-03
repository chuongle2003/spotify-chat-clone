"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import {
    ChevronLeft,
    Send,
    Mic,
    PaperclipIcon,
    SmileIcon,
    Loader2,
    Music,
    Image as ImageIcon,
    Check,
    X,
    RefreshCw
} from "lucide-react"
import { useChat } from "@/context/chat-context"
import { useAuth } from "@/context/auth-context"
import MessageItem from "./MessageItem"
import { toast } from "@/components/ui/use-toast"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api"

interface ChatWindowProps {
    onToggleSidebar: () => void
    isMobileSidebarOpen: boolean
    onRefresh?: () => void
}

const ChatWindow = ({ onToggleSidebar, isMobileSidebarOpen, onRefresh }: ChatWindowProps) => {
    const { activeChat, messages, sendMessage, isConnected, shareSong, sharePlaylist, setMessages, fetchMessageHistory, isLoading } = useChat()
    const { user } = useAuth()
    const [messageText, setMessageText] = useState("")
    const [isSending, setIsSending] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [isRecording, setIsRecording] = useState(false)
    const [recordingTime, setRecordingTime] = useState(0)
    const [recordingInterval, setRecordingInterval] = useState<NodeJS.Timeout | null>(null)
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
    const [audioChunks, setAudioChunks] = useState<Blob[]>([])
    const [isAttachmentDialogOpen, setIsAttachmentDialogOpen] = useState(false)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [showShareDialog, setShowShareDialog] = useState(false)
    const [shareType, setShareType] = useState<'song' | 'playlist'>('song')
    const [shareId, setShareId] = useState("")
    const [shareComment, setShareComment] = useState("")

    // Tự động scroll xuống tin nhắn mới nhất
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
        }
    }, [messages])

    // Xử lý và gỡ lỗi tin nhắn
    useEffect(() => {
        if (messages && messages.length > 0) {
            console.log("Số lượng tin nhắn:", messages.length);

            // Kiểm tra xem tin nhắn có đúng định dạng không
            const invalidMessages = messages.filter(msg => !msg || !msg.sender || !msg.id);
            if (invalidMessages.length > 0) {
                console.warn("Phát hiện tin nhắn không hợp lệ:", invalidMessages);
            }
        }
    }, [messages]);

    // Xử lý kết thúc ghi âm khi component unmount
    useEffect(() => {
        return () => {
            if (recordingInterval) {
                clearInterval(recordingInterval)
            }
            if (mediaRecorder && mediaRecorder.state === 'recording') {
                mediaRecorder.stop()
            }
        }
    }, [recordingInterval, mediaRecorder])

    // Hàm gửi tin nhắn
    const handleSendMessage = async (e?: React.FormEvent) => {
        if (e) e.preventDefault()

        if (!messageText.trim() || !activeChat || isSending) return

        try {
            setIsSending(true)
            await sendMessage(activeChat.partner.id, messageText)
            setMessageText("")
        } catch (error) {
            console.error("Lỗi khi gửi tin nhắn:", error)
            toast({
                title: "Lỗi",
                description: "Không thể gửi tin nhắn. Vui lòng thử lại sau.",
                variant: "destructive"
            })
        } finally {
            setIsSending(false)
        }
    }

    // Bắt đầu ghi âm
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            const recorder = new MediaRecorder(stream)

            setAudioChunks([])
            const chunks: Blob[] = []

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunks.push(e.data)
                    setAudioChunks([...chunks])
                }
            }

            recorder.start(200)
            setMediaRecorder(recorder)
            setIsRecording(true)

            // Bộ đếm thời gian
            let time = 0
            const interval = setInterval(() => {
                time += 1
                setRecordingTime(time)

                // Dừng sau 60 giây
                if (time >= 60) {
                    stopRecording()
                }
            }, 1000)

            setRecordingInterval(interval)
        } catch (error) {
            console.error("Lỗi khi bắt đầu ghi âm:", error)
            toast({
                title: "Lỗi",
                description: "Không thể truy cập microphone. Vui lòng kiểm tra quyền truy cập.",
                variant: "destructive"
            })
        }
    }

    // Dừng ghi âm
    const stopRecording = async () => {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.stop()

            // Dừng stream để tắt microphone
            mediaRecorder.stream.getTracks().forEach(track => track.stop())

            if (recordingInterval) {
                clearInterval(recordingInterval)
                setRecordingInterval(null)
            }

            setIsRecording(false)

            // Xử lý ghi âm khi đã hoàn thành
            mediaRecorder.onstop = async () => {
                try {
                    if (!activeChat || audioChunks.length === 0) return

                    // Tạo blob từ audio chunks
                    const audioBlob = new Blob(audioChunks, { type: 'audio/webm' })

                    // Upload blob lên server
                    // Chuyển Blob thành File để sử dụng trong API
                    const audioFile = new File([audioBlob], "voice-message.webm", {
                        type: 'audio/webm',
                        lastModified: Date.now()
                    })

                    setIsSending(true)
                    const response = await api.chat.uploadFile(audioFile)

                    // Gửi tin nhắn voice note
                    await api.chat.sendVoiceNote(activeChat.partner.id, response.url, "")

                    // Reload tin nhắn
                    const messages = await api.chat.getConversationMessages(activeChat.id)
                    setMessages(messages)
                } catch (error) {
                    console.error("Lỗi khi gửi tin nhắn thoại:", error)
                    toast({
                        title: "Lỗi",
                        description: "Không thể gửi tin nhắn thoại. Vui lòng thử lại sau.",
                        variant: "destructive"
                    })
                } finally {
                    setIsSending(false)
                    setAudioChunks([])
                }
            }
        }
    }

    // Xử lý tệp đính kèm
    const handleAttachment = () => {
        setIsAttachmentDialogOpen(true)
    }

    // Xử lý chọn tệp
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setSelectedFile(e.target.files[0])
        }
    }

    // Xử lý gửi tệp đính kèm
    const handleSendFile = async () => {
        if (!selectedFile || !activeChat) return

        try {
            setIsSending(true)
            // Upload file lên server
            const formData = new FormData()
            formData.append('file', selectedFile)
            const response = await api.chat.uploadFile(selectedFile)
            const fileUrl = response.url

            // Kiểm tra loại file
            if (selectedFile.type.startsWith('image/')) {
                // Gửi ảnh
                await api.chat.sendImage(activeChat.partner.id, fileUrl, messageText)
            } else {
                // Gửi tệp đính kèm
                await api.chat.sendAttachment(activeChat.partner.id, fileUrl, messageText)
            }

            // Xóa trạng thái
            setSelectedFile(null)
            setMessageText("")
            setIsAttachmentDialogOpen(false)

            // Reload tin nhắn
            const messages = await api.chat.getConversationMessages(activeChat.id)
            setMessages(messages)
        } catch (error) {
            console.error("Lỗi khi gửi tệp:", error)
            toast({
                title: "Lỗi",
                description: "Không thể gửi tệp. Vui lòng thử lại sau.",
                variant: "destructive"
            })
        } finally {
            setIsSending(false)
        }
    }

    // Hàm xử lý chia sẻ nhạc/playlist
    const handleShare = async () => {
        if (!shareId || !activeChat) return

        try {
            setIsSending(true)
            if (shareType === 'song') {
                await shareSong(shareId, activeChat.partner.id, shareComment)
            } else {
                await sharePlaylist(shareId, activeChat.partner.id, shareComment)
            }

            setShareId("")
            setShareComment("")
            setShowShareDialog(false)
        } catch (error) {
            console.error(`Lỗi khi chia sẻ ${shareType}:`, error)
            toast({
                title: "Lỗi",
                description: `Không thể chia sẻ ${shareType === 'song' ? 'bài hát' : 'playlist'}. Vui lòng thử lại sau.`,
                variant: "destructive"
            })
        } finally {
            setIsSending(false)
        }
    }

    // Xử lý nhấn Enter để gửi tin nhắn
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSendMessage()
        }
    }

    if (!activeChat) return null

    // Format thời gian ghi âm
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`
    }

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="px-4 py-3 border-b border-muted-foreground/10 flex items-center justify-between">
                <div className="flex items-center">
                    <button
                        className="md:hidden p-2 -ml-2 mr-2 rounded-full hover:bg-muted/80"
                        onClick={onToggleSidebar}
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </button>

                    <div className="flex items-center space-x-3">
                        <div className="relative h-10 w-10 rounded-full overflow-hidden">
                            {activeChat.partner.avatar ? (
                                <Image
                                    src={activeChat.partner.avatar}
                                    alt={activeChat.partner.username}
                                    fill
                                    className="object-cover"
                                />
                            ) : (
                                <div className="h-full w-full bg-primary/20 flex items-center justify-center rounded-full">
                                    <span className="text-lg font-semibold">
                                        {activeChat.partner.username.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                            )}
                        </div>
                        <div>
                            <h3 className="font-semibold">{activeChat.partner.username}</h3>
                            <p className="text-xs text-muted-foreground flex items-center">
                                {isConnected ? (
                                    <>
                                        <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                                        Đang hoạt động
                                    </>
                                ) : (
                                    <>
                                        <span className="inline-block w-2 h-2 bg-gray-400 rounded-full mr-1"></span>
                                        Ngoại tuyến
                                    </>
                                )}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Nút refresh */}
                <button
                    onClick={onRefresh}
                    className="p-2 rounded-full hover:bg-muted/80"
                    title="Tải lại tin nhắn"
                >
                    <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin text-primary' : 'text-muted-foreground'}`} />
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {isLoading ? (
                    <div className="flex h-full items-center justify-center">
                        <span className="loading loading-spinner loading-md"></span>
                    </div>
                ) : messages && messages.length > 0 ? (
                    messages
                        .filter((msg) => msg && msg.sender && msg.id)
                        .map((msg) => (
                            <MessageItem
                                key={msg.id}
                                message={msg}
                                isCurrentUser={String(msg.sender?.id || msg.sender) === String(user?.id)}
                            />
                        ))
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center p-4">
                        <p className="text-muted-foreground mb-2">
                            Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện!
                        </p>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Message input */}
            <div className="p-4 border-t border-muted-foreground/10">
                {isRecording ? (
                    <div className="flex items-center space-x-2 p-3 bg-muted/50 rounded-2xl">
                        <div className="flex-1 flex items-center space-x-2">
                            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                            <span>Đang ghi âm... {formatTime(recordingTime)}</span>
                        </div>
                        <div className="flex space-x-2">
                            <button
                                onClick={stopRecording}
                                className="p-2 rounded-full bg-red-500 text-white"
                            >
                                <Check className="h-5 w-5" />
                            </button>
                            <button
                                onClick={() => {
                                    if (mediaRecorder) {
                                        mediaRecorder.stream.getTracks().forEach(track => track.stop())
                                        if (recordingInterval) {
                                            clearInterval(recordingInterval)
                                            setRecordingInterval(null)
                                        }
                                        setIsRecording(false)
                                    }
                                }}
                                className="p-2 rounded-full bg-gray-500 text-white"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSendMessage} className="flex items-end space-x-2">
                        <div className="flex-1 relative">
                            <div className="absolute bottom-2 left-3 flex space-x-1">
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <button
                                            type="button"
                                            className="p-1 rounded-full text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            <PaperclipIcon className="h-5 w-5" />
                                        </button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-48 p-2" align="start" alignOffset={10}>
                                        <div className="flex flex-col space-y-1">
                                            <button
                                                type="button"
                                                className="flex items-center space-x-2 p-2 hover:bg-muted rounded-md transition-colors"
                                                onClick={handleAttachment}
                                            >
                                                <ImageIcon className="h-4 w-4" />
                                                <span>Hình ảnh/Tệp</span>
                                            </button>
                                            <button
                                                type="button"
                                                className="flex items-center space-x-2 p-2 hover:bg-muted rounded-md transition-colors"
                                                onClick={() => setShowShareDialog(true)}
                                            >
                                                <Music className="h-4 w-4" />
                                                <span>Chia sẻ nhạc</span>
                                            </button>
                                        </div>
                                    </PopoverContent>
                                </Popover>

                                <button
                                    type="button"
                                    className="p-1 rounded-full text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    <SmileIcon className="h-5 w-5" />
                                </button>
                            </div>

                            <textarea
                                value={messageText}
                                onChange={(e) => setMessageText(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Nhập tin nhắn..."
                                className="w-full rounded-2xl bg-muted/50 focus:outline-none focus:ring-1 focus:ring-primary pl-[4.5rem] pr-10 py-3 max-h-32 min-h-[52px] resize-none"
                                rows={1}
                            ></textarea>

                            <button
                                type="button"
                                className="absolute bottom-2 right-3 p-1 rounded-full text-muted-foreground hover:text-foreground transition-colors"
                                onClick={startRecording}
                                disabled={isRecording}
                            >
                                <Mic className="h-5 w-5" />
                            </button>
                        </div>

                        <button
                            type="submit"
                            className={`p-3 rounded-full ${isSending ? 'bg-primary/70' : 'bg-primary'} text-primary-foreground flex items-center justify-center ${!messageText.trim() || isSending ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                            disabled={!messageText.trim() || isSending}
                        >
                            {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                        </button>
                    </form>
                )}
            </div>

            {/* Dialog đính kèm tệp */}
            <Dialog open={isAttachmentDialogOpen} onOpenChange={setIsAttachmentDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Đính kèm tệp</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-2">
                        <div className="flex flex-col space-y-2">
                            <Label htmlFor="attachment">Chọn tệp để gửi</Label>
                            <input
                                type="file"
                                id="attachment"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                className="w-full"
                            />
                        </div>
                        <div className="flex flex-col space-y-2">
                            <Label htmlFor="attachment-message">Tin nhắn (tùy chọn)</Label>
                            <textarea
                                id="attachment-message"
                                placeholder="Nhập tin nhắn kèm theo..."
                                value={messageText}
                                onChange={(e) => setMessageText(e.target.value)}
                                className="w-full h-24 p-2 rounded-md border bg-muted/50 focus:outline-none focus:ring-1 focus:ring-primary"
                            ></textarea>
                        </div>
                        <Button
                            onClick={handleSendFile}
                            disabled={!selectedFile}
                            className="w-full"
                        >
                            Gửi
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Dialog chia sẻ nhạc/playlist */}
            <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Chia sẻ nhạc</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-2">
                        <RadioGroup
                            value={shareType}
                            onValueChange={value => setShareType(value as 'song' | 'playlist')}
                            className="flex space-x-4"
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="song" id="song" />
                                <Label htmlFor="song">Bài hát</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="playlist" id="playlist" />
                                <Label htmlFor="playlist">Playlist</Label>
                            </div>
                        </RadioGroup>

                        <div className="flex flex-col space-y-2">
                            <Label htmlFor="share-id">ID {shareType === 'song' ? 'Bài hát' : 'Playlist'}</Label>
                            <input
                                type="text"
                                id="share-id"
                                value={shareId}
                                onChange={(e) => setShareId(e.target.value)}
                                placeholder={`Nhập ID ${shareType === 'song' ? 'bài hát' : 'playlist'}`}
                                className="p-2 rounded-md border bg-muted/50 focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                        </div>

                        <div className="flex flex-col space-y-2">
                            <Label htmlFor="share-comment">Bình luận (tùy chọn)</Label>
                            <textarea
                                id="share-comment"
                                placeholder="Nhập bình luận của bạn..."
                                value={shareComment}
                                onChange={(e) => setShareComment(e.target.value)}
                                className="w-full h-24 p-2 rounded-md border bg-muted/50 focus:outline-none focus:ring-1 focus:ring-primary"
                            ></textarea>
                        </div>

                        <Button
                            onClick={handleShare}
                            disabled={!shareId || isSending}
                            className="w-full"
                        >
                            {isSending ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
                            Chia sẻ
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default ChatWindow 