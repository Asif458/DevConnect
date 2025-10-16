const User = require("../model/userSchema");
const bcrypt = require("bcryptjs");
const generateToken = require("../utils/generateToken");
const Skill = require("../model/skillSchema");
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


 

exports.signup = async (req, res) => {
  try {
    const { name, username, email, password, role, skills, experience, availability } = req.body;

    // Basic validation
    if (!name || !username || !email || !password || !role)
      return res.status(400).json({ message: "All fields are required." });

    const validRoles = ["mentor", "developer", "admin"];
    if (!validRoles.includes(role))
      return res.status(400).json({ message: "Invalid role selected." });

    const hashedPassword = await bcrypt.hash(password, 10);

    const userData = {
      name,
      username,
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role,
    };

    // Profile photo from multer & Cloudinary
    if (req.file) {
      userData.profilePhoto = req.file.path; // multer-storage-cloudinary provides the path
    }

    // ==================== Skills / Expertise ====================
    let skillIds = [];
    if (skills) {
      let parsedSkills;
      try {
        parsedSkills = Array.isArray(skills) ? skills : JSON.parse(skills);
      } catch {
        parsedSkills = skills.split(",").map((s) => s.trim()).filter(Boolean);
      }

      for (let skillName of parsedSkills) {
        let skillDoc = await Skill.findOne({ name: skillName });
        if (!skillDoc) skillDoc = await Skill.create({ name: skillName });
        skillIds.push(skillDoc._id);
      }
    }

    // ==================== Role-specific fields ====================
    if (role === "mentor") {
      // Process availability correctly
      let structuredAvailability = [];
      if (availability) {
        let parsedAvailability;
        try {
          parsedAvailability = Array.isArray(availability) ? availability : JSON.parse(availability);
        } catch {
          parsedAvailability = [];
        }

        // Group slots by day
        const availabilityByDay = {};
        parsedAvailability.forEach((slotString) => {
          const [day, time] = slotString.split(" ");
          if (!availabilityByDay[day]) availabilityByDay[day] = [];
          availabilityByDay[day].push({ time, isBooked: false });
        });

        structuredAvailability = Object.entries(availabilityByDay).map(([day, slots]) => ({
          day,
          date: new Date(), // optional: can assign real date if needed
          slots,
        }));
      }

      userData.mentorProfile = {
        expertise: skillIds,
        experience: experience || "",
        availability: structuredAvailability,
        verified: false,
        approvedByAdmin: false,
        sessionPrice: 0,
        mentorshipPlans: [],
      };
    } else if (role === "developer") {
      userData.skills = skillIds;
      userData.interests = [];
    }

    // Create the user
    const user = await User.create(userData);

    // Generate JWT token in cookie
    generateToken(res, user._id, user.role);

    return res.status(201).json({
      message: "Signup successful",
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        profilePhoto: user.profilePhoto,
      },
    });
  } catch (error) {
    console.error("Signup Error:", error.message || error);
    console.error("Full error object:", error.response?.data || error);
    return res.status(500).json({ message: "Server error" });
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

