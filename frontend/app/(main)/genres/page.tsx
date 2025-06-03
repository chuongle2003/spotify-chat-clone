"use client"

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { usePlayer } from "@/components/player/PlayerContext";
import { useToast } from "@/hooks/use-toast";
import postmanApi from "@/lib/api/postman";
import { api, Genre } from "@/lib/api";

// Mở rộng interface Genre để có thêm trường color
interface GenreWithColor extends Genre {
    color: string;
}

export default function GenresPage() {
    const [genresWithColor, setGenresWithColor] = useState<GenreWithColor[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const router = useRouter();
    const { user } = useAuth();
    const { play } = usePlayer();
    const { toast } = useToast();

    // Mảng màu cho các thể loại
    const genreColors = [
        "from-purple-600 to-indigo-800",
        "from-green-600 to-emerald-800",
        "from-red-600 to-rose-800",
        "from-blue-600 to-sky-800",
        "from-pink-600 to-fuchsia-800",
        "from-amber-600 to-yellow-800",
        "from-teal-600 to-cyan-800",
    ];

    useEffect(() => {
        if (!user) {
            router.push("/");
        }
    }, [user, router]);

    // Lấy danh sách thể loại khi component được mount
    useEffect(() => {
        const fetchGenres = async () => {
            try {
                setLoading(true);
                const genres = await api.genres.getGenres();
                // Thêm màu sắc cho mỗi thể loại
                const withColors = genres.map((genre, index) => ({
                    ...genre,
                    color: genreColors[index % genreColors.length]
                }));
                setGenresWithColor(withColors);
                setError(null);
            } catch (err) {
                console.error("Lỗi khi lấy danh sách thể loại:", err);
                setError(err instanceof Error ? err : new Error("Không thể lấy danh sách thể loại"));
            } finally {
                setLoading(false);
            }
        };

        fetchGenres();
    }, []);

    const handlePlayGenre = async (genreName: string, event: React.MouseEvent) => {
        event.preventDefault();
        try {
            // Tìm kiếm bài hát theo thể loại
            const response = await postmanApi.music.search(genreName);

            let songsData = [];
            // Lọc các kết quả tìm kiếm chỉ lấy bài hát
            if (response.results && Array.isArray(response.results.songs)) {
                songsData = response.results.songs;
            } else if (Array.isArray(response)) {
                songsData = response.filter((item: any) => item.title || item.name);
            } else if (response.songs && Array.isArray(response.songs)) {
                songsData = response.songs;
            }

            if (songsData.length === 0) {
                toast({
                    title: "Không tìm thấy bài hát",
                    description: `Không có bài hát nào thuộc thể loại ${genreName}`,
                    variant: "destructive",
                });
                return;
            }

            // Chuyển đổi định dạng dữ liệu
            const formattedSongs = songsData.map((song: any) => ({
                id: song.id,
                title: song.title || song.name,
                artist: typeof song.artist === 'string' ? song.artist : song.artist?.name || 'Unknown Artist',
                duration: typeof song.duration === 'string' ? song.duration : `${Math.floor(song.duration / 60)}:${(song.duration % 60).toString().padStart(2, '0')}`,
                file_url: song.audio_url || song.audio_file || song.file_url,
                image_url: song.cover_image || song.image_url,
                album: song.album?.name || song.album || "-"
            }));

            // Phát danh sách bài hát
            if (formattedSongs.length > 0) {
                play(formattedSongs[0], formattedSongs);
            }

            toast({
                title: "Đang phát",
                description: `Danh sách nhạc thể loại ${genreName}`,
            });
        } catch (error) {
            console.error("Lỗi khi phát nhạc theo thể loại:", error);
            toast({
                title: "Lỗi",
                description: "Không thể phát nhạc. Vui lòng thử lại sau.",
                variant: "destructive",
            });
        }
    };

    // Hiển thị lỗi nếu có
    if (error) {
        return (
            <div className="p-6 text-center">
                <h1 className="text-3xl font-bold mb-6">Khám phá thể loại</h1>
                <div className="text-red-500 mb-4">Không thể tải danh sách thể loại</div>
                <p className="text-zinc-400">Vui lòng thử lại sau</p>
            </div>
        );
    }

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Khám phá thể loại</h1>

            {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {[...Array(8)].map((_, index) => (
                        <div
                            key={index}
                            className="h-40 rounded-lg bg-zinc-800/40 animate-pulse"
                        />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {genresWithColor.map((genre) => (
                        <Link
                            href={`/genre/${encodeURIComponent(genre.name)}`}
                            key={genre.id || genre.name}
                            className="relative h-40 rounded-lg overflow-hidden group"
                        >
                            <div className={`absolute inset-0 bg-gradient-to-br ${genre.color}`}></div>
                            <div className="absolute inset-0 bg-black/20"></div>
                            <div className="absolute bottom-4 left-4 right-4">
                                <h3 className="text-xl font-bold">{genre.name}</h3>
                                <p className="text-sm text-white/80">
                                    {genre.songs_count || 0} bài hát
                                </p>
                            </div>
                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                    size="icon"
                                    className="rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20"
                                    onClick={(e) => handlePlayGenre(genre.name, e)}
                                >
                                    <Play className="h-5 w-5" />
                                </Button>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
} 