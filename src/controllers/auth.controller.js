const User = require("../models/User");
const PasswordReset = require("../models/PasswordReset");
const { hashPassword, comparePassword } = require("../utils/hash");
const { generateToken } = require("../utils/jwt");
const { success, error } = require("../utils/response");
const { getDeviceIdentity } = require("../utils/deviceInfo");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const EmailVerification = require("../models/EmailVerification");
const sendVerificationEmail = require("../utils/sendVerificationEmail");
const sendPasswordResetEmail = require("../utils/sendPasswordResetEmail");
const generateOTP = require("../utils/generateOTP");

// weezo-api's public URL, used to build the link inside the reset email.
// Set PUBLIC_URL in your .env once you have a real domain — falls back to
// the current server IP otherwise.
const PUBLIC_URL = process.env.PUBLIC_URL || "http://92.222.243.150:5000";

// Marks the requesting device as "current" in user.devices, used by the
// "Appareils connectés" screen. Called from register/login.
function registerDevice(user, req) {
  const identity = getDeviceIdentity(req);
  user.devices = user.devices || [];
  user.devices.forEach((d) => (d.current = false));

  const existing = user.devices.find((d) => d.deviceId === identity.deviceId);
  if (existing) {
    existing.lastActive = new Date();
    existing.current = true;
    existing.name = identity.name;
    existing.location = identity.location;
  } else {
    user.devices.push({ ...identity, lastActive: new Date(), current: true });
  }
}

// REGISTER
exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) return error(res, "Email already registered", 400);

    // Hash password
    const hashed = await hashPassword(password);

    const user = await User.create({
      name,
      email,
      password: hashed,
    });

    registerDevice(user, req);
    await user.save();

    // Generate token
    const token = generateToken({ id: user._id, role: user.role, email: user.email });

    success(res, { user, token }, "User registered", 201);
  } catch (err) {
    next(err);
  }
};

// LOGIN
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return error(res, "Invalid credentials", 401);

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) return error(res, "Invalid credentials", 401);

    registerDevice(user, req);
    await user.save();

    const token = generateToken({ id: user._id, role: user.role, email: user.email });

    success(res, { user, token }, "Login successful");
  } catch (err) {
    next(err);
  }
};

// GET CURRENT USER
exports.me = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return error(res, "User not found", 404);

    success(res, { user });
  } catch (err) {
    next(err);
  }
};

// RESET PASSWORD — step 1: request a link
exports.resetPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    // Always respond success even if the user doesn't exist — avoids
    // leaking which emails are registered. We only actually send an email
    // when the account is real.
    if (!user) return success(res, {}, "Reset password link sent to email");

    await PasswordReset.deleteMany({ email });

    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

    await PasswordReset.create({
      email,
      tokenHash,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    });

    const resetUrl = `${PUBLIC_URL}/api/auth/reset-password/${rawToken}`;
    await sendPasswordResetEmail(email, resetUrl);

    success(res, {}, "Reset password link sent to email");
  } catch (err) {
    next(err);
  }
};

// RESET PASSWORD — step 2a: serve a minimal page to enter the new password
// GET /api/auth/reset-password/:token
exports.resetPasswordForm = async (req, res) => {
  const { token } = req.params;
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const record = await PasswordReset.findOne({ tokenHash });

  if (!record || record.expiresAt < new Date()) {
    return res.status(400).send(`
      <html><body style="font-family:sans-serif;text-align:center;padding:60px">
        <h2>Lien invalide ou expiré</h2>
        <p>Redemandez un lien de réinitialisation depuis l'application.</p>
      </body></html>
    `);
  }

  res.send(`
    <html><body style="font-family:sans-serif;max-width:400px;margin:60px auto;padding:0 20px">
      <h2>Nouveau mot de passe</h2>
      <form method="POST" action="/api/auth/reset-password/${token}">
        <input type="password" name="password" placeholder="Nouveau mot de passe"
               minlength="6" required
               style="width:100%;padding:12px;margin:10px 0;box-sizing:border-box" />
        <button type="submit"
                style="width:100%;padding:12px;background:#4A90E2;color:#fff;
                       border:none;border-radius:6px;font-size:16px">
          Valider
        </button>
      </form>
    </body></html>
  `);
};

// RESET PASSWORD — step 2b: consume the token, set the new password
// POST /api/auth/reset-password/:token
exports.resetPasswordConfirm = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).send("Mot de passe trop court (6 caractères minimum).");
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const record = await PasswordReset.findOne({ tokenHash });

    if (!record || record.expiresAt < new Date()) {
      return res.status(400).send("Lien invalide ou expiré.");
    }

    const user = await User.findOne({ email: record.email });
    if (!user) return res.status(404).send("Utilisateur introuvable.");

    user.password = await hashPassword(password);
    await user.save();
    await PasswordReset.deleteOne({ _id: record._id });

    res.send(`
      <html><body style="font-family:sans-serif;text-align:center;padding:60px">
        <h2>Mot de passe mis à jour ✅</h2>
        <p>Vous pouvez retourner sur l'application et vous reconnecter.</p>
      </body></html>
    `);
  } catch (err) {
    next(err);
  }
};

exports.sendCode = async (req, res) => {
  try {
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        message: "Name and email are required",
      });
    }

    // Remove old codes
    await EmailVerification.deleteMany({ email });

    // Generate OTP
    const code = generateOTP();
    const codeHash = await bcrypt.hash(code, 10);

    // Save code
    await EmailVerification.create({
      email,
      codeHash,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
    });
    console.log("sendVerificationEmail");

    // Send email via SendGrid
    await sendVerificationEmail(email, code);
    console.log("code sent to",email);
    return res.status(200).json({
      message: "Verification code sent",
    });
  } catch (err) {
    console.error("Send code error:", err);
    return res.status(500).json({
      message: "Failed to send verification code",
    });
  }
};

// VERIFY EMAIL CODE
exports.verifyCode = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({
        message: "Email and code are required",
      });
    }

    const record = await EmailVerification.findOne({ email });
    if (!record) {
      return res.status(400).json({
        message: "Invalid or expired verification code",
      });
    }

    // Check expiration
    if (record.expiresAt < new Date()) {
      await EmailVerification.deleteOne({ email });
      return res.status(400).json({
        message: "Verification code expired",
      });
    }

    // Compare code
    const isValid = await bcrypt.compare(code, record.codeHash);
    if (!isValid) {
      return res.status(400).json({
        message: "Invalid verification code",
      });
    }

    // Optional: mark user as verified
    await User.findOneAndUpdate(
      { email },
      { isEmailVerified: true },
      { new: true }
    );

    // Remove used code
    await EmailVerification.deleteOne({ email });

    return res.status(200).json({
      message: "Email verified successfully",
    });
  } catch (err) {
    console.error("Verify code error:", err);
    return res.status(500).json({
      message: "Verification failed",
    });
  }
};