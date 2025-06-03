"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { PlaylistService } from "@/lib/api/services/PlaylistService";
import { useAuth } from "@/context/auth-context";

// Định nghĩa kiểu dữ liệu
export interface Song {
    id: string;
    title: string;
    artist: any;
    album?: string;
    duration: number;
    audio_url?: string;
    audio_file?: string;
    cover_image?: string;
    play_count?: number;
    likes_count?: number;
    is_liked?: boolean;
}

export interface Playlist {
    id: string | number;
    name: string;
    description?: string;
    is_public: boolean;
    cover_image: string | null;
    user?: {
        id: number | string;
        username: string;
        avatar: string | null;
    };
    songs_count: number;
    created_at: string;
    updated_at: string;
    songs?: Song[];
    is_following?: boolean;
    followers_count?: number;
}

interface PlaylistContextType {
    playlists: Playlist[];
    userPlaylists: Playlist[];
    currentPlaylist: Playlist | null;
    isLoading: boolean;
    isUpdating: boolean;
    refreshPlaylists: () => Promise<void>;
    refreshCurrentPlaylist: () => Promise<void>;
    getPlaylist: (id: string) => Promise<Playlist | null>;
    removePlaylist: (id: string) => void;
    updatePlaylistInState: (updatedPlaylist: Playlist) => void;
    addSongToPlaylist: (playlistId: string, songId: string) => Promise<boolean>;
    removeSongFromPlaylist: (playlistId: string, songId: string) => Promise<boolean>;
    followPlaylist: (playlistId: string) => Promise<boolean>;
    unfollowPlaylist: (playlistId: string) => Promise<boolean>;
    togglePlaylistPrivacy: (playlistId: string) => Promise<Playlist | null>;
}

const PlaylistContext = createContext<PlaylistContextType | undefined>(undefined);

