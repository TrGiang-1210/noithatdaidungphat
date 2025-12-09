const PostCategory = require("../models/PostCategory");
const Post = require("../models/Post");

// Lấy tất cả danh mục
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await PostCategory.find();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Lấy bài viết theo danh mục - THÊM METHOD NÀY
exports.getPostsByCategory = async (req, res) => {
  try {
    const category = await PostCategory.findOne({ slug: req.params.slug });
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    
    const posts = await Post.find({ category_id: category._id })
      .populate("category_id")
      .sort({ created_at: -1 });
      
    res.json({ category, posts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Tạo danh mục mới
exports.createCategory = async (req, res) => {
  try {
    const category = new PostCategory(req.body);
    await category.save();
    res.json({ message: "Category created", category });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Xóa danh mục
exports.deleteCategory = async (req, res) => {
  try {
    await PostCategory.findByIdAndDelete(req.params.id);
    res.json({ message: "Category deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};