const User = require("../model/userSchema");
const { sendEmail, sendAdminNotification } = require("../services/emailService");

// --- GET all users/mentors
exports.getUsers = async (req, res) => {
  try {
    // Parse query params safely
    let { page = 1, limit = 15, search, role } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    const filter = {};

    // Search filter
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { role: { $regex: search, $options: "i" } },
      ];
    }

    // Role filter
    if (role && role !== "all") filter.role = role;

    const skip = (page - 1) * limit;

    const users = await User.find(filter)
      .select("-password")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(filter);

    res.json({
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (err) {
    console.error("Get Users Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// --- GET single user
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    console.error("Get User By ID Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// --- CREATE new user
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "Email already exists" });

    const user = await User.create({ name, email, password, role });

    // If role is mentor, notify admin for approval
    if (role === "mentor") await sendAdminNotification(user);

    res.status(201).json(user);
  } catch (err) {
    console.error("Create User Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// --- UPDATE user
exports.updateUser = async (req, res) => {
  try {
    const { name, email, role, isActive } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.name = name || user.name;
    user.email = email || user.email;
    user.role = role || user.role;
    if (isActive !== undefined) user.isActive = isActive;

    await user.save();
    res.json(user);
  } catch (err) {
    console.error("Update User Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// --- DELETE user
exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    await User.findByIdAndDelete(userId);

    res.status(200).json({ message: "User deleted successfully" });
  } catch (err) {
    console.error("Delete User Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// --- GET dashboard stats
exports.getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: { $in: ["developer", "mentor"] } });
    const totalMentors = await User.countDocuments({ role: "mentor" });

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const activeUsersToday = await User.countDocuments({ updatedAt: { $gte: startOfToday } });

    res.json({
      stats: [
        { title: "Total Users", value: totalUsers, icon: "Users" },
        { title: "Total Mentors", value: totalMentors, icon: "UserCheck" },
        { title: "Active Users Today", value: activeUsersToday, icon: "Users" },
      ],
      revenueTrend: [],
      userGrowth: [],
      sessionActivity: [],
    });
  } catch (err) {
    console.error("Dashboard Stats Error:", err);
    res.status(500).json({ message: "Server error fetching dashboard stats" });
  }
};

 // ===== Approve Mentor =====
exports.approveMentor = async (req, res) => {
  try {
    const { id } = req.params;
    const mentor = await User.findById(id);

    if (!mentor || mentor.role !== "mentor") {
      return res.status(404).json({ message: "Mentor not found" });
    }

    if (!mentor.mentorProfile) mentor.mentorProfile = {};
    mentor.mentorProfile.approvedByAdmin = true;
    mentor.mentorProfile.status = "approved"; // optional
    mentor.status = "approved"; // <-- CRUCIAL for frontend
    await mentor.save();

    await sendEmail({
      to: mentor.email,
      subject: "Mentor Account Approved",
      html: `<h3>Hi ${mentor.name},</h3>
             <p>Your mentor profile has been approved by admin. You can now log in and start mentoring.</p>`,
    });

    res.status(200).json({ message: "Mentor approved successfully", mentor });
  } catch (err) {
    console.error("Approve Mentor Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.rejectMentor = async (req, res) => {
  try {
    const { id } = req.params;
    const mentor = await User.findById(id);

    if (!mentor || mentor.role !== "mentor") {
      return res.status(404).json({ message: "Mentor not found" });
    }

    if (!mentor.mentorProfile) mentor.mentorProfile = {};
    mentor.mentorProfile.approvedByAdmin = false;
    mentor.mentorProfile.status = "rejected"; // optional
    mentor.status = "rejected"; // <-- CRUCIAL for frontend
    await mentor.save();

    await sendEmail({
      to: mentor.email,
      subject: "Mentor Account Rejected",
      html: `<h3>Hi ${mentor.name},</h3>
             <p>Unfortunately, your mentor application was not approved at this time. 
             You may contact support for clarification.</p>`,
    });

    res.status(200).json({ message: "Mentor rejected successfully" });
  } catch (err) {
    console.error("Reject Mentor Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ===== Fetch Pending Mentors =====
exports.getPendingMentors = async (req, res) => {
  try {
    const mentors = await User.find({
      role: "mentor",
      $or: [
        { "mentorProfile.approvedByAdmin": false },
        { mentorProfile: { $exists: false } },
      ],
    }).select("-password");

    res.status(200).json(mentors);
  } catch (err) {
    console.error("Pending mentors fetch error:", err);
    res.status(500).json({ message: "Server error fetching pending mentors" });
  }
};

