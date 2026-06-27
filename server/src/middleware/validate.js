const { z } = require("zod");

const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const errors = result.error.errors.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    }));
    return res.status(400).json({ message: "Validation failed", errors });
  }
  req.body = result.data;
  next();
};

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[0-9]/, "Password must contain at least one number");

const userSignupSchema = z.object({
  role: z.literal("USER").optional(),
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address"),
  password: passwordSchema,
  phone: z.string().regex(/^[6-9]\d{9}$/, "Invalid Indian phone number").optional(),
});

// Owner signup only creates the user account — restaurant is created separately via /owner/onboard
const ownerSignupSchema = z.object({
  role: z.literal("RESTAURANT_OWNER"),
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address"),
  password: passwordSchema,
  phone: z.string().regex(/^[6-9]\d{9}$/, "Invalid Indian phone number").optional(),
});

// Discriminated union: parse role first, then validate accordingly
const signupSchema = z.discriminatedUnion("role", [
  ownerSignupSchema,
  userSignupSchema,
]);

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  newPassword: passwordSchema,
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

const changePasswordSchema = z.object({
  oldPassword: z.string().optional(),
  currentPassword: z.string().optional(),
  newPassword: passwordSchema,
});

const verifyEmailSchema = z.object({
  email: z.string().email("Invalid email address"),
  code: z.string().regex(/^\d{6}$/, "Enter the 6-digit verification code"),
});

const resendVerificationSchema = z.object({
  email: z.string().email("Invalid email address"),
});

module.exports = {
  validate,
  signupSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  passwordSchema,
};
