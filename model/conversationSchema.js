const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema({
  chatType: { type: String, enum: ["private", "group"], default: "private" },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: "Group" },
  lastMessageAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model("Conversation", conversationSchema);
