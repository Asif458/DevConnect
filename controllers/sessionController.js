// const Session = require("../model/sessionSchema");
// const User = require("../model/userSchema");

// // Book session
// exports.bookSession = async (req, res) => {
//   try {
//     const { mentorId, menteeId, availabilityId, sessionType, slot } = req.body;

//     // Check if slot already booked (you can improve by checking in sessions collection or mentor availability)
//     const existingSession = await Session.findOne({ mentorId, slot, status: "scheduled" });
//     if (existingSession) {
//       return res.status(400).json({ message: "Slot already booked" });
//     }

//     const session = new Session({
//       mentorId,
//       menteeId,
//       availabilityId,
//       sessionType,
//       slot,
//       status: "scheduled",
//     });

//     await session.save();

//     res.status(201).json({ success: true, session });
//   } catch (error) {
//     console.error("Booking session error:", error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };

// // Get sessions for a user (mentor or mentee)
// exports.getUserSessions = async (req, res) => {
//   try {
//     const userId = req.params.userId;
//     const sessions = await Session.find({
//       $or: [{ mentorId: userId }, { menteeId: userId }],
//     })
//       .populate("mentorId", "name profilePhoto mentorProfile")
//       .populate("menteeId", "name profilePhoto")
//       .lean();

//     res.json({ sessions });
//   } catch (error) {
//     console.error("Get sessions error:", error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };

const Session = require("../model/sessionSchema");

// Book a mentorship session
exports.bookSession = async (req, res) => {
  try {
    const { mentorId, menteeId, availabilityId, sessionType, slot } = req.body;

    // Check if slot already booked
    const existingSession = await Session.findOne({ mentorId, slot, status: "scheduled" });
    if (existingSession) {
      return res.status(400).json({ message: "Slot already booked" });
    }

    const session = new Session({
      mentorId,
      menteeId,
      availabilityId,
      sessionType,
      slot,
      status: "scheduled",
    });

    await session.save();
    res.status(201).json({ success: true, session });
  } catch (error) {
    console.error("Booking session error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get user sessions for mentor or mentee
exports.getUserSessions = async (req, res) => {
  try {
    const userId = req.params.userId;
    const sessions = await Session.find({
      $or: [{ mentorId: userId }, { menteeId: userId }],
    })
      .populate({
        path: "mentorId",
        select: "name profilePhoto mentorProfile skills",
        populate: [
          { path: "skills", select: "name" },
          { path: "mentorProfile.expertise", select: "name" },
        ],
      })
      .populate("menteeId", "name profilePhoto")
      .lean();

    res.json({ sessions });
  } catch (error) {
    console.error("Get sessions error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


