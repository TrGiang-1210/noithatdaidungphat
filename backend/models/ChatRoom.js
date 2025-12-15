const mongoose = require('mongoose');

const chatRoomSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  userName: { type: String, required: true },
  userEmail: String,
  status: { type: String, enum: ['active', 'closed'], default: 'active' },
  lastMessage: String,
  lastMessageTime: Date,
  unreadCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ChatRoom', chatRoomSchema);