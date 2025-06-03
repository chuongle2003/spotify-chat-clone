import { BaseService } from "../core/BaseService";
import { Message, Song, Playlist, User, ChatRoom } from "@/types";

export class ChatService extends BaseService {
  constructor() {
    super();
  }

  /**
   * Tìm kiếm người dùng
   */
  async searchUsers(searchTerm: string): Promise<User[]> {
    const response = await this.get(
      `/api/chat/users/search/?search=${searchTerm}`
    );
    return response as User[];
  }

  /**
   * Lấy gợi ý người dùng để chat
   */
  async getUserSuggestions(): Promise<User[]> {
    const response = await this.get("/api/chat/users/suggestions/");
    return response as User[];
  }

  /**
   * Lấy danh sách cuộc trò chuyện
   */
  async getConversations(): Promise<ChatRoom[]> {
    const response = await this.get("/api/chat/conversations/");
    return response as ChatRoom[];
  }

  /**
   * Bắt đầu cuộc trò chuyện mới
   */
  async startConversation(userId: string): Promise<ChatRoom> {
    const response = await this.post("/api/chat/conversations/start/", {
      user_id: userId,
    });
    return response as ChatRoom;
  }

  /**
   * Lấy tin nhắn của một cuộc trò chuyện
   */
  async getConversationMessages(conversationId: string): Promise<Message[]> {
    const response = await this.get(
      `/api/chat/conversations/${conversationId}/messages/`
    );
    return response as Message[];
  }

  /**
   * Lấy lịch sử tin nhắn giữa hai người dùng
   */
  async getMessageHistory(
    user1Id: string,
    user2Id: string
  ): Promise<Message[]> {
    console.log(
      `Gọi API lịch sử tin nhắn với user1=${user1Id}, user2=${user2Id}`
    );
    try {
      const response = await this.get(
        `/api/chat/messages/history/?user1=${user1Id}&user2=${user2Id}`
      );
      console.log("Phản hồi API lịch sử tin nhắn:", response);

      // Đảm bảo luôn trả về mảng
      if (Array.isArray(response)) {
        return response as Message[];
      } else if (response && typeof response === "object") {
        // Nếu response là object (có thể chứa data), cố gắng lấy mảng tin nhắn
        const responseObj = response as Record<string, any>;
        if (Array.isArray(responseObj.messages)) {
          return responseObj.messages as Message[];
        } else if (Array.isArray(responseObj.data)) {
          return responseObj.data as Message[];
        }
      }
      // Mặc định trả về mảng rỗng
      console.error("Định dạng phản hồi không mong đợi:", response);
      return [];
    } catch (error) {
      console.error("Lỗi khi gọi API lịch sử tin nhắn:", error);
      throw error;
    }
  }

  /**
   * Lấy tất cả tin nhắn
   */
  async getAllMessages(): Promise<Message[]> {
    const response = await this.get("/api/chat/messages/");
    return response as Message[];
  }

  /**
   * Gửi tin nhắn văn bản
   */
  async sendMessage(receiverId: string, content: string): Promise<Message> {
    const response = await this.post("/api/chat/messages/create/", {
      receiver_id: receiverId,
      content,
    });
    return response as Message;
  }

  /**
   * Xem chi tiết tin nhắn
   */
  async getMessageDetails(messageId: number): Promise<Message> {
    const response = await this.get(`/api/chat/messages/${messageId}/`);
    return response as Message;
  }

  /**
   * Xóa tin nhắn
   */
  async deleteMessage(messageId: number): Promise<void> {
    await this.delete(`/api/chat/messages/${messageId}/`);
  }

  /**
   * Báo cáo tin nhắn vi phạm
   */
  async reportMessage(
    messageId: number,
    reason: string,
    description: string
  ): Promise<any> {
    const response = await this.post("/api/chat/report-message/", {
      message: messageId,
      reason,
      description,
    });
    return response;
  }

  /**
   * Chia sẻ bài hát
   */
  async shareSong(
    receiverId: string,
    songId: string,
    content: string
  ): Promise<Message> {
    const response = await this.post("/api/chat/messages/create/", {
      receiver_id: receiverId,
      content,
      message_type: "SONG",
      song_id: songId,
    });
    return response as Message;
  }

  /**
   * Chia sẻ playlist
   */
  async sharePlaylist(
    receiverId: string,
    playlistId: string,
    content: string
  ): Promise<Message> {
    const response = await this.post("/api/chat/messages/create/", {
      receiver_id: receiverId,
      content,
      message_type: "PLAYLIST",
      playlist_id: playlistId,
    });
    return response as Message;
  }

  /**
   * Đánh dấu tin nhắn là đã đọc
   */
  async markMessagesAsRead(conversationId: string): Promise<void> {
    await this.post(`/api/chat/conversations/${conversationId}/mark-read/`, {});
  }

  /**
   * Upload file lên server
   */
  async uploadFile(file: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append("file", file);

    // Gửi yêu cầu POST với FormData, chỉ sử dụng 2 tham số
    const response = await this.post("/api/chat/upload/", formData);

    return response as { url: string };
  }

  /**
   * Gửi hình ảnh
   */
  async sendImage(
    receiverId: string,
    imageUrl: string,
    content?: string
  ): Promise<Message> {
    const response = await this.post("/api/chat/messages/create/", {
      receiver_id: receiverId,
      content: content || "",
      message_type: "IMAGE",
      image: imageUrl,
    });

    return response as Message;
  }

  /**
   * Gửi tệp đính kèm
   */
  async sendAttachment(
    receiverId: string,
    fileUrl: string,
    content?: string
  ): Promise<Message> {
    const response = await this.post("/api/chat/messages/create/", {
      receiver_id: receiverId,
      content: content || "",
      message_type: "ATTACHMENT",
      attachment: fileUrl,
    });

    return response as Message;
  }

  /**
   * Gửi ghi âm
   */
  async sendVoiceNote(
    receiverId: string,
    audioUrl: string,
    content?: string
  ): Promise<Message> {
    const response = await this.post("/api/chat/messages/create/", {
      receiver_id: receiverId,
      content: content || "",
      message_type: "VOICE_NOTE",
      voice_note: audioUrl,
    });

    return response as Message;
  }
}
