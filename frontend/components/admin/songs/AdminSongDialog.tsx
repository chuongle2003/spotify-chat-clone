"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import AdminSongForm from "./AdminSongForm";
import { AdminSong } from "@/lib/api/services/AdminSongService";

interface AdminSongDialogProps {
    isOpen: boolean;
    onClose: () => void;
    song?: AdminSong;
    artists: string[];
    genres: string[];
    albums: string[];
    isLoading: boolean;
    onSubmit: (formData: FormData) => Promise<void>;
    title: string;
    description?: string;
}

export default function AdminSongDialog({
    isOpen,
    onClose,
    song,
    artists,
    genres,
    albums,
    isLoading,
    onSubmit,
    title,
    description
}: AdminSongDialogProps) {
    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="bg-zinc-900 text-white border-zinc-800 max-w-4xl">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    {description && <DialogDescription className="text-zinc-400">{description}</DialogDescription>}
                </DialogHeader>
                <AdminSongForm
                    song={song}
                    artists={artists}
                    genres={genres}
                    albums={albums}
                    isLoading={isLoading}
                    onSubmit={onSubmit}
                    onCancel={onClose}
                />
            </DialogContent>
        </Dialog>
    );
} 