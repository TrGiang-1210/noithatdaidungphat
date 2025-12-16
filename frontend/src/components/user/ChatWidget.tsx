import { useState, useEffect, useRef } from 'react';
import { useChatClient } from '/hooks/useChatClient';
import "@/styles/components/user/chatWidget.scss";

interface ChatWidgetProps {
  userId?: string; // ✅ User ID nếu đã login
  userName?: string;
  userEmail?: string;
}

const ChatWidget = ({ userId, userName, userEmail }: ChatWidgetProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // ✅ SỬ DỤNG CUSTOM HOOK
  const {
    isConnected,
    messages,
    roomId,
    isTyping,
    sendMessage,
    startTyping,
    stopTyping,
    isGuest
  } = useChatClient({ userId, userName, userEmail });

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // ✅ LOG SESSION INFO
  useEffect(() => {
    console.log('💬 ChatWidget session:', {
      userId,
      userName,
      isGuest,
      roomId,
      isConnected,
      messageCount: messages.length
    });
  }, [userId, userName, isGuest, roomId, isConnected, messages.length]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;

    console.log('📤 Sending message:', newMessage);
    sendMessage(newMessage);
    setNewMessage('');
    handleTypingStop();
  };

  const handleTypingStart = () => {
    startTyping();
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      handleTypingStop();
    }, 3000);
  };

  const handleTypingStop = () => {
    stopTyping();
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
                <h3>Nội Thất Đại Dũng Phát</h3>
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
                {/* ✅ SESSION INFO */}
                {isGuest && (
                  <p className="session-info">💭 Khách (Chưa đăng nhập)</p>
                )}
                {!isGuest && userName && (
                  <p className="session-info">👤 {userName}</p>
                )}
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
                {isGuest && (
                  <p className="login-hint">
                    💡 <a href="/tai-khoan-ca-nhan">Đăng nhập</a> để lưu lịch sử chat
                  </p>
                )}
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg._id}
                  className={`message ${msg.sender === 'user' ? 'message-user' : 'message-admin'}`}
                >
                  <div className="message-content">
                    {(msg.sender === 'bot' || msg.sender === 'admin') && (
                      <div className="message-sender-name">{msg.senderName}</div>
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

        </div>
      )}
    </div>
  );
};

export default ChatWidget;