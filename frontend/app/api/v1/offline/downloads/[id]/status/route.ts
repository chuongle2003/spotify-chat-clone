import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { downloads as downloadsStore } from "../../shared-store";

// GET: Lấy trạng thái của một download
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id?.toString() || "";
    const downloadId = parseInt(params.id);

    if (isNaN(downloadId)) {
      return NextResponse.json(
        { error: "Invalid download ID" },
        { status: 400 }
      );
    }

    // Lấy danh sách tải xuống của người dùng
    const userDownloads = downloadsStore[userId] || [];

    // Tìm download theo ID
    const download = userDownloads.find((d) => d.id === downloadId);

    if (!download) {
      return NextResponse.json(
        { error: "Download not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        id: download.id,
        status: download.status,
        status_display: download.status_display,
        progress: download.progress,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching download status:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
