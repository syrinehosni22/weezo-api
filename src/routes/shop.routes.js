const express = require("express");
const router = express.Router();
const shopController = require("../controllers/shop.controller");
const auth = require("../middlewares/auth.middleware");
const role = require("../middlewares/role.middleware");

// Public
router.get("/", shopController.getShops);

// Admin
router.post("/", auth, role("ADMIN"), shopController.createShop);
router.put("/:id", auth, role("ADMIN"), shopController.updateShop);
router.delete("/:id", auth, role("ADMIN"), shopController.deleteShop);

module.exports = router;
