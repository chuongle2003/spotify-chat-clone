"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useToast } from "@/hooks/use-toast";
import { Trash2 } from "lucide-react";
import { PlaylistService } from "@/lib/api/services/PlaylistService";

interface DeletePlaylistButtonProps {
    playlistId: string;
    playlistName: string;
    variant?: "default" | "destructive" | "outline" | "ghost" | null;
    size?: "default" | "sm" | "lg" | "icon";
    className?: string;
    onSuccess?: () => void;
}

export default function DeletePlaylistButton({
    playlistId,
    playlistName,
    variant = "destructive",
    size = "sm",
    className = "",
    onSuccess
}: DeletePlaylistButtonProps) {
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const router = useRouter();
    const { toast } = useToast();
    const playlistService = new PlaylistService();

    const handleDelete = async () => {
        if (!playlistId) return;

        try {
            setIsDeleting(true);
            await playlistService.deletePlaylist(playlistId);

            toast({
                title: "Đã xóa playlist",
                description: `Playlist "${playlistName}" đã được xóa thành công`,
            });

            // Đóng dialog
            setIsConfirmOpen(false);

            // Callback khi xóa thành công
            if (onSuccess) {
                onSuccess();
            } else {
                // Mặc định: chuyển hướng về trang playlists
                router.push("/playlists");
            }
        } catch (error) {
            console.error("Lỗi khi xóa playlist:", error);
            toast({
                title: "Lỗi",
                description: "Không thể xóa playlist. Vui lòng thử lại sau.",
                variant: "destructive",
            });
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <>
            <Button
                variant={variant}
                size={size}
                className={`gap-2 ${className}`}
                onClick={() => setIsConfirmOpen(true)}
                disabled={isDeleting}
            >
                <Trash2 className="h-4 w-4" />
                <span>Xóa</span>
            </Button>

            <ConfirmDialog
                open={isConfirmOpen}
                onOpenChange={setIsConfirmOpen}
                title="Xóa playlist"
                description={
                    <div>
                        <p>Bạn có chắc chắn muốn xóa playlist "<strong>{playlistName}</strong>"?</p>
                        <p className="mt-2 text-sm text-gray-500">Hành động này không thể hoàn tác.</p>
                    </div>
                }
                onConfirm={handleDelete}
                confirmText={isDeleting ? "Đang xóa..." : "Xóa"}
                cancelText="Hủy"
                variant="destructive"
            />
        </>
    );
} 