"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { UsersIcon } from "lucide-react";
import postmanApi from "@/lib/api/postman";

interface FollowerType {
    id: number | string;
    username: string;
    avatar: string | null;
}

interface PlaylistFollowersModalProps {
    playlistId: string;
    followersCount: number;
}

export default function PlaylistFollowersModal({
    playlistId,
    followersCount = 0,
}: PlaylistFollowersModalProps) {
    const [followers, setFollowers] = useState<FollowerType[]>([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (open && followersCount > 0) {
            fetchFollowers();
        }
    }, [open, playlistId]);

    const fetchFollowers = async () => {
        try {
            setLoading(true);
            const response = await postmanApi.music.getPlaylistFollowers(playlistId);
            setFollowers(response.followers || []);
        } catch (error) {
            console.error("Lỗi khi lấy danh sách người theo dõi:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    disabled={followersCount === 0}
                    className="text-zinc-400 hover:text-white flex items-center gap-1"
                >
                    <UsersIcon className="h-4 w-4" />
                    <span>{followersCount} người theo dõi</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Người theo dõi</DialogTitle>
                    <DialogDescription>
                        {followersCount} người đang theo dõi playlist này
                    </DialogDescription>
                </DialogHeader>
                <div className="max-h-[50vh] overflow-y-auto pr-1">
                    {loading ? (
                        // Skeleton loading state
                        Array(Math.min(5, followersCount))
                            .fill(0)
                            .map((_, index) => (
                                <div
                                    key={`skeleton-${index}`}
                                    className="flex items-center gap-3 py-3"
                                >
                                    <Skeleton className="h-10 w-10 rounded-full" />
                                    <div className="space-y-1">
                                        <Skeleton className="h-4 w-24" />
                                        <Skeleton className="h-3 w-16" />
                                    </div>
                                </div>
                            ))
                    ) : followers.length > 0 ? (
                        followers.map((follower) => (
                            <div
                                key={follower.id}
                                className="flex items-center gap-3 py-3 border-b border-zinc-800 last:border-0"
                            >
                                <Avatar>
                                    <AvatarImage
                                        src={follower.avatar || undefined}
                                        alt={follower.username}
                                    />
                                    <AvatarFallback>
                                        {follower.username.substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-medium">{follower.username}</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="py-6 text-center text-zinc-500">
                            Không có người theo dõi
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
} 