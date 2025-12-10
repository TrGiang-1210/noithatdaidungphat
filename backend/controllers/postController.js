const Post = require("../models/Post");

// ==================== PUBLIC ROUTES ====================

// Lấy danh sách bài viết (public - chỉ published)
exports.getAllPostsPublic = async (req, res) => {
  try {
    const { page = 1, limit = 9, category } = req.query;
    
    // ✅ Chỉ lấy bài viết đã published
    const query = { status: 'published' };
    if (category) query.category_id = category;
    
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

// Lấy chi tiết bài viết (public)
exports.getPostBySlug = async (req, res) => {
  try {
    const post = await Post.findOne({ 
      slug: req.params.slug,
      status: 'published' // ✅ Chỉ cho xem bài đã published
    }).populate("category_id");
    
    if (!post) return res.status(404).json({ message: "Post not found" });

    res.json(post);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ==================== ADMIN ROUTES ====================

// Lấy tất cả bài viết (admin - cả draft và published)
exports.getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("category_id")
      .sort({ created_at: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Tạo bài viết
exports.createPost = async (req, res) => {
  try {
    const postData = {
      ...req.body,
      status: req.body.status || 'draft', // ✅ Mặc định là draft
      tags: req.body.tags || [],
      created_at: new Date(),
      updated_at: new Date()
    };

    const post = new Post(postData);
    await post.save();
    
    // ✅ Populate category trước khi trả về
    await post.populate("category_id");
    
    res.json({ message: "Post created", post });
  } catch (err) {
    console.error('Error creating post:', err);
    res.status(500).json({ error: err.message });
  }
};

// Cập nhật bài viết
exports.updatePost = async (req, res) => {
  try {
    const updateData = {
      ...req.body,
      updated_at: new Date()
    };

    const post = await Post.findByIdAndUpdate(
      req.params.id, 
      updateData,
      { new: true } // ✅ Trả về document sau khi update
    ).populate("category_id");
    
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    
    res.json({ message: "Post updated", post });
  } catch (err) {
    console.error('Error updating post:', err);
    res.status(500).json({ error: err.message });
  }
};

// Xóa bài viết
exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findByIdAndDelete(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    
    res.json({ message: "Post deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};