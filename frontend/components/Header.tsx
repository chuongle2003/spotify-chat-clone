"use client"

import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { Bell, ChevronLeft, ChevronRight, User, LogOut, Settings } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { useState } from "react"

export function Header() {
    const { user, logout } = useAuth()
    const router = useRouter()
    const [searchQuery, setSearchQuery] = useState("")

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        if (searchQuery.trim()) {
            router.push(`/search?q=${encodeURIComponent(searchQuery)}`)
        }
    }

    const handleUserLogout = async () => {
        try {
            await logout()
            router.push("/")
        } catch (error) {
            console.error("Error logging out:", error)
        }
    }

    return (
        <header className="bg-black/20 backdrop-blur-sm sticky top-0 z-10 px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full bg-black/40 text-white"
                        onClick={() => router.back()}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full bg-black/40 text-white"
                        onClick={() => router.forward()}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>

                <form onSubmit={handleSearch} className="relative w-64">
                    <Input
                        type="search"
                        placeholder="Tìm kiếm..."
                        className="bg-zinc-800 border-none rounded-full pl-4 pr-10 h-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <Button
                        type="submit"
                        size="sm"
                        variant="ghost"
                        className="absolute right-0 top-0 h-full px-3 text-zinc-400"
                    >
                        <span className="sr-only">Tìm kiếm</span>
                    </Button>
                </form>
            </div>

            <div className="flex items-center gap-4">
                <Button className="bg-white text-black hover:bg-white/90">
                    Nâng cấp
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full bg-black/40 text-white"
                >
                    <Bell className="h-4 w-4" />
                </Button>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="rounded-full overflow-hidden">
                            {user?.profile_image ? (
                                <Image
                                    src={user.profile_image}
                                    alt={user.username || "User"}
                                    width={32}
                                    height={32}
                                    className="rounded-full"
                                />
                            ) : (
                                <div className="h-8 w-8 rounded-full bg-zinc-700 flex items-center justify-center">
                                    <User className="h-4 w-4" />
                                </div>
                            )}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 bg-zinc-900 border-zinc-800 text-white">
                        <DropdownMenuItem className="cursor-pointer hover:bg-zinc-800" onClick={() => router.push('/account')}>
                            <User className="mr-2 h-4 w-4" />
                            <span>Tài khoản</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer hover:bg-zinc-800" onClick={() => router.push('/settings')}>
                            <Settings className="mr-2 h-4 w-4" />
                            <span>Cài đặt</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-zinc-800" />
                        <DropdownMenuItem className="cursor-pointer hover:bg-zinc-800" onClick={handleUserLogout}>
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Đăng xuất</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    )
} 