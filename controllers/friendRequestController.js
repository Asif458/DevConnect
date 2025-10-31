const User = require("../model/userSchema");

// Send Friend Request
exports.sendRequest = async (req, res) => {
  try {
    const { recipientId, message } = req.body;
    const requesterId = req.user._id;

    // Validation
    if (!recipientId) {
      return res.status(400).json({ error: "Recipient ID is required" });
    }

    if (recipientId === requesterId.toString()) {
      return res.status(400).json({ error: "Cannot send request to yourself" });
    }

    const recipient = await User.findById(recipientId);
    const requester = await User.findById(requesterId);

    if (!recipient) {
      return res.status(404).json({ error: "User not found" });
    }

    // Security: Don't allow sending requests to admins
    if (recipient.role === "admin") {
      return res.status(403).json({ error: "Cannot send friend requests to admins" });
    }

    // Check if already friends
    if (requester.friends?.includes(recipientId)) {
      return res.status(400).json({ error: "Already friends with this user" });
    }

    // Check if request already exists
    const alreadySent = requester.outgoingRequests?.find(
      (req) => req.user.toString() === recipientId
    );
    if (alreadySent) {
      return res.status(400).json({ error: "Friend request already sent" });
    }

    // Check if reverse request exists (they sent to us)
    const reverseRequest = requester.incomingRequests?.find(
      (req) => req.user.toString() === recipientId
    );
    if (reverseRequest && reverseRequest.status === "pending") {
      return res.status(400).json({ 
        error: "This user already sent you a request. Please accept it instead." 
      });
    }

    // Initialize arrays if they don't exist
    if (!requester.outgoingRequests) requester.outgoingRequests = [];
    if (!recipient.incomingRequests) recipient.incomingRequests = [];

    // Add to outgoing requests
    requester.outgoingRequests.push({ user: recipientId, status: "pending" });

    // Add to incoming requests
    recipient.incomingRequests.push({ user: requesterId, status: "pending" });

    await requester.save();
    await recipient.save();

    res.status(201).json({ 
      message: "Friend request sent successfully",
      recipient: {
        _id: recipient._id,
        name: recipient.name,
        username: recipient.username,
      }
    });
  } catch (err) {
    console.error("Send request error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Get Pending Requests
exports.getPendingRequests = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate({
        path: "incomingRequests.user",
        select: "name username profilePhoto role skills bio",
      });

    if (!user) return res.status(404).json({ error: "User not found" });

    const pending = user.incomingRequests
      .filter((req) => req.status === "pending")
      .map((req) => ({
        _id: req._id || req.user._id,
        sender: req.user,
        status: req.status,
      }));

    res.json(pending);
  } catch (err) {
    console.error("Get requests error:", err);
    res.status(500).json({ error: err.message });
  }
};


// ✅ Get Sent (Outgoing) Friend Requests
exports.getSentRequests = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate({
        path: "outgoingRequests.user",
        select: "name username profilePhoto role skills bio",
        populate: { path: "skills", select: "name" },
      });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const sent = user.outgoingRequests
      ?.filter((req) => req.status === "pending")
      ?.map((req) => ({
        _id: req._id ?? req.user._id,
        receiver: req.user,
        status: req.status,
      })) || [];
    res.json(sent);
  } catch (err) {
    console.error("Get sent requests error:", err);
    res.status(500).json({ error: err.message });
  }
};


// Accept Request
exports.acceptRequest = async (req, res) => {
  try {
    const { requesterId } = req.params;
    const recipientId = req.user._id;

    if (!requesterId) {
      return res.status(400).json({ error: "Requester ID is required" });
    }

    const recipient = await User.findById(recipientId);
    const requester = await User.findById(requesterId);

    if (!requester) {
      return res.status(404).json({ error: "User not found" });
    }

    // Find the specific request
    const incomingRequest = recipient.incomingRequests?.find(
      (req) => req.user.toString() === requesterId && req.status === "pending"
    );

    const outgoingRequest = requester.outgoingRequests?.find(
      (req) => req.user.toString() === recipientId.toString() && req.status === "pending"
    );

    // Security: Verify request exists and is pending
    if (!incomingRequest || !outgoingRequest) {
      return res.status(404).json({ 
        error: "Friend request not found or already processed" 
      });
    }

    // Update status
    incomingRequest.status = "accepted";
    outgoingRequest.status = "accepted";

    // Add to friends
    if (!recipient.friends) recipient.friends = [];
    if (!requester.friends) requester.friends = [];

    if (!recipient.friends.includes(requesterId)) {
      recipient.friends.push(requesterId);
    }
    if (!requester.friends.includes(recipientId)) {
      requester.friends.push(recipientId);
    }

    await recipient.save();
    await requester.save();

    res.json({ 
      message: "Friend request accepted successfully",
      newFriend: {
        _id: requester._id,
        name: requester.name,
        username: requester.username,
        profilePhoto: requester.profilePhoto,
      }
    });
  } catch (err) {
    console.error("Accept request error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Reject Request
exports.rejectRequest = async (req, res) => {
  try {
    const { requesterId } = req.params;
    const recipientId = req.user._id;

    if (!requesterId) {
      return res.status(400).json({ error: "Requester ID is required" });
    }

    const recipient = await User.findById(recipientId);
    const requester = await User.findById(requesterId);

    if (!requester) {
      return res.status(404).json({ error: "User not found" });
    }

    const incomingRequest = recipient.incomingRequests?.find(
      (req) => req.user.toString() === requesterId && req.status === "pending"
    );

    const outgoingRequest = requester.outgoingRequests?.find(
      (req) => req.user.toString() === recipientId.toString() && req.status === "pending"
    );

    // Security: Verify request exists and is pending
    if (!incomingRequest || !outgoingRequest) {
      return res.status(404).json({ 
        error: "Friend request not found or already processed" 
      });
    }

    // Update status to rejected
    incomingRequest.status = "rejected";
    outgoingRequest.status = "rejected";

    await recipient.save();
    await requester.save();

    res.json({ message: "Friend request rejected" });
  } catch (err) {
    console.error("Reject request error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Cancel Request
exports.cancelRequest = async (req, res) => {
  try {
    const { recipientId } = req.params;
    const requesterId = req.user._id;

    if (!recipientId) {
      return res.status(400).json({ error: "Recipient ID is required" });
    }

    const requester = await User.findById(requesterId);
    const recipient = await User.findById(recipientId);

    if (!recipient) {
      return res.status(404).json({ error: "User not found" });
    }

    // Security: Verify request was sent by the logged-in user and is pending
    const sentRequest = requester.outgoingRequests?.find(
      (req) => req.user.toString() === recipientId && req.status === "pending"
    );

    if (!sentRequest) {
      return res.status(404).json({ 
        error: "No pending friend request found to this user" 
      });
    }

    // Remove from both arrays
    requester.outgoingRequests = requester.outgoingRequests?.filter(
      (req) => !(req.user.toString() === recipientId && req.status === "pending")
    ) || [];

    recipient.incomingRequests = recipient.incomingRequests?.filter(
      (req) => !(req.user.toString() === requesterId.toString() && req.status === "pending")
    ) || [];

    await requester.save();
    await recipient.save();

    res.json({ message: "Friend request cancelled successfully" });
  } catch (err) {
    console.error("Cancel request error:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.getFriends = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate({
        path: "friends",
        select: "name username profilePhoto role bio"
      });
    res.json(user.friends || []);
  } catch (err) {
    console.error("Get friends error:", err);
    res.status(500).json({ error: err.message });
  }
};
