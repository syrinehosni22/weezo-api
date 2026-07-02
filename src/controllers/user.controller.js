const speakeasy = require("speakeasy");
const qrcode = require("qrcode");
const Stripe = require("stripe");
const User = require("../models/User");
const { success, error } = require("../utils/response");

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

// ── Préférences / Sécurité du compte / Confidentialité localisation ───────
// GET /api/users/me/settings
exports.getSettings = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select("settings twoFactorEnabled");
    if (!user) return error(res, "User not found", 404);

    const { settings } = user.toObject();
    success(res, { ...settings, twoFactorEnabled: user.twoFactorEnabled });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/users/me/settings
// body: any subset of { notifications, darkMode, language, unusualLoginAlerts,
//                        locationSharingEnabled, locationMode }
exports.updateSettings = async (req, res, next) => {
  try {
    const allowed = [
      "notifications",
      "darkMode",
      "language",
      "unusualLoginAlerts",
      "locationSharingEnabled",
      "locationMode",
    ];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[`settings.${key}`] = req.body[key];
    }
    if (Object.keys(updates).length === 0) {
      return error(res, "No valid settings fields provided", 400);
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select("settings twoFactorEnabled");
    if (!user) return error(res, "User not found", 404);

    const { settings } = user.toObject();
    success(res, { ...settings, twoFactorEnabled: user.twoFactorEnabled }, "Settings updated");
  } catch (err) {
    next(err);
  }
};

// ── Appareils connectés ──────────────────────────────────────────────────
// GET /api/users/me/devices
exports.getDevices = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select("devices");
    if (!user) return error(res, "User not found", 404);
    success(res, user.devices);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/users/me/devices/:id
exports.revokeDevice = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findById(req.user.id).select("devices");
    if (!user) return error(res, "User not found", 404);

    const target = user.devices.find((d) => d.deviceId === id);
    if (!target) return error(res, "Device not found", 404);
    if (target.current) {
      return error(res, "Impossible de révoquer l'appareil actuel", 400);
    }

    user.devices = user.devices.filter((d) => d.deviceId !== id);
    await user.save();
    success(res, {}, "Device revoked");
  } catch (err) {
    next(err);
  }
};

// POST /api/users/me/devices/revoke-others
exports.revokeOtherDevices = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select("devices");
    if (!user) return error(res, "User not found", 404);

    user.devices = user.devices.filter((d) => d.current);
    await user.save();
    success(res, {}, "Other devices revoked");
  } catch (err) {
    next(err);
  }
};

// ── Authentification à deux facteurs (TOTP) ────────────────────────────────
// POST /api/users/me/2fa/setup
exports.start2FASetup = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return error(res, "User not found", 404);

    const secret = speakeasy.generateSecret({
      name: `Weezo (${user.email})`,
      length: 20,
    });

    user.twoFactorTempSecret = secret.base32;
    await user.save();

    const qrCodeDataUrl = await qrcode.toDataURL(secret.otpauth_url);

    success(res, { qrCodeDataUrl, secret: secret.base32 });
  } catch (err) {
    next(err);
  }
};

// POST /api/users/me/2fa/verify  body: { code }
exports.verify2FASetup = async (req, res, next) => {
  try {
    const { code } = req.body;
    if (!code) return error(res, "Code requis", 400);

    const user = await User.findById(req.user.id).select("+twoFactorTempSecret");
    if (!user || !user.twoFactorTempSecret) {
      return error(res, "Aucune configuration 2FA en cours", 400);
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorTempSecret,
      encoding: "base32",
      token: code,
      window: 1,
    });
    if (!verified) return error(res, "Code invalide", 400);

    user.twoFactorSecret = user.twoFactorTempSecret;
    user.twoFactorTempSecret = undefined;
    user.twoFactorEnabled = true;
    await user.save();

    success(res, {}, "2FA activée");
  } catch (err) {
    next(err);
  }
};

// POST /api/users/me/2fa/disable
exports.disable2FA = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return error(res, "User not found", 404);

    user.twoFactorEnabled = false;
    user.twoFactorSecret = undefined;
    user.twoFactorTempSecret = undefined;
    await user.save();

    success(res, {}, "2FA désactivée");
  } catch (err) {
    next(err);
  }
};

// ── Moyens de paiement (via Stripe — jamais de PAN/CVV sur notre serveur) ──
// GET /api/users/me/payment-methods
exports.getPaymentMethods = async (req, res, next) => {
  try {
    if (!stripe) return error(res, "Stripe non configuré", 500);
    const user = await User.findById(req.user.id).select("+stripeCustomerId");
    if (!user) return error(res, "User not found", 404);
    if (!user.stripeCustomerId) return success(res, []);

    const methods = await stripe.paymentMethods.list({
      customer: user.stripeCustomerId,
      type: "card",
    });

    success(
      res,
      methods.data.map((m) => ({
        id: m.id,
        last4: m.card.last4,
        expiry: `${String(m.card.exp_month).padStart(2, "0")}/${String(
          m.card.exp_year
        ).slice(-2)}`,
        brand: m.card.brand,
      }))
    );
  } catch (err) {
    next(err);
  }
};

// POST /api/users/me/payment-methods/setup-intent
// Returns everything Flutter's Stripe Payment Sheet needs to securely
// collect card details client-side (they never transit through our API).
exports.createPaymentMethodSetupIntent = async (req, res, next) => {
  try {
    if (!stripe) return error(res, "Stripe non configuré", 500);
    const user = await User.findById(req.user.id).select("+stripeCustomerId email name");
    if (!user) return error(res, "User not found", 404);

    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
      });
      customerId = customer.id;
      user.stripeCustomerId = customerId;
      await user.save();
    }

    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customerId },
      { apiVersion: "2022-11-15" }
    );

    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      usage: "off_session",
    });

    success(res, {
      setupIntentClientSecret: setupIntent.client_secret,
      ephemeralKey: ephemeralKey.secret,
      customerId,
    });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/users/me/payment-methods/:id
exports.deletePaymentMethod = async (req, res, next) => {
  try {
    if (!stripe) return error(res, "Stripe non configuré", 500);
    const { id } = req.params;
    await stripe.paymentMethods.detach(id);
    success(res, {}, "Payment method removed");
  } catch (err) {
    next(err);
  }
};

// ── Export des données / suppression du compte ─────────────────────────────
// GET /api/users/me/data-export
exports.dataExport = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select(
      "-password -twoFactorSecret -twoFactorTempSecret -stripeCustomerId"
    );
    if (!user) return error(res, "User not found", 404);
    success(res, user);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/users/me
exports.deleteAccount = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select("+stripeCustomerId");
    if (!user) return error(res, "User not found", 404);

    if (stripe && user.stripeCustomerId) {
      try {
        await stripe.customers.del(user.stripeCustomerId);
      } catch (e) {
        console.error("Stripe customer deletion failed:", e.message);
      }
    }

    await User.findByIdAndDelete(req.user.id);
    success(res, {}, "Account deleted");
  } catch (err) {
    next(err);
  }
};