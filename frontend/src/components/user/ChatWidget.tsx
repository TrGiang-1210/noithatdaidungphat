// frontend/components/ChatWidget.tsx
import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import "@/styles/components/user/chatWidget.scss";

interface Message {
  _id: string;
  sender: 'user' | 'admin' | 'bot';
  senderName: string;
  content: string;
  timestamp: Date;
}

interface ChatWidgetProps {
  userId: string;
  userName: string;
  userEmail?: string;
  onLogout?: () => void;
}

const ChatWidget = ({ userId, userName, userEmail, onLogout }: ChatWidgetProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [roomId, setRoomId] = useState<string>('');
  const [sessionError, setSessionError] = useState<string>('');
  
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const currentUserIdRef = useRef<string>(userId);

  // ✅ EFFECT 1: Khi userId thay đổi → Reset hoàn toàn và ĐÓNG CHAT
  useEffect(() => {
    if (currentUserIdRef.current !== userId) {
      console.log('🔄 User changed, resetting everything:', {
        oldUser: currentUserIdRef.current,
        newUser: userId
      });
      
      // Disconnect socket cũ
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      
      // Reset ALL state
      setMessages([]);
      setRoomId('');
      setIsConnected(false);
      setIsTyping(false);
      setNewMessage('');
      setSessionError('');
      setIsOpen(false); // ✅ ĐÓNG CHAT WIDGET
      
      // Update ref
      currentUserIdRef.current = userId;
    }
  }, [userId]);

  // ✅ EFFECT 2: Khởi tạo socket cho user hiện tại
  useEffect(() => {
    console.log('🔌 Initializing socket for user:', userId);
    
    socketRef.current = io('http://localhost:5000', {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    socketRef.current.on('connect', () => {
      console.log('✅ Socket connected:', socketRef.current?.id);
      setIsConnected(true);
      setSessionError('');
      
      // ✅ CHỈ GỬI THÔNG TIN USER, KHÔNG TẠO ROOM
      socketRef.current?.emit('user:join', { 
        userId, 
        userName, 
        userEmail 
      });
    });

    socketRef.current.on('disconnect', () => {
      console.log('❌ Socket disconnected');
      setIsConnected(false);
    });

    // ✅ NHẬN HISTORY - CÓ THỂ EMPTY NẾU CHƯA CÓ ROOM
    socketRef.current.on('chat:history', (data: { room: any; messages: Message[] }) => {
      console.log('📜 Chat history received:', data);
      
      if (data.room) {
        // Có room cũ
        if (data.room.userId === userId) {
          setRoomId(data.room._id);
          setMessages(data.messages);
          setTimeout(() => scrollToBottom(), 100);
        } else {
          console.error('❌ Room userId mismatch!');
          setSessionError('Session không hợp lệ');
        }
      } else {
        // Chưa có room - user mới lần đầu
        console.log('👋 New user, waiting for first message');
        setRoomId('');
        setMessages([]);
      }
    });

    // ✅ NHẬN ROOM ID SAU KHI GỬI TIN NHẮN ĐẦU TIÊN
    socketRef.current.on('room:created', (data: { roomId: string }) => {
      console.log('🆕 Room created:', data.roomId);
      setRoomId(data.roomId);
    });

    socketRef.current.on('message:new', (message: Message) => {
      console.log('📨 New message received:', message);
      
      setMessages(prev => {
        const exists = prev.some(m => m._id === message._id);
        if (exists) return prev;
        return [...prev, message];
      });
    });

    socketRef.current.on('typing:status', (data: { isTyping: boolean; userName?: string }) => {
      setIsTyping(data.isTyping);
    });

    socketRef.current.on('session:replaced', (data: { message: string }) => {
      console.warn('⚠️ Session replaced:', data.message);
      setSessionError(data.message);
      setIsConnected(false);
      alert(data.message);
      setMessages([]);
      setRoomId('');
    });

    socketRef.current.on('error', (error: { message: string }) => {
      console.error('❌ Socket error:', error);
      setSessionError(error.message);
    });

    socketRef.current.on('logout:success', () => {
      console.log('🔓 Logout successful');
      setMessages([]);
      setRoomId('');
      setIsConnected(false);
    });

    return () => {
      console.log('🔌 Cleaning up socket for user:', userId);
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [userId, userName, userEmail]);

  // ✅ Auto scroll khi messages thay đổi
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // ✅ Scroll xuống cuối khi mở chat window
  useEffect(() => {
    if (isOpen && messages.length > 0) {
      setTimeout(() => scrollToBottom(), 100);
    }
  }, [isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !isConnected) return;

    console.log('📤 Sending message:', { 
      roomId: roomId || 'will create new', 
      content: newMessage 
    });

    // ✅ GỬI TIN NHẮN
    // Backend sẽ tự động tạo room nếu chưa có
    socketRef.current?.emit('message:send', {
      roomId: roomId || undefined, // undefined nếu chưa có room
      content: newMessage,
      sender: 'user',
      senderName: userName
    });

    setNewMessage('');
    handleTypingStop();
  };

  const handleTypingStart = () => {
    if (!roomId || !isConnected) return;
    
    socketRef.current?.emit('typing:start', { roomId, userName });
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      handleTypingStop();
    }, 3000);
  };

  const handleTypingStop = () => {
    if (!roomId || !isConnected) return;
    socketRef.current?.emit('typing:stop', { roomId });
  };

  const handleLogout = () => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('user:logout');
    }
    
    setMessages([]);
    setRoomId('');
    setIsOpen(false);
    
    if (onLogout) {
      onLogout();
    }
  };

  const formatTime = (timestamp: Date) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="chat-widget">
      {!isOpen && (
        <button className="chat-toggle-btn" onClick={() => setIsOpen(true)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span className="chat-badge">!</span>
        </button>
      )}

      {isOpen && (
        <div className="chat-window">
          <div className="chat-header">
            <div className="chat-header-content">
              <div className="chat-logo">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
                </svg>
              </div>
              <div>
                <h3>Nội Thất Đại Dũng Phát</h3>
                <p className="chat-status">
                  {sessionError ? (
                    <span style={{ color: '#ff4444' }}>❌ {sessionError}</span>
                  ) : isConnected ? (
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

          <div className="chat-messages">
            {messages.length === 0 ? (
              <div className="chat-welcome">
                <p>Xin chào {userName}! 👋</p>
                <p>Em có thể giúp được gì cho Anh/Chị?</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg._id}
                  className={`message ${msg.sender === 'user' ? 'message-user' : 'message-admin'}`}
                >
                  <div className="message-content">
                    {msg.sender === 'bot' && (
                      <div className="bot-indicator">🤖 Bot</div>
                    )}
                    <p style={{ whiteSpace: 'pre-line' }}>{msg.content}</p>
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

          <div className="chat-quick-actions">
            <button 
              onClick={() => setNewMessage('Cần mua hàng')}
              disabled={!isConnected}
            >
              Cần mua hàng
            </button>
            <button 
              onClick={() => setNewMessage('Gọi lại cho tôi')}
              disabled={!isConnected}
            >
              Gọi lại cho tôi
            </button>
            <button 
              onClick={() => setNewMessage('Tư vấn dự án')}
              disabled={!isConnected}
            >
              Tư vấn dự án
            </button>
          </div>

          <form className="chat-input" onSubmit={handleSendMessage}>
            <input
              type="text"
              placeholder={sessionError ? "Session không hợp lệ" : "Nhập tin nhắn..."}
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                handleTypingStart();
              }}
              disabled={!isConnected || !!sessionError}
            />
            <button 
              type="submit" 
              disabled={!newMessage.trim() || !isConnected || !!sessionError}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
            </button>
          </form>

          <div className="chat-footer">
            <button className="feedback-btn" disabled={!isConnected}>👍</button>
            <button className="feedback-btn" disabled={!isConnected}>👎</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWidget;