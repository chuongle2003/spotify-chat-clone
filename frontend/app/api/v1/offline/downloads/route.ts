import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import {
  downloads as downloadsStore,
  DownloadStatus,
  downloadStatusDisplay,
  generateDownloadId,
} from "./shared-store";

// Đối tượng giữ danh sách các bài hát đã tải xuống
type DownloadStatus =
  | "PENDING"
  | "DOWNLOADING"
  | "COMPLETED"
  | "FAILED"
  | "EXPIRED";

interface DownloadItem {
  id: number;
  user_id: string;
  song_id: number;
  song_details: any;
  status: DownloadStatus;
  status_display: string;
  progress: number;
  download_time?: string;
  expiry_time?: string;
  is_active: boolean;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

// Lưu trữ tạm thời cho các download (trong thực tế sẽ lưu vào DB)
const downloadsStore: Record<string, DownloadItem[]> = {};
let nextDownloadId = 1;

// Helper để lấy trạng thái hiển thị
const getStatusDisplay = (status: DownloadStatus): string => {
  switch (status) {
    case "PENDING":
      return "Đang chờ";
    case "DOWNLOADING":
      return "Đang tải xuống";
    case "COMPLETED":
      return "Đã hoàn thành";
    case "FAILED":
      return "Tải thất bại";
    case "EXPIRED":
      return "Đã hết hạn";
    default:
      return "Không xác định";
  }
};

// GET: Lấy danh sách các download
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id?.toString() || "";

    // Lấy thông tin về giới hạn và phân trang (nếu có)
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Lọc theo trạng thái (nếu có)
    const status = searchParams.get("status");

    // Lấy danh sách tải xuống của người dùng
    const userDownloads = downloadsStore[userId] || [];

    // Lọc theo trạng thái nếu được chỉ định
    let filteredDownloads = userDownloads;
    if (status) {
      filteredDownloads = userDownloads.filter((d) => d.status === status);
    }

    // Phân trang
    const paginatedDownloads = filteredDownloads
      .slice(offset, offset + limit)
      .map((d) => ({
        id: d.id,
        song_id: d.song_id,
        song_title: d.song_title,
        artist: d.artist,
        status: d.status,
        status_display: d.status_display,
        progress: d.progress,
        created_at: d.created_at,
        updated_at: d.updated_at,
      }));

    return NextResponse.json({
      downloads: paginatedDownloads,
      total: filteredDownloads.length,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Error fetching downloads:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// POST: Tạo một download mới
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id?.toString() || "";

    // Phân tích dữ liệu đầu vào
    const data = await req.json();
    const { song_id } = data;

    if (!song_id) {
      return NextResponse.json(
        { error: "Song ID is required" },
        { status: 400 }
      );
    }

    // Kiểm tra nếu bài hát đã được tải xuống
    if (!downloadsStore[userId]) {
      downloadsStore[userId] = [];
    }

    const existingDownload = downloadsStore[userId].find(
      (d) =>
        d.song_id.toString() === song_id.toString() &&
        (d.status === DownloadStatus.COMPLETED ||
          d.status === DownloadStatus.DOWNLOADING ||
          d.status === DownloadStatus.PENDING)
    );

    if (existingDownload) {
      return NextResponse.json(
        {
          error: "Song is already downloaded or queued for download",
          download_id: existingDownload.id,
        },
        { status: 409 }
      );
    }

    // Tạo một download mới
    const newDownload = {
      id: generateDownloadId(),
      song_id,
      song_title: `Song ${song_id}`, // Giả lập - trong thực tế sẽ lấy từ database
      artist: "Artist Name", // Giả lập - trong thực tế sẽ lấy từ database
      status: DownloadStatus.PENDING,
      status_display: downloadStatusDisplay[DownloadStatus.PENDING],
      progress: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    downloadsStore[userId].push(newDownload);

    // Giả lập quá trình tải xuống (trong thực tế sẽ là một tác vụ ngầm)
    simulateDownload(userId, newDownload.id);

    return NextResponse.json(
      {
        message: "Download queued successfully",
        download_id: newDownload.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating download:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// Hàm giả lập quá trình tải xuống
function simulateDownload(userId: string, downloadId: number) {
  // Tìm download trong danh sách
  const userDownloads = downloadsStore[userId] || [];
  const downloadIndex = userDownloads.findIndex((d) => d.id === downloadId);

  if (downloadIndex === -1) return;

  // Cập nhật trạng thái thành 'downloading'
  userDownloads[downloadIndex] = {
    ...userDownloads[downloadIndex],
    status: DownloadStatus.DOWNLOADING,
    status_display: downloadStatusDisplay[DownloadStatus.DOWNLOADING],
    updated_at: new Date().toISOString(),
  };

  // Giả lập quá trình tải xuống (5 giây cho mỗi 20%)
  let progress = 0;
  const interval = setInterval(() => {
    progress += 20;

    if (progress <= 100) {
      // Cập nhật tiến trình
      const currentDownloads = downloadsStore[userId] || [];
      const currentIndex = currentDownloads.findIndex(
        (d) => d.id === downloadId
      );

      if (currentIndex !== -1) {
        currentDownloads[currentIndex] = {
          ...currentDownloads[currentIndex],
          progress,
          updated_at: new Date().toISOString(),
        };

        // Nếu hoàn thành
        if (progress === 100) {
          currentDownloads[currentIndex].status = DownloadStatus.COMPLETED;
          currentDownloads[currentIndex].status_display =
            downloadStatusDisplay[DownloadStatus.COMPLETED];
          clearInterval(interval);
        }
      } else {
        clearInterval(interval);
      }
    } else {
      clearInterval(interval);
    }
  }, 5000);
}
