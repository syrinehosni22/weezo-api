const transporter = require("./mailer");

/**
 * Sends a password reset link via OVH SMTP.
 * @param {string} to - Recipient email address
 * @param {string} resetUrl - Full URL the user clicks to set a new password
 */
const sendPasswordResetEmail = async (to, resetUrl) => {
  try {
    const info = await transporter.sendMail({
      from: `"Weezo App" <${process.env.MAIL_USER}>`,
      to,
      subject: "Réinitialisation de votre mot de passe",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 10px;">
          <h2 style="color: #333; text-align: center;">Réinitialisation du mot de passe</h2>
          <p style="font-size: 16px; color: #555;">Bonjour,</p>
          <p style="font-size: 16px; color: #555;">
            Vous avez demandé la réinitialisation de votre mot de passe Weezo.
            Ce lien est valable <b>1 heure</b> :
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}"
               style="background-color: #4A90E2; color: #fff; padding: 14px 28px;
                      border-radius: 8px; text-decoration: none; font-weight: bold;
                      display: inline-block;">
              Réinitialiser mon mot de passe
            </a>
          </div>
          <p style="font-size: 12px; color: #999; text-align: center;">
            Si vous n'êtes pas à l'origine de cette demande, ignorez cet email —
            votre mot de passe ne sera pas modifié.
          </p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #bbb; text-align: center;">&copy; ${new Date().getFullYear()} Weezo App. All rights reserved.</p>
        </div>
      `,
    });

    console.log("Password reset email sent: %s", info.messageId);
    return info;
  } catch (err) {
    console.error("--- FULL SMTP ERROR START ---");
    console.error(err);
    console.error("--- FULL SMTP ERROR END ---");
    throw err;
  }
};

module.exports = sendPasswordResetEmail;