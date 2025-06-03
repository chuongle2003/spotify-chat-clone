"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Play } from "lucide-react"
import { cn } from "@/lib/utils"

interface PlayButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    size?: "sm" | "md" | "lg"
    onClick?: () => void
    className?: string
}

export function PlayButton({ size = "md", onClick, className, ...props }: PlayButtonProps) {
    const sizeClasses = {
        sm: "h-8 w-8",
        md: "h-10 w-10",
        lg: "h-14 w-14",
    }

    const iconSizes = {
        sm: "h-4 w-4",
        md: "h-5 w-5",
        lg: "h-6 w-6",
    }

    return (
        <Button
            type="button"
            onClick={onClick}
            size="icon"
            className={cn(
                "rounded-full bg-green-500 hover:bg-green-400 text-black shadow-md transition-transform hover:scale-105 hover:shadow-lg",
                sizeClasses[size],
                className
            )}
            {...props}
        >
            <Play className={cn(iconSizes[size], "ml-0.5")} />
        </Button>
    )
} 