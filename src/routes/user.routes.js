const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth.middleware");
const userController = require("../controllers/user.controller");

// Every route below requires a valid Bearer token (see auth.middleware.js)
router.use(auth);

// ── Préférences / Sécurité du compte / Confidentialité localisation ───────
router.get("/me/settings", userController.getSettings);
router.patch("/me/settings", userController.updateSettings);

// ── Appareils connectés ──────────────────────────────────────────────────
router.get("/me/devices", userController.getDevices);
router.delete("/me/devices/:id", userController.revokeDevice);
router.post("/me/devices/revoke-others", userController.revokeOtherDevices);

// ── Authentification à deux facteurs ────────────────────────────────────
router.post("/me/2fa/setup", userController.start2FASetup);
router.post("/me/2fa/verify", userController.verify2FASetup);
router.post("/me/2fa/disable", userController.disable2FA);

// ── Moyens de paiement (Stripe) ──────────────────────────────────────────
router.get("/me/payment-methods", userController.getPaymentMethods);
router.post(
  "/me/payment-methods/setup-intent",
  userController.createPaymentMethodSetupIntent
);
router.delete("/me/payment-methods/:id", userController.deletePaymentMethod);

// ── Export des données / suppression du compte ───────────────────────────
router.get("/me/data-export", userController.dataExport);
router.delete("/me", userController.deleteAccount);

module.exports = router;