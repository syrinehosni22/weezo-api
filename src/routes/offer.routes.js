const express = require("express");
const router = express.Router();
const offerController = require("../controllers/offer.controller");
const auth = require("../middlewares/auth.middleware");
const role = require("../middlewares/role.middleware");

// Public
router.get("/", offerController.getActiveOffers);

// Admin
router.post("/", auth, role("ADMIN"), offerController.createOffer);
router.put("/:id", auth, role("ADMIN"), offerController.updateOffer);
router.delete("/:id", auth, role("ADMIN"), offerController.deleteOffer);

module.exports = router;
