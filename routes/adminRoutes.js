const express = require("express");
const router = express.Router();
const { protect, authorizeRoles } = require("../middlewares/authMiddleware");
const {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  approveMentor,
  rejectMentor,
  getDashboardStats,
} = require("../controllers/adminController");

const User = require("../model/userSchema");

// ====== Protect all routes: Admin only ======
router.use(protect, authorizeRoles("admin"));

// ====== Users & Mentors Management ======
router.get("/users", getUsers);               // List all users
router.get("/users/:id", getUserById);        // Get single user
router.post("/users", createUser);            // Create new user manually
router.put("/users/:id", updateUser);         // Update user
router.delete("/users/:id", deleteUser);      // Delete user

// ====== Dashboard Stats ======
router.get("/dashboard-stats", getDashboardStats);

// ====== Pending Mentors (Admin Review Section) ======
router.get("/pending-mentors", async (req, res) => {
  try {
    // Include mentors with either no mentorProfile or not approved yet
    const mentors = await User.find({
      role: "mentor",
      $or: [
        { "mentorProfile.approvedByAdmin": false },
        { mentorProfile: { $exists: false } },
      ],
    }).select("-password");

    res.status(200).json(mentors);
  } catch (err) {
    console.error("Pending Mentors Fetch Error:", err);
    res.status(500).json({ message: "Server error fetching pending mentors" });
  }
});

// ====== Approve / Reject Mentor ======
router.put("/approve-mentor/:id", approveMentor);  // Approve mentor
router.put("/reject-mentor/:id", rejectMentor);    // Reject mentor

module.exports = router;
