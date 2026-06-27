const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");
const { getGoogleOAuthClient } = require("../config/google");
const {
  getFacebookAuthUrl,
  exchangeFacebookCode,
  fetchFacebookProfile,
} = require("../config/facebook");
const { getFrontendUrl } = require("../config/urls");
const { setRefreshCookie, clearRefreshCookie } = require("../utils/cookies");
const { sendPasswordResetEmail, sendVerificationOtpEmail } = require("../services/emailService");

const RESET_TOKEN_BYTES = 32;
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour
const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const OTP_MAX_ATTEMPTS = 5;

const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

const hashOtp = (code) => crypto.createHash("sha256").update(String(code).trim()).digest("hex");

const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));

const createAndSendVerificationOtp = async (user) => {
  const code = generateOtp();
  const codeHash = hashOtp(code);
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  await prisma.emailVerificationCode.updateMany({
    where: { userId: user.id, usedAt: null },
    data: { usedAt: new Date() },
  });

  await prisma.emailVerificationCode.create({
    data: { userId: user.id, codeHash, expiresAt },
  });

  await sendVerificationOtpEmail({ to: user.email, name: user.name, code });
};

const facebookPlaceholderEmail = (facebookId) => `${facebookId}@facebook.cravon.local`;

const socialSignInMessage = (user) => {
  if (user.googleId) return "This account uses Google sign-in. Please continue with Google.";
  if (user.facebookId) return "This account uses Facebook sign-in. Please continue with Facebook.";
  return "This account uses social sign-in. Please use Google or Facebook.";
};

const isDeliverableEmail = (email) =>
  Boolean(email && !email.endsWith("@facebook.cravon.local"));

const parseOAuthRole = (state) => {
  try {
    const parsed = JSON.parse(state || "{}");
    return parsed.role === "RESTAURANT_OWNER" ? "RESTAURANT_OWNER" : "USER";
  } catch {
    return "USER";
  }
};

const finishOAuthRedirect = async (res, user, requestedRole, frontendUrl, callbackPath) => {
  const { accessToken } = await issueSession(res, user);
  const params = new URLSearchParams({
    accessToken,
    user: JSON.stringify(userPayload(user)),
  });
  if (user.role === "RESTAURANT_OWNER" && requestedRole === "RESTAURANT_OWNER") {
    params.set("newOwner", "1");
  }
  res.redirect(`${frontendUrl}${callbackPath}?${params.toString()}`);
};

const userPayload = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  emailVerified: Boolean(user.emailVerified),
});

const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES || "15m" }
  );
  const refreshToken = jwt.sign(
    { id: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES || "7d" }
  );
  return { accessToken, refreshToken };
};

const issueSession = async (res, user) => {
  const { accessToken, refreshToken } = generateTokens(user);
  await prisma.user.update({ where: { id: user.id }, data: { refreshToken } });
  setRefreshCookie(res, refreshToken);
  return { accessToken, user: userPayload(user) };
};

