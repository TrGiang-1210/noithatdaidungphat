const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  // ✅ MULTILINGUAL FIELDS
  title: {
    vi: { type: String, default: '' },
    zh: { type: String, default: '' }
  },
  
  slug: { type: String, required: true, unique: true },
  thumbnail: { type: String }, 
  
  description: {
    vi: { type: String, default: '' },
    zh: { type: String, default: '' }
  },
  
  content: {
    vi: { type: String, default: '' },
    zh: { type: String, default: '' }
  },
  
  category_id: { type: mongoose.Schema.Types.ObjectId, ref: "PostCategory" },
  
  status: { 
    type: String, 
    enum: ['draft', 'published'], 
    default: 'draft' 
  },
  
  tags: [{ type: String }],
  
  meta_title: {
    vi: { type: String, default: '' },
    zh: { type: String, default: '' }
  },
  
  meta_description: {
    vi: { type: String, default: '' },
    zh: { type: String, default: '' }
  },
  
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