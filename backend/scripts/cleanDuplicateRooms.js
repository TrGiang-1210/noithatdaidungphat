// backend/scripts/cleanDuplicateRooms.js
// Chạy script này 1 lần để xóa duplicate rooms trong database

const mongoose = require('mongoose');
require('dotenv').config();

const ChatRoom = require('../models/ChatRoom');

async function cleanDuplicateRooms() {
  try {
    // Kết nối database
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/noithatdaidungphat');
    console.log('✅ Connected to MongoDB');

    // Tìm tất cả rooms
    const allRooms = await ChatRoom.find({});
    console.log(`📊 Total rooms found: ${allRooms.length}`);

    // Group by userId
    const roomsByUserId = {};
    allRooms.forEach(room => {
      if (!roomsByUserId[room.userId]) {
        roomsByUserId[room.userId] = [];
      }
      roomsByUserId[room.userId].push(room);
    });

    // Tìm duplicates
    let duplicateCount = 0;
    for (const userId in roomsByUserId) {
      const rooms = roomsByUserId[userId];
      if (rooms.length > 1) {
        console.log(`\n🔍 Found ${rooms.length} rooms for userId: ${userId}`);
        
        // Giữ lại room có nhiều tin nhắn nhất hoặc room mới nhất
        const Message = require('../models/Message');
        const roomsWithMessageCount = await Promise.all(
          rooms.map(async (room) => {
            const messageCount = await Message.countDocuments({ roomId: room._id });
            return { room, messageCount };
          })
        );

        // Sort: Room có nhiều message nhất, hoặc room mới nhất
        roomsWithMessageCount.sort((a, b) => {
          if (b.messageCount !== a.messageCount) {
            return b.messageCount - a.messageCount; // Nhiều message hơn
          }
          return new Date(b.room.createdAt) - new Date(a.room.createdAt); // Mới hơn
        });

        const keepRoom = roomsWithMessageCount[0].room;
        const deleteRooms = roomsWithMessageCount.slice(1).map(r => r.room);

        console.log(`  ✅ Keeping room: ${keepRoom._id} (${roomsWithMessageCount[0].messageCount} messages)`);
        
        for (const deleteRoom of deleteRooms) {
          console.log(`  ❌ Deleting room: ${deleteRoom._id}`);
          await ChatRoom.findByIdAndDelete(deleteRoom._id);
          duplicateCount++;
        }
      }
    }

    console.log(`\n✅ Cleanup completed!`);
    console.log(`📊 Removed ${duplicateCount} duplicate rooms`);
    console.log(`📊 Total rooms now: ${Object.keys(roomsByUserId).length}`);

    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error);
    mongoose.connection.close();
  }
}

cleanDuplicateRooms();