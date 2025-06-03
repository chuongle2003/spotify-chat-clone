"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { AdminSong } from "@/lib/api/services/AdminSongService";

interface AdminSongDeleteDialogProps {
    isOpen: boolean;
    onClose: () => void;
    song?: AdminSong;
    isLoading: boolean;
    onConfirm: () => Promise<void>;
}

export default function AdminSongDeleteDialog({
    isOpen,
    onClose,
    song,
    isLoading,
    onConfirm
}: AdminSongDeleteDialogProps) {
    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="bg-zinc-900 text-white border-zinc-800">
                <DialogHeader>
                    <DialogTitle className="text-red-500">Xóa bài hát</DialogTitle>
                    <DialogDescription className="text-zinc-400">
                        {song ? (
                            <>
                                Bạn có chắc chắn muốn xóa bài hát <span className="font-medium text-white">{song.title}</span> của nghệ sĩ <span className="font-medium text-white">{song.artist}</span>?
                                <br />
                                Thao tác này không thể hoàn tác.
                            </>
                        ) : (
                            <>
                                Bạn có chắc chắn muốn xóa bài hát này? Thao tác này không thể hoàn tác.
                            </>
                        )}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        disabled={isLoading}
                    >
                        Hủy
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        onClick={onConfirm}
                        disabled={isLoading}
                    >
                        {isLoading ? "Đang xử lý..." : (
                            <>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Xóa
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
} 