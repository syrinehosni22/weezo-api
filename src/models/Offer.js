const mongoose = require("mongoose");

const offerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    sneakerIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Sneaker",
      },
    ],
    discountPercentage: {
      type: Number,
      required: true,
    },
    startDate: Date,
    endDate: Date,
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Offer", offerSchema);
