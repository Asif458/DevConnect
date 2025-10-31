const User = require("../model/userSchema");

// Get all approved mentors
exports.getMentors = async (req, res) => {
  try {
const mentors = await User.find({ role: "mentor", status: "approved" })
  .select("-password")
  .populate("mentorProfile.expertise", "name") // Main skill badges
  .populate({ path: "feedback.from", select: "name profilePhoto" }) // For reviews
  .lean();

    res.json({ mentors });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// Get ratings for a single mentor
exports.getMentorRatings = async (req, res) => {
  try {
    const mentorId = req.params.id;
    const mentor = await User.findById(mentorId).select("mentorRating");
    if (!mentor) {
      return res.status(404).json({ message: "Mentor not found" });
    }
    res.json({ rating: mentor.mentorRating });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch ratings" });
  }
};
