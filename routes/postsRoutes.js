const express = require("express");
const router = express.Router();
const postsController = require("../controllers/postController");
const { protect } = require("../middlewares/authMiddleware");
const uploadPost = require("../middlewares/uploadPostImage");

// IMPORTANT: PUT route BEFORE other :postId routes
router.put("/:postId", protect, uploadPost.single("image"), postsController.updatePost);

// Create Post (single image upload)
router.post("/", protect, uploadPost.single("image"), postsController.createPost);

// Feed
router.get("/", protect, postsController.getPosts);

// Delete post
router.delete("/:postId", protect, postsController.deletePost);

// Post interactions
router.post("/:postId/like", protect, postsController.toggleLike);
router.post("/:postId/comment", protect, postsController.addComment);
router.get("/:postId/comments", protect, postsController.getComments);
router.delete("/:postId/comment/:commentId", protect, postsController.deleteComment);
router.post("/:postId/report", protect, postsController.reportPost);

module.exports = router;
