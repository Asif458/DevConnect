const express = require("express");
// const passport = require("passport");
const {
  signup,
  login,
  logout,
  getProfile,
  verifyOTP,   
} = require("../controllers/authController");
const { protect } = require("../middlewares/authMiddleware");
const upload = require("../middlewares/uploadMiddleware");

const router = express.Router();

// Regular login/signup
router.post("/signup", upload.single("profilePhoto"), signup);
router.post("/login", login);
router.post("/logout", protect, logout);
router.get("/profile", protect, getProfile);

// OTP verification
router.post("/verify-otp", verifyOTP);  

// // Google OAuth
// router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

module.exports = router;
