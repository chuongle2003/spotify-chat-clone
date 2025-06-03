"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import AdminGenreForm from "@/components/admin/genres/AdminGenreForm";
import { AdminGenre } from "@/lib/api/services/AdminGenreService";

interface AdminGenreDialogProps {
    isOpen: boolean;
    onClose: () => void;
    genre?: AdminGenre;
    isLoading: boolean;
    onSubmit: (formData: FormData) => Promise<void>;
    title: string;
    description?: string;
}

export default function AdminGenreDialog({
    isOpen,
    onClose,
    genre,
    isLoading,
    onSubmit,
    title,
    description
}: AdminGenreDialogProps) {
    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="bg-zinc-900 text-white border-zinc-800 max-w-md">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    {description && <DialogDescription className="text-zinc-400">{description}</DialogDescription>}
                </DialogHeader>
                <AdminGenreForm
                    genre={genre}
                    isLoading={isLoading}
                    onSubmit={onSubmit}
                    onCancel={onClose}
                />
            </DialogContent>
        </Dialog>
    );
} 