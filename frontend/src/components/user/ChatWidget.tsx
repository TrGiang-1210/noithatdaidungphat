// frontend/components/ChatWidget.tsx
import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import "@/styles/components/user/chatWidget.scss";

interface Message {
  _id: string;
  sender: 'user' | 'admin';
  senderName: string;
  content: string;
  timestamp: Date;
}

interface ChatWidgetProps {
  userId: string;
  userName: string;
  userEmail?: string;
}

const ChatWidget = ({ userId, userName, userEmail }: ChatWidgetProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [roomId, setRoomId] = useState<string>('');
  
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io('http://localhost:5000');

    socketRef.current.on('connect', () => {
      console.log('✅ Socket connected:', socketRef.current?.id);
      setIsConnected(true);
      // Join chat room
      socketRef.current?.emit('user:join', { userId, userName, userEmail });
    });

    socketRef.current.on('disconnect', () => {
      setIsConnected(false);
    });

    socketRef.current.on('chat:history', (data: { room: any; messages: Message[] }) => {
      console.log('📜 Chat history received:', data);
      setRoomId(data.room._id);
      setMessages(data.messages);
    });

    socketRef.current.on('message:new', (message: Message) => {
      console.log('📨 New message received:', message);
      setMessages(prev => {
        // Kiểm tra xem message đã tồn tại chưa để tránh duplicate
        const exists = prev.some(m => m._id === message._id);
        if (exists) return prev;
        return [...prev, message];
      });
    });

    socketRef.current.on('typing:status', (data: { isTyping: boolean; userName?: string }) => {
      setIsTyping(data.isTyping);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [userId, userName, userEmail]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !roomId) return;

    console.log('📤 Sending message:', { roomId, content: newMessage });

    socketRef.current?.emit('message:send', {
      roomId,
      content: newMessage,
      sender: 'user',
      senderName: userName
    });

    setNewMessage('');
    handleTypingStop();
  };

  const handleTypingStart = () => {
    if (!roomId) return;
    
    socketRef.current?.emit('typing:start', { roomId, userName });
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      handleTypingStop();
    }, 3000);
  };

  const handleTypingStop = () => {
    if (!roomId) return;
    socketRef.current?.emit('typing:stop', { roomId });
  };

  const formatTime = (timestamp: Date) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="chat-widget">
      {/* Chat Button */}
      {!isOpen && (
        <button className="chat-toggle-btn" onClick={() => setIsOpen(true)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span className="chat-badge">!</span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="chat-window">
          {/* Header */}
          <div className="chat-header">
            <div className="chat-header-content">
              <div className="chat-logo">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
                </svg>
              </div>
              <div>
                <h3>Nội Thất Hòa Phát</h3>
                <p className="chat-status">
                  {isConnected ? (
                    <>
                      <span className="status-dot"></span>
                      Hỗ trợ 24/7
                    </>
                  ) : (
                    'Đang kết nối...'
                  )}
                </p>
              </div>
            </div>
            <button className="chat-close-btn" onClick={() => setIsOpen(false)}>
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className="chat-messages">
            {messages.length === 0 ? (
              <div className="chat-welcome">
                <p>Xin chào! 👋</p>
                <p>Em có thể giúp được gì cho Anh/Chị?</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg._id}
                  className={`message ${msg.sender === 'user' ? 'message-user' : 'message-admin'}`}
                >
                  <div className="message-content">
                    <p>{msg.content}</p>
                    <span className="message-time">{formatTime(msg.timestamp)}</span>
                  </div>
                </div>
              ))
            )}
            
            {isTyping && (
              <div className="message message-admin">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          <div className="chat-quick-actions">
            <button onClick={() => setNewMessage('Cần mua hàng')}>
              Cần mua hàng
            </button>
            <button onClick={() => setNewMessage('Gọi lại cho tôi')}>
              Gọi lại cho tôi
            </button>
            <button onClick={() => setNewMessage('Tư vấn dự án')}>
              Tư vấn dự án
            </button>
          </div>

          {/* Input */}
          <form className="chat-input" onSubmit={handleSendMessage}>
            <input
              type="text"
              placeholder="Nhập tin nhắn..."
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                handleTypingStart();
              }}
              disabled={!isConnected}
            />
            <button type="submit" disabled={!newMessage.trim() || !isConnected}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
            </button>
          </form>

          {/* Footer */}
          <div className="chat-footer">
            <button className="feedback-btn">👍</button>
            <button className="feedback-btn">👎</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWidget;