import {
    Alert,
    AlertDescription,
    AlertTitle,
} from "@/components/ui/alert";
import { AlertCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AuthErrorAlertProps {
    message: string;
    onClose: () => void;
}

export function AuthErrorAlert({ message, onClose }: AuthErrorAlertProps) {
    return (
        <Alert className="border-red-500 bg-red-500/10 mb-4 relative">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <AlertTitle className="text-red-500">Lỗi đăng nhập</AlertTitle>
            <AlertDescription className="text-red-500/90">
                {message}
            </AlertDescription>
            <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 text-red-500 hover:text-red-600 hover:bg-transparent"
                onClick={onClose}
            >
                <XCircle className="h-4 w-4" />
            </Button>
        </Alert>
    );
} 