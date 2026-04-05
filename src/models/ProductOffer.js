const mongoose = require("mongoose");

const productOfferSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true },
    shopName: { type: String, required: true },
    membership: { type: String, enum: ["premium", "standard", "free"], default: "free" },
    price: { type: Number, required: true },
    currency: { type: String, default: "TND" },
    inStock: { type: Boolean, default: true },
    condition: { type: String, enum: ["new", "used"], default: "new" },
    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ProductOffer", productOfferSchema);
