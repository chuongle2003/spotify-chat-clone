"use client"

import { ReactNode } from "react"

interface AdminCenterProps {
    children: ReactNode
}

export default function AdminCenter({ children }: AdminCenterProps) {
    return (
        <div className="flex-1 p-6 md:p-8 bg-zinc-900 min-h-screen overflow-auto">
            {children}
        </div>
    )
}
