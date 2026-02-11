// backend/server.js — CHẠY NGON 100% CHO VITE (port 5173) + SOCKET.IO

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");
const path = require('path');
const routes = require('./routes/index');
const adminRoutes = require('./routes/admin');
const { startOrderReserveCronjob } = require('./scripts/orderCronjob');
const chatSocket = require('./scripts/chatSocket');

dotenv.config();

// ✅ KẾT NỐI DB TRƯỚC, SAU ĐÓ KHỞI ĐỘNG CRONJOB
connectDB().then(() => {
  console.log('✅ MongoDB connected');
  
  // ✅ KHỞI ĐỘNG CRONJOB SAU KHI DB ĐÃ KẾT NỐI
  startOrderReserveCronjob();
});

const app = express();
const server = http.createServer(app);

// ✅ KHỞI TẠO SOCKET.IO
const io = new Server(server, {
  cors: {
    origin: ["https://tongkhonoithattayninh.vn", "http://localhost:5173"], // Cho phép cả web thật và máy nhà
    methods: ["GET", "POST"],
    credentials: true
  }
});

// CORS - cho phép tất cả origins
app.use(cors());

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ==================== ROUTES ====================
// Public routes
app.use('/api', routes);

// Admin routes (bao gồm cả /translations)
app.use('/api/admin', adminRoutes);

// ✅ KHỞI ĐỘNG SOCKET CHAT
chatSocket(io);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// 1. Khai báo thư mục chứa code Frontend đã build (dist/public)
app.use(express.static(path.join(__dirname, 'public')));

// 2. Xử lý Single Page Application (SPA) - THAY THẾ DÒNG 70-82 CŨ
// Dùng middleware thay vì app.get('*') để tránh lỗi path-to-regexp trên Node v22
app.use((req, res, next) => {
  // Nếu là yêu cầu GET và không phải gọi vào API, và không phải yêu cầu file tĩnh (có dấu chấm)
  if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.includes('.')) {
    return res.sendFile(path.join(__dirname, 'public', 'index.html'));
  }
  next();
});

// 3. Handler cho các route API không tồn tại (404)
app.use('/api', (req, res) => {
  res.status(404).json({ 
    success: false, 
    message: `API route ${req.method} ${req.originalUrl} không tồn tại` 
  });
});

// 404 handler
app.use((req, res) => {
  console.log(`❌ 404: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ 
    success: false,
    message: `Route ${req.method} ${req.originalUrl} không tồn tại` 
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("❌ Lỗi server:", err);
  res.status(err.status || 500).json({ 
    success: false,
    message: err.message || "Lỗi server",
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log('\n🚀 ================ SERVER STARTED ================');
  console.log(`📍 Port: ${PORT}`);
  console.log(`🌐 Public API: http://localhost:${PORT}/api`);
  console.log(`🔧 Admin API: http://localhost:${PORT}/api/admin`);
  console.log(`📝 Translations: http://localhost:${PORT}/api/admin/translations/keys`);
  console.log(`💬 Socket.io: ENABLED`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  console.log('===============================================\n');
});