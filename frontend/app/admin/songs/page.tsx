"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Music } from "lucide-react";
import { AdminSong, AdminSongService } from "@/lib/api/services/AdminSongService";
import AdminSongTable from "@/components/admin/songs/AdminSongTable";
import AdminSongDialog from "@/components/admin/songs/AdminSongDialog";
import AdminSongDeleteDialog from "@/components/admin/songs/AdminSongDeleteDialog";
import { useToast } from "@/components/ui/toast";

const adminSongService = new AdminSongService();

export default function AdminSongsPage() {
  const [songs, setSongs] = useState<AdminSong[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddSongOpen, setIsAddSongOpen] = useState(false);
  const [isEditSongOpen, setIsEditSongOpen] = useState(false);
  const [isDeleteSongOpen, setIsDeleteSongOpen] = useState(false);
  const [selectedSong, setSelectedSong] = useState<AdminSong | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Danh sách nghệ sĩ, album, thể loại
  const [artists, setArtists] = useState<string[]>([]);
  const [albums, setAlbums] = useState<string[]>([]);
  const [genres, setGenres] = useState<string[]>([]);

  const { success, error, ToastContainer } = useToast();

  useEffect(() => {
    fetchData();
    fetchMetadata();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await adminSongService.getSongs();
      console.log("API Response:", response); // Debug log

      if (Array.isArray(response)) {
        setSongs(response);
      } else if (response && Array.isArray(response.results)) {
        setSongs(response.results);
      } else {
        console.error("Invalid response format:", response);
        error("Định dạng dữ liệu không hợp lệ");
      }
    } catch (err) {
      console.error("Lỗi khi tải danh sách bài hát:", err);
      error("Không thể tải danh sách bài hát");
    } finally {
      setLoading(false);
    }
  };

  const fetchMetadata = async () => {
    try {
      const { AdminArtistService } = await import('@/lib/api/services/AdminArtistService');
      const { AdminAlbumService } = await import('@/lib/api/services/AdminAlbumService');
      const { AdminGenreService } = await import('@/lib/api/services/AdminGenreService');

      const artistService = new AdminArtistService();
      const albumService = new AdminAlbumService();
      const genreService = new AdminGenreService();

      const [artistsResponse, albumsResponse, genresResponse] = await Promise.all([
        artistService.getArtists(),
        albumService.getAlbums(),
        genreService.getGenres()
      ]);

      // Xử lý và lấy danh sách tên nghệ sĩ
      let artistNames: string[] = [];
      if (Array.isArray(artistsResponse)) {
        artistNames = artistsResponse.map(artist => artist.name);
      } else if (artistsResponse && Array.isArray(artistsResponse.results)) {
        artistNames = artistsResponse.results.map(artist => artist.name);
      }
      setArtists(artistNames);

      // Xử lý và lấy danh sách tên album
      let albumNames: string[] = [];
      if (Array.isArray(albumsResponse)) {
        albumNames = albumsResponse.map(album => album.title);
      } else if (albumsResponse && Array.isArray(albumsResponse.results)) {
        albumNames = albumsResponse.results.map(album => album.title);
      }
      setAlbums(albumNames);

      // Xử lý và lấy danh sách tên thể loại
      let genreNames: string[] = [];
      if (Array.isArray(genresResponse)) {
        genreNames = genresResponse.map(genre => genre.name);
      } else if (genresResponse && Array.isArray(genresResponse.results)) {
        genreNames = genresResponse.results.map(genre => genre.name);
      }
      setGenres(genreNames);
    } catch (err) {
      console.error("Lỗi khi tải metadata:", err);
      error("Không thể tải dữ liệu nghệ sĩ, album và thể loại");
    }
  };

  const handleAddSong = async (formData: FormData) => {
    try {
      setFormLoading(true);

      // Đảm bảo không có trường uploaded_by trong formData
      if (formData.has("uploaded_by")) {
        formData.delete("uploaded_by");
      }

      await adminSongService.createSong(formData);
      await fetchData();
      setIsAddSongOpen(false);
      success("Thêm bài hát thành công");
    } catch (err: any) {
      console.error("Lỗi khi thêm bài hát:", err);

      // Xử lý lỗi từ API
      if (err.response?.data?.error) {
        const errorData = err.response.data.error;
        if (errorData.message) {
          error(errorData.message);
        } else if (errorData.details) {
          const details = errorData.details;
          if (details.title) error(`Lỗi tên bài hát: ${details.title[0]}`);
          if (details.artist) error(`Lỗi nghệ sĩ: ${details.artist[0]}`);
          if (details.genre) error(`Lỗi thể loại: ${details.genre[0]}`);
          if (details.audio_file) error(`Lỗi file nhạc: ${details.audio_file[0]}`);
          if (details.cover_image) error(`Lỗi ảnh bìa: ${details.cover_image[0]}`);
          if (details.uploaded_by) error(`Lỗi người tải lên: ${details.uploaded_by[0]}`);
          if (details.non_field_errors) error(details.non_field_errors[0]);
        }
      } else {
        error("Không thể thêm bài hát. Vui lòng kiểm tra dữ liệu đầu vào.");
      }

      throw err; // Ném lại lỗi để form xử lý hiển thị
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditSong = async (formData: FormData) => {
    if (!selectedSong) return;

    try {
      setFormLoading(true);

      // Đảm bảo không có trường uploaded_by trong formData
      if (formData.has("uploaded_by")) {
        formData.delete("uploaded_by");
      }

      await adminSongService.updateSong(selectedSong.id, formData);
      await fetchData();
      setIsEditSongOpen(false);
      setSelectedSong(null);
      success("Cập nhật bài hát thành công");
    } catch (err: any) {
      console.error("Lỗi khi cập nhật bài hát:", err);

      // Xử lý lỗi từ API
      if (err.response?.data?.error) {
        const errorData = err.response.data.error;
        if (errorData.message) {
          error(errorData.message);
        } else if (errorData.details) {
          const details = errorData.details;
          if (details.title) error(`Lỗi tên bài hát: ${details.title[0]}`);
          if (details.artist) error(`Lỗi nghệ sĩ: ${details.artist[0]}`);
          if (details.genre) error(`Lỗi thể loại: ${details.genre[0]}`);
          if (details.audio_file) error(`Lỗi file nhạc: ${details.audio_file[0]}`);
          if (details.cover_image) error(`Lỗi ảnh bìa: ${details.cover_image[0]}`);
          if (details.uploaded_by) error(`Lỗi người tải lên: ${details.uploaded_by[0]}`);
          if (details.non_field_errors) error(details.non_field_errors[0]);
        }
      } else {
        error("Không thể cập nhật bài hát. Vui lòng kiểm tra dữ liệu đầu vào.");
      }

      throw err; // Ném lại lỗi để form xử lý hiển thị
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteSong = async () => {
    if (!selectedSong) return;

    try {
      setFormLoading(true);
      await adminSongService.deleteSong(selectedSong.id);
      await fetchData();
      setIsDeleteSongOpen(false);
      setSelectedSong(null);
      success("Xóa bài hát thành công");
    } catch (err) {
      console.error("Lỗi khi xóa bài hát:", err);
      error("Không thể xóa bài hát");
    } finally {
      setFormLoading(false);
    }
  };

  const openEditDialog = (song: AdminSong) => {
    setSelectedSong(song);
    setIsEditSongOpen(true);
  };

  const openDeleteDialog = (song: AdminSong) => {
    setSelectedSong(song);
    setIsDeleteSongOpen(true);
  };

  console.log("Current songs state:", songs); // Debug log

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Quản lý bài hát</h1>
        <Button onClick={() => setIsAddSongOpen(true)}>
          <Music className="h-4 w-4 mr-2" />
          Thêm bài hát
        </Button>
      </div>

      <AdminSongTable
        songs={songs}
        loading={loading}
        onEdit={openEditDialog}
        onDelete={openDeleteDialog}
      />

      <AdminSongDialog
        isOpen={isAddSongOpen}
        onClose={() => setIsAddSongOpen(false)}
        artists={artists}
        genres={genres}
        albums={albums}
        isLoading={formLoading}
        onSubmit={handleAddSong}
        title="Thêm bài hát mới"
        description="Điền thông tin để tạo bài hát mới"
      />

      <AdminSongDialog
        isOpen={isEditSongOpen}
        onClose={() => {
          setIsEditSongOpen(false);
          setSelectedSong(null);
        }}
        song={selectedSong || undefined}
        artists={artists}
        genres={genres}
        albums={albums}
        isLoading={formLoading}
        onSubmit={handleEditSong}
        title="Chỉnh sửa bài hát"
        description="Cập nhật thông tin bài hát"
      />

      <AdminSongDeleteDialog
        isOpen={isDeleteSongOpen}
        onClose={() => {
          setIsDeleteSongOpen(false);
          setSelectedSong(null);
        }}
        song={selectedSong || undefined}
        isLoading={formLoading}
        onConfirm={handleDeleteSong}
      />

      <ToastContainer />
    </div>
  );
}