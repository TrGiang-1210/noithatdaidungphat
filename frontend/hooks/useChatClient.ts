import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface ChatMessage {
  _id: string;
  sender: 'user' | 'admin' | 'bot';
  senderName: string;
  content: string;
  timestamp: Date;
}

interface ChatRoom {
  _id: string;
  user?: any;
  guestId?: string;
  userName: string;
  userEmail?: string;
  userType: 'registered' | 'guest';
}

interface UseChatClientProps {
  userId?: string;
  userName?: string;
  userEmail?: string;
  language?: string; // ✅ THÊM language parameter
}

export function useChatClient({ userId, userName, userEmail, language = 'vi' }: UseChatClientProps = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  
  const socketRef = useRef<Socket | null>(null);
  const guestIdRef = useRef<string | null>(null);

  const getGuestId = () => {
    if (userId) return null;
    
    if (!guestIdRef.current) {
      let guestId = localStorage.getItem('chat_guest_id');
      
      if (!guestId) {
        guestId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('chat_guest_id', guestId);
      }
      
      guestIdRef.current = guestId;
    }
    
    return guestIdRef.current;
  };

  useEffect(() => {
    socketRef.current = io('http://localhost:5000');

    socketRef.current.on('connect', () => {
      console.log('✅ Chat connected:', socketRef.current?.id);
      setIsConnected(true);

      const guestId = getGuestId();
      
      socketRef.current?.emit('user:join', {
        userId: userId || null,
        guestId: guestId,
        userName: userName || (userId ? 'User' : 'Khách'),
        userEmail: userEmail || null
      });
    });

    socketRef.current.on('disconnect', () => {
      console.log('❌ Chat disconnected');
      setIsConnected(false);
    });

    socketRef.current.on('chat:history', (data: { room?: ChatRoom; messages: ChatMessage[] }) => {
      console.log('📜 Chat history:', data);
      
      if (data.room) {
        setRoomId(data.room._id);
      }
      
      setMessages(data.messages);
    });

    socketRef.current.on('message:new', (message: ChatMessage) => {
      console.log('📨 New message:', message);
      setMessages(prev => {
        const exists = prev.some(m => m._id === message._id);
        if (exists) return prev;
        return [...prev, message];
      });
    });

    socketRef.current.on('room:created', (data: { roomId: string }) => {
      console.log('🆕 Room created:', data.roomId);
      setRoomId(data.roomId);
    });

    socketRef.current.on('typing:status', (data: { isTyping: boolean }) => {
      setIsTyping(data.isTyping);
    });

    socketRef.current.on('session:replaced', (data: { message: string }) => {
      alert(data.message);
      socketRef.current?.disconnect();
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [userId, userName, userEmail]);

  // ✅ GỬI TIN NHẮN - THÊM LANGUAGE
  const sendMessage = (content: string) => {
    if (!content.trim() || !socketRef.current) return;

    socketRef.current.emit('message:send', {
      roomId: roomId,
      content: content.trim(),
      sender: 'user',
      senderName: userName || (userId ? 'User' : 'Khách'),
      language: language // ✅ THÊM language field
    });
  };

  const startTyping = () => {
    if (!roomId) return;
    socketRef.current?.emit('typing:start', {
      roomId,
      userName: userName || (userId ? 'User' : 'Khách')
    });
  };

  const stopTyping = () => {
    if (!roomId) return;
    socketRef.current?.emit('typing:stop', { roomId });
  };

  const logout = () => {
    if (userId && socketRef.current) {
      socketRef.current.emit('user:logout');
    }
  };

  return {
    isConnected,
    messages,
    roomId,
    isTyping,
    sendMessage,
    startTyping,
    stopTyping,
    logout,
    isGuest: !userId
  };
}

export default useChatClient;