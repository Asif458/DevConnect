const Post = require("../model/postSchema");
const Report = require("../model/reportSchema");

// Create Post
exports.createPost = async (req, res) => {
  try {
    console.log("Request body:", req.body);
    console.log("Request file:", req.file);

    const { content, hashtags } = req.body;
    
    // Get image URL from Cloudinary
    const mediaUrls = req.file ? [req.file.path] : [];

    console.log("Creating post with mediaUrls:", mediaUrls);

    const post = await Post.create({
      userId: req.user._id,
      content,
      mediaUrls,
      hashtags: hashtags ? (typeof hashtags === 'string' ? JSON.parse(hashtags) : hashtags) : [],
    });

    // Populate for frontend
    const populatedPost = await Post.findById(post._id)
      .populate({
        path: "userId",
        select: "name username profilePhoto skills",
      })
      .populate({
        path: "comments.userId",
        select: "name username profilePhoto",
      });

    console.log("Post created successfully:", populatedPost);
    res.status(201).json(populatedPost);
  } catch (err) {
    console.error("Create post error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Update Post
exports.updatePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;
    
    console.log("=== Update Post Request ===");
    console.log("Post ID:", postId);
    console.log("Content:", content);
    console.log("File:", req.file);
    console.log("User ID:", req.user._id);
    
    // Find the post
    const post = await Post.findById(postId);
    if (!post) {
      console.log("Post not found");
      return res.status(404).json({ error: "Post not found" });
    }
    
    // Check if user owns the post
    if (post.userId.toString() !== req.user._id.toString()) {
      console.log("Not authorized");
      return res.status(403).json({ error: "Not authorized to update this post" });
    }
    
    // Update content if provided
    if (content !== undefined) {
      post.content = content;
    }
    
    // Update image if provided
    if (req.file) {
      post.mediaUrls = [req.file.path]; // Cloudinary URL
      console.log("New image:", req.file.path);
    }
    
    await post.save();
    console.log("Post saved");
    
    // Populate for frontend
    const populatedPost = await Post.findById(post._id)
      .populate({
        path: "userId",
        select: "name username profilePhoto skills",
      })
      .populate({
        path: "comments.userId",
        select: "name username profilePhoto",
      });
    
    console.log("Post updated successfully");
    res.json(populatedPost);
  } catch (err) {
    console.error("=== Update post error ===", err);
    res.status(500).json({ error: err.message });
  }
};

// Get Feed
exports.getPosts = async (req, res) => {
  const { page = 1, limit = 10, search } = req.query;
  const query = {};
  if (search) query.content = { $regex: search, $options: "i" };

  try {
    const posts = await Post.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate({
        path: "userId",
        select: "name username profilePhoto skills",
      })
      .populate("comments.userId", "name username profilePhoto");

    const total = await Post.countDocuments(query);
    res.json({ posts, totalPages: Math.ceil(total / limit), total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Toggle Like
exports.toggleLike = async (req, res) => {
  const { postId } = req.params;
  const userId = req.user._id;
  try {
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ error: "Post not found" });

    const liked = post.likes.includes(userId);
    if (liked) post.likes.pull(userId);
    else post.likes.push(userId);

    await post.save();
    res.json({ likes: post.likes.length, liked: !liked });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Add Comment
exports.addComment = async (req, res) => {
  const { postId } = req.params;
  const { text } = req.body;

  if (!text || !text.trim())
    return res.status(400).json({ error: "Comment cannot be empty" });

  try {
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ error: "Post not found" });

    post.comments.push({ userId: req.user._id, text });
    await post.save();

    const populatedPost = await Post.findById(post._id).populate({
      path: "comments.userId",
      select: "name username profilePhoto",
    });

    const newComment = populatedPost.comments[populatedPost.comments.length - 1];
    res.status(201).json(newComment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get Comments
exports.getComments = async (req, res) => {
  const { postId } = req.params;
  try {
    const post = await Post.findById(postId).populate(
      "comments.userId",
      "name username profilePhoto"
    );
    if (!post) return res.status(404).json({ error: "Post not found" });

    res.json(post.comments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete Comment
exports.deleteComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const post = await Post.findById(postId);
    
    if (!post) return res.status(404).json({ error: "Post not found" });
    
    const commentIndex = post.comments.findIndex(
      (c) => c._id.toString() === commentId
    );
    
    if (commentIndex === -1) {
      return res.status(404).json({ error: "Comment not found" });
    }
    
    if (post.comments[commentIndex].userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not authorized to delete this comment" });
    }
    
    post.comments.splice(commentIndex, 1);
    await post.save();
    
    res.json({ message: "Comment deleted successfully" });
  } catch (err) {
    console.error("Delete comment error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Report Post
exports.reportPost = async (req, res) => {
  try {
    const { postId } = req.params;

    const existing = await Report.findOne({
      entityType: "Post",
      entityId: postId,
      reportedBy: req.user._id,
    });
    if (existing) return res.status(200).json({ reported: true });

    await Report.create({
      entityType: "Post",
      entityId: postId,
      reportedBy: req.user._id,
    });

    res.status(201).json({ reported: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete Post
exports.deletePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const post = await Post.findById(postId);
    
    if (!post) return res.status(404).json({ error: "Post not found" });
    
    if (post.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not authorized to delete this post" });
    }
    
    await Post.findByIdAndDelete(postId);
    res.json({ message: "Post deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
