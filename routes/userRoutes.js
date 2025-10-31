const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { protect } = require("../middlewares/authMiddleware");
const upload = require("../middlewares/uploadMiddleware");

// Search/Filter users (mentors/developers)
router.get("/search", protect, userController.searchUsers);

// Get user profile by ID
router.get("/:userId/profile", protect, userController.getUserProfile);

// Profile photo upload (POST)
router.post(
  "/profile-photo",
  protect,
  upload.single("profilePhoto"),
  userController.uploadProfilePhoto
);


// // Public: Get any user's profile
// router.get("/:id", userController.getUserProfile);

// Protected: Update your own profile
router.put("/:id", protect, userController.updateUserProfile);


module.exports = router;
