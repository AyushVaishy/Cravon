import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { FaEye, FaEyeSlash, FaLock } from "react-icons/fa";
import { verifyResetToken, resetPassword } from "../services/authService";
import { validatePassword, PASSWORD_HINT } from "../utils/passwordValidation";

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [checking, setChecking] = useState(true);
  const [valid, setValid] = useState(false);
  const [maskedEmail, setMaskedEmail] = useState("");
  const [verifyError, setVerifyError] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setChecking(false);
      setVerifyError("Invalid reset link. Please request a new one.");
      return;
    }

    verifyResetToken(token)
      .then((res) => {
        setValid(res.data.valid);
        setMaskedEmail(res.data.email || "");
      })
      .catch((err) => {
        setVerifyError(err?.response?.data?.message || "This reset link is invalid or has expired.");
      })
      .finally(() => setChecking(false));
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nextErrors = {};
    const pwErr = validatePassword(password);
    if (pwErr) nextErrors.password = pwErr;
    if (password !== confirmPassword) nextErrors.confirmPassword = "Passwords do not match";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSubmitting(true);
    try {
      await resetPassword({ token, newPassword: password, confirmPassword });
      toast.success("Password updated! Please sign in.");
      navigate("/", { replace: true });
    } catch (err) {
      const data = err?.response?.data;
      if (data?.errors?.length) {
        const fe = {};
        data.errors.forEach(({ field, message }) => { fe[field] = message; });
        setErrors(fe);
      } else {
        toast.error(data?.message || "Failed to reset password.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = (field) =>
    `w-full px-5 py-3.5 border rounded-full outline-none transition-all text-sm font-medium text-foreground placeholder:text-muted-foreground bg-background ${
      errors[field] ? "border-red-400 focus:border-red-500" : "border-border focus:border-primary focus:ring-1 focus:ring-primary"
    }`;

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center">
          <div className="animate-spin h-10 w-10 border-b-2 border-primary rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground font-medium">Verifying reset link…</p>
        </div>
      </div>
    );
  }

  if (!valid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-md w-full bg-card border border-border rounded-3xl p-8 text-center shadow-sm">
          <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
            <FaLock className="text-red-500 text-xl" />
          </div>
          <h1 className="text-xl font-extrabold text-foreground mb-2">Link expired or invalid</h1>
          <p className="text-muted-foreground text-sm mb-6">{verifyError}</p>
          <Link
            to="/"
            className="inline-block w-full bg-primary hover:opacity-90 text-white py-3 rounded-full font-bold text-sm transition"
          >
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <FaLock className="text-primary text-xl" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground mb-2">Set a new password</h1>
          {maskedEmail && (
            <p className="text-muted-foreground text-sm">For account <span className="font-semibold text-foreground">{maskedEmail}</span></p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm">
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-4 mb-1 block">New password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: "" })); }}
                className={inputClass("password")}
                placeholder="New password"
                autoComplete="new-password"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            {errors.password ? (
              <p className="text-red-500 text-xs mt-1.5 ml-4">{errors.password}</p>
            ) : (
              <p className="text-muted-foreground text-xs mt-1.5 ml-4">{PASSWORD_HINT}</p>
            )}
          </div>

          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-4 mb-1 block">Confirm password</label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setErrors((p) => ({ ...p, confirmPassword: "" })); }}
                className={inputClass("confirmPassword")}
                placeholder="Confirm new password"
                autoComplete="new-password"
              />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showConfirm ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            {errors.confirmPassword && <p className="text-red-500 text-xs mt-1.5 ml-4">{errors.confirmPassword}</p>}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-primary hover:opacity-90 text-white py-3.5 rounded-full font-bold text-base transition disabled:opacity-60 mt-2"
          >
            {submitting ? "Updating…" : "Update password"}
          </button>
        </form>

        <p className="text-center text-muted-foreground text-sm mt-6">
          Remember your password?{" "}
          <Link to="/" className="text-foreground font-bold hover:text-primary">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
