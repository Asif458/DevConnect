const mongoose = require("mongoose");

// Mentorship plan schema (embedded, optional)
const mentorshipPlanSchema = new mongoose.Schema({
  title: String,
  description: String,
  price: Number,
  durationInDays: Number,
}, { _id: false });

// Friend request sub-schema
const friendRequestSubSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  status: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending" },
});

// Mentor availability (embedded)
const slotSchema = new mongoose.Schema({
  time: { type: String, required: true },
  isBooked: { type: Boolean, default: false },
});
const availabilitySchema = new mongoose.Schema({
  day: { type: String, required: true },
  date: { type: Date, required: true },
  slots: [slotSchema],
});

// Feedback schema (embedded)
const feedbackSchema = new mongoose.Schema({
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: "Session", required: true },
  from: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  review: { type: String, trim: true },
}, { timestamps: true, _id: false });

// ===== Main User Schema =====
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  username: { type: String },
  email: { type: String, unique: true, required: true, lowercase: true, trim: true },
  password: { type: String, required: true, select: false },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: function () {
      return this.role === "mentor" ? "pending" : "approved";
    },
  },
  bio: String,
  location: String,
  profilePhoto: String,
  
  // SKILLS as references for badge/tags (IMPORTANT LINE)
  skills: [{ type: mongoose.Schema.Types.ObjectId, ref: "Skill" }],

  interests: [String],
  role: { type: String, enum: ["developer", "mentor", "admin"], default: "developer" },
  otp: {
    code: String,
    type: { type: String },
    expiresAt: Date,
  },
  isVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  isPremium: { type: Boolean, default: false },
  premiumExpiresAt: Date,
  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  incomingRequests: [friendRequestSubSchema],
  outgoingRequests: [friendRequestSubSchema],
  feedback: [feedbackSchema],
  mentorRating: {
    average: { type: Number, default: 0, min: 0, max: 5 },
    totalReviews: { type: Number, default: 0 },
    reviews: [{
      developerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
      sessionId: { type: mongoose.Schema.Types.ObjectId, ref: "Session" },
      rating: { type: Number, min: 1, max: 5, required: true },
      review: { type: String, trim: true },
      createdAt: { type: Date, default: Date.now },
    }],
  },
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
          date: new Date(),
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
  adminProfile: {
    managedMentors: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    managedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    managedPosts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Post" }],
    managedComments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment" }],
    reportsTracked: [{ type: mongoose.Schema.Types.ObjectId, ref: "Report" }],
    notificationsSetup: [String],
  }
}, { timestamps: true });

userSchema.index({ followers: 1 });
userSchema.index({ following: 1 });
userSchema.index({ "incomingRequests.user": 1 });
userSchema.index({ "outgoingRequests.user": 1 });
userSchema.index({ "feedback.sessionId": 1 });

module.exports = mongoose.model("User", userSchema);
