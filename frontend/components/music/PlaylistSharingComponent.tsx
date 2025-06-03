"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Share as ShareIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import postmanApi from "@/lib/api/postman";

interface UserType {
    id: string | number;
    username: string;
    avatar?: string | null;
}

interface PlaylistSharingComponentProps {
    playlistId: string;
    playlistName: string;
    playlistCover?: string | null;
}

export default function PlaylistSharingComponent({
    playlistId,
    playlistName,
    playlistCover,
}: PlaylistSharingComponentProps) {
    const [users, setUsers] = useState<UserType[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<string>("");
    const [message, setMessage] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const [isFetchingUsers, setIsFetchingUsers] = useState(false);
    const [open, setOpen] = useState(false);

    const { toast } = useToast();

    // Tải danh sách người dùng khi modal mở
    useEffect(() => {
        if (open) {
            fetchUsers();
        }
    }, [open]);

    const fetchUsers = async () => {
        try {
            setIsFetchingUsers(true);
            // Gọi API để lấy danh sách người dùng
            const response = await postmanApi.accounts.getPublicUsers();
            setUsers(response.results || []);
        } catch (error) {
            console.error("Lỗi khi lấy danh sách người dùng:", error);
            toast({
                title: "Lỗi",
                description: "Không thể tải danh sách người dùng",
                variant: "destructive",
            });
        } finally {
            setIsFetchingUsers(false);
        }
    };

    const handleSharePlaylist = async () => {
        if (!selectedUserId) {
            toast({
                title: "Lỗi",
                description: "Vui lòng chọn người nhận",
                variant: "destructive",
            });
            return;
        }

        try {
            setLoading(true);
            // Chuẩn bị nội dung mặc định nếu không có
            const content = message.trim() || `Tôi muốn chia sẻ playlist "${playlistName}" với bạn!`;

            // Gọi API chia sẻ playlist
            await postmanApi.music.sharePlaylist(playlistId, selectedUserId, content);

            // Thông báo thành công
            toast({
                title: "Đã chia sẻ",
                description: "Playlist đã được chia sẻ thành công!",
            });

            // Đóng modal và reset form
            setOpen(false);
            setSelectedUserId("");
            setMessage("");
        } catch (error) {
            console.error("Lỗi khi chia sẻ playlist:", error);
            toast({
                title: "Lỗi",
                description: "Không thể chia sẻ playlist. Vui lòng thử lại sau.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <ShareIcon className="h-4 w-4" />
                    Chia sẻ
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Chia sẻ playlist</DialogTitle>
                    <DialogDescription>
                        Chia sẻ playlist này với một người dùng khác
                    </DialogDescription>
                </DialogHeader>

                <div className="flex items-center gap-3 my-4">
                    <div className="h-12 w-12 relative rounded overflow-hidden bg-zinc-800">
                        {playlistCover ? (
                            <img
                                src={playlistCover}
                                alt={playlistName}
                                className="object-cover w-full h-full"
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full w-full text-zinc-500">
                                <ShareIcon className="h-5 w-5" />
                            </div>
                        )}
                    </div>
                    <div>
                        <p className="font-medium">{playlistName}</p>
                        <p className="text-sm text-zinc-400">Playlist</p>
                    </div>
                </div>

                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <label className="text-sm font-medium">Chia sẻ với</label>
                        <Select
                            value={selectedUserId}
                            onValueChange={setSelectedUserId}
                            disabled={isFetchingUsers}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Chọn người nhận" />
                            </SelectTrigger>
                            <SelectContent>
                                {isFetchingUsers ? (
                                    <div className="flex justify-center py-2">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    </div>
                                ) : users.length > 0 ? (
                                    users.map((user) => (
                                        <SelectItem key={user.id} value={String(user.id)}>
                                            <div className="flex items-center gap-2">
                                                <Avatar className="h-6 w-6">
                                                    <AvatarImage src={user.avatar || undefined} />
                                                    <AvatarFallback>
                                                        {user.username.substring(0, 2).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <span>{user.username}</span>
                                            </div>
                                        </SelectItem>
                                    ))
                                ) : (
                                    <div className="p-2 text-center text-sm text-zinc-500">
                                        Không có người dùng
                                    </div>
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <label className="text-sm font-medium">Lời nhắn (không bắt buộc)</label>
                        <Textarea
                            placeholder="Để lại lời nhắn..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            rows={3}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                        Hủy
                    </Button>
                    <Button
                        type="submit"
                        onClick={handleSharePlaylist}
                        disabled={!selectedUserId || loading}
                    >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Chia sẻ
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
} 