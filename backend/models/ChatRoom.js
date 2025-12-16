// backend/models/ChatRoom.js - FIXED VERSION với User Reference
const mongoose = require('mongoose');

const chatRoomSchema = new mongoose.Schema({
  // ✅ Reference đến User model (cho user đã login)
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true
  },
  
  // ✅ Guest ID (cho khách chưa login) - dùng sessionId hoặc socketId
  guestId: {
    type: String,
    default: null,
    index: true
  },
  
  // ✅ Tên hiển thị (lấy từ User.name nếu có, hoặc "Khách" nếu guest)
  userName: { 
    type: String, 
    required: true 
  },
  
  userEmail: String,
  
  // ✅ Type để phân biệt user/guest
  userType: {
    type: String,
    enum: ['registered', 'guest'],
    default: 'guest',
    index: true
  },
  
  status: { 
    type: String, 
    enum: ['active', 'closed'], 
    default: 'active',
    index: true
  },
  
  lastMessage: String,
  lastMessageTime: Date,
  
  lastActiveAt: { 
    type: Date, 
    default: Date.now,
    index: true
  },
  
  unreadCount: { 
    type: Number, 
    default: 0 
  },
  
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// ✅ COMPOUND INDEX: Query rooms by user hoặc guestId + status
chatRoomSchema.index({ user: 1, status: 1 });
chatRoomSchema.index({ guestId: 1, status: 1 });
chatRoomSchema.index({ userType: 1, status: 1 });

// ✅ VIRTUAL: Lấy thông tin user đầy đủ
chatRoomSchema.virtual('userInfo', {
  ref: 'User',
  localField: 'user',
  foreignField: '_id',
  justOne: true
});

// ✅ STATIC METHOD: Đảm bảo chỉ có 1 active room cho mỗi user/guest
chatRoomSchema.statics.ensureSingleActiveRoom = async function(identifier) {
  try {
    const isGuest = typeof identifier === 'string' && !identifier.match(/^[0-9a-fA-F]{24}$/);
    
    const query = isGuest 
      ? { guestId: identifier, status: 'active' }
      : { user: identifier, status: 'active' };
    
    const activeRooms = await this.find(query).sort({ lastActiveAt: -1 });
    
    if (activeRooms.length > 1) {
      console.log(`⚠️ Found ${activeRooms.length} active rooms for ${isGuest ? 'guest' : 'user'} ${identifier}`);
      
      const [keepRoom, ...oldRooms] = activeRooms;
      
      for (const room of oldRooms) {
        room.status = 'closed';
        await room.save();
      }
      
      console.log(`✅ Cleaned up ${oldRooms.length} duplicate rooms`);
      return keepRoom;
    }
    
    return activeRooms[0] || null;
  } catch (error) {
    console.error('❌ Error in ensureSingleActiveRoom:', error);
    throw error;
  }
};

// ✅ STATIC METHOD: Cleanup inactive rooms
chatRoomSchema.statics.cleanupInactiveRooms = async function() {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const result = await this.updateMany(
      {
        status: 'active',
        lastActiveAt: { $lt: thirtyDaysAgo }
      },
      {
        status: 'closed'
      }
    );
    
    console.log(`🧹 Cleaned up ${result.modifiedCount} inactive rooms`);
    return result;
  } catch (error) {
    console.error('❌ Error in cleanupInactiveRooms:', error);
    throw error;
  }
};

// ✅ INSTANCE METHOD: Update last active time
chatRoomSchema.methods.updateActivity = async function() {
  this.lastActiveAt = new Date();
  return this.save();
};

// ✅ INSTANCE METHOD: Convert guest to registered user
chatRoomSchema.methods.convertToRegisteredUser = async function(userId, userName, userEmail) {
  this.user = userId;
  this.guestId = null;
  this.userType = 'registered';
  this.userName = userName;
  this.userEmail = userEmail;
  return this.save();
};

// ✅ PRE-SAVE: Auto set userType
chatRoomSchema.pre('save', function(next) {
  if (this.user) {
    this.userType = 'registered';
  } else if (this.guestId) {
    this.userType = 'guest';
  }
  next();
});

module.exports = mongoose.model('ChatRoom', chatRoomSchema);