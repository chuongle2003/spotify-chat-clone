# API Client

Đây là cấu trúc API client mới, được tổ chức theo các service để dễ dàng quản lý và mở rộng.

## Cấu trúc thư mục

```
lib/api/
├── core/                       # Core functionality
│   ├── ApiRequest.ts           # Lớp cơ sở cho các request
│   └── types.ts                # Các loại dữ liệu dùng chung
├── services/                   # Các service API riêng biệt
│   ├── AuthService.ts          # Xác thực người dùng
│   ├── SongService.ts          # Quản lý bài hát
│   ├── PlaylistService.ts      # Quản lý playlist
│   └── ...                     # Các service khác
├── index.ts                    # Export tất cả API
└── README.md                   # Tài liệu hướng dẫn
```

## Cách sử dụng

```typescript
import { api } from "@/lib/api";

// Xác thực
api.auth.login(email, password);
api.auth.register(userData);

// Bài hát
api.songs.getTrendingSongs();
api.songs.getSong(songId);
api.songs.likeSong(songId);

// Playlist
api.playlists.createPlaylist({ name: "My Playlist" });
api.playlists.addSongToPlaylist(playlistId, songId);
```

## Thêm service mới

Để thêm một service mới, tạo file trong thư mục `services/` và cập nhật `index.ts`:

```typescript
// 1. Tạo file lib/api/services/NewService.ts
import { ApiRequest } from "../core/ApiRequest";

export class NewService extends ApiRequest {
  async getSomething() {
    return this.get("/api/endpoint");
  }
}

// 2. Cập nhật lib/api/index.ts
import { NewService } from "./services/NewService";

const newService = new NewService();

export const api = {
  // ...existing services
  new: newService,
};
```

## Ưu điểm của cấu trúc mới

1. **Phân chia rõ ràng**: Mỗi service đại diện cho một phần chức năng riêng biệt
2. **Dễ bảo trì**: Thay đổi một service không ảnh hưởng đến service khác
3. **Mở rộng dễ dàng**: Thêm service mới đơn giản không cần thay đổi code đã có
4. **Tối ưu import**: Có thể import chỉ service cần thiết
5. **TypeScript support**: Định nghĩa kiểu dữ liệu rõ ràng và nhất quán
6. **Documentation**: Mỗi method có JSDoc giải thích cách sử dụng

## Các pattern sử dụng

1. **Module pattern**: Chia nhỏ, phân chia trách nhiệm rõ ràng
2. **Inheritance**: Kế thừa từ ApiRequest cơ bản để tái sử dụng code
3. **Singleton**: Mỗi service chỉ tạo một instance
4. **Repository pattern**: Phân tách logic truy cập dữ liệu
