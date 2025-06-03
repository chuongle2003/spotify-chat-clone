"use client";

import { useState } from "react";
import { Globe, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import postmanApi from "@/lib/api/postman";

interface PlaylistPrivacyToggleProps {
    playlistId: string;
    isPublic: boolean;
    onToggle?: (newStatus: boolean) => void;
}

export default function PlaylistPrivacyToggle({
    playlistId,
    isPublic,
    onToggle,
}: PlaylistPrivacyToggleProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [currentStatus, setCurrentStatus] = useState(isPublic);
    const { toast } = useToast();

    const handleToggle = async () => {
        try {
            setIsLoading(true);
            const response = await postmanApi.music.togglePlaylistPrivacy(playlistId);

            // Cập nhật trạng thái mới
            const newStatus = response.is_public;
            setCurrentStatus(newStatus);

            // Thông báo thành công
            toast({
                title: "Đã cập nhật",
                description: newStatus
                    ? "Playlist của bạn đã chuyển sang chế độ công khai"
                    : "Playlist của bạn đã chuyển sang chế độ riêng tư",
            });

            // Gọi callback nếu có
            if (onToggle) {
                onToggle(newStatus);
            }
        } catch (error) {
            console.error("Lỗi khi thay đổi chế độ riêng tư:", error);
            toast({
                title: "Lỗi",
                description: "Không thể thay đổi chế độ riêng tư. Vui lòng thử lại sau.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={handleToggle}
                        disabled={isLoading}
                    >
                        {currentStatus ? (
                            <Globe className="h-4 w-4" />
                        ) : (
                            <Lock className="h-4 w-4" />
                        )}
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    {currentStatus
                        ? "Playlist công khai: mọi người đều có thể xem"
                        : "Playlist riêng tư: chỉ bạn mới xem được"}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
} 