const express = require("express");
const router = express.Router();
const { protect, authorizeRoles } = require("../middlewares/authMiddleware");
const User = require("../model/userSchema");

// Developer Dashboard
router.get(
  "/developer",
  protect,
  authorizeRoles("developer"),
  async (req, res) => {
    try {
      const user = await User.findById(req.user._id)
        .select("name username email role skills interests friends followers following createdAt updatedAt")
        .lean(); 
      res.json({ message: `Welcome Developer ${user.name}`, user });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Mentor Dashboard
router.get(
  "/mentor",
  protect,
  authorizeRoles("mentor"),
  async (req, res) => {
    try {
      const user = await User.findById(req.user._id)
        .select("name username email role mentorProfile")
        .populate("mentorProfile.expertise") 
        .lean();
      res.json({ message: `Welcome Mentor ${user.name}`, mentorProfile: user.mentorProfile });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Admin Dashboard
router.get(
  "/admin",
  protect,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      const user = await User.findById(req.user._id).select("name email role").lean();
      const allUsers = await User.find().select("name email role").lean();
      res.json({ message: `Welcome Admin ${user.name}`, users: allUsers });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

module.exports = router;
