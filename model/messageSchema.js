const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  conversationId: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation", required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  // Normal chat
  text: String,
  mediaUrl: String,

  // Call metadata
  callInfo: {
    callType: { type: String, enum: ["audio", "video"] },  // Type of call
    status: { type: String, enum: ["initiated", "missed", "ended"], default: "initiated" }, // What happened
    startedAt: Date,
    endedAt: Date
  }
}, { timestamps: true });

module.exports = mongoose.model("Message", messageSchema);
