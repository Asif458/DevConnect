const express = require("express");
const { signup, login, logout, getProfile } = require("../controllers/authController");
const { protect } = require("../middlewares/authMiddleware"); // ✅ import correctly

const router = express.Router();

// Public routes
router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);

// Protected route
router.get("/profile", protect, getProfile);

module.exports = router;
