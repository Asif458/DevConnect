const User = require("../model/userSchema");
const Post = require("../model/postSchema");
// Search/Filter Users
exports.searchUsers = async (req, res) => {
  try {
    const { role, skills, search, minRating, page = 1, limit = 20 } = req.query;
    const query = {};

    if (role && ["developer", "mentor"].includes(role)) {
      query.role = role;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { username: { $regex: search, $options: "i" } },
      ];
    }

    if (skills) {
      const skillArray = skills.split(",");
      query.skills = { $in: skillArray };
    }

    if (minRating) {
      query["mentorRating.average"] = { $gte: parseFloat(minRating) };
    }

    if (role === "mentor") {
      query.status = "approved";
    }

    query._id = { $ne: req.user._id };

    const users = await User.find(query)
      .select("name username profilePhoto role bio skills mentorProfile mentorRating followers following location incomingRequests outgoingRequests")
      .populate("skills", "name")
      .populate("mentorProfile.expertise", "name")
      .sort({ "mentorRating.average": -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const currentUser = await User.findById(req.user._id);

    const usersWithStatus = users.map((user) => {
      // Check friend request status using existing schema
      const sentRequest = currentUser.outgoingRequests?.find(
        (req) => req.user.toString() === user._id.toString()
      );
      const receivedRequest = currentUser.incomingRequests?.find(
        (req) => req.user.toString() === user._id.toString()
      );

      let connectionStatus = "none";
      if (currentUser.friends?.includes(user._id)) {
        connectionStatus = "accepted";
      } else if (sentRequest) {
        connectionStatus = sentRequest.status;
      } else if (receivedRequest) {
        connectionStatus = "pending_received";
      }

      const isFollowing = currentUser.following?.includes(user._id) || false;

      return {
        _id: user._id,
        name: user.name,
        username: user.username,
        profilePhoto: user.profilePhoto,
        role: user.role,
        bio: user.bio,
        skills: user.skills,
        expertise: user.mentorProfile?.expertise || [],
        rating: user.mentorRating,
        location: user.location,
        connectionStatus,
        isFollowing,
        followersCount: user.followers?.length || 0,
        followingCount: user.following?.length || 0,
      };
    });

    const total = await User.countDocuments(query);

    res.json({
      users: usersWithStatus,
      totalPages: Math.ceil(total / limit),
      total,
      currentPage: Number(page),
    });
  } catch (err) {
    console.error("Search users error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Get User Profile 
exports.getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    // Fetch user details
    const user = await User.findById(userId)
      .select("-password -otp")
      .populate("skills", "name")
      .populate("mentorProfile.expertise", "name")
      .populate("followers", "name username profilePhoto role")
      .populate("following", "name username profilePhoto role");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

  const allPosts = await Post.find({ userId }) // userId is the profile user’s id
  .sort({ createdAt: -1 })
  .populate("userId", "name username profilePhoto")
  .populate("comments.userId", "name username profilePhoto");

    // Map recent posts with like/comment counts
    const recentPosts = allPosts.slice(0, 3).map((post) => ({
      ...post.toObject(),
      likesCount: post.likes?.length || 0,
      commentsCount: post.comments?.length || 0,
    }));

    // Logged-in user for connection/follow status
    const currentUser = await User.findById(req.user._id);

    const sentRequest = currentUser.outgoingRequests?.find(
      (req) => req.user.toString() === userId
    );
    const receivedRequest = currentUser.incomingRequests?.find(
      (req) => req.user.toString() === userId
    );

    let connectionStatus = "none";
    if (currentUser.friends?.includes(userId)) {
      connectionStatus = "accepted";
    } else if (sentRequest) {
      connectionStatus = sentRequest.status;
    } else if (receivedRequest) {
      connectionStatus = "pending_received";
    }

    const isFollowing = currentUser.following?.includes(userId) || false;

    // Construct clean response
    res.json({
      ...user.toObject(),
      followersCount: user.followers?.length || 0,
      followingCount: user.following?.length || 0,
      postsCount: allPosts.length,
      recentPosts,
      connectionStatus,
      isFollowing,
      createdAt: user.createdAt,
    });
  } catch (err) {
    console.error("🔥 Get profile error:", err);
    res.status(500).json({ error: err.message });
  }
};


 

// Update user profile (allow only self, admin update, robust validation recommended)
exports.updateUserProfile = async (req, res) => {
  try {
    if (req.user._id.toString() !== req.params.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }
    const allowedFields = [
      "name", "bio", "location", "profilePhoto",
      "skills", "links", "mentorProfile", "interests"
      // Add more allowed fields here
    ];
    const updateData = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) updateData[field] = req.body[field];
    });
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    )
      .populate("skills", "name")
      .populate("mentorProfile.expertise", "name")
      .select("-password");

    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.uploadProfilePhoto = async (req, res) => {
  try {
    if (!req.file?.path) {
      return res.status(400).json({ message: "No photo uploaded" });
    }
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { profilePhoto: req.file.path },
      { new: true }
    ).select("-password");
    res.json({ profilePhoto: user.profilePhoto, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
