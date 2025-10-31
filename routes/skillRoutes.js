const express = require("express");
const router = express.Router();
const skillController = require("../controllers/skillController");

// Public endpoint to get skills list
router.get("/", skillController.getSkills);

module.exports = router;
