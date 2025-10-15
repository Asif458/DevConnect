const User = require("../model/userSchema");
const bcrypt = require("bcryptjs");
const generateToken = require("../utils/generateToken");
const sendEmail = require("../utils/sendEmail"); // nodemailer wrapper
const crypto = require("crypto");

// ====================== GET LOGGED IN USER PROFILE ======================
// ====================== GET LOGGED IN USER PROFILE ======================
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    // Build filtered user object
    let filteredUser = {
      _id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      isPremium: user.isPremium,
      friends: user.friends,
      followers: user.followers,
      following: user.following,
      incomingRequests: user.incomingRequests,
      outgoingRequests: user.outgoingRequests,
      feedback: user.feedback,
    };

    // Role-specific fields
    if (user.role === "developer") {
      filteredUser.skills = user.skills;
      filteredUser.interests = user.interests;
    } else if (user.role === "mentor") {
      filteredUser.mentorProfile = user.mentorProfile;
    } else if (user.role === "admin") {
      filteredUser.adminProfile = user.adminProfile;
    }

    res.set("Cache-Control", "no-store"); // prevent caching sensitive info
    res.status(200).json({ user: filteredUser });
  } catch (error) {
    console.error("Get Profile Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


// ========================== SIGNUP CONTROLLER ==========================
// ========================== SIGNUP CONTROLLER ==========================
exports.signup = async (req, res) => {
  try {
    const { name, username, email, password, role } = req.body;
    if (!name || !email || !password || !role)
      return res.status(400).json({ message: "All fields are required." });

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "Email already exists." });

    const hashedPassword = await bcrypt.hash(password, 10);

    const userData = { name, username, email, password: hashedPassword, role };

    // ===== Role-specific initialization =====
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

      // Remove irrelevant fields
      delete userData.skills;
      delete userData.interests;
      delete userData.adminProfile;

    } else if (role === "developer") {
      userData.skills = [];
      userData.interests = [];

      // Remove irrelevant fields
      delete userData.mentorProfile;
      delete userData.adminProfile;

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

// ========================== FORGOT PASSWORD (REQUEST OTP) ==========================
// ========================== FORGOT PASSWORD ==========================
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email)
      return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ message: "User not found" });

    // Generate OTP (6-digit numeric)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = Date.now() + 10 * 60 * 1000; // valid 10 mins

    // Save OTP in user document
    user.resetOTP = otp;
    user.resetOTPExpiry = otpExpiry;
    await user.save();

    // Send OTP email
    await sendEmail({
      to: user.email,
      subject: "Your DevConnect OTP",
      text: `Your OTP for password reset is ${otp}. It is valid for 10 minutes.`,
    });

    res.status(200).json({ message: "OTP sent to your email" });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ========================== RESET PASSWORD ==========================
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword)
      return res.status(400).json({ message: "All fields are required" });

    const user = await User.findOne({ email }).select(
      "+password +resetOTP +resetOTPExpiry"
    );
    if (!user) return res.status(404).json({ message: "User not found" });

    // Validate OTP
    if (user.resetOTP !== otp || user.resetOTPExpiry < Date.now())
      return res.status(400).json({ message: "Invalid or expired OTP" });

    // Update password
    user.password = await bcrypt.hash(newPassword, 10);
    user.resetOTP = undefined;
    user.resetOTPExpiry = undefined;
    await user.save();

    res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

