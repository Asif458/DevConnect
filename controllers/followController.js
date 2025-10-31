const User = require("../model/userSchema");

// Follow User
exports.followUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    if (userId === currentUserId.toString()) {
      return res.status(400).json({ error: "Cannot follow yourself" });
    }

    const userToFollow = await User.findById(userId);
    const currentUser = await User.findById(currentUserId);

    if (!userToFollow) {
      return res.status(404).json({ error: "User not found" });
    }

    if (currentUser.following?.includes(userId)) {
      return res.status(400).json({ error: "Already following" });
    }

    if (!currentUser.following) currentUser.following = [];
    if (!userToFollow.followers) userToFollow.followers = [];

    currentUser.following.push(userId);
    userToFollow.followers.push(currentUserId);

    await currentUser.save();
    await userToFollow.save();

    res.json({
      message: "Followed successfully",
      followersCount: userToFollow.followers.length,
      followingCount: currentUser.following.length,
    });
  } catch (err) {
    console.error("Follow error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Unfollow User
exports.unfollowUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    const userToUnfollow = await User.findById(userId);
    const currentUser = await User.findById(currentUserId);

    if (!userToUnfollow) {
      return res.status(404).json({ error: "User not found" });
    }

    currentUser.following = currentUser.following?.filter(
      (id) => id.toString() !== userId
    ) || [];

    userToUnfollow.followers = userToUnfollow.followers?.filter(
      (id) => id.toString() !== currentUserId.toString()
    ) || [];

    await currentUser.save();
    await userToUnfollow.save();

    res.json({
      message: "Unfollowed successfully",
      followersCount: userToUnfollow.followers.length,
      followingCount: currentUser.following.length,
    });
  } catch (err) {
    console.error("Unfollow error:", err);
    res.status(500).json({ error: err.message });
  }
};
