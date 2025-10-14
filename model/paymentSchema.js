const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  mentorId: { type: mongoose.Schema.Types.ObjectId, ref: "Mentor", required: true },
  transactionId: { type: String, unique: true },
  type: { type: String, enum: ["subscription", "session"], default: "session" },
  amount: Number,
  currency: { type: String, default: "RS" },
  status: { type: String, enum: ["pending", "completed", "failed"], default: "pending" }
}, { timestamps: true });

module.exports = mongoose.model("Payment", paymentSchema);
