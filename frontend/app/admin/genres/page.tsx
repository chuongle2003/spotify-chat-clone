"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Tag } from "lucide-react";
import { AdminGenre, AdminGenreService } from "@/lib/api/services/AdminGenreService";
import AdminGenreTable from "../../../components/admin/genres/AdminGenreTable";
import AdminGenreDialog from "../../../components/admin/genres/AdminGenreDialog";
import AdminGenreDeleteDialog from "../../../components/admin/genres/AdminGenreDeleteDialog";
import { useToast } from "@/components/ui/toast";

const adminGenreService = new AdminGenreService();

export default function AdminGenresPage() {
    const [genres, setGenres] = useState<AdminGenre[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddGenreOpen, setIsAddGenreOpen] = useState(false);
    const [isEditGenreOpen, setIsEditGenreOpen] = useState(false);
    const [isDeleteGenreOpen, setIsDeleteGenreOpen] = useState(false);
    const [selectedGenre, setSelectedGenre] = useState<AdminGenre | null>(null);
    const [formLoading, setFormLoading] = useState(false);

    const { success, error, ToastContainer } = useToast();

    useEffect(() => {
        fetchGenres();
    }, []);

    const fetchGenres = async () => {
        try {
            setLoading(true);
            const response = await adminGenreService.getGenres();
            console.log("API Response:", response); // Debug log

            if (Array.isArray(response)) {
                setGenres(response);
            } else if (response && Array.isArray(response.results)) {
                setGenres(response.results);
            } else {
                console.error("Invalid response format:", response);
                error("Định dạng dữ liệu không hợp lệ");
            }
        } catch (err) {
            console.error("Lỗi khi tải danh sách thể loại:", err);
            error("Không thể tải danh sách thể loại");
        } finally {
            setLoading(false);
        }
    };

    const handleAddGenre = async (formData: FormData) => {
        try {
            setFormLoading(true);
            await adminGenreService.createGenre(formData);
            await fetchGenres();
            setIsAddGenreOpen(false);
            success("Thêm thể loại thành công");
        } catch (err) {
            console.error("Lỗi khi thêm thể loại:", err);
            error("Không thể thêm thể loại");
        } finally {
            setFormLoading(false);
        }
    };

    const handleEditGenre = async (formData: FormData) => {
        if (!selectedGenre) return;

        try {
            setFormLoading(true);
            await adminGenreService.updateGenre(selectedGenre.id, formData);
            await fetchGenres();
            setIsEditGenreOpen(false);
            setSelectedGenre(null);
            success("Cập nhật thể loại thành công");
        } catch (err) {
            console.error("Lỗi khi cập nhật thể loại:", err);
            error("Không thể cập nhật thể loại");
        } finally {
            setFormLoading(false);
        }
    };

    const handleDeleteGenre = async () => {
        if (!selectedGenre) return;

        try {
            setFormLoading(true);
            await adminGenreService.deleteGenre(selectedGenre.id);
            await fetchGenres();
            setIsDeleteGenreOpen(false);
            setSelectedGenre(null);
            success("Xóa thể loại thành công");
        } catch (err) {
            console.error("Lỗi khi xóa thể loại:", err);
            error("Không thể xóa thể loại");
        } finally {
            setFormLoading(false);
        }
    };

    const openEditDialog = (genre: AdminGenre) => {
        setSelectedGenre(genre);
        setIsEditGenreOpen(true);
    };

    const openDeleteDialog = (genre: AdminGenre) => {
        setSelectedGenre(genre);
        setIsDeleteGenreOpen(true);
    };

    return (
        <div className="space-y-6 p-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Quản lý thể loại</h1>
                <Button onClick={() => setIsAddGenreOpen(true)}>
                    <Tag className="h-4 w-4 mr-2" />
                    Thêm thể loại
                </Button>
            </div>

            <AdminGenreTable
                genres={genres}
                loading={loading}
                onEdit={openEditDialog}
                onDelete={openDeleteDialog}
            />

            <AdminGenreDialog
                isOpen={isAddGenreOpen}
                onClose={() => setIsAddGenreOpen(false)}
                isLoading={formLoading}
                onSubmit={handleAddGenre}
                title="Thêm thể loại mới"
                description="Điền thông tin để tạo thể loại mới"
            />

            <AdminGenreDialog
                isOpen={isEditGenreOpen}
                onClose={() => {
                    setIsEditGenreOpen(false);
                    setSelectedGenre(null);
                }}
                genre={selectedGenre || undefined}
                isLoading={formLoading}
                onSubmit={handleEditGenre}
                title="Chỉnh sửa thể loại"
                description="Cập nhật thông tin thể loại"
            />

            <AdminGenreDeleteDialog
                isOpen={isDeleteGenreOpen}
                onClose={() => {
                    setIsDeleteGenreOpen(false);
                    setSelectedGenre(null);
                }}
                isLoading={formLoading}
                onConfirm={handleDeleteGenre}
                genreName={selectedGenre?.name || ""}
            />

            <ToastContainer />
        </div>
    );
} 