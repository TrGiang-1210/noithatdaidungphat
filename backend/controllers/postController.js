const Post = require("../models/Post");

// Lấy danh sách bài viết
exports.getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find().populate("category_id");
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Lấy chi tiết bài viết
exports.getPostBySlug = async (req, res) => {
  try {
    const post = await Post.findOne({ slug: req.params.slug }).populate("category_id");
    if (!post) return res.status(404).json({ message: "Post not found" });

    res.json(post);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Tạo bài viết
exports.createPost = async (req, res) => {
  try {
    const post = new Post(req.body);
    await post.save();
    res.json({ message: "Post created", post });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Cập nhật bài viết
exports.updatePost = async (req, res) => {
  try {
    await Post.findByIdAndUpdate(req.params.id, req.body);
    res.json({ message: "Post updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Xóa bài viết
exports.deletePost = async (req, res) => {
  try {
    await Post.findByIdAndDelete(req.params.id);
    res.json({ message: "Post deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Thêm vào postController.js
exports.getAllPostsPublic = async (req, res) => {
  try {
    const { page = 1, limit = 9, category } = req.query;
    const query = category ? { category_id: category } : {};
    
    const posts = await Post.find(query)
      .populate("category_id")
      .sort({ created_at: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
      
    const count = await Post.countDocuments(query);
    
    res.json({
      posts,
      totalPages: Math.ceil(count / limit),
      currentPage: Number(page)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};