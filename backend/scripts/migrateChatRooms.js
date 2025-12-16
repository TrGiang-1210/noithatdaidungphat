const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const ChatRoom = require('../models/ChatRoom');
const User = require('../models/User');

async function migrateChatRooms() {
  try {
    console.log('🚀 Starting ChatRoom migration...');
    
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to database');
    
    // Lấy tất cả rooms cũ
    const oldRooms = await ChatRoom.find();
    console.log(`📊 Found ${oldRooms.length} rooms to migrate`);
    
    let migrated = 0;
    let failed = 0;
    let skipped = 0;
    
    for (const room of oldRooms) {
      try {
        // ✅ TRƯỜNG HỢP 1: Room đã có user (ObjectId) → skip
        if (room.user && mongoose.Types.ObjectId.isValid(room.user)) {
          console.log(`⏭️  Skipping room ${room._id} - already migrated`);
          skipped++;
          continue;
        }
        
        // ✅ TRƯỜNG HỢP 2: Room có userId cũ (String)
        if (room.userId) {
          // Tìm user theo ID
          const user = await User.findById(room.userId);
          
          if (user) {
            // Migrate sang user (ObjectId)
            room.user = user._id;
            room.userName = user.name;
            room.userEmail = user.email;
            room.userType = 'registered';
            room.guestId = null; // Clear guestId nếu có
            
            await room.save();
            console.log(`✅ Migrated room ${room._id} for user ${user.name}`);
            migrated++;
          } else {
            // User không tồn tại → convert thành guest
            console.log(`⚠️  User ${room.userId} not found, converting to guest`);
            room.guestId = `legacy_${room.userId}`;
            room.user = null;
            room.userType = 'guest';
            room.userName = room.userName || 'Khách';
            
            await room.save();
            console.log(`✅ Converted room ${room._id} to guest`);
            migrated++;
          }
        }
        
        // ✅ TRƯỜNG HỢP 3: Room không có userId → là guest
        else {
          room.guestId = room.guestId || `guest_${room._id}`;
          room.user = null;
          room.userType = 'guest';
          room.userName = room.userName || 'Khách';
          
          await room.save();
          console.log(`✅ Set room ${room._id} as guest`);
          migrated++;
        }
        
      } catch (error) {
        console.error(`❌ Failed to migrate room ${room._id}:`, error.message);
        failed++;
      }
    }
    
    console.log('\n📊 Migration Summary:');
    console.log(`   ✅ Migrated: ${migrated}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`   📝 Total: ${oldRooms.length}`);
    
    // ✅ Cleanup: Đảm bảo mỗi user chỉ có 1 active room
    console.log('\n🧹 Cleaning up duplicate rooms...');
    
    const duplicateUsers = await ChatRoom.aggregate([
      { $match: { status: 'active', userType: 'registered', user: { $ne: null } } },
      { $group: { 
        _id: '$user', 
        count: { $sum: 1 },
        rooms: { $push: '$_id' }
      }},
      { $match: { count: { $gt: 1 } } }
    ]);
    
    for (const dup of duplicateUsers) {
      await ChatRoom.ensureSingleActiveRoom(dup._id);
    }
    
    console.log(`✅ Cleaned up ${duplicateUsers.length} duplicate user rooms`);
    
    const duplicateGuests = await ChatRoom.aggregate([
      { $match: { status: 'active', userType: 'guest', guestId: { $ne: null } } },
      { $group: { 
        _id: '$guestId', 
        count: { $sum: 1 },
        rooms: { $push: '$_id' }
      }},
      { $match: { count: { $gt: 1 } } }
    ]);
    
    for (const dup of duplicateGuests) {
      await ChatRoom.ensureSingleActiveRoom(dup._id);
    }
    
    console.log(`✅ Cleaned up ${duplicateGuests.length} duplicate guest rooms`);
    
    console.log('\n🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Database connection closed');
  }
}

// Run migration
if (require.main === module) {
  migrateChatRooms()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = migrateChatRooms;