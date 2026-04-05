const Cart = require("../models/Cart");
const { success, error } = require("../utils/response");

// GET USER CART
exports.getCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ userId: req.user.id }).populate("items.sneakerId");
    if (!cart) {
      cart = await Cart.create({ userId: req.user.id, items: [], total: 0 });
    }
    success(res, cart);
  } catch (err) {
    next(err);
  }
};

// ADD ITEM
exports.addItem = async (req, res, next) => {
  try {
    const { sneakerId, size, quantity, price } = req.body;

    let cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) {
      cart = await Cart.create({ userId: req.user.id, items: [], total: 0 });
    }

    // Check if item exists
    const index = cart.items.findIndex(
      (item) => item.sneakerId.toString() === sneakerId && item.size === size
    );

    if (index > -1) {
      cart.items[index].quantity += quantity;
    } else {
      cart.items.push({ sneakerId, size, quantity, price });
    }

    // Recalculate total
    cart.total = cart.items.reduce((sum, i) => sum + i.quantity * i.price, 0);

    await cart.save();
    success(res, cart, "Item added");
  } catch (err) {
    next(err);
  }
};

// UPDATE ITEM
exports.updateItem = async (req, res, next) => {
  try {
    const { itemId, quantity } = req.body;

    const cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) return error(res, "Cart not found", 404);

    const item = cart.items.id(itemId);
    if (!item) return error(res, "Item not found", 404);

    item.quantity = quantity;

    cart.total = cart.items.reduce((sum, i) => sum + i.quantity * i.price, 0);
    await cart.save();

    success(res, cart, "Item updated");
  } catch (err) {
    next(err);
  }
};

// REMOVE ITEM
exports.removeItem = async (req, res, next) => {
  try {
    const { itemId } = req.params;

    const cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) return error(res, "Cart not found", 404);

    cart.items.id(itemId).remove();
    cart.total = cart.items.reduce((sum, i) => sum + i.quantity * i.price, 0);
    await cart.save();

    success(res, cart, "Item removed");
  } catch (err) {
    next(err);
  }
};

// CLEAR CART
exports.clearCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) return error(res, "Cart not found", 404);

    cart.items = [];
    cart.total = 0;
    await cart.save();

    success(res, cart, "Cart cleared");
  } catch (err) {
    next(err);
  }
};
