// backend/scripts/chatSocket.js - FIXED: Sửa lỗi Guest ID query
const Message = require('../models/Message');
const ChatRoom = require('../models/ChatRoom');
const User = require('../models/User');
const { handleUserMessage } = require('../services/chatbotService');
const { getOrCreateChatRoom } = require('../services/authHandler');
const mongoose = require('mongoose');

module.exports = (io) => {
  const activeSessions = new Map(); // identifier (userId/guestId) -> { socketId, roomId, userName, type }
  const activeAdmins = new Set();
  const socketToIdentifier = new Map(); // socketId -> identifier

  io.on('connection', (socket) => {
    console.log('🔌 User connected:', socket.id);

    // ✅ USER/GUEST JOIN - FIXED
    socket.on('user:join', async (data) => {
      try {
        console.log('👤 User/Guest joining:', data);
        
        // ✅ XÁC ĐỊNH IDENTIFIER - FIXED: Kiểm tra ObjectId hợp lệ
        let identifier;
        let isGuest;
        
        // Nếu có userId VÀ là ObjectId hợp lệ → registered user
        if (data.userId && mongoose.Types.ObjectId.isValid(data.userId)) {
          identifier = data.userId;
          isGuest = false;
        } 
        // Nếu có guestId hoặc userId không hợp lệ → guest
        else {
          identifier = data.guestId || data.userId || `guest_${socket.id}`;
          isGuest = true;
        }
        
        const sessionType = isGuest ? 'guest' : 'registered';
        
        console.log('🔍 Session type:', sessionType, '| Identifier:', identifier);
        
        // ✅ KIỂM TRA SESSION CŨ
        const existingSession = activeSessions.get(identifier);
        if (existingSession && existingSession.socketId !== socket.id) {
          console.log('⚠️ Replacing old session');
          const oldSocket = io.sockets.sockets.get(existingSession.socketId);
          if (oldSocket) {
            oldSocket.emit('session:replaced', { 
              message: 'Bạn đã đăng nhập từ thiết bị khác' 
            });
            oldSocket.disconnect(true);
          }
          socketToIdentifier.delete(existingSession.socketId);
        }

        // ✅ TÌM ROOM CŨ - FIXED: Query đúng field
        let query;
        if (isGuest) {
          query = { guestId: identifier, status: 'active' };
        } else {
          query = { user: identifier, status: 'active' };
        }
        
        console.log('🔍 Query:', query);
        
        const room = await ChatRoom.findOne(query).populate('user', 'name email phone');
        
        if (room) {
          console.log('📂 Existing room found:', room._id);
          
          // Cập nhật thông tin room
          room.userName = data.userName || room.userName;
          room.userEmail = data.userEmail || room.userEmail;
          room.lastActiveAt = new Date();
          await room.save();

          // Lưu session
          activeSessions.set(identifier, {
            socketId: socket.id,
            roomId: room._id.toString(),
            userName: room.userName,
            userEmail: room.userEmail,
            type: sessionType,
            userId: isGuest ? null : identifier,
            guestId: isGuest ? identifier : null
          });
          socketToIdentifier.set(socket.id, identifier);

          // Join rooms
          socket.join(`session_${identifier}`);
          socket.join(`room_${room._id}`);

          // Gửi lịch sử chat
          const messages = await Message.find({ roomId: room._id })
            .sort({ timestamp: 1 })
            .limit(100);

          console.log('📜 Sending chat history:', messages.length, 'messages');
          socket.emit('chat:history', { room, messages });

        } else {
          console.log('👋 New session, no room yet. Waiting for first message.');
          
          // Lưu session (chưa có roomId)
          activeSessions.set(identifier, {
            socketId: socket.id,
            roomId: null,
            userName: data.userName || (isGuest ? 'Khách' : 'User'),
            userEmail: data.userEmail,
            type: sessionType,
            userId: isGuest ? null : identifier,
            guestId: isGuest ? identifier : null
          });
          socketToIdentifier.set(socket.id, identifier);

          // Join session room
          socket.join(`session_${identifier}`);

          // Gửi empty history
          socket.emit('chat:history', { room: null, messages: [] });
        }

        console.log('✅ Session established:', {
          identifier,
          type: sessionType,
          socketId: socket.id,
          roomId: room?._id || 'pending'
        });

      } catch (error) {
        console.error('❌ Error in user:join:', error);
        socket.emit('error', { message: 'Không thể kết nối chat' });
      }
    });

    // ✅ ADMIN JOIN
    socket.on('admin:join', async () => {
      try {
        activeAdmins.add(socket.id);
        socket.join('admin_room');

        // ✅ LẤY ROOMS với thông tin user đầy đủ
        const rooms = await ChatRoom.find({ status: 'active' })
          .populate('user', 'name email phone')
          .sort({ lastMessageTime: -1 });
        
        // ✅ Format tên hiển thị cho admin
        const formattedRooms = rooms.map(room => ({
          ...room.toObject(),
          displayName: room.userType === 'registered' 
            ? (room.user?.name || room.userName)
            : `Khách ${room.guestId?.substring(0, 8) || ''}`
        }));
        
        socket.emit('rooms:list', formattedRooms);
        
        console.log('👨‍💼 Admin joined:', socket.id, '| Rooms:', rooms.length);
      } catch (error) {
        console.error('❌ Error in admin:join:', error);
      }
    });

    // ✅ ADMIN JOIN ROOM
    socket.on('admin:join_room', async (roomId) => {
      try {
        socket.join(`room_${roomId}`);
        
        const room = await ChatRoom.findById(roomId).populate('user', 'name email phone');
        const messages = await Message.find({ roomId })
          .sort({ timestamp: 1 })
          .limit(100);
        
        socket.emit('chat:history', { room, messages });

        await Message.updateMany(
          { roomId, sender: 'user', read: false },
          { read: true }
        );
        
        await ChatRoom.findByIdAndUpdate(roomId, { unreadCount: 0 });
        
        console.log('👨‍💼 Admin joined room:', roomId);
      } catch (error) {
        console.error('❌ Error in admin:join_room:', error);
      }
    });

    // ✅ SEND MESSAGE - FIXED
    socket.on('message:send', async (data) => {
      try {
        console.log('💬 Message received:', {
          sender: data.sender,
          hasRoomId: !!data.roomId,
          content: data.content?.substring(0, 50)
        });
        
        // ✅ XÁC THỰC SENDER
        if (data.sender === 'user') {
          const identifier = socketToIdentifier.get(socket.id);
          
          if (!identifier) {
            console.error('❌ No identifier for socket:', socket.id);
            socket.emit('error', { message: 'Session không hợp lệ' });
            return;
          }

          const session = activeSessions.get(identifier);
          if (!session || session.socketId !== socket.id) {
            console.error('❌ Session mismatch');
            socket.emit('error', { message: 'Session đã hết hạn' });
            return;
          }

          // ✅ NẾU CHƯA CÓ ROOM → TẠO MỚI - FIXED: Dùng userId/guestId từ session
          if (!session.roomId) {
            console.log('🆕 First message, creating room for:', identifier);
            
            const { room, isNew } = await getOrCreateChatRoom({
              userId: session.userId, // null nếu guest
              guestId: session.guestId, // null nếu registered
              userName: session.userName,
              userEmail: session.userEmail
            });

            // Cập nhật session
            session.roomId = room._id.toString();
            activeSessions.set(identifier, session);

            // Join room
            socket.join(`room_${room._id}`);

            // Gửi room ID
            socket.emit('room:created', { roomId: room._id.toString() });

            // Thông báo admin nếu room mới
            if (isNew) {
              const roomWithUser = await ChatRoom.findById(room._id).populate('user', 'name email phone');
              const displayName = roomWithUser.userType === 'registered'
                ? (roomWithUser.user?.name || roomWithUser.userName)
                : `Khách ${roomWithUser.guestId?.substring(0, 8) || ''}`;
              
              io.to('admin_room').emit('room:new', {
                ...roomWithUser.toObject(),
                displayName
              });
            }

            data.roomId = room._id.toString();
            console.log('✅ Room created:', room._id);
          } else {
            // Đã có room → validate
            if (data.roomId && session.roomId !== data.roomId) {
              console.error('❌ User trying wrong room');
              socket.emit('error', { message: 'Không có quyền truy cập' });
              return;
            }
            
            data.roomId = data.roomId || session.roomId;
          }
        }

        // ✅ VALIDATE ROOM ID
        if (!data.roomId) {
          console.error('❌ No roomId in message data');
          socket.emit('error', { message: 'Thiếu roomId' });
          return;
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

        // ✅ CẬP NHẬT ROOM
        await ChatRoom.findByIdAndUpdate(data.roomId, {
          lastMessage: data.content,
          lastMessageTime: new Date(),
          lastActiveAt: new Date(),
          $inc: data.sender === 'user' ? { unreadCount: 1 } : {}
        });

        // ✅ BROADCAST MESSAGE
        io.to(`room_${data.roomId}`).emit('message:new', message);
        console.log('📤 Message sent to room:', data.roomId);
        
        // ✅ USER MESSAGE → NOTIFY ADMIN + BOT
        if (data.sender === 'user') {
          io.to('admin_room').emit('message:user_new', { 
            roomId: data.roomId, 
            message 
          });
          
          // 🤖 BOT RESPONSE
          const botResponse = await handleUserMessage(
            data.content, 
            data.roomId, 
            activeAdmins
          );
          
          if (botResponse) {
            console.log('🤖 Bot responding...');
            
            await new Promise(resolve => setTimeout(resolve, 1000));
            
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
            
            io.to(`room_${data.roomId}`).emit('message:new', botMessage);
            io.to('admin_room').emit('message:user_new', { 
              roomId: data.roomId, 
              message: botMessage 
            });
            
            console.log('🤖 Bot response sent');
          }
        }
      } catch (error) {
        console.error('❌ Error in message:send:', error);
        socket.emit('error', { message: 'Không thể gửi tin nhắn' });
      }
    });

    // ✅ TYPING INDICATOR
    socket.on('typing:start', (data) => {
      if (!data.roomId) return;
      socket.to(`room_${data.roomId}`).emit('typing:status', {
        isTyping: true,
        userName: data.userName
      });
    });

    socket.on('typing:stop', (data) => {
      if (!data.roomId) return;
      socket.to(`room_${data.roomId}`).emit('typing:status', {
        isTyping: false
      });
    });

    // ✅ USER LOGOUT
    socket.on('user:logout', async () => {
      const identifier = socketToIdentifier.get(socket.id);
      if (identifier) {
        console.log('🔓 User logout:', identifier);
        
        const session = activeSessions.get(identifier);
        if (session && session.roomId) {
          await ChatRoom.findByIdAndUpdate(session.roomId, {
            lastActiveAt: new Date()
          }).catch(err => console.error('Error updating room:', err));
        }
        
        activeSessions.delete(identifier);
        socketToIdentifier.delete(socket.id);
        
        socket.emit('logout:success');
        socket.disconnect(true);
      }
    });

    // ✅ DISCONNECT
    socket.on('disconnect', () => {
      console.log('🔌 User disconnected:', socket.id);
      
      const identifier = socketToIdentifier.get(socket.id);
      if (identifier) {
        const session = activeSessions.get(identifier);
        if (session && session.socketId === socket.id) {
          activeSessions.delete(identifier);
          console.log('🗑️ Cleaned up session:', identifier);
        }
        socketToIdentifier.delete(socket.id);
      }
      
      if (activeAdmins.has(socket.id)) {
        activeAdmins.delete(socket.id);
        console.log('👨‍💼 Admin disconnected');
      }
    });

    // ✅ DEBUG (development only)
    socket.on('debug:get_session', () => {
      const identifier = socketToIdentifier.get(socket.id);
      const session = identifier ? activeSessions.get(identifier) : null;
      socket.emit('debug:session_info', {
        socketId: socket.id,
        identifier,
        session,
        totalSessions: activeSessions.size,
        totalAdmins: activeAdmins.size
      });
    });
  });

  // ✅ PERIODIC CLEANUP
  setInterval(() => {
    console.log('🧹 Active sessions:', activeSessions.size, '| Admins:', activeAdmins.size);
  }, 30 * 60 * 1000);
};