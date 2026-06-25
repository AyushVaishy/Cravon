const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");
const { getGoogleOAuthClient } = require("../config/google");
const { getFrontendUrl } = require("../config/urls");
const { setRefreshCookie, clearRefreshCookie } = require("../utils/cookies");
const { sendPasswordResetEmail } = require("../services/emailService");

const RESET_TOKEN_BYTES = 32;
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

const userPayload = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
});

const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "120m" }
  );
  const refreshToken = jwt.sign(
    { id: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" }
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
      if (exists.googleId && !exists.password) {
        return res.status(409).json({ message: "This email is registered with Google. Please sign in with Google." });
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
      },
    });

    const session = await issueSession(res, user);
    res.status(201).json(session);
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ message: "Invalid email or password" });

    if (!user.password) {
      return res.status(401).json({
        message: "This account uses Google sign-in. Please continue with Google.",
      });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: "Invalid email or password" });

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

    try {
      await sendPasswordResetEmail({ to: user.email, name: user.name, resetUrl });
    } catch (emailErr) {
      console.error("Forgot password email failed:", emailErr.message);
      await prisma.passwordResetToken.deleteMany({ where: { tokenHash } });
      return res.status(503).json({
        message: "Could not send reset email right now. Please try again in a few minutes.",
      });
    }

    res.json({ message: genericMessage });
  } catch (err) {
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
          authProvider: record.user.googleId ? record.user.authProvider : "LOCAL",
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
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true, phone: true, role: true, addresses: true },
    });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ user });
  } catch (err) {
    next(err);
  }
};

const updateMe = async (req, res, next) => {
  try {
    const { name, phone } = req.body;
    const data = {};
    if (name?.trim()) data.name = name.trim();
    if (phone !== undefined) data.phone = phone;

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
    if (!providedOld || !newPassword) return res.status(400).json({ message: "Both passwords required" });
    if (newPassword.length < 8) return res.status(400).json({ message: "New password must be at least 8 characters" });
    if (!/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      return res.status(400).json({ message: "Password must contain at least one uppercase letter and one number" });
    }
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user?.password) {
      return res.status(400).json({ message: "Set a password via forgot-password flow first, or use Google sign-in." });
    }
    const valid = await bcrypt.compare(providedOld, user.password);
    if (!valid) return res.status(400).json({ message: "Current password is incorrect" });
    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: req.user.id }, data: { password: hashed } });
    res.json({ message: "Password changed successfully" });
  } catch (err) {
    next(err);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { name, phone } = req.body;
    const data = {};
    if (name && name.trim()) data.name = name.trim();
    if (phone !== undefined) data.phone = phone.trim() || null;
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

    let requestedRole = "USER";
    try {
      const parsed = JSON.parse(state || "{}");
      if (parsed.role === "RESTAURANT_OWNER") requestedRole = "RESTAURANT_OWNER";
    } catch {
      /* ignore malformed state */
    }

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

    const { accessToken, refreshToken } = generateTokens(user);
    await prisma.user.update({ where: { id: user.id }, data: { refreshToken } });
    setRefreshCookie(res, refreshToken);

    const params = new URLSearchParams({
      accessToken,
      user: JSON.stringify(userPayload(user)),
    });
    if (user.role === "RESTAURANT_OWNER" && requestedRole === "RESTAURANT_OWNER") {
      params.set("newOwner", "1");
    }

    res.redirect(`${frontendUrl}/auth/google/callback?${params.toString()}`);
  } catch (err) {
    console.error("Google OAuth callback error:", err.message);
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
  getMe,
  updateMe,
  changePassword,
  updateProfile,
  googleAuth,
  googleCallback,
};
