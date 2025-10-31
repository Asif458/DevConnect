const express = require("express");
const { bookSession, getUserSessions } = require("../controllers/sessionController");
const { protect, authorizeRoles } = require("../middlewares/authMiddleware");

const router = express.Router();

// Booking session requires login & role
router.post("/", protect, authorizeRoles("mentor", "developer"), bookSession);

// Get sessions for a user - ensure only owner/admin/mentor can access
router.get("/:userId", protect, (req, res, next) => {
  const loggedInUserId = req.user._id.toString();
  const requestUserId = req.params.userId ? req.params.userId.toString() : null;

  if (!requestUserId) {
    return res.status(400).json({ message: "User ID parameter is required." });
  }

  if (req.user.role !== "admin" && loggedInUserId !== requestUserId) {
    return res.status(403).json({ message: "Forbidden: unauthorized" });
  }

  next();
}, getUserSessions);

module.exports = router;