export function PlaylistProvider({ children }: { children: ReactNode }) {
    const [playlists, setPlaylists] = useState<Playlist[]>([]);
    const [userPlaylists, setUserPlaylists] = useState<Playlist[]>([]);
    const [currentPlaylist, setCurrentPlaylist] = useState<Playlist | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const { user } = useAuth();
    const playlistService = new PlaylistService();

    // Lấy tất cả playlist khi người dùng đăng nhập
    useEffect(() => {
        if (user) {
            refreshPlaylists();
        }
    }, [user]);

    const refreshPlaylists = async () => {
        try {
            setIsLoading(true);
            const response = await playlistService.getPlaylists();

            // Đảm bảo playlists luôn là mảng dù response có định dạng như thế nào
            let playlistsData: Playlist[] = [];

            if (response) {
                // Kiểm tra xem response có thuộc tính results không
                if (Array.isArray(response.results)) {
                    playlistsData = response.results;
                }
                // Kiểm tra xem response có phải là mảng không
                else if (Array.isArray(response)) {
                    playlistsData = response;
                }
            }

            setPlaylists(playlistsData);

            // Lọc playlist của user hiện tại
            if (user) {
                const userPlaylists = playlistsData.filter(
                    (playlist) => playlist.user && String(playlist.user.id) === String(user.id)
                );
                setUserPlaylists(userPlaylists);
            }
        } catch (error) {
            console.error("Lỗi khi lấy danh sách playlist:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const refreshCurrentPlaylist = async () => {
        if (!currentPlaylist?.id) return;

        try {
            const playlist = await getPlaylist(String(currentPlaylist.id));
            if (playlist) {
                setCurrentPlaylist(playlist);
            }
        } catch (error) {
            console.error("Lỗi khi làm mới playlist hiện tại:", error);
        }
    };

    const getPlaylist = async (id: string): Promise<Playlist | null> => {
        // Kiểm tra nếu playlist hiện tại đã tồn tại và trùng id thì trả về luôn
        if (currentPlaylist && String(currentPlaylist.id) === id) {
            return currentPlaylist;
        }

        try {
            setIsLoading(true);
            const response = await playlistService.getPlaylist(id);

            // Xử lý phản hồi để đảm bảo định dạng phù hợp với Playlist
            let playlist: Playlist;

            if (response.playlist) {
                // Trường hợp API trả về dạng {playlist, songs}
                playlist = {
                    ...response.playlist,
                    songs: response.songs || []
                };
            } else {
                // Trường hợp API trả về trực tiếp thông tin playlist
                playlist = {
                    ...response,
                    songs: response.songs || []
                };
            }

            setCurrentPlaylist(playlist);
            return playlist;
        } catch (error) {
            console.error("Lỗi khi lấy chi tiết playlist:", error);
            return null;
        } finally {
            setIsLoading(false);
        }
    };

    const removePlaylist = (id: string) => {
        // Cập nhật state sau khi xóa playlist
        setPlaylists(prevPlaylists => prevPlaylists.filter(p => String(p.id) !== id));
        setUserPlaylists(prevPlaylists => prevPlaylists.filter(p => String(p.id) !== id));

        if (currentPlaylist && String(currentPlaylist.id) === id) {
            setCurrentPlaylist(null);
        }
    };

    const updatePlaylistInState = (updatedPlaylist: Playlist) => {
        // Cập nhật trong danh sách playlists
        setPlaylists(prevPlaylists =>
            prevPlaylists.map(p =>
                String(p.id) === String(updatedPlaylist.id) ? updatedPlaylist : p
            )
        );

        // Cập nhật trong danh sách userPlaylists nếu là playlist của user
        if (user && updatedPlaylist.user && String(updatedPlaylist.user.id) === String(user.id)) {
            setUserPlaylists(prevPlaylists =>
                prevPlaylists.map(p =>
                    String(p.id) === String(updatedPlaylist.id) ? updatedPlaylist : p
                )
            );
        }

        // Cập nhật currentPlaylist nếu đang xem playlist này
        if (currentPlaylist && String(currentPlaylist.id) === String(updatedPlaylist.id)) {
            setCurrentPlaylist(updatedPlaylist);
        }
    };

    const addSongToPlaylist = async (playlistId: string, songId: string): Promise<boolean> => {
        try {
            setIsUpdating(true);
            await playlistService.addSongToPlaylist(playlistId, songId);

            // Cập nhật state
            if (currentPlaylist && String(currentPlaylist.id) === playlistId) {
                // Cần làm mới playlist để hiển thị bài hát mới
                await refreshCurrentPlaylist();
            }

            return true;
        } catch (error) {
            console.error("Lỗi khi thêm bài hát vào playlist:", error);
            return false;
        } finally {
            setIsUpdating(false);
        }
    };

    const removeSongFromPlaylist = async (playlistId: string, songId: string): Promise<boolean> => {
        try {
            setIsUpdating(true);
            await playlistService.removeSongFromPlaylist(playlistId, songId);

            // Cập nhật state
            if (currentPlaylist && String(currentPlaylist.id) === playlistId) {
                // Xóa bài hát khỏi currentPlaylist
                setCurrentPlaylist(prev => {
                    if (!prev || !prev.songs) return prev;

                    return {
                        ...prev,
                        songs: prev.songs.filter(song => String(song.id) !== songId),
                        songs_count: (prev.songs_count || 0) - 1
                    };
                });
            }

            return true;
        } catch (error) {
            console.error("Lỗi khi xóa bài hát khỏi playlist:", error);
            return false;
        } finally {
            setIsUpdating(false);
        }
    };

    const followPlaylist = async (playlistId: string): Promise<boolean> => {
        try {
            setIsUpdating(true);
            await playlistService.followPlaylist(playlistId);

            // Cập nhật state
            if (currentPlaylist && String(currentPlaylist.id) === playlistId) {
                setCurrentPlaylist({
                    ...currentPlaylist,
                    is_following: true,
                    followers_count: (currentPlaylist.followers_count || 0) + 1
                });
            }

            return true;
        } catch (error) {
            console.error("Lỗi khi theo dõi playlist:", error);
            return false;
        } finally {
            setIsUpdating(false);
        }
    };

    const unfollowPlaylist = async (playlistId: string): Promise<boolean> => {
        try {
            setIsUpdating(true);
            await playlistService.unfollowPlaylist(playlistId);

            // Cập nhật state
            if (currentPlaylist && String(currentPlaylist.id) === playlistId) {
                setCurrentPlaylist({
                    ...currentPlaylist,
                    is_following: false,
                    followers_count: Math.max((currentPlaylist.followers_count || 0) - 1, 0)
                });
            }

            return true;
        } catch (error) {
            console.error("Lỗi khi bỏ theo dõi playlist:", error);
            return false;
        } finally {
            setIsUpdating(false);
        }
    };

    const togglePlaylistPrivacy = async (playlistId: string): Promise<Playlist | null> => {
        try {
            setIsUpdating(true);
            const response = await playlistService.togglePlaylistPrivacy(playlistId);

            // Cập nhật state
            const updatedPlaylist = {
                ...response,
                songs: currentPlaylist?.songs || []
            };

            updatePlaylistInState(updatedPlaylist);

            return updatedPlaylist;
        } catch (error) {
            console.error("Lỗi khi chuyển đổi chế độ riêng tư:", error);
            return null;
        } finally {
            setIsUpdating(false);
        }
    };

    const value = {
        playlists,
        userPlaylists,
        currentPlaylist,
        isLoading,
        isUpdating,
        refreshPlaylists,
        refreshCurrentPlaylist,
        getPlaylist,
        removePlaylist,
        updatePlaylistInState,
        addSongToPlaylist,
        removeSongFromPlaylist,
        followPlaylist,
        unfollowPlaylist,
        togglePlaylistPrivacy
    };

    return (
        <PlaylistContext.Provider value={value}>
            {children}
        </PlaylistContext.Provider>
    );
}

export function usePlaylist() {
    const context = useContext(PlaylistContext);

    if (context === undefined) {
        throw new Error("usePlaylist must be used within a PlaylistProvider");
    }

    return context;
} 