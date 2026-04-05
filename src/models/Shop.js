const mongoose = require("mongoose");

const shopSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    location: { type: String },
    membership: { type: String, enum: ["premium", "standard", "free"], default: "free" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Shop", shopSchema);
