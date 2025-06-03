"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
    Home,
    Search,
    Library,
    Music,
    Disc3,
    ListMusic,
    Heart,
    Plus,
    Radio,
    Mic2,
    LayoutGrid,
    MessageSquare,
    ShieldAlert,
    LineChart
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { useAuth } from "@/context/auth-context"

export function Sidebar() {
    const pathname = usePathname()
    const [showPlaylists, setShowPlaylists] = useState(true)
    const [showExplore, setShowExplore] = useState(true)
    const [showAdmin, setShowAdmin] = useState(true)
    const { user, isAdmin } = useAuth()

    return (
        <div className="w-full h-full bg-black flex flex-col overflow-hidden">
            <div className="p-6">
                <Link href="/">
                    <div className="flex items-center gap-2">
                        <svg viewBox="0 0 24 24" className="h-8 w-8 text-white">
                            <path
                                fill="currentColor"
                                d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"
                            />
                        </svg>
                        <span className="text-xl font-bold">Spotify</span>
                    </div>
                </Link>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
                <nav className="mt-2">
                    <ul className="space-y-1 px-2">
                        <li>
                            <Link href="/">
                                <Button
                                    variant="ghost"
                                    className={cn(
                                        "w-full justify-start text-zinc-400 hover:text-white",
                                        pathname === "/" && "text-white"
                                    )}
                                >
                                    <Home className="h-5 w-5 mr-3" />
                                    Trang chủ
                                </Button>
                            </Link>
                        </li>
                        <li>
                            <Link href="/search">
                                <Button
                                    variant="ghost"
                                    className={cn(
                                        "w-full justify-start text-zinc-400 hover:text-white",
                                        pathname === "/search" && "text-white"
                                    )}
                                >
                                    <Search className="h-5 w-5 mr-3" />
                                    Tìm kiếm
                                </Button>
                            </Link>
                        </li>
                        {user && (
                            <li>
                                <Link href="/messages">
                                    <Button
                                        variant="ghost"
                                        className={cn(
                                            "w-full justify-start text-zinc-400 hover:text-white",
                                            pathname === "/messages" && "text-white",
                                            pathname.startsWith("/messages") && "text-white"
                                        )}
                                    >
                                        <MessageSquare className="h-5 w-5 mr-3" />
                                        Tin nhắn
                                    </Button>
                                </Link>
                            </li>
                        )}
                    </ul>
                </nav>

                {/* Phần Admin */}
                {isAdmin && (
                    <div className="mt-6 px-4">
                        <div className="py-2 flex items-center justify-between">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-zinc-400 hover:text-white"
                                onClick={() => setShowAdmin(!showAdmin)}
                            >
                                <p className="font-semibold">QUẢN TRỊ</p>
                            </Button>
                        </div>

                        {showAdmin && (
                            <div className="space-y-1">
                                <Link href="/admin/dashboard">
                                    <Button
                                        variant="ghost"
                                        className={cn(
                                            "w-full justify-start text-zinc-400 hover:text-white",
                                            pathname === "/admin/dashboard" && "text-white"
                                        )}
                                    >
                                        <LineChart className="h-5 w-5 mr-3" />
                                        Thống kê
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </div>
                )}

                <div className="mt-6 px-4">
                    <div className="py-2 flex items-center justify-between">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-zinc-400 hover:text-white"
                            onClick={() => setShowExplore(!showExplore)}
                        >
                            <p className="font-semibold">KHÁM PHÁ</p>
                        </Button>
                    </div>

                    {showExplore && (
                        <div className="space-y-1">
                            <Link href="/albums">
                                <Button
                                    variant="ghost"
                                    className={cn(
                                        "w-full justify-start text-zinc-400 hover:text-white",
                                        pathname === "/albums" && "text-white"
                                    )}
                                >
                                    <Disc3 className="h-5 w-5 mr-3" />
                                    Albums
                                </Button>
                            </Link>
                            <Link href="/artists">
                                <Button
                                    variant="ghost"
                                    className={cn(
                                        "w-full justify-start text-zinc-400 hover:text-white",
                                        pathname === "/artists" && "text-white"
                                    )}
                                >
                                    <Mic2 className="h-5 w-5 mr-3" />
                                    Nghệ sĩ
                                </Button>
                            </Link>
                            <Link href="/genres">
                                <Button
                                    variant="ghost"
                                    className={cn(
                                        "w-full justify-start text-zinc-400 hover:text-white",
                                        pathname === "/genres" && "text-white"
                                    )}
                                >
                                    <Radio className="h-5 w-5 mr-3" />
                                    Thể loại
                                </Button>
                            </Link>
                            <Link href="/playlists">
                                <Button
                                    variant="ghost"
                                    className={cn(
                                        "w-full justify-start text-zinc-400 hover:text-white",
                                        pathname === "/playlists" && "text-white"
                                    )}
                                >
                                    <LayoutGrid className="h-5 w-5 mr-3" />
                                    Playlists
                                </Button>
                            </Link>
                        </div>
                    )}
                </div>

                <div className="mt-6 px-4">
                    <div className="py-2 flex items-center justify-between">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-zinc-400 hover:text-white"
                            onClick={() => setShowPlaylists(!showPlaylists)}
                        >
                            <p className="font-semibold">Playlist của bạn</p>
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800"
                        >
                            <Plus className="h-5 w-5" />
                        </Button>
                    </div>

                    {showPlaylists && (
                        <div className="space-y-1 mt-2 text-sm">
                            <Link href="/favorites">
                                <Button
                                    variant="ghost"
                                    className={cn(
                                        "w-full justify-start text-zinc-400 hover:text-white px-2",
                                        pathname === "/favorites" && "text-white"
                                    )}
                                >
                                    <Heart className="h-4 w-4 mr-3 text-rose-500" />
                                    Bài hát đã thích
                                </Button>
                            </Link>
                            <Button
                                variant="ghost"
                                className="w-full justify-start text-zinc-400 hover:text-white px-2"
                            >
                                Playlist #1
                            </Button>
                            <Button
                                variant="ghost"
                                className="w-full justify-start text-zinc-400 hover:text-white px-2"
                            >
                                Playlist #2
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
} 