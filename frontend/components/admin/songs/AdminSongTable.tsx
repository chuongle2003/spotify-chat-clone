"use client";

import { useState, useEffect } from "react"; // Thêm useEffect
import { AdminSong } from "@/lib/api/services/AdminSongService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pencil, Trash2, Search, Play, Pause } from "lucide-react";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"; // Import component phân trang

interface AdminSongTableProps {
    songs: AdminSong[];
    loading: boolean;
    onEdit: (song: AdminSong) => void;
    onDelete: (song: AdminSong) => void;
    pageSize?: number; // Kích thước trang tùy chọn, mặc định là 20
}

export default function AdminSongTable({ songs, loading, onEdit, onDelete, pageSize = 20 }: AdminSongTableProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [playingSong, setPlayingSong] = useState<number | null>(null);
    const audioRef = typeof Audio !== 'undefined' ? new Audio() : null;
    const [page, setPage] = useState(1);
    const totalPages = Math.ceil(songs.length / pageSize);
    const [displayedSongs, setDisplayedSongs] = useState<AdminSong[]>([]);

    useEffect(() => {
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        setDisplayedSongs(songs.slice(startIndex, endIndex));
    }, [songs, page, pageSize]);

    const togglePlaySong = (songId: number) => {
        if (playingSong === songId) {
            setPlayingSong(null);
            if (audioRef) {
                audioRef.pause();
            }
        } else {
            setPlayingSong(songId);
            const songToPlay = songs.find((song) => song.id === songId);
            if (songToPlay && audioRef) {
                audioRef.src = songToPlay.audio_file;
                audioRef.play().catch(err => {
                    console.error("Lỗi khi phát nhạc:", err);
                    setPlayingSong(null);
                    alert("Không thể phát bài hát này.");
                });
            }
        }
    };

    const formatDuration = (seconds?: number) => {
        if (!seconds) return "0:00";
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
    };

    const filteredSongs = displayedSongs.filter((song) => // Lọc trên displayedSongs
        song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        song.artist?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (song.album && song.album.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (song.genre && song.genre.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-4 mb-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <Input
                        placeholder="Tìm kiếm bài hát..."
                        className="pl-10 bg-zinc-800 border-zinc-700 text-white"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-zinc-800 rounded-md border border-zinc-700 overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-zinc-700/50">
                            <TableHead className="text-zinc-400 w-12">STT</TableHead>
                            <TableHead className="text-zinc-400">Bài hát</TableHead>
                            <TableHead className="text-zinc-400">Album</TableHead>
                            <TableHead className="text-zinc-400">Thể loại</TableHead>
                            <TableHead className="text-zinc-400">Thời lượng</TableHead>
                            <TableHead className="text-zinc-400">Lượt nghe</TableHead>
                            <TableHead className="text-zinc-400 text-right">Thao tác</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-10 text-zinc-500">
                                    Đang tải dữ liệu...
                                </TableCell>
                            </TableRow>
                        ) : filteredSongs.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-10 text-zinc-500">
                                    Không tìm thấy bài hát nào
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredSongs.map((song, index) => (
                                <TableRow key={song.id} className="hover:bg-zinc-700/50">
                                    <TableCell>{(page - 1) * pageSize + index + 1}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="relative w-10 h-10 overflow-hidden rounded">
                                                <Image
                                                    src={song.cover_image || "/placeholder.svg"}
                                                    alt={song.title}
                                                    fill
                                                    className="object-cover"
                                                />
                                            </div>
                                            <div>
                                                <div className="font-medium">{song.title}</div>
                                                <div className="text-xs text-zinc-400">{song.artist}</div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>{song.album || "-"}</TableCell>
                                    <TableCell>{song.genre || "-"}</TableCell>
                                    <TableCell>{formatDuration(song.duration)}</TableCell>
                                    <TableCell>{song.play_count?.toLocaleString() || "0"}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => onEdit(song)}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-red-500"
                                                onClick={() => onDelete(song)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {totalPages > 1 && (
                <Pagination className="mt-4">
                    <PaginationContent>
                        <PaginationItem>
                            <PaginationPrevious onClick={() => setPage(prev => Math.max(prev - 1, 1))} className={page === 1 ? "opacity-50 cursor-not-allowed" : ""} />
                        </PaginationItem>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(num => (
                            <PaginationItem key={num} className={num === page ? "active-class" : ""}>
                                <PaginationLink onClick={() => setPage(num)}>{num}</PaginationLink>
                            </PaginationItem>
                        ))}
                        <PaginationItem>
                            <PaginationNext onClick={() => setPage(prev => Math.min(prev + 1, totalPages))} className={page === totalPages ? "opacity-50 cursor-not-allowed" : ""} />
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            )}
        </div>
    );
}