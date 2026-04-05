const Offer = require("../models/Offer");
const Sneaker = require("../models/Product");
const { success, error } = require("../utils/response");

// GET ALL ACTIVE OFFERS
exports.getActiveOffers = async (req, res, next) => {
  try {
    const offers = await Offer.find({ active: true }).populate("sneakerIds");
    success(res, offers, "Active offers retrieved");
  } catch (err) {
    next(err);
  }
};

// CREATE OFFER (ADMIN)
exports.createOffer = async (req, res, next) => {
  try {
    const offer = await Offer.create(req.body);
    success(res, offer, "Offer created", 201);
  } catch (err) {
    next(err);
  }
};

// UPDATE OFFER
exports.updateOffer = async (req, res, next) => {
  try {
    const offer = await Offer.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!offer) return error(res, "Offer not found", 404);

    success(res, offer, "Offer updated");
  } catch (err) {
    next(err);
  }
};

// DELETE OFFER
exports.deleteOffer = async (req, res, next) => {
  try {
    const offer = await Offer.findByIdAndDelete(req.params.id);
    if (!offer) return error(res, "Offer not found", 404);

    success(res, {}, "Offer deleted");
  } catch (err) {
    next(err);
  }
};
