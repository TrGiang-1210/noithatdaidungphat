const mongoose = require("mongoose");

const postCategorySchema = new mongoose.Schema({
  // ✅ MULTILINGUAL NAME
  name: {
    vi: { type: String, default: '' },
    zh: { type: String, default: '' }
  },
  
  slug: { type: String, required: true, unique: true }
});

module.exports = mongoose.model("PostCategory", postCategorySchema);