const signup = async (req, res, next) => {
  try {
    const { name, email, password, phone, role } = req.body;

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      if ((exists.googleId || exists.facebookId) && !exists.password) {
        return res.status(409).json({ message: socialSignInMessage(exists) });
      }
      if (!exists.emailVerified && exists.authProvider === "LOCAL" && exists.password) {
        const hashedPassword = await bcrypt.hash(password, 12);
        const user = await prisma.user.update({
          where: { id: exists.id },
          data: { name, password: hashedPassword, phone: phone ?? exists.phone },
        });
        await createAndSendVerificationOtp(user);
        return res.status(201).json({
          pendingVerification: true,
          email: user.email,
          message: "Verification code sent. Check your email to complete signup.",
        });
      }
      return res.status(409).json({ message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const userRole = role === "RESTAURANT_OWNER" ? "RESTAURANT_OWNER" : "USER";

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone,
        role: userRole,
        authProvider: "LOCAL",
        emailVerified: false,
      },
    });

    await createAndSendVerificationOtp(user);
    res.status(201).json({
      pendingVerification: true,
      email: user.email,
      message: "Verification code sent. Check your email to complete signup.",
    });
  } catch (err) {
    console.error("signup error:", err.message);
    if (err.status === 503) {
      return res.status(503).json({
        message:
          process.env.NODE_ENV === "production"
            ? "Unable to send verification email right now. Please try again later."
            : err.message || "Unable to send verification email.",
      });
    }
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ message: "Invalid email or password" });

    if (!user.password) {
      return res.status(401).json({ message: socialSignInMessage(user) });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: "Invalid email or password" });

    if (user.authProvider === "LOCAL" && !user.emailVerified) {
      await createAndSendVerificationOtp(user);
      return res.status(403).json({
        message: "Please verify your email first. We've sent a new verification code.",
        needsVerification: true,
        email: user.email,
      });
    }

    const session = await issueSession(res, user);
    res.json(session);
  } catch (err) {
    next(err);
  }
};

const logout = async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken;
    if (token) {
      await prisma.user.updateMany({ where: { refreshToken: token }, data: { refreshToken: null } });
    }
    clearRefreshCookie(res);
    res.json({ message: "Logged out successfully" });
  } catch (err) {
    next(err);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) return res.status(401).json({ message: "No refresh token" });

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user || user.refreshToken !== token) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const { accessToken, refreshToken: newRefresh } = generateTokens(user);
    await prisma.user.update({ where: { id: user.id }, data: { refreshToken: newRefresh } });
    setRefreshCookie(res, newRefresh);

    res.json({ accessToken });
  } catch (err) {
    next(err);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const genericMessage =
      "If an account exists with that email, we've sent password reset instructions.";

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.json({ message: genericMessage });
    }

    if (!isDeliverableEmail(user.email)) {
      return res.json({ message: genericMessage });
    }

    const rawToken = crypto.randomBytes(RESET_TOKEN_BYTES).toString("hex");
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

    await prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    await prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash, expiresAt },
    });

    const frontendUrl = getFrontendUrl();
    const resetUrl = `${frontendUrl}/auth/reset-password?token=${rawToken}`;

    await sendPasswordResetEmail({ to: user.email, name: user.name, resetUrl });

    res.json({ message: genericMessage });
  } catch (err) {
    console.error("forgot-password error:", err.message);
    if (err.status === 503) {
      return res.status(503).json({
        message:
          process.env.NODE_ENV === "production"
            ? "Unable to send reset email right now. Please try again later."
            : err.message || "Unable to send reset email. Please try again later.",
      });
    }
    next(err);
  }
};

const verifyResetToken = async (req, res, next) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ valid: false, message: "Token is required" });

    const tokenHash = hashToken(token);
    const record = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: { select: { email: true } } },
    });

    if (!record || record.usedAt || record.expiresAt < new Date()) {
      return res.status(400).json({ valid: false, message: "This reset link is invalid or has expired." });
    }

    const email = record.user.email;
    const masked = email.replace(/(.{2})(.*)(@.*)/, (_, a, b, c) => `${a}${"*".repeat(Math.min(b.length, 6))}${c}`);

    res.json({ valid: true, email: masked });
  } catch (err) {
    next(err);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    const tokenHash = hashToken(token);
    const record = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!record || record.usedAt || record.expiresAt < new Date()) {
      return res.status(400).json({ message: "This reset link is invalid or has expired. Please request a new one." });
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.$transaction([
      prisma.user.update({
        where: { id: record.userId },
        data: {
          password: hashed,
          authProvider: "LOCAL",
          emailVerified: true,
        },
      }),
      prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      prisma.user.update({
        where: { id: record.userId },
        data: { refreshToken: null },
      }),
    ]);

    clearRefreshCookie(res);
    res.json({ message: "Password reset successfully. You can now sign in with your new password." });
  } catch (err) {
    next(err);
  }
};

