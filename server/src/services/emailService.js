const nodemailer = require("nodemailer");
const sgMail = require("@sendgrid/mail");

const APP_NAME = "Cravon";
const BRAND_COLOR = "#FF5A5F";

const getFromAddress = () =>
  process.env.EMAIL_FROM || process.env.SMTP_FROM || `${APP_NAME} <noreply@cravon.com>`;

/** Parse "Name <email@x.com>" or plain email for SendGrid */
const parseFromAddress = () => {
  const raw = getFromAddress().trim();
  const named = raw.match(/^"?([^"<]+)"?\s*<([^>]+)>$/);
  if (named) {
    return { name: named[1].trim(), email: named[2].trim() };
  }
  return { email: raw.replace(/"/g, ""), name: APP_NAME };
};

const getSmtpTransporter = () => {
  const host = process.env.SMTP_HOST;
  if (!host) return null;

  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
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

const sendViaSendGrid = async ({ to, subject, html, text }) => {
  const apiKey = process.env.SENDGRID_API_KEY?.trim();
  if (!apiKey) {
    const err = new Error("SENDGRID_API_KEY is not configured");
    err.status = 503;
    throw err;
  }

  sgMail.setApiKey(apiKey);
  const from = parseFromAddress();

  try {
    await sgMail.send({ to, from, subject, html, text });
  } catch (err) {
    const sgMessage = err.response?.body?.errors?.[0]?.message || err.message;
    console.error("SendGrid send failed:", {
      from: from.email,
      to,
      status: err.code,
      errors: err.response?.body?.errors,
    });

    const emailErr = new Error(
      err.code === 403 || /forbidden|verified|sender/i.test(sgMessage)
        ? `SendGrid rejected the sender (${from.email}). Verify this email under SendGrid → Settings → Sender Authentication.`
        : `Email delivery failed: ${sgMessage}`
    );
    emailErr.status = 503;
    throw emailErr;
  }
};

const sendViaSmtp = async ({ to, from, subject, html, text }) => {
  const transporter = getSmtpTransporter();
  if (!transporter) return false;
  await transporter.sendMail({ from, to, subject, html, text });
  return true;
};

const sendPasswordResetEmail = async ({ to, name, resetUrl }) => {
  const from = getFromAddress();
  const subject = `Reset your ${APP_NAME} password`;
  const html = buildPasswordResetHtml({ name, resetUrl });
  const text = `Hi ${name || "there"},\n\nReset your ${APP_NAME} password using this link (expires in 1 hour):\n${resetUrl}\n\nIf you didn't request this, ignore this email.`;

  if (process.env.SENDGRID_API_KEY?.trim()) {
    await sendViaSendGrid({ to, subject, html, text });
    return { provider: "sendgrid" };
  }

  const smtpSent = await sendViaSmtp({ to, from, subject, html, text }).catch(() => false);
  if (smtpSent) return { provider: "smtp" };

  console.log("\n--- PASSWORD RESET (no email provider configured) ---");
  console.log(`To: ${to}`);
  console.log(`Reset link: ${resetUrl}`);
  console.log("----------------------------------------------------\n");
  return { provider: "console" };
};

module.exports = { sendPasswordResetEmail };
