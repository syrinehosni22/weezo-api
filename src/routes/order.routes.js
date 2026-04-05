const express = require("express");
const router = express.Router();
const orderController = require("../controllers/order.controller");
const auth = require("../middlewares/auth.middleware");
const role = require("../middlewares/role.middleware");

// Auth required
router.use(auth);

// User routes
router.get("/", orderController.getUserOrders);
router.post("/", orderController.createOrder);

// Admin routes
router.get("/all", role("ADMIN"), orderController.getAllOrders);
router.put("/:id/status", role("ADMIN"), orderController.updateOrderStatus);

module.exports = router;
