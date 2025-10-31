const User = require("../model/userSchema");
const Skill = require("../model/skillSchema");
const bcrypt = require("bcryptjs");
const generateToken = require("../utils/generateToken");
const { sendOTP, sendEmail } = require("../services/emailService");

// ====================== GET PROFILE ======================
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    const filteredUser = {
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

    if (user.role === "developer") filteredUser.skills = user.skills;
    if (user.role === "admin") filteredUser.adminProfile = user.adminProfile;

    if (user.role === "mentor") filteredUser.mentorProfile = user.mentorProfile || {};

    //   Always use top-level status for consistency
    filteredUser.status = user.status || (
      user.mentorProfile?.approvedByAdmin
        ? "approved"
        : user.mentorProfile?.status === "rejected"
          ? "rejected"
          : "pending"
    );

    res.set("Cache-Control", "no-store");
    res.status(200).json({ user: filteredUser });
  } catch (err) {
    console.error("Get Profile Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};



// ====================== SIGNUP ======================
exports.signup = async (req, res) => {
  try {
    const { name, username, email, password, role,bio, skills, experience, availability } = req.body;
    if (!name || !username || !email || !password || !role)
      return res.status(400).json({ message: "All fields required" });

    const validRoles = ["mentor", "developer"];
    if (!validRoles.includes(role)) return res.status(400).json({ message: "Invalid role" });

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "Email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const userData = {
      name,
      username,
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
      bio,
      isVerified: false,
      status: role === "mentor" ? "pending" : "approved",  
    };

    if (req.file) userData.profilePhoto = req.file.path;

    // Handle skills
    let skillIds = [];
    if (skills) {
      const parsedSkills = Array.isArray(skills) ? skills : JSON.parse(skills);
      const filtered = parsedSkills.map(s => s.trim()).filter(s => s.length >= 2);
      const existingSkills = await Skill.find({ name: { $in: filtered } });
      const existingNames = existingSkills.map(s => s.name);
      const newNames = filtered.filter(s => !existingNames.includes(s));
      if (newNames.length) await Skill.insertMany(newNames.map(name => ({ name })), { ordered: false });
      const finalSkills = await Skill.find({ name: { $in: filtered } }).select("_id");
      skillIds = finalSkills.map(s => s._id);
    }

    // Mentor-specific data
    if (role === "mentor") {
      let structuredAvailability = [];
      if (availability) {
        const parsed = Array.isArray(availability) ? availability : JSON.parse(availability);
        const byDay = {};
        parsed.forEach(slot => {
          const [day, time] = slot.split(" ");
          if (!day || !time) return;
          if (!byDay[day]) byDay[day] = [];
          byDay[day].push({ time, isBooked: false });
        });
        structuredAvailability = Object.entries(byDay).map(([day, slots]) => ({ day, date: new Date(), slots }));
      }

      userData.mentorProfile = {
        expertise: skillIds,
        experience: experience || "",
        availability: structuredAvailability,
        verified: false,
        approvedByAdmin: false,
        status: "pending",
        sessionPrice: 0,
        mentorshipPlans: [],
      };

      // Send pending approval email immediately
      await sendEmail({
        to: userData.email,
        subject: "Mentor Application Pending",
        html: `<h3>Hi ${name},</h3>
               <p>Thanks for applying as a mentor! Your profile is pending admin approval.</p>
               <p>You cannot log in as a mentor until approved.</p>`,
      });
    } else {
      userData.skills = skillIds;
      userData.interests = [];
    }

    const user = await User.create(userData);

    // Send OTP for signup verification
    await sendOTP(user, "signup");

    res.status(201).json({
      message: "Signup successful. OTP sent for verification",
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        status: userData.status,
      },
    });

  } catch (err) {
    console.error("Signup Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ====================== VERIFY OTP ======================
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email }).select("+password +otp +mentorProfile");
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.otp || !user.otp.code || user.otp.expiresAt < new Date())
      return res.status(400).json({ message: "OTP expired or invalid" });

    const isValid = await bcrypt.compare(otp, user.otp.code);
    if (!isValid) return res.status(400).json({ message: "Invalid OTP" });

    user.isVerified = true;
    user.otp = undefined;

    // Developers approved immediately, mentors remain pending
    if (user.role === "developer") user.status = "approved";
    if (user.role === "mentor") user.status = "pending";

    await user.save();

    res.status(200).json({
      message: "OTP verified successfully",
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });
  } catch (err) {
    console.error("Verify OTP Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ====================== LOGIN ======================
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "All fields required" });

    const user = await User.findOne({ email }).select("+password +mentorProfile");
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    //   Always reflect top-level status
    const status = user.status || "approved";

    generateToken(res, user._id, user.role);

    res.status(200).json({
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status,
      },
    });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ====================== LOGOUT ======================
exports.logout = (req, res) => {
  res.cookie("jwt", "", {
    httpOnly: true,
    expires: new Date(0),
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict",
  });
  res.status(200).json({ message: "Logged out successfully" });
};
