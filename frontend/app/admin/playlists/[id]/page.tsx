"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Edit, Trash2, Music, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from "@/components/ui/alert-dialog"
import { useToast } from "@/components/ui/use-toast"
import { AdminPlaylistService } from "@/lib/api/services/AdminPlaylistService"

export default function PlaylistDetailsPage({
    params,
}: {
    params: { id: string }
}) {
    const router = useRouter()
    const { toast } = useToast()
    const playlistId = parseInt(params.id, 10)
    const [playlist, setPlaylist] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

    const playlistService = new AdminPlaylistService()

    useEffect(() => {
        const fetchPlaylist = async () => {
            try {
                setLoading(true)
                const data = await playlistService.getPlaylist(playlistId)
                setPlaylist(data)
            } catch (error) {
                console.error("Lỗi khi tải thông tin playlist:", error)
                toast({
                    title: "Lỗi",
                    description: "Không thể tải thông tin playlist. Vui lòng thử lại sau.",
                    variant: "destructive",
                })
            } finally {
                setLoading(false)
            }
        }

        fetchPlaylist()
    }, [playlistId])

    const handleDeletePlaylist = async () => {
        try {
            await playlistService.deletePlaylist(playlistId)
            toast({
                title: "Thành công",
                description: "Đã xóa playlist thành công",
            })
            router.push("/admin/playlists")
        } catch (error) {
            console.error("Lỗi khi xóa playlist:", error)
            toast({
                title: "Lỗi",
                description: "Không thể xóa playlist. Vui lòng thử lại sau.",
                variant: "destructive",
            })
        }
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    if (loading) {
        return (
            <div className="p-6 flex items-center justify-center h-full">
                <div className="animate-spin h-8 w-8 border-t-2 border-green-500 rounded-full"></div>
            </div>
        )
    }

    if (!playlist) {
        return (
            <div className="p-6">
                <Button
                    variant="ghost"
                    className="flex items-center gap-2 mb-4"
                    onClick={() => router.push("/admin/playlists")}
                >
                    <ArrowLeft className="h-4 w-4" />
                    Quay lại danh sách
                </Button>

                <div className="text-center py-12">
                    <h2 className="text-xl font-semibold mb-2">Không tìm thấy playlist</h2>
                    <p className="text-gray-500 mb-4">Playlist không tồn tại hoặc đã bị xóa</p>
                    <Button onClick={() => router.push("/admin/playlists")}>
                        Quay lại danh sách
                    </Button>
                </div>
            </div>
        )
    }

    const secondsToTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    return (
        <div className="p-6 space-y-6">
            <Button
                variant="ghost"
                className="flex items-center gap-2 mb-4"
                onClick={() => router.push("/admin/playlists")}
            >
                <ArrowLeft className="h-4 w-4" />
                Quay lại danh sách
            </Button>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Thông tin playlist */}
                <div className="lg:w-1/3">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-xl mb-1">{playlist.name}</CardTitle>
                                    <CardDescription>
                                        Tạo bởi <span className="font-medium">{playlist.user.username}</span>
                                    </CardDescription>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => router.push(`/admin/playlists/${playlistId}/edit`)}
                                    >
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        size="icon"
                                        onClick={() => setDeleteDialogOpen(true)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="aspect-square w-full overflow-hidden rounded-md bg-gray-100 dark:bg-gray-800">
                                {playlist.cover_image ? (
                                    <img
                                        src={playlist.cover_image}
                                        alt={playlist.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                        <Music className="h-16 w-16" />
                                    </div>
                                )}
                            </div>

                            <div className="grid gap-1">
                                <div className="text-sm font-medium">Thông tin</div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                    {playlist.description || "Không có mô tả"}
                                </div>
                            </div>

                            <Separator />

                            <div className="grid gap-2">
                                <div className="text-sm font-medium">Trạng thái</div>
                                <div className="flex gap-2">
                                    <Badge variant={playlist.is_public ? "default" : "outline"}>
                                        {playlist.is_public ? "Công khai" : "Riêng tư"}
                                    </Badge>
                                    <Badge variant={playlist.is_collaborative ? "secondary" : "outline"}>
                                        {playlist.is_collaborative ? "Cộng tác" : "Cá nhân"}
                                    </Badge>
                                </div>
                            </div>

                            <Separator />

                            <div className="grid gap-2">
                                <div className="text-sm font-medium">Thời gian</div>
                                <div className="grid grid-cols-2 gap-1">
                                    <div className="text-sm text-gray-500">Tạo lúc</div>
                                    <div className="text-sm">{formatDate(playlist.created_at)}</div>
                                    {playlist.updated_at && (
                                        <>
                                            <div className="text-sm text-gray-500">Cập nhật lúc</div>
                                            <div className="text-sm">{formatDate(playlist.updated_at)}</div>
                                        </>
                                    )}
                                </div>
                            </div>

                            <Separator />

                            <div className="grid gap-2">
                                <div className="text-sm font-medium">Thông tin bổ sung</div>
                                <div className="grid grid-cols-2 gap-1">
                                    <div className="text-sm text-gray-500">Số lượng bài hát</div>
                                    <div className="text-sm">{playlist.songs ? playlist.songs.length : 0}</div>
                                    <div className="text-sm text-gray-500">Lượt theo dõi</div>
                                    <div className="text-sm">{playlist.followers_count}</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Nội dung tab */}
                <div className="lg:w-2/3 space-y-4">
                    <Tabs defaultValue="songs">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="songs" className="flex items-center gap-2">
                                <Music className="h-4 w-4" />
                                Bài hát
                            </TabsTrigger>
                            <TabsTrigger value="collaborators" className="flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                Cộng tác viên
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="songs" className="pt-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Danh sách bài hát</CardTitle>
                                    <CardDescription>
                                        {playlist.songs ? playlist.songs.length : 0} bài hát trong playlist
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {playlist.songs && playlist.songs.length > 0 ? (
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="w-12">#</TableHead>
                                                    <TableHead>Tiêu đề</TableHead>
                                                    <TableHead>Nghệ sĩ</TableHead>
                                                    <TableHead className="text-right">Thời lượng</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {playlist.songs.map((song: any, index: number) => (
                                                    <TableRow key={song.id}>
                                                        <TableCell>{index + 1}</TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded overflow-hidden">
                                                                    {song.cover_image ? (
                                                                        <img
                                                                            src={song.cover_image}
                                                                            alt={song.title}
                                                                            className="w-full h-full object-cover"
                                                                        />
                                                                    ) : (
                                                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                                            <Music className="h-4 w-4" />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="font-medium">{song.title}</div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>{song.artist}</TableCell>
                                                        <TableCell className="text-right">{secondsToTime(song.duration)}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    ) : (
                                        <div className="text-center py-12">
                                            <Music className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                                            <h3 className="text-lg font-medium mb-2">Không có bài hát nào</h3>
                                            <p className="text-gray-500 mb-4">Playlist này chưa có bài hát nào</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="collaborators" className="pt-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Danh sách cộng tác viên</CardTitle>
                                    <CardDescription>
                                        {playlist.collaborators ? playlist.collaborators.length : 0} người cộng tác
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {playlist.collaborators && playlist.collaborators.length > 0 ? (
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Tên người dùng</TableHead>
                                                    <TableHead>Vai trò</TableHead>
                                                    <TableHead>Thêm bởi</TableHead>
                                                    <TableHead>Thời gian thêm</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {playlist.collaborators.map((collaborator: any) => (
                                                    <TableRow key={collaborator.id}>
                                                        <TableCell>
                                                            <div className="font-medium">{collaborator.user.username}</div>
                                                            <div className="text-xs text-gray-500">ID: {collaborator.user.id}</div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant={collaborator.role === "EDITOR" ? "default" : "outline"}>
                                                                {collaborator.role === "EDITOR" ? "Biên tập viên" : "Người xem"}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>{collaborator.added_by.username}</TableCell>
                                                        <TableCell>{formatDate(collaborator.added_at)}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    ) : (
                                        <div className="text-center py-12">
                                            <Users className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                                            <h3 className="text-lg font-medium mb-2">Không có cộng tác viên</h3>
                                            <p className="text-gray-500 mb-4">
                                                {playlist.is_collaborative
                                                    ? "Playlist này chưa có người cộng tác nào"
                                                    : "Playlist không ở chế độ cộng tác"}
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Xác nhận xóa playlist</AlertDialogTitle>
                        <AlertDialogDescription>
                            Hành động này không thể hoàn tác. Playlist "{playlist.name}" sẽ bị xóa vĩnh viễn khỏi hệ thống.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeletePlaylist} className="bg-red-500 hover:bg-red-600">
                            Xóa
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
} 