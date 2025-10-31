const mongoose = require("mongoose");

const skillSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  category: String,
  popularity: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model("Skill", skillSchema);
