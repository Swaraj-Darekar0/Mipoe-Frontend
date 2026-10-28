import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import AuthLayout from "@/layouts/AuthLayout";
import { login as loginApi, requestPasswordReset, syncWalletUser } from "@/lib/api";
import { preloadPostLoginRoutes } from "@/utils/route-preloader";
import { toast } from "sonner"; 
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MessageSquare, Phone, Sparkles } from "lucide-react";
// Import UI components for Dialog (assuming shadcn/ui or similar)
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import type { AvatarState, Vec2 } from "@/components/login/avatar/BibleStrongCloudAvatar";

const Login = () => {
  const [searchParams] = useSearchParams();
  const queryRole = searchParams.get("role") === "brand" ? "brand" : "creator";
  const [role, setRole] = useState<"brand" | "creator">(queryRole);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSuccessVideoPlaying, setIsSuccessVideoPlaying] = useState(false);
  const pendingNavigationRef = useRef<(() => void) | null>(null);
  const hasNavigatedRef = useRef(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetStatus, setResetStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [resetMessage, setResetMessage] = useState("");

  const [consentGiven, setConsentGiven] = useState(false);

  // Phone / WhatsApp OTP States (for Creators)
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  // Avatar interactivity states
  const [avatarState, setAvatarState] = useState<AvatarState>("idle");
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  const updateLookTarget = (ref: React.RefObject<HTMLInputElement | null>, state: AvatarState) => {
    setAvatarState(state);
    if (ref.current) {
      setTargetRect(ref.current.getBoundingClientRect());
    }
  };

  const handleBlur = () => {
    if (avatarState !== "invalid" && avatarState !== "submitting") {
      setAvatarState("idle");
      setTargetRect(null);
    }
  };

  const handleVideoEnded = () => {
    if (hasNavigatedRef.current) return;
    hasNavigatedRef.current = true;
    if (pendingNavigationRef.current) {
      pendingNavigationRef.current();
    }
  };

  // Sync role state with query param if it changes
  useEffect(() => {
    const r = searchParams.get("role");
    if (r === "brand" || r === "creator") {
      setRole(r);
    }
  }, [searchParams]);

  useEffect(() => {
    if (location.state?.toastMessage) {
      toast.success(location.state.toastMessage);
      
      // Optional: Clear the state so the toast doesn't show again on refresh
       window.history.replaceState({}, document.title); 
    }
  }, [location]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    setAvatarState("submitting");
    try {
      const data = await loginApi({ email, password, role, consentGiven });
      setAvatarState("success");
      
      preloadPostLoginRoutes();

      // Store destination to navigate strictly after video completes
      pendingNavigationRef.current = () => {
        const redirectParam = searchParams.get("redirect");
        if (redirectParam) {
          navigate(decodeURIComponent(redirectParam));
          return;
        }

        if (data.role === "brand") {
          navigate("/brand/dashboard");
        } else if (data.role === "creator") {
          if (data.profile_completed) {
            navigate("/creator/dashboard");
          } else {
            navigate("/creator/complete-profile");
          }
        }
      };

      // Play video now that access to enter dashboard is granted.
      // Loading spinner continues in the right side section until video ends.
      setIsSuccessVideoPlaying(true);
    } catch (err: unknown) {
      setAvatarState("invalid");
      setLoading(false);
      setIsSuccessVideoPlaying(false);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred");
      }
    }
  };
  const handleGoogleLogin = async () => {
    try {
      const redirectParam = searchParams.get("redirect");
      const redirectQuery = redirectParam ? `&redirect=${encodeURIComponent(redirectParam)}` : "";
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?role=${role}${redirectQuery}`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      if (error) throw error;
    } catch (err: any) {
      toast.error(err.message || "Failed to start Google sign in");
    }
  };

  const handleSandboxQuickLogin = async (targetRole: "brand" | "creator") => {
    setLoading(true);
    try {
      const syncRes = await syncWalletUser({
        auth_token: `crossmint_sandbox_did:crossmint:dev_${targetRole}_99::0x742d35Cc6634C0532925a3b844Bc454e4438f44e::dev_${targetRole}@gmail.com`,
        role: targetRole,
        wallet_address: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
        email: `dev_${targetRole}@gmail.com`,
        name: `Dev ${targetRole === "brand" ? "D2C Brand" : "Creator"}`,
      });
      toast.success(`Logged in as Sandbox ${targetRole}!`);
      if (syncRes.role === "brand") {
        navigate("/brand/dashboard");
      } else {
        navigate(syncRes.profile_completed ? "/creator/dashboard" : "/creator/complete-profile");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed sandbox login");
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = () => {
    const cleanPhone = phoneNumber.replace(/\D/g, "");
    if (cleanPhone.length !== 10) {
      toast.error("Please enter a valid 10-digit Indian mobile number");
      return;
    }
    setSendingOtp(true);
    setTimeout(() => {
      setSendingOtp(false);
      setOtpSent(true);
      toast.success(`OTP sent to +91 ${cleanPhone} via WhatsApp / SMS! (Use 123456 for dev)`);
    }, 600);
  };

  const handleVerifyOtp = async () => {
    const cleanPhone = phoneNumber.replace(/\D/g, "");
    if (otpCode.length < 4) {
      toast.error("Please enter the 6-digit OTP");
      return;
    }
    setVerifyingOtp(true);
    try {
      const syncRes = await syncOktoUser({
        auth_token: `okto_sandbox_did:okto:phone_${cleanPhone}::0x742d35Cc6634C0532925a3b844Bc454e4438f44e::${cleanPhone}`,
        role: "creator",
        phone: cleanPhone,
        wallet_address: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
        name: `Creator_${cleanPhone.slice(-4)}`,
      });
      toast.success(`Welcome, ${syncRes.username || "creator"}!`);
      preloadPostLoginRoutes();
      const redirectParam = searchParams.get("redirect");
      if (redirectParam) {
        navigate(decodeURIComponent(redirectParam));
        return;
      }
      navigate(syncRes.profile_completed ? "/creator/dashboard" : "/creator/complete-profile");
    } catch (err: any) {
      toast.error(err.message || "Failed to verify OTP");
    } finally {
      setVerifyingOtp(false);
    }
  };


const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetStatus("loading");
    setResetMessage("");
    try {
      const response = await requestPasswordReset(resetEmail);
      setResetStatus("success");
      setResetMessage(response.msg || "Check your email for the password reset link.");
    } catch (err: any) {
      setResetStatus("error");
      setResetMessage(err.message || "Failed to send email. Please try again.");
    }
  };

  return (
    <AuthLayout
      isSuccessVideoPlaying={isSuccessVideoPlaying}
      onVideoEnded={handleVideoEnded}
      avatarState={avatarState}
      targetElementRect={targetRect}
    >
      <div className="w-full">
        <button
          onClick={() => navigate("/")}
          className="inline-flex items-center text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
        </button>

        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 mb-1.5">
            {role === "brand" ? "Brand Sign In" : "Creator Sign In"}
          </h1>
          <p className="text-sm text-zinc-500">Sign in to continue as a {role}.</p>
        </div>

        {role === "creator" ? (
          /* CREATOR 1-CLICK AUTH (No passwords!) */
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200/70 rounded-2xl p-4 text-center">
              <div className="text-xs font-bold text-orange-950 uppercase tracking-wider mb-1 flex items-center justify-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#FF5C00]" />
                Instant 1-Click Creator Access
              </div>
              <p className="text-xs text-orange-800/80 leading-relaxed">
                No password required! Simply connect via Google or verified Indian mobile / WhatsApp.
              </p>
            </div>

            {/* Primary: Continue with Google */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading || isSuccessVideoPlaying}
              className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-zinc-200 bg-white text-sm font-semibold text-zinc-800 shadow-xs transition-all hover:bg-zinc-50 hover:border-zinc-300"
            >
              <svg className="h-5 w-5" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" fill="#FFC107"></path><path d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" fill="#FF3D00"></path><path d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" fill="#4CAF50"></path><path d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C42.022,35.244,44,30.036,44,24C44,22.659,43.862,21.35,43.611,20.083z" fill="#1976D2"></path>
              </svg>
              <span>Continue with Google</span>
            </button>

            <div className="relative flex items-center py-2">
              <div className="h-px w-full flex-1 bg-zinc-200"></div>
              <p className="shrink-0 px-3 text-[11px] text-zinc-400 font-semibold uppercase tracking-wider">Or Mobile / WhatsApp</p>
              <div className="h-px w-full flex-1 bg-zinc-200"></div>
            </div>

            {/* Secondary: Phone / WhatsApp OTP */}
            <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-xl space-y-3">
              <div className="space-y-1">
                <label className="block text-zinc-700 text-xs font-semibold">Indian Mobile Number</label>
                <div className="flex gap-2">
                  <div className="flex items-center px-3 bg-zinc-100 border border-zinc-200 rounded-lg text-xs font-bold text-zinc-600">
                    +91
                  </div>
                  <input
                    type="tel"
                    maxLength={10}
                    placeholder="9876543210"
                    value={phoneNumber}
                    disabled={otpSent || sendingOtp || verifyingOtp}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
                    className="flex h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-xs font-mono font-bold tracking-wider"
                  />
                  {!otpSent && (
                    <button
                      type="button"
                      disabled={phoneNumber.length !== 10 || sendingOtp}
                      onClick={handleSendOtp}
                      className="px-3.5 h-10 bg-[#FF5C00] hover:bg-[#FF5C00]/90 text-white text-xs font-bold rounded-lg shrink-0 disabled:opacity-40 transition-colors"
                    >
                      {sendingOtp ? "Sending..." : "Send OTP"}
                    </button>
                  )}
                </div>
              </div>

              {otpSent && (
                <div className="space-y-2 pt-2 border-t border-zinc-200/60">
                  <div className="flex items-center justify-between">
                    <label className="block text-zinc-700 text-xs font-semibold">Enter 6-Digit OTP</label>
                    <button
                      type="button"
                      onClick={() => setOtpSent(false)}
                      className="text-[10px] text-zinc-400 hover:text-zinc-600"
                    >
                      Change Number
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="123456"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      className="flex h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-xs font-mono font-bold tracking-widest text-center"
                    />
                    <button
                      type="button"
                      disabled={verifyingOtp || otpCode.length < 4}
                      onClick={handleVerifyOtp}
                      className="px-4 h-10 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shrink-0 disabled:opacity-40 transition-colors"
                    >
                      {verifyingOtp ? "Verifying..." : "Verify & Enter"}
                    </button>
                  </div>
                  <p className="text-[10px] text-zinc-400">Sandbox dev hint: enter any 6-digit code</p>
                </div>
              )}
            </div>

            {/* Consent Checkbox */}
            <div className="flex items-start gap-2.5 pt-1">
              <input
                id="creator-consent"
                type="checkbox"
                checked={consentGiven}
                onChange={(e) => setConsentGiven(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-[#FF5C00] focus:ring-[#FF5C00]/20 accent-[#FF5C00]"
              />
              <label htmlFor="creator-consent" className="text-xs text-zinc-500 leading-normal select-none">
                I agree to the{" "}
                <Link to="/privacy" target="_blank" className="text-[#FF5C00] hover:underline font-medium">
                  Privacy Policy
                </Link>{" "}
                and{" "}
                <Link to="/terms" target="_blank" className="text-[#FF5C00] hover:underline font-medium">
                  Terms & Conditions
                </Link>
                .
              </label>
            </div>
          </div>
        ) : (
          /* BRAND CORPORATE AUTH (Email + Password + Google) */
          <>
            <form className="space-y-4" onSubmit={handleLogin}>
              <div>
                <label className="block text-zinc-700 text-xs sm:text-sm font-medium pb-1.5">Work Email</label>
                <input
                  ref={emailInputRef}
                  disabled={loading || isSuccessVideoPlaying}
                  className="flex h-11 w-full rounded-lg border border-zinc-200 bg-white px-3.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-[#FF5C00] focus:outline-none focus:ring-2 focus:ring-[#FF5C00]/20 disabled:opacity-50 transition-colors"
                  type="email"
                  value={email}
                  onFocus={() => updateLookTarget(emailInputRef, "watching-email")}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError("");
                    updateLookTarget(emailInputRef, "typing-email");
                  }}
                  onBlur={handleBlur}
                  placeholder="name@company.com"
                  required
                />
              </div>
              <div>
                <div className="flex justify-between items-center pb-1.5">
                  <label className="block text-zinc-700 text-xs sm:text-sm font-medium">Password</label>
                  <button
                    type="button"
                    disabled={loading || isSuccessVideoPlaying}
                    onClick={() => setShowForgotPassword(true)}
                    className="text-xs sm:text-sm font-medium text-[#FF5C00] hover:underline focus:outline-none disabled:opacity-50"
                  >
                    Forgot Password?
                  </button>
                </div>
                <input
                  ref={passwordInputRef}
                  disabled={loading || isSuccessVideoPlaying}
                  className="flex h-11 w-full rounded-lg border border-zinc-200 bg-white px-3.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-[#FF5C00] focus:outline-none focus:ring-2 focus:ring-[#FF5C00]/20 disabled:opacity-50 transition-colors"
                  type="password"
                  value={password}
                  onFocus={() => updateLookTarget(passwordInputRef, "watching-password")}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError("");
                    updateLookTarget(passwordInputRef, "typing-password");
                  }}
                  onBlur={handleBlur}
                  placeholder="Enter your password"
                  required
                />
              </div>

              <div className="flex items-start gap-2.5 pt-1">
                <input
                  id="consent"
                  type="checkbox"
                  disabled={loading || isSuccessVideoPlaying}
                  checked={consentGiven}
                  onChange={(e) => setConsentGiven(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-[#FF5C00] focus:ring-[#FF5C00]/20 accent-[#FF5C00] disabled:opacity-50"
                  required
                />
                <label htmlFor="consent" className="text-xs text-zinc-500 leading-normal select-none">
                  I agree to the{" "}
                  <Link
                    to="/privacy"
                    target="_blank"
                    className="text-[#FF5C00] hover:underline font-medium"
                  >
                    Privacy Policy
                  </Link>{" "}
                  and{" "}
                  <Link
                    to="/terms"
                    target="_blank"
                    className="text-[#FF5C00] hover:underline font-medium"
                  >
                    Terms & Conditions
                  </Link>
                  .
                </label>
              </div>

              {error && <div className="text-red-600 text-xs sm:text-sm text-center py-1">{error}</div>}

              <button
                type="submit"
                className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#FF5C00] px-4 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#FF5C00]/90 focus:outline-none focus:ring-2 focus:ring-[#FF5C00] focus:ring-offset-2 disabled:opacity-50"
                disabled={!email || !password || !consentGiven || loading || isSuccessVideoPlaying}
              >
                {loading || isSuccessVideoPlaying ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>{isSuccessVideoPlaying ? "Entering dashboard..." : "Signing In..."}</span>
                  </div>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>

            <div className="relative flex items-center py-5">
              <div className="h-px w-full flex-1 bg-zinc-200"></div>
              <p className="shrink-0 px-3 text-xs text-zinc-400 font-medium">Or continue with</p>
              <div className="h-px w-full flex-1 bg-zinc-200"></div>
            </div>

            <button
              onClick={handleGoogleLogin}
              className="flex h-11 w-full items-center justify-center gap-2.5 rounded-lg border border-zinc-200 bg-white text-sm font-medium text-zinc-700 shadow-xs transition-colors hover:bg-zinc-50 hover:border-zinc-300"
            >
              <svg className="h-4 w-4" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" fill="#FFC107"></path><path d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" fill="#FF3D00"></path><path d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" fill="#4CAF50"></path><path d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C42.022,35.244,44,30.036,44,24C44,22.659,43.862,21.35,43.611,20.083z" fill="#1976D2"></path>
              </svg>
              <span>Continue with Google</span>
            </button>
          </>
        )}

        {!import.meta.env.PROD && (
          <div className="mt-3.5 pt-3 border-t border-zinc-100 flex flex-col gap-1.5">
            <div className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 text-center">
              Dev Sandbox 1-Click Login
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleSandboxQuickLogin("creator")}
                className="px-2.5 py-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
              >
                <span>⚡</span> Sandbox Creator
              </button>
              <button
                type="button"
                onClick={() => handleSandboxQuickLogin("brand")}
                className="px-2.5 py-2 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
              >
                <span>⚡</span> Sandbox Brand
              </button>
            </div>
          </div>
        )}

        <p className="text-center text-sm text-zinc-500 mt-6">
          Don't have an account?{" "}
          <Link
            to={`/register?role=${role}${searchParams.get("redirect") ? `&redirect=${encodeURIComponent(searchParams.get("redirect")!)}` : ""}`}
            className="font-semibold text-[#FF5C00] hover:underline"
          >
            Register
          </Link>
        </p>
        <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
          <DialogContent className="bg-white border-zinc-200 text-zinc-900 sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-zinc-900">Reset Password</DialogTitle>
              <DialogDescription className="text-sm text-zinc-500">
                Enter your email address and we'll send you a secure password reset link.
              </DialogDescription>
            </DialogHeader>
            
            {resetStatus === "success" ? (
              <div className="py-4">
                <div className="bg-green-50 text-green-700 p-3 rounded-md text-sm border border-green-200">
                  {resetMessage}
                </div>
                <Button 
                  onClick={() => setShowForgotPassword(false)} 
                  className="w-full mt-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-800"
                >
                  Close
                </Button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4 pt-4">
                <div>
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="Enter your registered email"
                    required
                    className="flex h-11 w-full rounded-lg border border-zinc-200 bg-white px-3.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-[#FF5C00] focus:outline-none focus:ring-2 focus:ring-[#FF5C00]/20"
                  />
                </div>
                {resetStatus === "error" && (
                  <div className="text-red-600 text-xs">{resetMessage}</div>
                )}
                <DialogFooter className="gap-2 sm:gap-0">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowForgotPassword(false)}
                    className="border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={resetStatus === "loading" || !resetEmail}
                    className="bg-[#FF5C00] hover:bg-[#FF5C00]/90 text-white"
                  >
                    {resetStatus === "loading" ? "Sending..." : "Send Reset Link"}
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AuthLayout>
  );
};

export default Login;
