const express = require("express");
const router = express.Router();
const productController = require("../controllers/product.controller");
const productResultController = require("../controllers/productResult.controller");

const auth = require("../middlewares/auth.middleware");
const role = require("../middlewares/role.middleware");

// Public
// router.get("/", productResultController.getProductResults);
// router.get("/popular", productController.getPopular);
// // router.get("/special-offers", productController.get);
// router.get("/:id", productController.getSneakerById);


module.exports = router;
