const ProductResult = require("../models/ProductResult");

// ====== PRODUCT RESULT CRUD ======
exports.createProductResult = async (req, res) => {
  try {
    const result = await ProductResult.create(req.body);
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getProductResults = async (req, res) => {
  try {
    const results = await ProductResult.find()
      .populate("product")
      .populate({
        path: "offers",
        populate: { path: "shopId", model: "Shop" },
      });
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getProductResultById = async (req, res) => {
  try {
    const result = await ProductResult.findById(req.params.id)
      .populate("product")
      .populate({
        path: "offers",
        populate: { path: "shopId", model: "Shop" },
      });
    if (!result) return res.status(404).json({ error: "ProductResult not found" });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateProductResult = async (req, res) => {
  try {
    const result = await ProductResult.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!result) return res.status(404).json({ error: "ProductResult not found" });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.deleteProductResult = async (req, res) => {
  try {
    const result = await ProductResult.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ error: "ProductResult not found" });
    res.json({ message: "ProductResult deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
