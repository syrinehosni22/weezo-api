const { verifyToken } = require("../utils/jwt");

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = verifyToken(token);
    req.user = decoded; // { id, role, email }
    next();
  } catch (err) {
    // Log the *real* jsonwebtoken error server-side — this is what tells
    // you whether the token expired, was signed with a different
    // JWT_SECRET, or isn't a JWT at all (e.g. the client sent the wrong
    // string as the token).
    console.error(
      `❌ JWT verify failed: ${err.name} — ${err.message} | token received (first 20 chars): "${token?.slice(0, 20)}..."`
    );

    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" });
    }
    if (err.name === "JsonWebTokenError") {
      // Covers malformed tokens AND signature mismatches (wrong/rotated
      // JWT_SECRET) — both throw this same error name.
      return res.status(401).json({
        message:
          process.env.NODE_ENV === "production"
            ? "Invalid token"
            : `Invalid token: ${err.message}`, // e.g. "jwt malformed" or "invalid signature"
      });
    }
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};