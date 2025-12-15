const ChatRoom = require('../models/ChatRoom');
const Message = require('../models/Message');

/**
 * ✅ XỬ LÝ KHI USER ĐĂNG KÝ
 */
async function handleUserRegistration(userData) {
  try {
    const { userId, userName, userEmail } = userData;
    
    console.log('📝 New user registration:', userId);
    
    const room = await ChatRoom.create({
      userId,
      userName,
      userEmail,
      status: 'active',
      lastActiveAt: new Date()
    });
    
    await Message.create({
      roomId: room._id,
      sender: 'bot',
      senderName: '🤖 Bot Tư Vấn',
      content: `Xin chào ${userName}! 👋\n\nChào mừng bạn đến với Nội Thất Đại Dũng Phát.\nEm có thể giúp gì cho bạn hôm nay?`,
      timestamp: new Date()
    });
    
    console.log('✅ New room created for registered user:', room._id);
    
    return {
      success: true,
      roomId: room._id,
      message: 'Chat session mới đã được tạo'
    };
  } catch (error) {
    console.error('❌ Error in handleUserRegistration:', error);
    throw error;
  }
}

/**
 * ✅ XỬ LÝ KHI USER LOGIN
 */
async function handleUserLogin(userData) {
  try {
    const { userId, userName, userEmail } = userData;
    
    console.log('🔐 User login:', userId);
    
    let room = await ChatRoom.findOne({ userId });
    
    if (!room) {
      room = await ChatRoom.create({
        userId,
        userName,
        userEmail,
        status: 'active',
        lastActiveAt: new Date()
      });
      
      await Message.create({
        roomId: room._id,
        sender: 'bot',
        senderName: '🤖 Bot Tư Vấn',
        content: `Xin chào ${userName}! 👋\n\nChào mừng bạn quay lại với Nội Thất Đại Dũng Phát.\nEm có thể giúp gì cho bạn?`,
        timestamp: new Date()
      });
      
      console.log('✅ New room created for login:', room._id);
    } else {
      room.status = 'active';
      room.userName = userName;
      room.userEmail = userEmail || room.userEmail;
      room.lastActiveAt = new Date();
      await room.save();
      
      console.log('♻️ Existing room reactivated:', room._id);
    }
    
    await ChatRoom.ensureSingleActiveRoom(userId);
    
    return {
      success: true,
      roomId: room._id,
      isNewRoom: !room,
      message: 'Chat session đã sẵn sàng'
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
    
    const room = await ChatRoom.findOne({ userId, status: 'active' });
    
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
      message: 'Session đã được đóng'
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
    
    if (oldUserId) {
      await handleUserLogout(oldUserId, { closeRoom: false });
    }
    
    const result = await handleUserLogin(newUserData);
    
    console.log('✅ User switch completed');
    
    return {
      success: true,
      ...result,
      message: 'Đã chuyển sang tài khoản mới'
    };
  } catch (error) {
    console.error('❌ Error in handleUserSwitch:', error);
    throw error;
  }
}

/**
 * ✅ VERIFY SESSION
 */
async function verifyUserSession(userId, roomId) {
  try {
    const room = await ChatRoom.findOne({ 
      _id: roomId,
      userId: userId,
      status: 'active'
    });
    
    if (!room) {
      console.error('❌ Invalid session:', { userId, roomId });
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
    
    const duplicateUsers = await ChatRoom.aggregate([
      { $match: { status: 'active' } },
      { $group: { 
        _id: '$userId', 
        count: { $sum: 1 },
        rooms: { $push: '$_id' }
      }},
      { $match: { count: { $gt: 1 } } }
    ]);
    
    for (const user of duplicateUsers) {
      await ChatRoom.ensureSingleActiveRoom(user._id);
    }
    
    console.log('✅ Session cleanup completed');
  } catch (error) {
    console.error('❌ Error in runSessionCleanup:', error);
  }
}

module.exports = {
  handleUserRegistration,
  handleUserLogin,
  handleUserLogout,
  handleUserSwitch,
  verifyUserSession,
  runSessionCleanup
};