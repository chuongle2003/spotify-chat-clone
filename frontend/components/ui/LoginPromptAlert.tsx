import { useRouter } from "next/navigation";
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
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

interface LoginPromptAlertProps {
    isOpen: boolean;
    onClose: () => void;
}

export function LoginPromptAlert({ isOpen, onClose }: LoginPromptAlertProps) {
    const router = useRouter();

    const handleLogin = () => {
        router.push("/login");
        onClose();
    };

    return (
        <AlertDialog open={isOpen} onOpenChange={onClose}>
            <AlertDialogContent className="max-w-md bg-zinc-900 border border-zinc-700">
                <AlertDialogHeader className="mb-2">
                    <AlertDialogTitle className="flex items-center gap-2 text-xl">
                        <AlertCircle className="h-6 w-6 text-yellow-500" />
                        Cần đăng nhập
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-white/80 text-base leading-relaxed">
                        Vui lòng đăng nhập để nghe bài hát và sử dụng đầy đủ các tính năng của ứng dụng.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex gap-2 sm:gap-0">
                    <AlertDialogCancel className="mt-0 bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-white">
                        Hủy
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleLogin}
                        className="bg-green-500 hover:bg-green-600 text-black font-semibold"
                    >
                        Đăng nhập ngay
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
} 