import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import AuthLayout from "@/layouts/AuthLayout";
import { login as loginApi, requestPasswordReset, syncWalletUser, syncGoogleUser, setAuthTokens, clearAuthTokens } from "@/lib/api";
import { preloadPostLoginRoutes } from "@/utils/route-preloader";
import { toast } from "sonner"; 
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Sparkles, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import type { AvatarState } from "@/components/login/avatar/BibleStrongCloudAvatar";

const Login = () => {
  const [searchParams] = useSearchParams();
  const queryRole = searchParams.get("role") === "brand" ? "brand" : "creator";
  const [role, setRole] = useState<"brand" | "creator">(queryRole);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSuccessVideoPlaying, setIsSuccessVideoPlaying] = useState(false);
  const [isOAuthSyncing, setIsOAuthSyncing] = useState(false);
  const pendingNavigationRef = useRef<(() => void) | null>(null);
  const hasNavigatedRef = useRef(false);
  const syncAttemptedRef = useRef(false);
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
      window.history.replaceState({}, document.title); 
    }
  }, [location]);

  // Handle Google OAuth callback sync and trigger video animation
  useEffect(() => {
    const isOAuth = searchParams.get("oauth_callback") === "true" || window.location.hash.includes("access_token");
    if (!isOAuth || syncAttemptedRef.current) return;
    syncAttemptedRef.current = true;

    const processOAuthCallback = async () => {
      setIsOAuthSyncing(true);
      setIsSuccessVideoPlaying(true);
      setLoading(true);

      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        let activeSession = session;
        if (!activeSession) {
          activeSession = await new Promise((resolve) => {
            const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
              if (currentSession) {
                subscription.unsubscribe();
                resolve(currentSession);
              }
            });
            setTimeout(() => resolve(null), 3000);
          });
        }

        if (!activeSession) {
          throw new Error("No active Google session found. Please try signing in again.");
        }

        const roleFromQuery = searchParams.get("role") || role || "creator";
        
        await supabase.auth.updateUser({
          data: { role: roleFromQuery },
        });

        const { data: { session: refreshedSession } } = await supabase.auth.refreshSession();
        const tokenToSync = refreshedSession?.access_token || activeSession.access_token;

        const response = await syncGoogleUser(tokenToSync);
        setAuthTokens(response.user_id, response.role);
        preloadPostLoginRoutes();

        pendingNavigationRef.current = () => {
          toast.success("Successfully signed in with Google!");
          const redirectParam = searchParams.get("redirect");
          if (redirectParam) {
            navigate(decodeURIComponent(redirectParam));
          } else if (response.role === "brand") {
            navigate("/brand/dashboard");
          } else if (response.profile_completed) {
            navigate("/creator/dashboard");
          } else {
            navigate("/creator/complete-profile");
          }
        };

        // If the left video already finished playing, navigate immediately
        if (hasNavigatedRef.current && pendingNavigationRef.current) {
          pendingNavigationRef.current();
        }
      } catch (err: any) {
        console.error("Google sign-in sync error:", err);
        toast.error(err.message || "Failed to finalize Google sign-in");
        clearAuthTokens();
        setIsOAuthSyncing(false);
        setIsSuccessVideoPlaying(false);
        setLoading(false);
      }
    };

    processOAuthCallback();
  }, [searchParams, role, navigate]);

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

  // Handle credential response from native Google Identity Services (Solution 2: signInWithIdToken)
  const handleGoogleCredentialResponse = async (idToken: string) => {
    setIsSuccessVideoPlaying(true);
    setLoading(true);

    try {
      // 1. Sign in to Supabase directly using the Google ID Token (zero redirect to supabase.co!)
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
      });

      if (error) throw error;
      if (!data.session) throw new Error("No session returned from Google verification");

      // 2. Set user metadata role in Supabase
      const currentRole = role || searchParams.get("role") || "creator";
      await supabase.auth.updateUser({
        data: { role: currentRole },
      });

      // 3. Refresh session to get updated claims
      const { data: { session: refreshedSession } } = await supabase.auth.refreshSession();
      const tokenToSync = refreshedSession?.access_token || data.session.access_token;

      // 4. Sync with FastAPI Backend -> Crossmint Base L2 Smart Wallet creation
      const response = await syncGoogleUser(tokenToSync);
      setAuthTokens(response.user_id, response.role);
      preloadPostLoginRoutes();

      // 5. Navigate once the left-side video finishes (or immediately if already ended)
      pendingNavigationRef.current = () => {
        toast.success("Successfully signed in with Google!");
        const redirectParam = searchParams.get("redirect");
        if (redirectParam) {
          navigate(decodeURIComponent(redirectParam));
        } else if (response.role === "brand") {
          navigate("/brand/dashboard");
        } else if (response.profile_completed) {
          navigate("/creator/dashboard");
        } else {
          navigate("/creator/complete-profile");
        }
      };

      if (hasNavigatedRef.current && pendingNavigationRef.current) {
        pendingNavigationRef.current();
      }
    } catch (err: any) {
      console.error("Google sign-in error:", err);
      toast.error(err.message || "Failed to finalize Google sign-in");
      clearAuthTokens();
      setIsSuccessVideoPlaying(false);
      setLoading(false);
    }
  };

  const fallbackToOAuthRedirect = async () => {
    setLoading(true);
    try {
      const redirectParam = searchParams.get("redirect");
      const redirectQuery = redirectParam ? `&redirect=${encodeURIComponent(redirectParam)}` : "";
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/login?role=${role}&oauth_callback=true${redirectQuery}`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setLoading(false);
      toast.error(err.message || "Failed to start Google sign in");
    }
  };

  const handleGoogleLogin = async () => {
    if (!consentGiven) {
      toast.error("Please accept the Terms & Conditions and Privacy Policy to continue");
      return;
    }

    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "1057115398692-c9nhbom5tetbpoaenvjh5j345kd24gsj.apps.googleusercontent.com";

    if (window.google?.accounts?.id && googleClientId) {
      setLoading(true);
      try {
        // Clear g_state cookie to ensure prompt displays even if previously dismissed
        document.cookie = "g_state=;path=/;expires=Thu, 01 Jan 1970 00:00:01 GMT";

        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: async (response: { credential: string }) => {
            if (response?.credential) {
              await handleGoogleCredentialResponse(response.credential);
            } else {
              setLoading(false);
            }
          },
        });

        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            console.warn(
              "Google One-Tap prompt not displayed:",
              notification.getNotDisplayedReason?.() || notification.getSkippedReason?.()
            );
            // Fall back to standard OAuth redirect if One-Tap was suppressed
            fallbackToOAuthRedirect();
          }
        });
        return;
      } catch (err) {
        console.warn("GIS prompt error, falling back:", err);
        fallbackToOAuthRedirect();
        return;
      }
    }

    fallbackToOAuthRedirect();
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
      preloadPostLoginRoutes();

      pendingNavigationRef.current = () => {
        if (syncRes.role === "brand") {
          navigate("/brand/dashboard");
        } else {
          navigate(syncRes.profile_completed ? "/creator/dashboard" : "/creator/complete-profile");
        }
      };

      setIsSuccessVideoPlaying(true);
    } catch (err: any) {
      toast.error(err.message || "Failed sandbox login");
      setLoading(false);
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
        {/* Animated Loader Card on Right Side while video plays / syncs */}
        {isSuccessVideoPlaying || isOAuthSyncing ? (
          <div className="w-full py-12 flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in duration-300">
            <div className="relative flex items-center justify-center">
              <div className="w-16 h-16 rounded-full border-3 border-orange-100 border-t-[#FF5C00] animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-[#FF5C00] animate-pulse" />
              </div>
            </div>

            <div className="space-y-1.5">
              <h2 className="text-xl font-bold tracking-tight text-zinc-900">
                {role === "brand" ? "Entering Brand Portal..." : "Entering Creator Workspace..."}
              </h2>
              <p className="text-xs text-zinc-500 max-w-[280px] mx-auto leading-relaxed">
                {isOAuthSyncing
                  ? "Securing your Google session and synchronizing your account..."
                  : "Finalizing your credentials and loading your dashboard..."}
              </p>
            </div>

            {/* Subtle animated progress indicator */}
            <div className="w-48 h-1.5 bg-zinc-100 rounded-full overflow-hidden mx-auto">
              <div className="h-full bg-gradient-to-r from-[#FF5C00] to-amber-500 rounded-full animate-pulse w-full" />
            </div>
          </div>
        ) : (
          <>
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
              /* CLEAN CREATOR GOOGLE-ONLY AUTH */
              <div className="space-y-4">
                {/* Accessible Consent Checkbox Guard */}
                <div className="flex items-start gap-2.5 p-3 rounded-xl border border-zinc-200/80 bg-zinc-50/70 transition-colors hover:bg-zinc-50">
                  <input
                    id="creator-consent"
                    type="checkbox"
                    checked={consentGiven}
                    onChange={(e) => setConsentGiven(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-[#FF5C00] focus:ring-[#FF5C00]/20 accent-[#FF5C00] cursor-pointer shrink-0"
                  />
                  <label htmlFor="creator-consent" className="text-xs text-zinc-600 leading-normal select-none cursor-pointer">
                    I agree to the{" "}
                    <Link to="/privacy" target="_blank" className="text-[#FF5C00] hover:underline font-semibold">
                      Privacy Policy
                    </Link>{" "}
                    and{" "}
                    <Link to="/terms" target="_blank" className="text-[#FF5C00] hover:underline font-semibold">
                      Terms & Conditions
                    </Link>
                    .
                  </label>
                </div>

                {/* Primary: Continue with Google (strictly guarded by checkbox) */}
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={!consentGiven || loading || isSuccessVideoPlaying}
                  className={`flex h-12 w-full items-center justify-center gap-3 rounded-xl border text-sm font-semibold transition-all ${
                    consentGiven && !loading && !isSuccessVideoPlaying
                      ? "bg-white text-zinc-800 border-zinc-200 shadow-xs hover:bg-zinc-50 hover:border-zinc-300 cursor-pointer active:scale-[0.99]"
                      : "bg-zinc-50 text-zinc-400 border-zinc-200 opacity-60 cursor-not-allowed"
                  }`}
                  title={!consentGiven ? "Please accept the Terms & Privacy Policy to continue" : "Continue with Google"}
                >
                  <svg className="h-5 w-5" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                    <path d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" fill="#FFC107"></path>
                    <path d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" fill="#FF3D00"></path>
                    <path d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" fill="#4CAF50"></path>
                    <path d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C42.022,35.244,44,30.036,44,24C44,22.659,43.862,21.35,43.611,20.083z" fill="#1976D2"></path>
                  </svg>
                  <span>Continue with Google</span>
                </button>
              </div>
            ) : (
              /* BRAND CORPORATE AUTH (Email + Password + Google) - Untouched */
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
                  type="button"
                  onClick={handleGoogleLogin}
                  className="flex h-11 w-full items-center justify-center gap-2.5 rounded-lg border border-zinc-200 bg-white text-sm font-medium text-zinc-700 shadow-xs transition-colors hover:bg-zinc-50 hover:border-zinc-300"
                >
                  <svg className="h-4 w-4" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                    <path d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" fill="#FFC107"></path>
                    <path d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" fill="#FF3D00"></path>
                    <path d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" fill="#4CAF50"></path>
                    <path d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C42.022,35.244,44,30.036,44,24C44,22.659,43.862,21.35,43.611,20.083z" fill="#1976D2"></path>
                  </svg>
                  <span>Continue with Google</span>
                </button>
              </>
            )}

            {!import.meta.env.PROD && (
              <div className="mt-6 pt-4 border-t border-zinc-100 flex flex-col gap-1.5">
                <div className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 text-center">
                  Dev Sandbox 1-Click Login
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleSandboxQuickLogin("creator")}
                    className="px-2.5 py-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <span>⚡</span> Sandbox Creator
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSandboxQuickLogin("brand")}
                    className="px-2.5 py-2 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <span>⚡</span> Sandbox Brand
                  </button>
                </div>
              </div>
            )}

            {/* Register Link only shown for brand */}
            {role === "brand" && (
              <p className="text-center text-sm text-zinc-500 mt-6">
                Don't have an account?{" "}
                <Link
                  to={`/register?role=brand${searchParams.get("redirect") ? `&redirect=${encodeURIComponent(searchParams.get("redirect")!)}` : ""}`}
                  className="font-semibold text-[#FF5C00] hover:underline"
                >
                  Register
                </Link>
              </p>
            )}
          </>
        )}

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
