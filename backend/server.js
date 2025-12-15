// backend/server.js — CHẠY NGON 100% CHO VITE (port 5173) + SOCKET.IO

const express = require("express");
const http = require("http"); // ← THÊM
const { Server } = require("socket.io"); // ← THÊM
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");
const path = require('path');
const routes = require('./routes/index');
const adminRoutes = require('./routes/admin');
const { startOrderReserveCronjob } = require('./scripts/orderCronjob');
const chatSocket = require('./scripts/chatSocket'); // ← THÊM

dotenv.config();

// ✅ KẾT NỐI DB TRƯỚC, SAU ĐÓ KHỞI ĐỘNG CRONJOB
connectDB().then(() => {
  console.log('✅ MongoDB connected');
  
  // ✅ KHỞI ĐỘNG CRONJOB SAU KHI DB ĐÃ KẾT NỐI
  startOrderReserveCronjob();
});

const app = express();
const server = http.createServer(app); // ← THÊM: wrap express với http

// ✅ KHỞI TẠO SOCKET.IO
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Frontend URL
    methods: ["GET", "POST"],
    credentials: true
  }
});

// CHỈ 1 DÒNG NÀY LÀ XỬ HẾT CORS!!!
app.use(cors());   // ← cho phép localhost:5173, 3000, tất cả

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api', routes);
app.use('/api/admin', adminRoutes);

// ✅ KHỞI ĐỘNG SOCKET CHAT
chatSocket(io);
console.log('✅ Socket.io chat initialized');

// 404
app.use((req, res) => {
  res.status(404).json({ message: "Route không tồn tại" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Lỗi server:", err);
  res.status(500).json({ message: "Lỗi server" });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => { // ← THAY ĐỔI: dùng server.listen thay vì app.listen
  console.log(`🚀 Server chạy tại http://localhost:${PORT}`);
});