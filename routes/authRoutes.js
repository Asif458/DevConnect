const express = require("express");
const { signup, login, logout, getProfile, forgotPassword, resetPassword } = require("../controllers/authController");
const {protect} = require("../middlewares/authMiddleware");
const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);
router.get("/profile", protect, getProfile);

// New routes
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

module.exports = router;
