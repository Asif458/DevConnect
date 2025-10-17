const User = require("../model/userSchema")

// --- GET all users/mentors (pagination + search) ---
exports.getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const filter = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { role: { $regex: search, $options: "i" } }
      ];
    }

    const skip = (page - 1) * limit;

    const users = await User.find(filter)
      .select("-password")
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(filter);

    res.json({ users, totalPages: Math.ceil(total / limit), currentPage: parseInt(page) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// --- GET single user ---
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// --- CREATE new user ---
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "Email already exists" });

    const user = await User.create({ name, email, password, role });
    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// --- UPDATE user ---
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
    res.status(500).json({ message: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findById(userId);
    if (!user)
      return res.status(404).json({ message: "User not found" });

    await User.findByIdAndDelete(userId); // ✅ Modern, clean way

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ message: "Server error while deleting user" });
  }
};

// --- APPROVE mentor ---
exports.approveMentor = async (req, res) => {
  try {
    const mentor = await User.findById(req.params.id);
    if (!mentor || mentor.role !== "mentor") return res.status(400).json({ message: "Invalid mentor" });

    mentor.mentorProfile.approvedByAdmin = true;
    await mentor.save();

    res.json({ message: "Mentor approved successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

 

exports.getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: { $in: ["developer", "mentor"] } });
    const totalMentors = await User.countDocuments({ role: "mentor" });
 
    const activeUsersToday = await User.countDocuments({ updatedAt: { $gte: new Date(new Date().setHours(0,0,0,0)) } });

    res.json({
      stats: [
        { title: "Total Users", value: totalUsers, icon: "Users", change: "+5%", changeType: "increase", iconBgColor: "bg-blue-500", trendData: [] },
        { title: "Total Mentors", value: totalMentors, icon: "UserCheck", change: "+2%", changeType: "increase", iconBgColor: "bg-green-500", trendData: [] },

        
        { title: "Active Users Today", value: activeUsersToday, icon: "Users", change: "+12%", changeType: "increase", iconBgColor: "bg-yellow-500", trendData: [] }
      ],
      revenueTrend: [], // optional if you don’t track revenue yet
      userGrowth: [],   // optional
      sessionActivity: [] // optional
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error fetching dashboard stats" });
  }
};

