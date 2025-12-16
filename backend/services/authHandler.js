// backend/services/authHandler.js - FULL FIX với User/Guest Logic
const ChatRoom = require('../models/ChatRoom');
const Message = require('../models/Message');
const User = require('../models/User');

/**
 * ✅ XỬ LÝ KHI USER ĐĂNG KÝ - CHỈ LOG, KHÔNG TẠO ROOM
 */
async function handleUserRegistration(userData) {
  try {
    const { userId, userName, userEmail } = userData;
    
    console.log('📝 New user registration:', userId);
    console.log('💬 Chat room will be created when user sends first message');
    
    return {
      success: true,
      message: 'User registered successfully. Chat available.'
    };
  } catch (error) {
    console.error('❌ Error in handleUserRegistration:', error);
    throw error;
  }
}

/**
 * ✅ XỬ LÝ KHI USER LOGIN - TÌM ROOM CŨ (cả guest room để convert)
 */
async function handleUserLogin(userData) {
  try {
    const { userId, userName, userEmail, guestId } = userData;
    
    console.log('🔐 User login:', userId);
    
    // ✅ TÌM ROOM CỦA USER (registered)
    let room = await ChatRoom.findOne({ 
      user: userId, 
      status: 'active' 
    });
    
    if (room) {
      // Có room cũ → cập nhật thông tin
      room.userName = userName;
      room.userEmail = userEmail || room.userEmail;
      room.lastActiveAt = new Date();
      await room.save();
      
      console.log('♻️ Existing user room found:', room._id);
      
      return {
        success: true,
        roomId: room._id,
        hasExistingRoom: true,
        message: 'Chat session ready'
      };
    }
    
    // ✅ KIỂM TRA GUEST ROOM (nếu user vừa đăng ký từ guest)
    if (guestId) {
      const guestRoom = await ChatRoom.findOne({
        guestId: guestId,
        status: 'active'
      });
      
      if (guestRoom) {
        console.log('🔄 Converting guest room to user room:', guestRoom._id);
        
        // Convert guest room thành user room
        await guestRoom.convertToRegisteredUser(userId, userName, userEmail);
        
        return {
          success: true,
          roomId: guestRoom._id,
          hasExistingRoom: true,
          convertedFromGuest: true,
          message: 'Guest chat converted to user account'
        };
      }
    }
    
    // ❌ KHÔNG CÓ ROOM → CHỜ TIN NHẮN ĐẦU TIÊN
    console.log('👋 New user, no existing room. Will create on first message.');
    
    return {
      success: true,
      roomId: null,
      hasExistingRoom: false,
      message: 'No chat history. Room will be created on first message.'
    };
  } catch (error) {
    console.error('❌ Error in handleUserLogin:', error);
    throw error;
  }
}

/**
 * ✅ XỬ LÝ KHI USER LOGOUT
 */
async function handleUserLogout(userId, options = {}) {
  try {
    const { closeRoom = false } = options;
    
    console.log('🔓 User logout:', userId);
    
    const room = await ChatRoom.findOne({ user: userId, status: 'active' });
    
    if (!room) {
      console.log('⚠️ No active room found for user:', userId);
      return {
        success: true,
        message: 'No active session to close'
      };
    }
    
    if (closeRoom) {
      room.status = 'closed';
      await room.save();
      console.log('✅ Room closed for user:', userId);
    } else {
      room.lastActiveAt = new Date();
      await room.save();
      console.log('✅ Room marked as inactive for user:', userId);
    }
    
    return {
      success: true,
      message: 'Session logged out'
    };
  } catch (error) {
    console.error('❌ Error in handleUserLogout:', error);
    throw error;
  }
}

/**
 * ✅ XỬ LÝ KHI ĐỔI USER
 */
async function handleUserSwitch(oldUserId, newUserData) {
  try {
    console.log('🔄 User switch:', { oldUserId, newUserId: newUserData.userId });
    
    // Đóng session cũ
    if (oldUserId) {
      await handleUserLogout(oldUserId, { closeRoom: false });
    }
    
    // Login user mới
    const result = await handleUserLogin(newUserData);
    
    console.log('✅ User switch completed');
    
    return {
      success: true,
      ...result,
      message: 'Switched to new account'
    };
  } catch (error) {
    console.error('❌ Error in handleUserSwitch:', error);
    throw error;
  }
}

/**
 * ✅ VERIFY SESSION (User hoặc Guest)
 */
