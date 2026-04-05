const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "ssl0.ovh.net",
  port: 465,
  secure: true,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

/**
 * Sends a verification email via OVH SMTP
 * @param {string} to - Recipient email address
 * @param {string} code - The 4-6 digit verification code
 */
const sendVerificationEmail = async (to, code) => {
  try {
    const info = await transporter.sendMail({
      from: `"Weezo App" <${process.env.MAIL_USER}>`,
      to,
      subject: "Email Verification Code",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 10px;">
          <h2 style="color: #333; text-align: center;">Email Verification</h2>
          <p style="font-size: 16px; color: #555;">Hello,</p>
          <p style="font-size: 16px; color: #555;">Use the following code to verify your email address. It is valid for <b>5 minutes</b>:</p>
          <div style="background-color: #f4f4f4; padding: 20px; text-align: center; border-radius: 5px; margin: 20px 0;">
            <h1 style="color: #4A90E2; letter-spacing: 5px; margin: 0; font-size: 40px;">${code}</h1>
          </div>
          <p style="font-size: 12px; color: #999; text-align: center;">
            If you did not request this code, please ignore this email or contact support if you have concerns.
          </p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #bbb; text-align: center;">&copy; ${new Date().getFullYear()} Weezo App. All rights reserved.</p>
        </div>
      `,
    });

    console.log("OVH Email Sent: %s", info.messageId);
    return info;
  } catch (err) {
    // MODIFICATION: Log the entire error object instead of just err.message
    console.error("--- FULL SMTP ERROR START ---");
    console.error(err); 
    console.error("--- FULL SMTP ERROR END ---");

    // Re-throw the full error object
    throw err;
  }
};

module.exports = sendVerificationEmail;