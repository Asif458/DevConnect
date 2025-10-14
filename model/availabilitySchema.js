const mongoose = require("mongoose");

const slotSchema = new mongoose.Schema({
  time: String,
  isBooked: { type: Boolean, default: false }
}, { _id: false });

const availabilitySchema = new mongoose.Schema({
  mentorId: { type: mongoose.Schema.Types.ObjectId, ref: "Mentor", required: true },
  date: { type: Date, required: true },
  slots: [slotSchema]
}, { timestamps: true });

module.exports = mongoose.model("Availability", availabilitySchema);
