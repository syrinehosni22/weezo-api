const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/products", require("./routes/product.routes"));
app.use("/api/cart", require("./routes/cart.routes"));
app.use("/api/orders", require("./routes/order.routes"));
app.use("/api/payments", require("./routes/payment.routes"));
app.use("/api/offers", require("./routes/offer.routes"));
app.use("/api/shops", require("./routes/shop.routes"));
app.use("/api/payment", require("./routes/payment.routes"));

// Error handler
app.use(require("./middlewares/error.middleware"));

module.exports = app;
