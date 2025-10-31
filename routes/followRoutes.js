const express = require("express");
const router = express.Router();
const followController = require("../controllers/followController");
const { protect } = require("../middlewares/authMiddleware");

// Follow a user
router.post("/:userId/follow", protect, followController.followUser);

// Unfollow a user
router.delete("/:userId/unfollow", protect, followController.unfollowUser);

module.exports = router;
