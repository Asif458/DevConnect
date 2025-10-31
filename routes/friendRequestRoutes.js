const express = require("express");
const router = express.Router();
const friendRequestController = require("../controllers/friendRequestController");
const { protect, authorizeRoles } = require("../middlewares/authMiddleware");

// Send friend request - Only developers and mentors (not admins)
router.post(
  "/send", 
  protect, 
  authorizeRoles("developer", "mentor"), 
  friendRequestController.sendRequest
);

// Get pending incoming requests - All authenticated users
router.get("/received", protect, friendRequestController.getPendingRequests);

// Get sent (outgoing) friend requests
router.get("/sent", protect, friendRequestController.getSentRequests);


// Accept friend request - All authenticated users
router.put("/:requesterId/accept", protect, friendRequestController.acceptRequest);

// Reject friend request - All authenticated users
router.put("/:requesterId/reject", protect, friendRequestController.rejectRequest);

// Cancel friend request (withdraw) - All authenticated users
router.delete("/:recipientId/cancel", protect, friendRequestController.cancelRequest);

router.get("/friends", protect, friendRequestController.getFriends);


module.exports = router;
