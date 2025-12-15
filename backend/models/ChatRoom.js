// backend/models/ChatRoom.js - FIXED VERSION
const mongoose = require('mongoose');

const chatRoomSchema = new mongoose.Schema({
  userId: { 
    type: String, 
    required: true, 
    index: true // ✅ Index cho query nhanh
  },
  userName: { 
    type: String, 
    required: true 
  },
  userEmail: String,
  status: { 
    type: String, 
    enum: ['active', 'closed'], 
    default: 'active',
    index: true // ✅ Index cho query theo status
  },
  lastMessage: String,
  lastMessageTime: Date,
  lastActiveAt: { 
    type: Date, 
    default: Date.now,
    index: true // ✅ Index cho cleanup task
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

// ✅ COMPOUND INDEX: Query rooms by userId + status
chatRoomSchema.index({ userId: 1, status: 1 });

// ✅ STATIC METHOD: Đảm bảo chỉ có 1 active room cho mỗi user
chatRoomSchema.statics.ensureSingleActiveRoom = async function(userId) {
  try {
    const activeRooms = await this.find({ 
      userId, 
      status: 'active' 
    }).sort({ lastActiveAt: -1 });
    
    if (activeRooms.length > 1) {
      console.log(`⚠️ Found ${activeRooms.length} active rooms for user ${userId}, keeping only the latest`);
      
      // Giữ room mới nhất, đóng các room cũ
      const [keepRoom, ...oldRooms] = activeRooms;
      
      for (const room of oldRooms) {
        room.status = 'closed';
        await room.save();
      }
      
      console.log(`✅ Cleaned up ${oldRooms.length} duplicate rooms for user ${userId}`);
      return keepRoom;
    }
    
    return activeRooms[0] || null;
  } catch (error) {
    console.error('❌ Error in ensureSingleActiveRoom:', error);
    throw error;
  }
};

// ✅ STATIC METHOD: Cleanup inactive rooms (rooms không active > 30 ngày)
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

module.exports = mongoose.model('ChatRoom', chatRoomSchema);