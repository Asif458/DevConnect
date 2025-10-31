

const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema({
  mentorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Mentors are users with role mentor
  menteeId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  availabilityId: { type: mongoose.Schema.Types.ObjectId },  
  sessionType: { type: String, enum: ["one-on-one", "group"], default: "one-on-one" },
  slot: String,
  status: { type: String, enum: ["scheduled", "completed", "cancelled"], default: "scheduled" },
  sessionLink: String, // Optional link for online session
}, { timestamps: true });

module.exports = mongoose.model("Session", sessionSchema);
