const express = require("express");
const router = express.Router();
const { protect, authorizeRoles } = require("../middlewares/authMiddleware")
const {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  approveMentor,
  getDashboardStats
} = require("../controllers/adminController");

// Protect all routes (only admin)
router.use(protect, authorizeRoles("admin"));

// Users + Mentors CRUD
router.get("/users", getUsers);             // List with pagination & search
router.get("/users/:id", getUserById);      // Single user
router.post("/users", createUser);          // Add user
router.put("/users/:id", updateUser);       // Edit user
router.delete("/users/:id", deleteUser);    // Delete user
router.patch("/users/:id/approve", approveMentor); // Approve mentor
router.get("/dashboard-stats", getDashboardStats);

module.exports = router;