const getMe = async (req, res, next) => {
  try {
    const record = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        emailVerified: true,
        password: true,
        googleId: true,
        facebookId: true,
        addresses: true,
      },
    });
    if (!record) return res.status(404).json({ message: "User not found" });

    const { password, googleId, facebookId, ...user } = record;
    res.json({
      user: {
        ...user,
        hasPassword: Boolean(password),
        linkedGoogle: Boolean(googleId),
        linkedFacebook: Boolean(facebookId),
      },
    });
  } catch (err) {
    next(err);
  }
};

const verifyEmail = async (req, res, next) => {
  try {
    const { email, code } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ message: "Invalid verification request." });

    if (user.emailVerified) {
      const session = await issueSession(res, user);
      return res.json({ ...session, alreadyVerified: true });
    }

    const record = await prisma.emailVerificationCode.findFirst({
      where: { userId: user.id, usedAt: null },
      orderBy: { createdAt: "desc" },
    });

    if (!record || record.expiresAt < new Date()) {
      return res.status(400).json({ message: "Verification code expired. Request a new one." });
    }

    if (record.attempts >= OTP_MAX_ATTEMPTS) {
      return res.status(429).json({ message: "Too many attempts. Request a new verification code." });
    }

    if (record.codeHash !== hashOtp(code)) {
      await prisma.emailVerificationCode.update({
        where: { id: record.id },
        data: { attempts: { increment: 1 } },
      });
      return res.status(400).json({ message: "Invalid verification code. Please try again." });
    }

    const verifiedUser = await prisma.$transaction(async (tx) => {
      await tx.emailVerificationCode.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      });
      return tx.user.update({
        where: { id: user.id },
        data: { emailVerified: true },
      });
    });

    const session = await issueSession(res, verifiedUser);
    res.json(session);
  } catch (err) {
    next(err);
  }
};

const resendVerification = async (req, res, next) => {
  try {
    const { email } = req.body;
    const genericMessage = "If your account needs verification, we've sent a new code to your email.";

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.emailVerified || user.authProvider !== "LOCAL") {
      return res.json({ message: genericMessage });
    }

    await createAndSendVerificationOtp(user);
    res.json({ message: genericMessage });
  } catch (err) {
    console.error("resend-verification error:", err.message);
    if (err.status === 503) {
      return res.status(503).json({
        message:
          process.env.NODE_ENV === "production"
            ? "Unable to send verification email right now. Please try again later."
            : err.message || "Unable to send verification email.",
      });
    }
    next(err);
  }
};

const updateMe = async (req, res, next) => {
  try {
    const { name, phone } = req.body;
    const data = {};
    if (name?.trim()) data.name = name.trim();
    if (phone !== undefined) data.phone = typeof phone === "string" ? phone.trim() || null : phone;

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data,
      select: { id: true, name: true, email: true, phone: true, role: true },
    });
    res.json({ user });
  } catch (err) {
    next(err);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { oldPassword, currentPassword, newPassword } = req.body;
    const providedOld = oldPassword || currentPassword;
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ message: "User not found" });

    const hashed = await bcrypt.hash(newPassword, 12);

    if (!user.password) {
      await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });
      return res.json({ message: "Password added successfully. You can now sign in with email and password." });
    }

    if (!providedOld?.trim()) {
      return res.status(400).json({ message: "Current password is required" });
    }
    const valid = await bcrypt.compare(providedOld, user.password);
    if (!valid) return res.status(400).json({ message: "Current password is incorrect" });

    await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });
    res.json({ message: "Password changed successfully" });
  } catch (err) {
    next(err);
  }
};

const googleAuth = (req, res, next) => {
  try {
    const client = getGoogleOAuthClient();
    const role = req.query.role === "RESTAURANT_OWNER" ? "RESTAURANT_OWNER" : "USER";
    const url = client.generateAuthUrl({
      access_type: "offline",
      scope: ["email", "profile"],
      prompt: "select_account",
      state: JSON.stringify({ role }),
    });
    res.redirect(url);
  } catch (err) {
    next(err);
  }
};

