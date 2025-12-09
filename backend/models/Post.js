const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  thumbnail: { type: String }, 
  description: { type: String }, // mô tả ngắn
  content: { type: String }, // nội dung bài viết (HTML)
  category_id: { type: mongoose.Schema.Types.ObjectId, ref: "PostCategory" },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Post", postSchema);
