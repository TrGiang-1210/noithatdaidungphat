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

// Lấy bài viết theo danh mục
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

// ✅ THÊM MỚI: Cập nhật danh mục
exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug } = req.body;
    
    const category = await PostCategory.findByIdAndUpdate(
      id,
      { name, slug },
      { new: true, runValidators: true }
    );
    
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    
    res.json({ message: "Category updated", category });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Xóa danh mục
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    
    // ✅ Kiểm tra xem có bài viết nào đang dùng category này không
    const postsUsingCategory = await Post.countDocuments({ category_id: id });
    
    if (postsUsingCategory > 0) {
      return res.status(400).json({ 
        error: `Không thể xóa danh mục này vì có ${postsUsingCategory} bài viết đang sử dụng` 
      });
    }
    
    const category = await PostCategory.findByIdAndDelete(id);
    
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    
    res.json({ message: "Category deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};