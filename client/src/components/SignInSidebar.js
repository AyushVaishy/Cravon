import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { setCredentials } from "../store/authSlice";
import { login, signup, forgotPassword, verifyEmail, resendVerification } from "../services/authService";
import { validatePassword, PASSWORD_HINT } from "../utils/passwordValidation";
import { FaTimes, FaEye, FaEyeSlash } from "react-icons/fa";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const getGoogleAuthUrl = (role = "USER") => {
  const params = new URLSearchParams({ role });
  return `${API_BASE_URL}/auth/google?${params.toString()}`;
};

const getFacebookAuthUrl = (role = "USER") => {
  const params = new URLSearchParams({ role });
  return `${API_BASE_URL}/auth/facebook?${params.toString()}`;
};

const ROLE_REDIRECT = {
  USER: "/home",
  RESTAURANT_OWNER: "/owner",
  ADMIN: "/admin",
};

const SignInSidebar = ({ isOpen, onClose, onSignIn, initialTab = "login" }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [selectedRole, setSelectedRole] = useState("USER");
  const [formData, setFormData] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);
  const [verifyEmailAddr, setVerifyEmailAddr] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setActiveTab(initialTab);
  }, [isOpen, initialTab]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  useEffect(() => {
    setIsDarkMode(document.documentElement.classList.contains("dark"));
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          setIsDarkMode(document.documentElement.classList.contains('dark'));
        }
      });
    });
    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  const lightFolderImages = [
    "/assets/light_images/chad-montano-MqT0asuoIcU-unsplash.jpg",
    "/assets/light_images/high-angle-indian-food-assortment.jpg",
    "/assets/light_images/joseph-gonzalez-zcUgjyqEwe8-unsplash.jpg",
    "/assets/light_images/luisa-brimble-2RrBE90w0T8-unsplash.jpg",
    "/assets/light_images/vertical-view-delicious-dinner-fried-chicken-dish-with-various-spices-foods-garlics-fallen-oil-bottle-lemon-dark-color-background.jpg"
  ];

  const darkFolderImages = [
    "/assets/dark_images/victoria-shes-UC0HZdUitWY-unsplash.jpg",
    "/assets/dark_images/tasty-serbian-food-arrangement-flat-lay.jpg",
    "/assets/dark_images/ikhsan-baihaqi-pbc2wXbQYpI-unsplash.jpg",
    "/assets/dark_images/18hourshub-padrauna-ho-padrauna-restaurants-rtvk1fglif.avif",
    "/assets/dark_images/odiseo-castrejon-1SPu0KT-Ejg-unsplash.jpg"
  ];

  const carouselImages = isDarkMode ? lightFolderImages : darkFolderImages;

  useEffect(() => {
    if (!isOpen) return;
    const intervalId = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % carouselImages.length);
    }, 3000);
    return () => clearInterval(intervalId);
  }, [isOpen, carouselImages.length]);

  const resetForm = () => {
    setFormData({ name: "", email: "", password: "", confirmPassword: "" });
    setForgotEmail("");
    setForgotSent(false);
    setVerifyEmailAddr("");
    setOtpCode("");
    setErrors({});
    setApiError("");
  };

  const switchTab = (tab) => { setActiveTab(tab); if (tab !== "verify") resetForm(); else { setErrors({}); setApiError(""); } };

  const finishAuth = (user, accessToken) => {
    persistAuth(user, accessToken);
    toast.success(`Welcome${user.name ? `, ${user.name}` : ""}!`);
    if (onSignIn) onSignIn(user);
    onClose();
    const returnTo = sessionStorage.getItem("auth_return_to");
    if (returnTo) {
      sessionStorage.removeItem("auth_return_to");
      navigate(returnTo);
      return;
    }
    navigate(selectedRole === "RESTAURANT_OWNER" ? "/owner/onboard" : (ROLE_REDIRECT[user.role] || "/home"));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
    setApiError("");
  };

  const validateLogin = () => {
    const e = {};
    if (!formData.email.trim()) e.email = "Email is required";
    if (!formData.password.trim()) e.password = "Password is required";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const validateSignup = () => {
    const e = {};
    if (!formData.name.trim()) e.name = "Username is required";
    if (!formData.email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) e.email = "Invalid email";
    const pwErr = validatePassword(formData.password);
    if (pwErr) e.password = pwErr;
    if (formData.password !== formData.confirmPassword) e.confirmPassword = "Passwords do not match";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const persistAuth = (user, accessToken) => {
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("userData", JSON.stringify(user));
    dispatch(setCredentials({ user, accessToken }));
  };

  const handleGoogleAuth = (role = "USER") => {
    window.location.href = getGoogleAuthUrl(role);
  };

  const handleFacebookAuth = (role = "USER") => {
    window.location.href = getFacebookAuthUrl(role);
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    const eMap = {};
    if (!forgotEmail.trim()) eMap.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(forgotEmail)) eMap.email = "Invalid email";
    setErrors(eMap);
    if (Object.keys(eMap).length) return;

    setIsSubmitting(true);
    setApiError("");
    try {
      const res = await forgotPassword({ email: forgotEmail.trim() });
      setForgotSent(true);
      toast.success(res.data.message || "Check your email for reset instructions.");
    } catch (err) {
      setApiError(err?.response?.data?.message || "Could not send reset email. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!validateLogin()) return;
    setIsSubmitting(true);
    setApiError("");
    try {
      const res = await login({ email: formData.email, password: formData.password });
      const { user, accessToken } = res.data;
      finishAuth(user, accessToken);
    } catch (err) {
      const data = err?.response?.data;
      if (data?.needsVerification && data?.email) {
        setVerifyEmailAddr(data.email);
        setActiveTab("verify");
        setResendCooldown(60);
        toast.success("Enter the verification code sent to your email.");
      } else {
        setApiError(data?.message || "Login failed. Check your credentials.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!validateSignup()) return;
    setIsSubmitting(true);
    setApiError("");
    try {
      const payload = { role: selectedRole, name: formData.name, email: formData.email, password: formData.password };
      const res = await signup(payload);
      if (res.data.pendingVerification) {
        setVerifyEmailAddr(res.data.email || formData.email);
        setActiveTab("verify");
        setResendCooldown(60);
        toast.success(res.data.message || "Check your email for the verification code.");
      } else {
        finishAuth(res.data.user, res.data.accessToken);
      }
    } catch (err) {
      const data = err?.response?.data;
      if (data?.errors?.length) {
        const fe = {};
        data.errors.forEach(({ field, message }) => { fe[field] = message; });
        setErrors(fe);
      } else {
        setApiError(data?.message || "Signup failed. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyEmail = async (e) => {
    e.preventDefault();
    const code = otpCode.replace(/\D/g, "");
    if (code.length !== 6) {
      setErrors({ otp: "Enter the 6-digit code from your email" });
      return;
    }
    setIsSubmitting(true);
    setApiError("");
    setErrors({});
    try {
      const res = await verifyEmail({ email: verifyEmailAddr, code });
      finishAuth(res.data.user, res.data.accessToken);
    } catch (err) {
      setApiError(err?.response?.data?.message || "Verification failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendVerification = async () => {
    if (resendCooldown > 0 || !verifyEmailAddr) return;
    setIsSubmitting(true);
    try {
      const res = await resendVerification({ email: verifyEmailAddr });
      toast.success(res.data.message || "New code sent!");
      setResendCooldown(60);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not resend code.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = (field) =>
    `w-full px-5 py-3 sm:py-3.5 border rounded-full outline-none transition-all text-sm font-medium text-foreground placeholder:text-muted-foreground bg-transparent ${
      errors[field] ? "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500" : "border-border focus:border-primary focus:ring-1 focus:ring-primary"
    }`;



  return (
    <>
      {/* Main Modal Container */}
      <div
        className={`fixed inset-0 bg-background z-[9999] transition-all duration-500 overflow-hidden ${
          isOpen ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-8 scale-95 pointer-events-none"
        }`}
      >
        {/* Close Button */}
        <button 
          onClick={onClose} 
          className={`absolute top-6 z-[60] w-10 h-10 bg-background/80 hover:bg-muted backdrop-blur-md rounded-full flex items-center justify-center text-foreground transition-all duration-[800ms] ease-in-out shadow-sm ${
            activeTab === 'signup' ? 'right-6 lg:right-8' : 'left-6 lg:left-8'
          }`}
        >
          <FaTimes className="text-lg" />
        </button>

        {/* Form Area */}
        <div className={`absolute top-0 bottom-0 w-full lg:w-[45%] bg-background z-20 flex flex-col transition-all duration-[800ms] ease-in-out ${activeTab === 'signup' ? 'lg:left-[55%] left-0' : 'left-0'}`}>
          <div className="flex-1 overflow-y-auto relative flex flex-col scrollbar-hide pt-16 pb-8">
            <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-16 py-4 max-w-[480px] mx-auto w-full">
            
            {apiError && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl text-red-700 dark:text-red-400 text-sm text-center font-medium">
                {apiError}
              </div>
            )}

            {/* LOGIN FLOW */}
            {activeTab === "login" && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground mb-2">Welcome Back!</h1>
                <p className="text-muted-foreground font-medium mb-6 text-sm">Sign in with your Email and Password.</p>

                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <input type="email" name="email" value={formData.email} onChange={handleInputChange}
                      className={inputClass("email")} placeholder="Email" />
                    {errors.email && <p className="text-red-500 text-xs mt-1.5 ml-4">{errors.email}</p>}
                  </div>
                  
                  <div>
                    <input type="password" name="password" value={formData.password} onChange={handleInputChange}
                      className={inputClass("password")} placeholder="Password" />
                    {errors.password && <p className="text-red-500 text-xs mt-1.5 ml-4">{errors.password}</p>}
                    <div className="flex justify-end mt-2">
                      <button
                        type="button"
                        onClick={() => { setActiveTab("forgot"); setApiError(""); setErrors({}); setForgotSent(false); }}
                        className="text-sm font-bold text-foreground hover:text-primary transition-colors"
                      >
                        Forgot password?
                      </button>
                    </div>
                  </div>

                  <button type="submit" disabled={isSubmitting}
                    className="w-full bg-primary hover:opacity-90 text-white py-3 sm:py-3.5 rounded-full font-bold text-base transition-all mt-4 flex items-center justify-center disabled:opacity-60">
                    {isSubmitting ? <div className="animate-spin h-5 w-5 border-b-2 border-current rounded-full" /> : "Login"}
                  </button>
                </form>

                <div className="flex items-center gap-4 my-6">
                  <div className="flex-1 h-px bg-border"></div>
                  <span className="text-muted-foreground text-sm font-medium">or login with</span>
                  <div className="flex-1 h-px bg-border"></div>
                </div>

                <div className="space-y-4">
                  <button
                    type="button"
                    onClick={() => handleGoogleAuth("USER")}
                    className="w-full flex items-center justify-center gap-3 py-3 border border-border rounded-full hover:bg-muted transition-colors font-bold text-foreground text-sm"
                  >
                    <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />
                    Login with Google
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFacebookAuth("USER")}
                    className="w-full flex items-center justify-center gap-3 py-3 border border-border rounded-full hover:bg-muted transition-colors font-bold text-foreground text-sm"
                  >
                    <img src="https://www.svgrepo.com/show/475647/facebook-color.svg" className="w-5 h-5" alt="Facebook" />
                    Login with Facebook
                  </button>
                </div>

                <p className="text-center text-muted-foreground mt-6 font-medium text-xs sm:text-sm">
                  Did not have any account? <button onClick={() => switchTab('signup')} className="text-foreground font-extrabold hover:text-primary transition-colors ml-1">Register Now</button>
                </p>
              </div>
            )}

            {/* SIGNUP FLOW */}
            {activeTab === "signup" && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground mb-2">Create an account</h1>
                <p className="text-muted-foreground font-medium mb-6 text-sm">Sign up with your valid email and password.</p>

                {/* Role Toggle */}
                <div className="flex bg-muted/50 p-1 rounded-full w-max mb-6 border border-border">
                  <button type="button" onClick={() => setSelectedRole("USER")}
                    className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${selectedRole === 'USER' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                    Customer
                  </button>
                  <button type="button" onClick={() => setSelectedRole("RESTAURANT_OWNER")}
                    className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${selectedRole === 'RESTAURANT_OWNER' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                    Restaurant Owner
                  </button>
                </div>

                <form onSubmit={handleSignup} className="space-y-4">
                  <div>
                    <input type="text" name="name" value={formData.name} onChange={handleInputChange}
                      className={inputClass("name")} placeholder="Username" />
                    {errors.name && <p className="text-red-500 text-xs mt-1.5 ml-4">{errors.name}</p>}
                  </div>
                  <div>
                    <input type="email" name="email" value={formData.email} onChange={handleInputChange}
                      className={inputClass("email")} placeholder="Email" />
                    {errors.email && <p className="text-red-500 text-xs mt-1.5 ml-4">{errors.email}</p>}
                  </div>
                  <div className="relative">
                    <input type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleInputChange}
                      className={inputClass("password")} placeholder="Password" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                    {errors.password ? (
                      <p className="text-red-500 text-xs mt-1.5 ml-4">{errors.password}</p>
                    ) : (
                      <p className="text-muted-foreground text-xs mt-1.5 ml-4">{PASSWORD_HINT}</p>
                    )}
                  </div>
                  <div className="relative">
                    <input type={showConfirmPassword ? "text" : "password"} name="confirmPassword" value={formData.confirmPassword} onChange={handleInputChange}
                      className={inputClass("confirmPassword")} placeholder="Confirm Password" />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                    {errors.confirmPassword && <p className="text-red-500 text-xs mt-1.5 ml-4">{errors.confirmPassword}</p>}
                  </div>

                  <button type="submit" disabled={isSubmitting}
                    className="w-full bg-primary hover:opacity-90 text-white py-3 sm:py-3.5 rounded-full font-bold text-base transition-all mt-4 flex items-center justify-center disabled:opacity-60">
                    {isSubmitting ? <div className="animate-spin h-5 w-5 border-b-2 border-current rounded-full" /> : selectedRole === "RESTAURANT_OWNER" ? "Sign Up as Owner" : "Sign Up"}
                  </button>
                </form>

                <div className="flex items-center gap-4 my-6">
                  <div className="flex-1 h-px bg-border"></div>
                  <span className="text-muted-foreground text-sm font-medium">or sign up with</span>
                  <div className="flex-1 h-px bg-border"></div>
                </div>

                <div className="space-y-4">
                  <button
                    type="button"
                    onClick={() => handleGoogleAuth(selectedRole)}
                    className="w-full flex items-center justify-center gap-3 py-3 border border-border rounded-full hover:bg-muted transition-colors font-bold text-foreground text-sm"
                  >
                    <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />
                    Sign up with Google
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFacebookAuth(selectedRole)}
                    className="w-full flex items-center justify-center gap-3 py-3 border border-border rounded-full hover:bg-muted transition-colors font-bold text-foreground text-sm"
                  >
                    <img src="https://www.svgrepo.com/show/475647/facebook-color.svg" className="w-5 h-5" alt="Facebook" />
                    Sign up with Facebook
                  </button>
                </div>

                <p className="text-center text-muted-foreground mt-6 font-medium text-xs sm:text-sm">
                  Already have an account? <button onClick={() => switchTab('login')} className="text-foreground font-extrabold hover:text-primary transition-colors ml-1">Login</button>
                </p>
              </div>
            )}

            {/* EMAIL VERIFICATION */}
            {activeTab === "verify" && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground mb-2">Verify your email</h1>
                <p className="text-muted-foreground font-medium mb-6 text-sm">
                  We sent a 6-digit code to{" "}
                  <span className="font-bold text-foreground">{verifyEmailAddr || "your email"}</span>.
                  Enter it below to activate your account.
                </p>

                <form onSubmit={handleVerifyEmail} className="space-y-4">
                  <div>
                    <input
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => {
                        setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                        setErrors((p) => ({ ...p, otp: "" }));
                      }}
                      className={`${inputClass("otp")} text-center text-2xl tracking-[0.5em] font-extrabold`}
                      placeholder="000000"
                    />
                    {errors.otp && <p className="text-red-500 text-xs mt-1.5 ml-4 text-center">{errors.otp}</p>}
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || otpCode.length !== 6}
                    className="w-full bg-primary hover:opacity-90 text-white py-3 sm:py-3.5 rounded-full font-bold text-base transition-all flex items-center justify-center disabled:opacity-60"
                  >
                    {isSubmitting ? <div className="animate-spin h-5 w-5 border-b-2 border-current rounded-full" /> : "Verify & Continue"}
                  </button>
                </form>

                <p className="text-center text-muted-foreground mt-6 text-sm">
                  Didn&apos;t receive the code?{" "}
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    disabled={resendCooldown > 0 || isSubmitting}
                    className="font-extrabold text-foreground hover:text-primary transition-colors disabled:opacity-50"
                  >
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
                  </button>
                </p>

                <p className="text-center text-muted-foreground mt-4 text-xs">
                  Wrong email?{" "}
                  <button type="button" onClick={() => switchTab("signup")} className="font-bold text-primary hover:underline">
                    Go back to signup
                  </button>
                </p>
              </div>
            )}

            {/* FORGOT PASSWORD */}
            {activeTab === "forgot" && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground mb-2">Forgot password?</h1>
                <p className="text-muted-foreground font-medium mb-6 text-sm">
                  {forgotSent
                    ? "If an account exists with that email, we've sent a secure reset link. Check your inbox and spam folder."
                    : "Enter your email and we'll send you a link to reset your password."}
                </p>

                {forgotSent ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl text-green-800 dark:text-green-300 text-sm text-center font-medium">
                      Reset link sent to <strong>{forgotEmail}</strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => switchTab("login")}
                      className="w-full bg-primary hover:opacity-90 text-white py-3 sm:py-3.5 rounded-full font-bold text-base transition-all"
                    >
                      Back to login
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleForgotPassword} className="space-y-4">
                    <div>
                      <input
                        type="email"
                        name="forgotEmail"
                        value={forgotEmail}
                        onChange={(e) => { setForgotEmail(e.target.value); setErrors((p) => ({ ...p, email: "" })); setApiError(""); }}
                        className={inputClass("email")}
                        placeholder="Email address"
                        autoComplete="email"
                      />
                      {errors.email && <p className="text-red-500 text-xs mt-1.5 ml-4">{errors.email}</p>}
                    </div>
                    <button type="submit" disabled={isSubmitting}
                      className="w-full bg-primary hover:opacity-90 text-white py-3 sm:py-3.5 rounded-full font-bold text-base transition-all mt-4 flex items-center justify-center disabled:opacity-60">
                      {isSubmitting ? <div className="animate-spin h-5 w-5 border-b-2 border-current rounded-full" /> : "Send reset link"}
                    </button>
                    <button type="button" onClick={() => switchTab("login")}
                      className="w-full text-muted-foreground hover:text-foreground font-bold text-sm py-2 transition-colors">
                      ← Back to login
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
        </div>

        {/* Image Area */}
        <div className={`hidden lg:block absolute top-0 bottom-0 w-[55%] z-10 p-4 lg:p-6 bg-background transition-all duration-[800ms] ease-in-out ${activeTab === 'signup' ? 'left-0' : 'left-[45%]'}`}>
          <div className="w-full h-full relative rounded-[2rem] overflow-hidden bg-zinc-950">
            {carouselImages.map((src, index) => (
              <img 
                key={index}
                src={src} 
                alt={`Auth Background ${index + 1}`} 
                className={`absolute inset-0 w-full h-full object-cover transition-all duration-[1500ms] ease-in-out ${
                  index === currentImageIndex 
                    ? 'opacity-100 scale-100 z-10' 
                    : 'opacity-0 scale-105 z-0'
                }`}
              />
            ))}
            {/* Dark overlay gradient at bottom for dots */}
            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none z-20"></div>
            
            {/* Carousel Dots */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-30">
              {carouselImages.map((_, index) => (
                <div
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    index === currentImageIndex ? "w-6 bg-white" : "w-2 bg-white/40 hover:bg-white/60"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SignInSidebar;

