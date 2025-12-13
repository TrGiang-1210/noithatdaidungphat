// types/chat.ts
export interface Message {
  _id: string;
  roomId: string;
  sender: 'user' | 'admin';
  senderName: string;
  content: string;
  timestamp: Date;
  read: boolean;
}

export interface ChatRoom {
  _id: string;
  userId: string;
  userName: string;
  userEmail?: string;
  status: 'active' | 'closed';
  lastMessage?: string;
  lastMessageTime?: Date;
  unreadCount: number;
  createdAt: Date;
}

export interface TypingStatus {
  roomId: string;
  isTyping: boolean;
  userName: string;
}