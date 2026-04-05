const Order = require("../models/Order");
const Cart = require("../models/Cart");
const { success, error } = require("../utils/response");

// GET ALL ORDERS FOR USER
exports.getUserOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ userId: req.user.id }).populate("items.sneakerId");
    success(res, orders, "Orders retrieved");
  } catch (err) {
    next(err);
  }
};

// GET ALL ORDERS (ADMIN)
exports.getAllOrders = async (req, res, next) => {
  try {
    const orders = await Order.find().populate("items.sneakerId");
    success(res, orders, "All orders retrieved");
  } catch (err) {
    next(err);
  }
};

// CREATE ORDER FROM CART
exports.createOrder = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.id });
    if (!cart || cart.items.length === 0) return error(res, "Cart is empty", 400);

    const order = await Order.create({
      userId: req.user.id,
      items: cart.items,
      total: cart.total,
      status: "PENDING",
    });

    // Clear cart after order
    cart.items = [];
    cart.total = 0;
    await cart.save();

    success(res, order, "Order created", 201);
  } catch (err) {
    next(err);
  }
};

// UPDATE ORDER STATUS (ADMIN)
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!order) return error(res, "Order not found", 404);

    success(res, order, "Order status updated");
  } catch (err) {
    next(err);
  }
};
