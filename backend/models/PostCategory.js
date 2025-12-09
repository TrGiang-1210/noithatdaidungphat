const mongoose = require("mongoose");

const postCategorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true }
});

module.exports = mongoose.model("PostCategory", postCategorySchema);
