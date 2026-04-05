const express = require("express");
const router = express.Router();
const cartController = require("../controllers/cart.controller");
const auth = require("../middlewares/auth.middleware");

// All routes require authentication
router.use(auth);

router.get("/", cartController.getCart);
router.post("/add", cartController.addItem);
router.put("/update", cartController.updateItem);
router.delete("/remove/:itemId", cartController.removeItem);
router.delete("/clear", cartController.clearCart);

module.exports = router;
