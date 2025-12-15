// backend/scripts/chatSocket.js
const Message = require('../models/Message');
const ChatRoom = require('../models/ChatRoom');
const { handleUserMessage } = require('../services/chatbotService');

module.exports = (io) => {
  const activeUsers = new Map(); // userId -> { socketId, roomId }
  const activeAdmins = new Set(); // Set of admin socketIds
  const socketToUser = new Map(); // socketId -> userId (để cleanup)

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // User joins chat
    socket.on('user:join', async (data) => {
      try {
        console.log('👤 User joining:', data);
        
        // ✅ KIỂM TRA: Nếu user này đang active ở socket khác → disconnect socket cũ
        const existingSession = activeUsers.get(data.userId);
        if (existingSession && existingSession.socketId !== socket.id) {
          console.log('⚠️ User already connected from another socket, disconnecting old session');
          const oldSocket = io.sockets.sockets.get(existingSession.socketId);
          if (oldSocket) {
            oldSocket.emit('session:replaced', { 
              message: 'Bạn đã đăng nhập từ thiết bị khác' 
            });
            oldSocket.disconnect(true);
          }
          // Cleanup old session
          socketToUser.delete(existingSession.socketId);
        }

        // ✅ TÌM HOẶC TẠO ROOM CHO USER NÀY
        let room = await ChatRoom.findOne({ userId: data.userId });
        
        if (!room) {
          // Tạo room mới cho user lần đầu
          room = await ChatRoom.create({
            userId: data.userId,
            userName: data.userName,
            userEmail: data.userEmail,
            status: 'active'
          });
          console.log('🆕 New room created:', room._id);
          io.to('admin_room').emit('room:new', room);
        } else {
          console.log('📂 Existing room found:', room._id);
          // Cập nhật thông tin user (có thể đã thay đổi)
          room.userName = data.userName;
          room.userEmail = data.userEmail || room.userEmail;
          room.status = 'active';
          await room.save();
        }

        // ✅ LƯU SESSION: map userId -> socketId + roomId
        activeUsers.set(data.userId, {
          socketId: socket.id,
          roomId: room._id.toString(),
          userName: data.userName
        });
        socketToUser.set(socket.id, data.userId);

        // ✅ JOIN ROOM: chỉ socket này được vào room của user này
        socket.join(`user_${data.userId}`);
        socket.join(`room_${room._id}`);

        // ✅ GỬI LỊCH SỬ CHAT CỦA USER NÀY
        const messages = await Message.find({ roomId: room._id })
          .sort({ timestamp: 1 })
          .limit(50);

        console.log('📜 Sending chat history, messages:', messages.length);
        socket.emit('chat:history', { room, messages });

        // ✅ LOG SESSION INFO
        console.log('✅ Session established:', {
          userId: data.userId,
          userName: data.userName,
          socketId: socket.id,
          roomId: room._id
        });

      } catch (error) {
        console.error('Error in user:join:', error);
        socket.emit('error', { message: 'Failed to join chat' });
      }
    });

    // Admin joins
    socket.on('admin:join', async () => {
      activeAdmins.add(socket.id);
      socket.join('admin_room');

      try {
        const rooms = await ChatRoom.find({ status: 'active' })
          .sort({ lastMessageTime: -1 });
        socket.emit('rooms:list', rooms);
        
        console.log('👨‍💼 Admin joined:', socket.id, '| Active admins:', activeAdmins.size);
      } catch (error) {
        console.error('Error in admin:join:', error);
      }
    });

    // Admin joins specific room
    socket.on('admin:join_room', async (roomId) => {
      socket.join(`room_${roomId}`);
      
      try {
        const messages = await Message.find({ roomId })
          .sort({ timestamp: 1 })
          .limit(50);
        socket.emit('chat:history', { messages });

        // Mark messages as read
        await Message.updateMany(
          { roomId, sender: 'user', read: false },
          { read: true }
        );
        await ChatRoom.findByIdAndUpdate(roomId, { unreadCount: 0 });
      } catch (error) {
        console.error('Error in admin:join_room:', error);
      }
    });

    // Send message - ✅ BẢO MẬT SESSION
    socket.on('message:send', async (data) => {
      try {
        console.log('💬 Message sending:', data);
        
        // ✅ XÁC THỰC: Nếu là user, kiểm tra socket này có quyền gửi tin cho room này không
        if (data.sender === 'user') {
          const userId = socketToUser.get(socket.id);
          if (!userId) {
            console.error('❌ Unauthorized: No userId for socket', socket.id);
            socket.emit('error', { message: 'Session không hợp lệ' });
            return;
          }

          const userSession = activeUsers.get(userId);
          if (!userSession || userSession.socketId !== socket.id) {
            console.error('❌ Unauthorized: Session mismatch for user', userId);
            socket.emit('error', { message: 'Session đã hết hạn' });
            return;
          }

          // ✅ KIỂM TRA: RoomId có thuộc về userId này không?
          if (userSession.roomId !== data.roomId) {
            console.error('❌ Unauthorized: User trying to send to wrong room', {
              userId,
              userRoomId: userSession.roomId,
              attemptedRoomId: data.roomId
            });
            socket.emit('error', { message: 'Không có quyền truy cập room này' });
            return;
          }
        }

        // ✅ LƯU MESSAGE
        const message = await Message.create({
          roomId: data.roomId,
          sender: data.sender,
          senderName: data.senderName,
          content: data.content,
          timestamp: new Date()
        });

        console.log('✅ Message saved:', message._id);

        // Update room
        await ChatRoom.findByIdAndUpdate(data.roomId, {
          lastMessage: data.content,
          lastMessageTime: new Date(),
          $inc: data.sender === 'user' ? { unreadCount: 1 } : {}
        });

        // ✅ PHÁT MESSAGE: chỉ đến room cụ thể
        io.to(`room_${data.roomId}`).emit('message:new', message);
        console.log('📤 Message broadcasted to room:', data.roomId);
        
        // If user message, notify admins + bot response
        if (data.sender === 'user') {
          io.to('admin_room').emit('message:user_new', { 
            roomId: data.roomId, 
            message 
          });
          console.log('🔔 Admin notified about user message');
          
          // 🤖 BOT AUTO RESPONSE
          const botResponse = await handleUserMessage(
            data.content, 
            data.roomId, 
            activeAdmins
          );
          
          if (botResponse) {
            console.log('🤖 Bot is responding...');
            
            const botMessage = await Message.create({
              roomId: data.roomId,
              sender: 'bot',
              senderName: botResponse.senderName,
              content: botResponse.content,
              timestamp: new Date()
            });
            
            await ChatRoom.findByIdAndUpdate(data.roomId, {
              lastMessage: botResponse.content,
              lastMessageTime: new Date()
            });
            
            // ✅ CHỈ GỬI ĐÉN ROOM CỤ THỂ
            io.to(`room_${data.roomId}`).emit('message:new', botMessage);
            io.to('admin_room').emit('message:user_new', { 
              roomId: data.roomId, 
              message: botMessage 
            });
            
            console.log('🤖 Bot response sent:', botMessage._id);
          }
        }
      } catch (error) {
        console.error('Error in message:send:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Typing indicator - ✅ BẢO MẬT
    socket.on('typing:start', (data) => {
      // Xác thực user có quyền gửi typing indicator cho room này
      if (!data.roomId) return;
      
      const userId = socketToUser.get(socket.id);
      if (userId) {
        const userSession = activeUsers.get(userId);
        if (userSession && userSession.roomId === data.roomId) {
          socket.to(`room_${data.roomId}`).emit('typing:status', {
            isTyping: true,
            userName: data.userName
          });
        }
      } else {
        // Admin có thể gửi typing
        socket.to(`room_${data.roomId}`).emit('typing:status', {
          isTyping: true,
          userName: data.userName
        });
      }
    });

    socket.on('typing:stop', (data) => {
      if (!data.roomId) return;
      socket.to(`room_${data.roomId}`).emit('typing:status', {
        isTyping: false
      });
    });

    // ✅ LOGOUT - Xóa session và không giữ lại chat
    socket.on('user:logout', async () => {
      const userId = socketToUser.get(socket.id);
      if (userId) {
        console.log('🔓 User logging out:', userId);
        
        // Xóa session
        activeUsers.delete(userId);
        socketToUser.delete(socket.id);
        
        socket.emit('logout:success');
        socket.disconnect(true);
      }
    });

    // Disconnect - ✅ CLEANUP SESSION
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
      
      // Xóa user session
      const userId = socketToUser.get(socket.id);
      if (userId) {
        const userSession = activeUsers.get(userId);
        if (userSession && userSession.socketId === socket.id) {
          activeUsers.delete(userId);
          console.log('🗑️ Cleaned up session for user:', userId);
        }
        socketToUser.delete(socket.id);
      }
      
      // Xóa admin
      if (activeAdmins.has(socket.id)) {
        activeAdmins.delete(socket.id);
        console.log('👨‍💼 Admin disconnected, remaining:', activeAdmins.size);
      }
    });

    // ✅ DEBUG ENDPOINT (chỉ dùng trong development)
    socket.on('debug:get_session', () => {
      const userId = socketToUser.get(socket.id);
      const session = userId ? activeUsers.get(userId) : null;
      socket.emit('debug:session_info', {
        socketId: socket.id,
        userId,
        session,
        totalActiveSessions: activeUsers.size
      });
    });
  });

  // ✅ CLEANUP PERIODIC: Xóa các session cũ mỗi 30 phút
  setInterval(() => {
    console.log('🧹 Cleanup check - Active sessions:', activeUsers.size);
  }, 30 * 60 * 1000);
};