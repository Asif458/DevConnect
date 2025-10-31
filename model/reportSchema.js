const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema({
  entityType: { type: String, enum: ["User", "Post", "Comment"], required: true },
  entityId: { type: mongoose.Schema.Types.ObjectId, required: true },
  reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  status: { type: String, enum: ["pending", "reviewed", "resolved"], default: "pending" }
}, { timestamps: true });

module.exports = mongoose.model("Report", reportSchema);
