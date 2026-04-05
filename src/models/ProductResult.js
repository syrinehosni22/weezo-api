const mongoose = require("mongoose");

const productResultSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    offers: [{ type: mongoose.Schema.Types.ObjectId, ref: "ProductOffer" }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("ProductResult", productResultSchema);
