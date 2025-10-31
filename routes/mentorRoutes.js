const express = require("express");
const { getMentors,getMentorRatings } = require("../controllers/mentorController");
const { protect, authorizeRoles } = require("../middlewares/authMiddleware");
const router = express.Router();

// Protect route to only authenticated users
router.get("/", protect, authorizeRoles("admin", "mentor", "developer"), getMentors);

router.get('/:id/ratings', protect, getMentorRatings);


module.exports = router;
