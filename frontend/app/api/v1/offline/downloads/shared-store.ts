// Giả lập một store lưu trữ tạm thời - trong môi trường thực tế sẽ sử dụng cơ sở dữ liệu
// Key là ID của người dùng, value là mảng các download của người dùng đó
export const downloads: Record<string, any[]> = {};

// Các trạng thái có thể có của quá trình tải xuống
export enum DownloadStatus {
  PENDING = "pending",
  DOWNLOADING = "downloading",
  COMPLETED = "completed",
  FAILED = "failed",
  CANCELED = "canceled",
}

// Ánh xạ trạng thái tải xuống sang các nhãn hiển thị thân thiện
export const downloadStatusDisplay: Record<DownloadStatus, string> = {
  [DownloadStatus.PENDING]: "Đang chờ",
  [DownloadStatus.DOWNLOADING]: "Đang tải xuống",
  [DownloadStatus.COMPLETED]: "Đã hoàn thành",
  [DownloadStatus.FAILED]: "Thất bại",
  [DownloadStatus.CANCELED]: "Đã hủy",
};

// Hàm tiện ích để tạo ID download mới
export function generateDownloadId(): number {
  return Math.floor(Math.random() * 100000) + 1;
}
