// server.js (bản đã sửa – sạch sẽ, chuẩn production)

const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");
const path = require('path');

dotenv.config();

// Kết nối DB ngay đầu
connectDB();

const app = express();

// CORS: chỉ cho phép frontend của bạn (bảo mật hơn)
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000", // React default
  credentials: true // nếu sau này dùng cookie
}));

// Body parser
app.use(express.json({ limit: '10mb' }));        // tăng limit nếu upload ảnh lớn
app.use(express.urlencoded({ extended: true })); // cho form-data nếu cần

// Serve file upload
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ==================== ROUTES ====================
app.use("/api", require("./routes/index"));

// Route 404 đẹp (tùy chọn nhưng nên có)
app.use('*', (req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

// Error handler toàn cục (rất quan trọng!)
app.use((err, req, res, next) => {
  console.error('Server Error:', err.stack);
  res.status(500).json({ message: 'Lỗi server, vui lòng thử lại sau!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server đang chạy tại: http://localhost:${PORT}`);
  console.log(`📍 API base URL: http://localhost:${PORT}/api`);
});