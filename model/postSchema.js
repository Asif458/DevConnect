// models/postSchema.js
const mongoose = require("mongoose");

// Embedded Comment Schema
const commentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

// Main Post Schema
const postSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, default: "" },
    mediaUrls: { type: [String], default: [] },
    hashtags: { type: [String], default: [] },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    comments: [commentSchema],
    reportCount: { type: Number, default: 0 }, // <-- add report count
  },
  { timestamps: true }
);

// Index for faster like & comment queries
postSchema.index({ likes: 1 });
postSchema.index({ "comments.userId": 1 });

module.exports = mongoose.model("Post", postSchema);
