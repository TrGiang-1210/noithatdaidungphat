// migrate-categories.js
const mongoose = require('mongoose');
require('dotenv').config(); // nếu bạn dùng file .env

// Kết nối DB (copy y hệt cách bạn kết nối trong server.js)
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ten_cua_database', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Đã kết nối MongoDB'))
.catch(err => console.log('Lỗi kết nối:', err));

// Import model (đúng đường dẫn của bạn)
const Product = require('../models/Product');
const Category = require('../models/Category');

async function runMigration() {
  console.log('Bắt đầu cập nhật dữ liệu cũ...');

  // 1. Thêm field categories = [] cho tất cả sản phẩm chưa có
  const productResult = await Product.updateMany(
    { categories: { $exists: false } },  // chỉ những sản phẩm chưa có field này
    { $set: { categories: [] } }
  );
  console.log(`Đã cập nhật ${productResult.modifiedCount} sản phẩm`);

  // 2. Thêm các field mới cho danh mục cũ
  const categoryResult = await Category.updateMany(
    { parent: { $exists: false } },
    { 
      $set: { 
        parent: null, 
        ancestors: [], 
        level: 0,
        sortOrder: 0,
        isActive: true 
      } 
    }
  );
  console.log(`Đã cập nhật ${categoryResult.modifiedCount} danh mục`);

  console.log('HOÀN TẤT! Bạn có thể tắt terminal.');
  process.exit();
}

runMigration();