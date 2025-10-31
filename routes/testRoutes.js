const express = require("express");
const { protect, authorizeRoles } = require("../middlewares/authMiddleware");

const router = express.Router();

//   Only logged-in users
router.get("/protected", protect, (req, res) => {
  res.json({ message: `Welcome, ${req.user.name}!`, user: req.user });
});

//   Only Admins
router.get("/admin", protect, authorizeRoles("admin"), (req, res) => {
  res.json({ message: `Hello Admin ${req.user.name}` });
});

module.exports = router;
