const nodemailer = require("nodemailer");
const dns = require("dns");

const APP_NAME = "Cravon";
const BRAND_COLOR = "#FF5A5F";

/** Render/cloud hosts often lack IPv6 egress — Gmail SMTP must use IPv4. */
const ipv4Lookup = (hostname, _options, callback) => {
  dns.lookup(hostname, { family: 4 }, callback);
};

const getTransporter = () => {
  const host = process.env.SMTP_HOST;
  if (!host) return null;

  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: (process.env.SMTP_PASS || "").replace(/\s/g, ""),
    },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000,
    lookup: ipv4Lookup,
    tls: {
      minVersion: "TLSv1.2",
    },
  });
};

const buildPasswordResetHtml = ({ name, resetUrl }) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset your ${APP_NAME} password</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f4f5;padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:${BRAND_COLOR};padding:28px 32px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:800;letter-spacing:-0.5px;">${APP_NAME}</h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.9);font-size:14px;">Food delivery, done right</p>
            </td>
          </tr>
          <tr>
            <td style="padding:36px 32px;">
              <h2 style="margin:0 0 12px;color:#18181b;font-size:22px;font-weight:700;">Reset your password</h2>
              <p style="margin:0 0 20px;color:#52525b;font-size:15px;line-height:1.6;">
                Hi ${name || "there"},<br /><br />
                We received a request to reset the password for your ${APP_NAME} account. Click the button below to choose a new password. This link expires in <strong>1 hour</strong>.
              </p>
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin:28px 0;">
                <tr>
                  <td style="border-radius:999px;background:${BRAND_COLOR};">
                    <a href="${resetUrl}" target="_blank" rel="noopener noreferrer"
                      style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 8px;color:#71717a;font-size:13px;line-height:1.6;">
                If the button doesn't work, copy and paste this link into your browser:
              </p>
              <p style="margin:0 0 24px;word-break:break-all;color:${BRAND_COLOR};font-size:13px;line-height:1.5;">
                <a href="${resetUrl}" style="color:${BRAND_COLOR};">${resetUrl}</a>
              </p>
              <hr style="border:none;border-top:1px solid #e4e4e7;margin:24px 0;" />
              <p style="margin:0;color:#a1a1aa;font-size:12px;line-height:1.6;">
                If you didn't request a password reset, you can safely ignore this email. Your password will not change.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#fafafa;padding:20px 32px;text-align:center;border-top:1px solid #f4f4f5;">
              <p style="margin:0;color:#a1a1aa;font-size:12px;">
                © ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

const sendPasswordResetEmail = async ({ to, name, resetUrl }) => {
  const from = process.env.SMTP_FROM || `"${APP_NAME}" <noreply@cravon.com>`;
  const subject = `Reset your ${APP_NAME} password`;
  const html = buildPasswordResetHtml({ name, resetUrl });
  const text = `Hi ${name || "there"},\n\nReset your ${APP_NAME} password using this link (expires in 1 hour):\n${resetUrl}\n\nIf you didn't request this, ignore this email.`;

  const transporter = getTransporter();
  if (!transporter) {
    console.log("\n--- PASSWORD RESET (SMTP not configured) ---");
    console.log(`To: ${to}`);
    console.log(`Reset link: ${resetUrl}`);
    console.log("--------------------------------------------\n");
    return { devMode: true };
  }

  await transporter.sendMail({ from, to, subject, html, text });
  return { devMode: false };
};

module.exports = { sendPasswordResetEmail };
