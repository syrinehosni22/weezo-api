const mongoose = require("mongoose");

const deviceSchema = new mongoose.Schema(
  {
    deviceId: { type: String, required: true },
    name: { type: String, default: "Appareil inconnu" },
    location: { type: String, default: "" },
    lastActive: { type: Date, default: Date.now },
    current: { type: Boolean, default: false },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["USER", "ADMIN"],
      default: "USER",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isSubscribed: {
      type: Boolean,
      default: false,
    },

    // ── Préférences (Notifications / Dark mode / Langue) ─────────────────
    // ── Sécurité du compte (Alertes / Localisation) ───────────────────────
    settings: {
      notifications: { type: Boolean, default: true },
      darkMode: { type: Boolean, default: false },
      language: { type: String, default: "fr" },
      unusualLoginAlerts: { type: Boolean, default: true },
      locationSharingEnabled: { type: Boolean, default: false },
      locationMode: {
        type: String,
        enum: ["never", "whileUsing", "always"],
        default: "whileUsing",
      },
    },

    // ── Authentification à deux facteurs (TOTP) ───────────────────────────
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret: { type: String, select: false },
    twoFactorTempSecret: { type: String, select: false }, // en attente de vérification

    // ── Appareils connectés ────────────────────────────────────────────────
    devices: [deviceSchema],

    // ── Moyens de paiement (Stripe) ────────────────────────────────────────
    stripeCustomerId: { type: String, select: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);