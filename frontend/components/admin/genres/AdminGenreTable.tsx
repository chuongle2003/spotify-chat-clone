"use client";

import { useState } from "react";
import { AdminGenre } from "@/lib/api/services/AdminGenreService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pencil, Trash2, Search } from "lucide-react";
import Image from "next/image";

interface AdminGenreTableProps {
    genres: AdminGenre[];
    loading: boolean;
    onEdit: (genre: AdminGenre) => void;
    onDelete: (genre: AdminGenre) => void;
}

export default function AdminGenreTable({ genres, loading, onEdit, onDelete }: AdminGenreTableProps) {
    const [searchQuery, setSearchQuery] = useState("");

    const filteredGenres = genres.filter((genre) =>
        genre.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (genre.description && genre.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-4 mb-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <Input
                        placeholder="Tìm kiếm thể loại..."
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
                            <TableHead className="text-zinc-400">Tên thể loại</TableHead>
                            <TableHead className="text-zinc-400">Mô tả</TableHead>
                            <TableHead className="text-zinc-400 text-center">Số bài hát</TableHead>
                            <TableHead className="text-zinc-400 text-center">Số nghệ sĩ</TableHead>
                            <TableHead className="text-zinc-400 text-center">Nổi bật</TableHead>
                            <TableHead className="text-zinc-400">Ngày tạo</TableHead>
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
                        ) : filteredGenres.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-10 text-zinc-500">
                                    Không tìm thấy thể loại nào
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredGenres.map((genre) => (
                                <TableRow key={genre.id} className="hover:bg-zinc-700/50">
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="relative w-10 h-10 overflow-hidden rounded">
                                                {genre.image ? (
                                                    <Image
                                                        src={genre.image}
                                                        alt={genre.name}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-zinc-600 flex items-center justify-center">
                                                        <span className="text-xs">{genre.name.charAt(0)}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="font-medium">{genre.name}</div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="max-w-[300px] truncate">
                                        {genre.description || "-"}
                                    </TableCell>
                                    <TableCell className="text-center">{genre.songs_count}</TableCell>
                                    <TableCell className="text-center">{genre.artists_count}</TableCell>
                                    <TableCell className="text-center">
                                        {genre.is_featured ? (
                                            <span className="inline-block px-2 py-1 bg-green-500/20 text-green-500 rounded-full text-xs">
                                                Có
                                            </span>
                                        ) : (
                                            <span className="inline-block px-2 py-1 bg-zinc-700 text-zinc-400 rounded-full text-xs">
                                                Không
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {new Date(genre.created_at).toLocaleDateString('vi-VN')}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => onEdit(genre)}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-red-500"
                                                onClick={() => onDelete(genre)}
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
        </div>
    );
} 