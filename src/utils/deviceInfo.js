const crypto = require("crypto");

/**
 * Builds a stable, anonymous-ish device identity from the request so we can
 * track "connected devices" without asking the client to generate/store an
 * ID itself. Not perfect (same browser/IP = same device) but good enough
 * for a security-settings screen.
 */
function getDeviceIdentity(req) {
  const userAgent = req.headers["user-agent"] || "Appareil inconnu";
  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.ip ||
    req.connection?.remoteAddress ||
    "";

  const deviceId = crypto
    .createHash("sha256")
    .update(`${userAgent}-${ip}`)
    .digest("hex")
    .slice(0, 16);

  let name = "Appareil inconnu";
  if (/ipad/i.test(userAgent)) name = "iPad";
  else if (/iphone/i.test(userAgent)) name = "iPhone";
  else if (/android/i.test(userAgent)) name = "Appareil Android";
  else if (/windows/i.test(userAgent)) name = "PC Windows";
  else if (/macintosh|mac os/i.test(userAgent)) name = "Mac";
  else if (/dart|flutter/i.test(userAgent)) name = "Application Weezo";

  return {
    deviceId,
    name,
    location: ip ? `IP ${ip}` : "",
  };
}

module.exports = { getDeviceIdentity };