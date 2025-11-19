// backend/server.js — CHẠY NGON 100% CHO VITE (port 5173)

const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");
const path = require('path');

dotenv.config();
connectDB();

const app = express();

// CHỈ 1 DÒNG NÀY LÀ XỬ HẾT CORS!!!
app.use(cors());   // ← cho phép localhost:5173, 3000, tất cả

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use("/api", require("./routes/index"));

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
app.listen(PORT, () => {
  console.log(`🚀 Server chạy tại http://localhost:${PORT}`);
});