async function verifyUserSession(identifier, roomId) {
  try {
    const isGuest = typeof identifier === 'string' && !identifier.match(/^[0-9a-fA-F]{24}$/);
    
    const query = {
      _id: roomId,
      status: 'active'
    };
    
    if (isGuest) {
      query.guestId = identifier;
    } else {
      query.user = identifier;
    }
    
    const room = await ChatRoom.findOne(query).populate('user', 'name email');
    
    if (!room) {
      console.error('❌ Invalid session:', { identifier, roomId });
      return {
        valid: false,
        message: 'Session không hợp lệ hoặc đã hết hạn'
      };
    }
    
    room.lastActiveAt = new Date();
    await room.save();
    
    return {
      valid: true,
      room
    };
  } catch (error) {
    console.error('❌ Error in verifyUserSession:', error);
    return {
      valid: false,
      message: 'Lỗi xác thực session'
    };
  }
}

/**
 * ✅ CLEANUP TASK
 */
async function runSessionCleanup() {
  try {
    console.log('🧹 Running session cleanup...');
    
    await ChatRoom.cleanupInactiveRooms();
    
    // Cleanup duplicate rooms cho registered users
    const duplicateUsers = await ChatRoom.aggregate([
      { $match: { status: 'active', userType: 'registered' } },
      { $group: { 
        _id: '$user', 
        count: { $sum: 1 },
        rooms: { $push: '$_id' }
      }},
      { $match: { count: { $gt: 1 } } }
    ]);
    
    for (const user of duplicateUsers) {
      await ChatRoom.ensureSingleActiveRoom(user._id);
    }
    
    // Cleanup duplicate rooms cho guests
    const duplicateGuests = await ChatRoom.aggregate([
      { $match: { status: 'active', userType: 'guest' } },
      { $group: { 
        _id: '$guestId', 
        count: { $sum: 1 },
        rooms: { $push: '$_id' }
      }},
      { $match: { count: { $gt: 1 } } }
    ]);
    
    for (const guest of duplicateGuests) {
      await ChatRoom.ensureSingleActiveRoom(guest._id);
    }
    
    console.log('✅ Session cleanup completed');
  } catch (error) {
    console.error('❌ Error in runSessionCleanup:', error);
  }
}

/**
 * ✅ GET OR CREATE ROOM - Dùng khi user/guest gửi tin nhắn đầu tiên
 * Đây là HÀM DUY NHẤT được phép tạo room mới
 */
async function getOrCreateChatRoom(userData) {
  try {
    const { userId, userName, userEmail, guestId } = userData;
    
    let room;
    let isNew = false;
    
    // ✅ USER ĐÃ LOGIN
    if (userId) {
      // Tìm room của user
      room = await ChatRoom.findOne({ 
        user: userId, 
        status: 'active' 
      }).populate('user', 'name email phone');
      
      if (room) {
        // Cập nhật thông tin
        room.userName = userName;
        room.userEmail = userEmail || room.userEmail;
        room.lastActiveAt = new Date();
        await room.save();
        
        console.log('♻️ Using existing user room:', room._id);
      } else {
        // Tạo room mới cho user
        const user = await User.findById(userId);
        
        room = await ChatRoom.create({
          user: userId,
          userName: user?.name || userName,
          userEmail: user?.email || userEmail,
          userType: 'registered',
          status: 'active',
          lastActiveAt: new Date()
        });
        
        isNew = true;
        console.log('🆕 Created new user room:', room._id);
      }
    } 
    // ✅ GUEST (CHƯA LOGIN)
    else if (guestId) {
      // Tìm room của guest
      room = await ChatRoom.findOne({ 
        guestId: guestId, 
        status: 'active' 
      });
      
      if (room) {
        // Cập nhật thông tin
        room.userName = userName || 'Khách';
        room.userEmail = userEmail || room.userEmail;
        room.lastActiveAt = new Date();
        await room.save();
        
        console.log('♻️ Using existing guest room:', room._id);
      } else {
        // Tạo room mới cho guest
        room = await ChatRoom.create({
          guestId: guestId,
          userName: userName || 'Khách',
          userEmail: userEmail,
          userType: 'guest',
          status: 'active',
          lastActiveAt: new Date()
        });
        
        isNew = true;
        console.log('🆕 Created new guest room:', room._id);
      }
    } else {
      throw new Error('Missing userId or guestId');
    }
    
    return { room, isNew };
    
  } catch (error) {
    console.error('❌ Error in getOrCreateChatRoom:', error);
    throw error;
  }
}

module.exports = {
  handleUserRegistration,
  handleUserLogin,
  handleUserLogout,
  handleUserSwitch,
  verifyUserSession,
  runSessionCleanup,
  getOrCreateChatRoom
};