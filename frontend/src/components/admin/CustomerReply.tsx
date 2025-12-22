// frontend/components/admin/CustomerReply.tsx - WITH SEARCH
import { useState, useEffect, useRef, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';
import "@/styles/components/admin/customerReply.scss";

interface Message {
  _id: string;
  sender: 'user' | 'admin' | 'bot';
  senderName: string;
  content: string;
  timestamp: Date;
}

interface User {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
}

interface ChatRoom {
  _id: string;
  user?: User;
  guestId?: string;
  userName: string;
  userEmail?: string;
  userType: 'registered' | 'guest';
  status: 'active' | 'closed';
  lastMessage?: string;
  lastMessageTime?: Date;
  unreadCount: number;
  displayName?: string;
}

const CustomerReply = () => {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [adminName] = useState('Admin Support');
  const [searchQuery, setSearchQuery] = useState('');
  const [messageSearchQuery, setMessageSearchQuery] = useState('');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const getDisplayName = (room: ChatRoom): string => {
    if (room.displayName) return room.displayName;
    
    if (room.userType === 'registered') {
      if (room.user?.name) return room.user.name;
      if (room.userName && room.userName !== 'Khách') return room.userName;
      return 'User';
    }
    
    const guestSuffix = room.guestId ? ` (${room.guestId.substring(0, 8)})` : '';
    return `Khách${guestSuffix}`;
  };

  const getSubtitle = (room: ChatRoom): string => {
    if (room.userType === 'registered') {
      return room.user?.email || room.userEmail || 'Khách hàng';
    }
    return '👤 Khách chưa đăng ký';
  };

  const getAvatar = (room: ChatRoom): string => {
    const displayName = getDisplayName(room);
    return displayName.charAt(0).toUpperCase();
  };

  // Filter rooms based on search query
  const filteredRooms = useMemo(() => {
    if (!searchQuery.trim()) return rooms;
    
    const query = searchQuery.toLowerCase().trim();
    
    return rooms.filter((room) => {
      // Search in display name
      if (getDisplayName(room).toLowerCase().includes(query)) return true;
      
      // Search in email
      if (room.user?.email?.toLowerCase().includes(query)) return true;
      if (room.userEmail?.toLowerCase().includes(query)) return true;
      
      // Search in phone
      if (room.user?.phone?.includes(query)) return true;
      
      // Search in last message
      if (room.lastMessage?.toLowerCase().includes(query)) return true;
      
      // Search in guest ID
      if (room.guestId?.toLowerCase().includes(query)) return true;
      
      return false;
    });
  }, [rooms, searchQuery]);

  // Filter messages based on search query
  const filteredMessages = useMemo(() => {
    if (!messageSearchQuery.trim()) return messages;
    
    const query = messageSearchQuery.toLowerCase().trim();
    
    return messages.filter((msg) => {
      return msg.content?.toLowerCase().includes(query);
    });
  }, [messages, messageSearchQuery]);

  // Toggle search and focus input
  const handleToggleSearch = () => {
    setIsSearchExpanded(!isSearchExpanded);
    if (!isSearchExpanded) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    } else {
      setMessageSearchQuery('');
    }
  };

  useEffect(() => {
    socketRef.current = io('http://localhost:5000');

    socketRef.current.on('connect', () => {
      console.log('✅ Admin socket connected:', socketRef.current?.id);
      setIsConnected(true);
      socketRef.current?.emit('admin:join');
    });

    socketRef.current.on('disconnect', () => {
      console.log('❌ Admin socket disconnected');
      setIsConnected(false);
    });

    socketRef.current.on('rooms:list', (roomsList: ChatRoom[]) => {
      console.log('📋 Rooms list received:', roomsList);
      
      const uniqueRooms = roomsList.reduce((acc: ChatRoom[], current) => {
        const identifier = current.userType === 'registered' 
          ? current.user?._id 
          : current.guestId;
        
        const exists = acc.find(room => {
          const existingId = room.userType === 'registered'
            ? room.user?._id
            : room.guestId;
          return existingId === identifier;
        });
        
        if (!exists) {
          acc.push(current);
        }
        return acc;
      }, []);
      
      setRooms(uniqueRooms);
    });

    socketRef.current.on('room:new', (newRoom: ChatRoom) => {
      console.log('🆕 New room created:', newRoom);
      
      setRooms(prev => {
        const identifier = newRoom.userType === 'registered'
          ? newRoom.user?._id
          : newRoom.guestId;
        
        const exists = prev.some(room => {
          const existingId = room.userType === 'registered'
            ? room.user?._id
            : room.guestId;
          return existingId === identifier;
        });
        
        if (exists) return prev;
        return [newRoom, ...prev];
      });
      
      playNotificationSound();
    });

    socketRef.current.on('chat:history', (data: { room?: ChatRoom; messages: Message[] }) => {
      console.log('📜 Chat history received:', data.messages);
      setMessages(data.messages);
      
      if (data.room && selectedRoom?._id === data.room._id) {
        setSelectedRoom(data.room);
      }
    });

    socketRef.current.on('message:new', (message: Message) => {
      console.log('📨 New message received:', message);
      setMessages(prev => {
        const exists = prev.some(m => m._id === message._id);
        if (exists) return prev;
        return [...prev, message];
      });
      scrollToBottom();
    });

    socketRef.current.on('message:user_new', (data: { roomId: string; message: Message }) => {
      console.log('👤 User message received:', data);
      
      setRooms(prev => prev.map(room => {
        if (room._id === data.roomId) {
          return {
            ...room,
            lastMessage: data.message.content,
            lastMessageTime: data.message.timestamp,
            unreadCount: room.unreadCount
          };
        }
        return room;
      }));
      
      setSelectedRoom(current => {
        if (current && current._id === data.roomId) {
          setMessages(prev => {
            const exists = prev.some(m => m._id === data.message._id);
            if (exists) return prev;
            return [...prev, data.message];
          });
          return current;
        } else {
          playNotificationSound();
          return current;
        }
      });
    });

    socketRef.current.on('typing:status', (data: { isTyping: boolean }) => {
      setIsTyping(data.isTyping);
    });

    return () => {
      console.log('🔌 Cleaning up socket connection');
      socketRef.current?.disconnect();
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const playNotificationSound = () => {
    const audio = new Audio('/notification.mp3');
    audio.play().catch(() => {});
  };

  const handleSelectRoom = (room: ChatRoom) => {
    console.log('🎯 Selected room:', room);
    setSelectedRoom(room);
    setMessages([]);
    socketRef.current?.emit('admin:join_room', room._id);
    
    setRooms(prev => prev.map(r => 
      r._id === room._id ? { ...r, unreadCount: 0 } : r
    ));
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !selectedRoom) return;

    console.log('📤 Admin sending message:', { roomId: selectedRoom._id, content: newMessage });

    socketRef.current?.emit('message:send', {
      roomId: selectedRoom._id,
      content: newMessage,
      sender: 'admin',
      senderName: adminName
    });

    setNewMessage('');
  };

  const formatTime = (timestamp?: Date) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} giờ trước`;
    return date.toLocaleDateString('vi-VN');
  };

  const getTotalUnread = () => {
    return rooms.reduce((sum, room) => sum + room.unreadCount, 0);
  };

  return (
    <div className="admin-chat-container">
      <div className="chat-rooms-sidebar">
        <div className="chat-sidebar-header">
          <h3>Tin nhắn khách hàng</h3>
          <div className="connection-status">
            <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}></span>
            {isConnected ? 'Đang hoạt động' : 'Mất kết nối'}
          </div>
        </div>

        <div className="rooms-stats">
          <div className="stat-item">
            <span className="stat-number">{rooms.length}</span>
            <span className="stat-label">Đoạn chat</span>
          </div>
          <div className="stat-item">
            <span className="stat-number unread">{getTotalUnread()}</span>
            <span className="stat-label">Chưa đọc</span>
          </div>
        </div>

        {/* Search Box */}
        <div className="rooms-search">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="text"
            placeholder="Tìm khách hàng..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button 
              className="clear-search"
              onClick={() => setSearchQuery('')}
              title="Xóa"
            >
              ✕
            </button>
          )}
        </div>

        <div className="rooms-list">
          {filteredRooms.length === 0 ? (
            <div className="empty-rooms">
              <p>
                {searchQuery 
                  ? `Không tìm thấy "${searchQuery}"`
                  : 'Chưa có cuộc trò chuyện nào'
                }
              </p>
            </div>
          ) : (
            filteredRooms.map(room => (
              <div
                key={room._id}
                className={`room-item ${selectedRoom?._id === room._id ? 'active' : ''} ${room.userType === 'guest' ? 'guest-room' : ''}`}
                onClick={() => handleSelectRoom(room)}
              >
                <div className="room-avatar">
                  {getAvatar(room)}
                  {room.userType === 'guest' && (
                    <span className="guest-badge">👤</span>
                  )}
                </div>
                <div className="room-info">
                  <div className="room-header">
                    <span className="room-name">
                      {getDisplayName(room)}
                    </span>
                    <span className="room-time">{formatTime(room.lastMessageTime)}</span>
                  </div>
                  <div className="room-preview">
                    <span className="room-subtitle">{getSubtitle(room)}</span>
                  </div>
                  <div className="room-preview">
                    <span className="room-message">{room.lastMessage || 'Bắt đầu trò chuyện'}</span>
                    {room.unreadCount > 0 && (
                      <span className="unread-badge">{room.unreadCount}</span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="chat-main-area">
        {selectedRoom ? (
          <>
            <div className="chat-area-header">
              <div className="user-info">
                <div className="user-avatar">
                  {getAvatar(selectedRoom)}
                  {selectedRoom.userType === 'guest' && (
                    <span className="guest-badge-header">👤</span>
                  )}
                </div>
                <div className="user-details">
                  <h4>{getDisplayName(selectedRoom)}</h4>
                  <p>{getSubtitle(selectedRoom)}</p>
                  {selectedRoom.user?.phone && (
                    <p className="user-phone">📞 {selectedRoom.user.phone}</p>
                  )}
                </div>
              </div>
              <div className="chat-actions">
                {/* Message Search */}
                <div className={`message-search-wrapper ${isSearchExpanded ? 'expanded' : ''}`}>
                  {isSearchExpanded && (
                    <input
                      ref={searchInputRef}
                      type="text"
                      placeholder="Tìm trong đoạn chat..."
                      value={messageSearchQuery}
                      onChange={(e) => setMessageSearchQuery(e.target.value)}
                      className="message-search-input"
                    />
                  )}
                  <button 
                    className="action-btn search-btn"
                    onClick={handleToggleSearch}
                    title={isSearchExpanded ? "Đóng tìm kiếm" : "Tìm kiếm tin nhắn"}
                  >
                    {isSearchExpanded ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8"/>
                        <path d="m21 21-4.35-4.35"/>
                      </svg>
                    )}
                  </button>
                </div>
                
                {selectedRoom.user?.phone && (
                  <a 
                    href={`tel:${selectedRoom.user.phone}`}
                    className="action-btn"
                    title="Gọi điện"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                    </svg>
                  </a>
                )}
              </div>
            </div>

            <div className="messages-container">
              {messageSearchQuery && (
                <div className="search-result-banner">
                  Tìm thấy <strong>{filteredMessages.length}</strong> tin nhắn
                </div>
              )}
              
              {filteredMessages.map(msg => (
                <div
                  key={msg._id}
                  className={`message-item ${msg.sender === 'admin' ? 'sent' : 'received'}`}
                >
                  {msg.sender !== 'admin' && (
                    <div className="message-avatar">
                      {msg.sender === 'bot' ? '🤖' : msg.senderName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="message-bubble">
                    {msg.sender === 'bot' && (
                      <div className="bot-badge">🤖 Bot Tự Động</div>
                    )}
                    <p style={{ whiteSpace: 'pre-line' }}>{msg.content}</p>
                    <span className="msg-time">{new Date(msg.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="typing-indicator-wrapper">
                  <div className="message-avatar">
                    {getAvatar(selectedRoom)}
                  </div>
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            <div className="quick-replies">
              <button onClick={() => setNewMessage('Chào bạn! Tôi có thể giúp gì cho bạn?')}>
                👋 Chào hỏi
              </button>
              <button onClick={() => setNewMessage('Vui lòng cho tôi số điện thoại để tư vấn chi tiết hơn')}>
                📞 Xin SĐT
              </button>
              <button onClick={() => setNewMessage('Cảm ơn bạn đã liên hệ! Chúng tôi sẽ phản hồi sớm nhất.')}>
                🙏 Cảm ơn
              </button>
            </div>

            <form className="message-input-area" onSubmit={handleSendMessage}>
              <input
                type="text"
                placeholder="Nhập tin nhắn..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                disabled={!isConnected}
              />
              <button type="submit" disabled={!newMessage.trim() || !isConnected}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                </svg>
              </button>
            </form>
          </>
        ) : (
          <div className="empty-chat">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <h3>Chọn một cuộc trò chuyện</h3>
            <p>Chọn một khách hàng từ danh sách bên trái để bắt đầu</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerReply;