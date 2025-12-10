const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  thumbnail: { type: String }, 
  description: { type: String }, // mô tả ngắn
  content: { type: String }, // nội dung bài viết (HTML)
  category_id: { type: mongoose.Schema.Types.ObjectId, ref: "PostCategory" },
  
  // ✅ THÊM CÁC FIELD MỚI
  status: { 
    type: String, 
    enum: ['draft', 'published'], 
    default: 'draft' 
  },
  tags: [{ type: String }], // Mảng tags
  meta_title: { type: String }, // SEO title
  meta_description: { type: String }, // SEO description
  
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

// Middleware tự động update updated_at khi save
postSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

// Middleware tự động update updated_at khi findOneAndUpdate
postSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updated_at: Date.now() });
  next();
});

module.exports = mongoose.model("Post", postSchema);