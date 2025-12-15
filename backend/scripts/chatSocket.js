// backend/scripts/chatSocket.js
const Message = require('../models/Message');
const ChatRoom = require('../models/ChatRoom');

module.exports = (io) => {
  const activeUsers = new Map(); // userId -> socketId
  const activeAdmins = new Set(); // Set of admin socketIds

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // User joins chat
    socket.on('user:join', async (data) => {
      try {
        console.log('👤 User joining:', data);
        activeUsers.set(data.userId, socket.id);
        socket.join(`user_${data.userId}`);

        // Create or get existing room
        let room = await ChatRoom.findOne({ userId: data.userId });
        if (!room) {
          room = await ChatRoom.create({
            userId: data.userId,
            userName: data.userName,
            userEmail: data.userEmail,
            status: 'active'
          });
          console.log('🆕 New room created:', room._id);
          // Notify all admins about new room
          io.to('admin_room').emit('room:new', room);
        } else {
          console.log('📂 Existing room found:', room._id);
        }

        // Join room for real-time updates
        socket.join(`room_${room._id}`);

        // Get chat history
        const messages = await Message.find({ roomId: room._id })
          .sort({ timestamp: 1 })
          .limit(50);

        console.log('📜 Sending chat history, messages:', messages.length);
        socket.emit('chat:history', { room, messages });
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
        // Send all active rooms to admin
        const rooms = await ChatRoom.find({ status: 'active' })
          .sort({ lastMessageTime: -1 });
        socket.emit('rooms:list', rooms);
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

    // Send message
    socket.on('message:send', async (data) => {
      try {
        console.log('💬 Message sending:', data);
        
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

        // Send to room participants (including sender)
        io.to(`room_${data.roomId}`).emit('message:new', message);
        console.log('📤 Message broadcasted to room:', data.roomId);
        
        // If user message, notify admins
        if (data.sender === 'user') {
          io.to('admin_room').emit('message:user_new', { roomId: data.roomId, message });
          console.log('🔔 Admin notified about user message');
        }
      } catch (error) {
        console.error('Error in message:send:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Typing indicator
    socket.on('typing:start', (data) => {
      socket.to(`room_${data.roomId}`).emit('typing:status', {
        isTyping: true,
        userName: data.userName
      });
    });

    socket.on('typing:stop', (data) => {
      socket.to(`room_${data.roomId}`).emit('typing:status', {
        isTyping: false
      });
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
      
      // Remove from active users
      for (const [userId, socketId] of activeUsers.entries()) {
        if (socketId === socket.id) {
          activeUsers.delete(userId);
          break;
        }
      }
      
      activeAdmins.delete(socket.id);
    });
  });
};