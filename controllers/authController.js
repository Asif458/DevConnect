const User = require("../model/userSchema");
const bcrypt = require("bcryptjs");
const generateToken = require("../utils/generateToken");

// ====================== GET LOGGED IN USER PROFILE ======================
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");

    if (!user) 
      return res.status(404).json({ message: "User not found" });

    // Prevent caching sensitive user data
    res.set("Cache-Control", "no-store");

    res.status(200).json({ user });
  } catch (error) {
    console.error("Get Profile Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ========================== SIGNUP CONTROLLER ==========================
exports.signup = async (req, res) => {
  try {
    const { name, username, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "Email already exists." });

    const hashedPassword = await bcrypt.hash(password, 10);

    const userData = { name, username, email, password: hashedPassword, role };

    // Role-specific initialization
    if (role === "mentor") {
      userData.mentorProfile = {
        expertise: [],
        verified: false,
        approvedByAdmin: false,
        experience: "",
        sessionPrice: 0,
        mentorshipPlans: [],
        availability: [],
      };
    } else if (role === "developer") {
      userData.skills = [];
      userData.interests = [];
    } else if (role === "admin") {
      return res
        .status(403)
        .json({ message: "Admin accounts cannot be created via signup." });
    }

    const user = await User.create(userData);

    // Send JWT cookie
    generateToken(res, user._id, user.role);

    res.status(201).json({
      message: "Signup successful",
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Signup Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ========================== LOGIN CONTROLLER ==========================
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: "All fields required" });

    const user = await User.findOne({ email }).select("+password");
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    generateToken(res, user._id, user.role);

    res.status(200).json({
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ========================== LOGOUT CONTROLLER ==========================
exports.logout = (req, res) => {
  res.cookie("jwt", "", {
    httpOnly: true,
    expires: new Date(0),
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict",
  });
  res.status(200).json({ message: "Logged out successfully" });
};
