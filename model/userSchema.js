const mongoose = require("mongoose");

// ===== Optional embedded schema for mentorship plans =====
const mentorshipPlanSchema = new mongoose.Schema({
  title: String,
  description: String,
  price: Number,
  durationInDays: Number,
}, { _id: false });

// ===== Embedded schema for friend requests =====
const friendRequestSubSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  status: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending" },
}, { _id: false });

// ===== Embedded schema for mentor availability =====
const slotSchema = new mongoose.Schema({
  time: { type: String, required: true },
  isBooked: { type: Boolean, default: false },
}, { _id: false });

const availabilitySchema = new mongoose.Schema({
  day: { type: String, required: true },
  date: { type: Date, required: true },
  slots: [slotSchema],
}, { _id: false });

// ===== Embedded schema for feedback =====
const feedbackSchema = new mongoose.Schema({
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: "Session", required: true },
  from: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // user who gave feedback
  rating: { type: Number, min: 1, max: 5, required: true },
  review: { type: String, trim: true },
}, { timestamps: true, _id: false });

// ===== Main User Schema =====
const userSchema = new mongoose.Schema({
  // ===== Basic Info =====
  name: { type: String, required: true },
  username: { type: String, unique: true, required: true },
 email: { type: String, unique: true, required: true, lowercase: true, trim: true },
 password: { type: String, required: true, select: false },


  // ===== Common Fields =====
  bio: String,
  location: String,
  profilePhoto: String,
  skills: [{ type: mongoose.Schema.Types.ObjectId, ref: "Skill" }],
  interests: [String],
  role: { type: String, enum: ["developer", "mentor", "admin"], default: "developer" },
  isActive: { type: Boolean, default: true },
  isPremium: { type: Boolean, default: false },
  premiumExpiresAt: Date,

  // ===== Social Connections =====
  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

  // ===== Embedded Friend Requests =====
  incomingRequests: [friendRequestSubSchema],
  outgoingRequests: [friendRequestSubSchema],

  // ===== Feedback / Reviews =====
  feedback: [feedbackSchema], // embedded feedback array

  // ===== Mentor-specific Fields =====
  mentorProfile: {
    expertise: [{ type: mongoose.Schema.Types.ObjectId, ref: "Skill" }],
    verified: { type: Boolean, default: false },
    approvedByAdmin: { type: Boolean, default: false },
    experience: String,
    sessionPrice: { type: Number, default: 0 },
    mentorshipPlans: [mentorshipPlanSchema],
    availability: {
      type: [availabilitySchema],
      default: [
        {
          day: "Monday",
          date: new Date("2025-09-13T09:00:00Z"),
          slots: [
            { time: "09:00 AM - 10:00 AM" },
            { time: "10:00 AM - 11:00 AM" },
            { time: "11:00 AM - 12:00 PM" },
            { time: "01:00 PM - 02:00 PM" },
            { time: "02:00 PM - 03:00 PM" },
            { time: "03:00 PM - 04:00 PM" },
            { time: "04:00 PM - 05:00 PM" },
          ],
        },
      ],
    },
  },

  // ===== Admin-specific Fields =====
  adminProfile: {
    managedMentors: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    managedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    managedPosts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Post" }],
    managedComments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment" }],
    reportsTracked: [{ type: mongoose.Schema.Types.ObjectId, ref: "Report" }],
    notificationsSetup: [String],
  },

}, { timestamps: true });

// ===== Indexes for Optimization =====
userSchema.index({ followers: 1 });
userSchema.index({ following: 1 });
userSchema.index({ "incomingRequests.user": 1 });
userSchema.index({ "outgoingRequests.user": 1 });
userSchema.index({ "feedback.sessionId": 1 }); // helpful for searching feedback per session

module.exports = mongoose.model("User", userSchema);
