"use client"

import { useAuth } from "@/context/auth-context"
import { Search, Bell, ChevronDown } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export default function AdminHeader() {
  const { user, logout } = useAuth()

  return (
    <header className="h-16 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <Link href="/admin" className="flex items-center gap-2">
          <svg viewBox="0 0 78 24" width="78" height="24" className="text-white">
            <path
              fill="currentColor"
              d="M18.616 10.639c-3.77-2.297-9.99-2.509-13.59-1.388a1.077 1.077 0 0 1-1.164-.363 1.14 1.14 0 0 1-.119-1.237c.136-.262.37-.46.648-.548 4.132-1.287 11-1.038 15.342 1.605a1.138 1.138 0 0 1 .099 1.863 1.081 1.081 0 0 1-.813.213c-.142-.02-.28-.07-.403-.145Zm-.124 3.402a.915.915 0 0 1-.563.42.894.894 0 0 1-.69-.112c-3.144-1.983-7.937-2.557-11.657-1.398a.898.898 0 0 1-.971-.303.952.952 0 0 1-.098-1.03.929.929 0 0 1 .54-.458c4.248-1.323 9.53-.682 13.14 1.595a.95.95 0 0 1 .3 1.286Zm-1.43 3.267a.73.73 0 0 1-.45.338.712.712 0 0 1-.553-.089c-2.748-1.722-6.204-2.111-10.276-1.156a.718.718 0 0 1-.758-.298.745.745 0 0 1-.115-.265.757.757 0 0 1 .092-.563.737.737 0 0 1 .457-.333c4.455-1.045 8.277-.595 11.361 1.338a.762.762 0 0 1 .241 1.028ZM11.696 0C5.237 0 0 5.373 0 12c0 6.628 5.236 12 11.697 12 6.46 0 11.698-5.372 11.698-12 0-6.627-5.238-12-11.699-12h.001Z"
            />
          </svg>
          <span className="text-lg font-bold hidden md:inline">Admin Panel</span>
        </Link>

        <div className="hidden md:block relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            placeholder="Tìm kiếm..."
            className="pl-10 bg-zinc-800 border-none h-10 text-white focus-visible:ring-0 w-64"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="rounded-full bg-zinc-800 text-white">
          <Bell className="h-5 w-5" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center gap-2 bg-zinc-800 rounded-full p-1 cursor-pointer hover:bg-zinc-700 transition-colors">
              <Image
                src={user?.profile_image || "/placeholder.svg?height=32&width=32"}
                width={32}
                height={32}
                alt="Profile"
                className="rounded-full"
              />
              <span className="mr-2 hidden md:inline">{user?.username || "Admin"}</span>
              <ChevronDown className="h-4 w-4 mr-1 text-white/70 hidden md:block" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-zinc-800 border-zinc-700 text-white">
            <DropdownMenuItem className="cursor-pointer hover:bg-zinc-700 focus:bg-zinc-700">
              <Link href="/account" className="flex items-center w-full">
                Tài khoản
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer hover:bg-zinc-700 focus:bg-zinc-700">
              <Link href="/dashboard" className="flex items-center w-full">
                Về trang người dùng
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer hover:bg-zinc-700 focus:bg-zinc-700 text-red-500"
              onClick={logout}
            >
              Đăng xuất
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}