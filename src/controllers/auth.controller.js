const User = require("../models/User");
const { hashPassword, comparePassword } = require("../utils/hash");
const { generateToken } = require("../utils/jwt");
const { success, error } = require("../utils/response");
const bcrypt = require("bcryptjs");
const EmailVerification = require("../models/EmailVerification");
const sendVerificationEmail = require("../utils/sendVerificationEmail");
const generateOTP = require("../utils/generateOTP");


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

// RESET PASSWORD (simple email simulation)
exports.resetPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return error(res, "User not found", 404);

    // TODO: send reset link via email
    success(res, {}, "Reset password link sent to email");
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