const googleCallback = async (req, res, next) => {
  const frontendUrl = getFrontendUrl();
  const failRedirect = `${frontendUrl}/auth/google/callback?error=google_auth_failed`;

  try {
    const { code, state, error } = req.query;
    if (error || !code) return res.redirect(failRedirect);

    const client = getGoogleOAuthClient();
    const { tokens } = await client.getToken(code);
    if (!tokens.id_token) return res.redirect(failRedirect);

    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const profile = ticket.getPayload();
    if (!profile?.email || !profile.sub) return res.redirect(failRedirect);

    const requestedRole = parseOAuthRole(state);

    let user = await prisma.user.findFirst({
      where: { OR: [{ googleId: profile.sub }, { email: profile.email }] },
    });

    if (user) {
      if (!user.googleId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { googleId: profile.sub, emailVerified: true },
        });
      }
    } else {
      user = await prisma.user.create({
        data: {
          name: profile.name || profile.email.split("@")[0],
          email: profile.email,
          googleId: profile.sub,
          authProvider: "GOOGLE",
          emailVerified: true,
          role: requestedRole === "RESTAURANT_OWNER" ? "RESTAURANT_OWNER" : "USER",
        },
      });
    }

    await finishOAuthRedirect(res, user, requestedRole, frontendUrl, "/auth/google/callback");
  } catch (err) {
    console.error("Google OAuth callback error:", err.message);
    res.redirect(failRedirect);
  }
};

const facebookAuth = (req, res, next) => {
  try {
    const role = req.query.role === "RESTAURANT_OWNER" ? "RESTAURANT_OWNER" : "USER";
    const url = getFacebookAuthUrl(JSON.stringify({ role }));
    res.redirect(url);
  } catch (err) {
    next(err);
  }
};

const facebookCallback = async (req, res, next) => {
  const frontendUrl = getFrontendUrl();
  const failRedirect = `${frontendUrl}/auth/facebook/callback?error=facebook_auth_failed`;

  try {
    const { code, state, error } = req.query;
    if (error || !code) return res.redirect(failRedirect);

    const accessToken = await exchangeFacebookCode(code);
    const profile = await fetchFacebookProfile(accessToken);
    if (!profile?.id) return res.redirect(failRedirect);

    const requestedRole = parseOAuthRole(state);

    const email = profile.email || facebookPlaceholderEmail(profile.id);
    const lookup = [{ facebookId: profile.id }];
    if (profile.email) lookup.push({ email: profile.email });

    let user = await prisma.user.findFirst({ where: { OR: lookup } });

    if (user) {
      const updates = {};
      if (!user.facebookId) updates.facebookId = profile.id;
      if (profile.email && !user.emailVerified) updates.emailVerified = true;
      if (Object.keys(updates).length) {
        user = await prisma.user.update({ where: { id: user.id }, data: updates });
      }
    } else {
      user = await prisma.user.create({
        data: {
          name: profile.name || "Facebook User",
          email,
          facebookId: profile.id,
          authProvider: "FACEBOOK",
          emailVerified: Boolean(profile.email),
          role: requestedRole === "RESTAURANT_OWNER" ? "RESTAURANT_OWNER" : "USER",
        },
      });
    }

    await finishOAuthRedirect(res, user, requestedRole, frontendUrl, "/auth/facebook/callback");
  } catch (err) {
    console.error("Facebook OAuth callback error:", err.message);
    res.redirect(failRedirect);
  }
};

module.exports = {
  signup,
  login,
  logout,
  refreshToken,
  forgotPassword,
  verifyResetToken,
  resetPassword,
  verifyEmail,
  resendVerification,
  getMe,
  updateMe,
  changePassword,
  googleAuth,
  googleCallback,
  facebookAuth,
  facebookCallback,
};
