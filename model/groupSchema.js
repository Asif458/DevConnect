const mongoose = require("mongoose");

const groupSchema = new mongoose.Schema({
  name: String,
  description: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  skills: [{ type: mongoose.Schema.Types.ObjectId, ref: "Skill" }],
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  posts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Post" }]
}, { timestamps: true });

module.exports = mongoose.model("Group", groupSchema);
