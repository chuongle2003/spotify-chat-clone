"use client";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface AdminGenreDeleteDialogProps {
    isOpen: boolean;
    onClose: () => void;
    isLoading: boolean;
    onConfirm: () => Promise<void>;
    genreName: string;
}

export default function AdminGenreDeleteDialog({
    isOpen,
    onClose,
    isLoading,
    onConfirm,
    genreName,
}: AdminGenreDeleteDialogProps) {
    return (
        <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <AlertDialogContent className="bg-zinc-900 text-white border-zinc-800">
                <AlertDialogHeader>
                    <AlertDialogTitle>Xóa thể loại</AlertDialogTitle>
                    <AlertDialogDescription className="text-zinc-400">
                        Bạn có chắc chắn muốn xóa thể loại <span className="text-white font-medium">{genreName}</span>?
                        <p className="mt-2 text-red-400">Hành động này không thể hoàn tác và có thể ảnh hưởng đến các bài hát sử dụng thể loại này.</p>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel
                        className="bg-transparent border-zinc-700 text-white hover:bg-zinc-800"
                        disabled={isLoading}
                    >
                        Hủy
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault();
                            onConfirm();
                        }}
                        className="bg-red-500 text-white hover:bg-red-600"
                        disabled={isLoading}
                    >
                        {isLoading ? "Đang xử lý..." : "Xóa"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
} 