const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    type: { type: String, required: true },
    brand: { type: String, required: true },
    name: { type: String, required: true },
    variant: { type: String },
    sku: { type: String, required: true, unique: true },
    attributes: { type: Object, default: {} },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
