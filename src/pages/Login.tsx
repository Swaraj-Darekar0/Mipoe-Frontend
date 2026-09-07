import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import AuthLayout from "@/layouts/AuthLayout";
import { login as loginApi, requestPasswordReset } from "@/lib/api";
import { preloadPostLoginRoutes } from "@/utils/route-preloader";
import { toast } from "sonner"; 
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
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
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `https://mipoe.vercel.app/auth/callback?role=${role}`, // Your frontend callback route
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message || "Failed to sign in with Google");
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

        <form className="space-y-4" onSubmit={handleLogin}>
          <div>
            <label className="block text-zinc-700 text-xs sm:text-sm font-medium pb-1.5">Email</label>
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
              placeholder="Enter your email"
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
              I agree to the secure storage of login cookies as detailed in the{" "}
              <Link
                to="/cookie-policy"
                target="_blank"
                className="text-[#FF5C00] hover:underline font-medium"
              >
                Cookie Policy
              </Link>
              , and agree to the{" "}
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

        <p className="text-center text-sm text-zinc-500 mt-6">
          Don't have an account?{" "}
          <Link to={`/register?role=${role}`} className="font-semibold text-[#FF5C00] hover:underline">
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
