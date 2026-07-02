const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const auth = require("../middlewares/auth.middleware");

// Public routes
router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/reset-password", authController.resetPassword);
router.get("/reset-password/:token", authController.resetPasswordForm);
router.post("/reset-password/:token", authController.resetPasswordConfirm);
router.post("/send-code", authController.sendCode);
router.post("/verify-code", authController.verifyCode);


// Private route
router.get("/me", auth, authController.me);

module.exports = router;