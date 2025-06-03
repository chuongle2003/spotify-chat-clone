"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import ChatLayout from "@/components/chat/ChatLayout"
import { ChatProvider } from "@/context/chat-context"

export default function MessagesPage() {
    const { user, isLoading } = useAuth()
    const router = useRouter()

    // Chuyển hướng nếu chưa đăng nhập
    useEffect(() => {
        if (!isLoading && !user) {
            router.push("/login")
        }
    }, [user, isLoading, router])

    // Hiển thị loading hoặc component chat
    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <span className="loading loading-spinner loading-lg"></span>
            </div>
        )
    }

    return (
        <div className="h-full">
            <ChatProvider>
                <ChatLayout />
            </ChatProvider>
        </div>
    )
} 