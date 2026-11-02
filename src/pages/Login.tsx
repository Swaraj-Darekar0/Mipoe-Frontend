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
  const creatorGoogleButtonRef = useRef<HTMLDivElement>(null);
  const brandGoogleButtonRef = useRef<HTMLDivElement>(null);
  const [isGsiReady, setIsGsiReady] = useState(false);

  // Google Popup & Auth State Machine
  const [googleAuthState, setGoogleAuthState] = useState<"idle" | "popup_open" | "verifying" | "success" | "failed">("idle");
  const isHoveredOnGoogleBtn = useRef(false);
  const isAuthenticatingRef = useRef(false);
  const popupOpenTimerRef = useRef<NodeJS.Timeout | null>(null);
  const focusCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const triggerGooglePopupState = () => {
    isAuthenticatingRef.current = true;
    if (popupOpenTimerRef.current) clearTimeout(popupOpenTimerRef.current);
    // Defer 200ms to guarantee window.open completes synchronously during user gesture without any React interruption
    popupOpenTimerRef.current = setTimeout(() => {
      setGoogleAuthState((current) => (current === "idle" ? "popup_open" : current));
    }, 200);
  };

  useEffect(() => {
    const handleWindowBlur = () => {
      if (isHoveredOnGoogleBtn.current && googleAuthState === "idle") {
        triggerGooglePopupState();
      }
    };

    const handleWindowFocus = () => {
      if (isAuthenticatingRef.current) {
        if (focusCheckTimeoutRef.current) clearTimeout(focusCheckTimeoutRef.current);
        focusCheckTimeoutRef.current = setTimeout(() => {
          setGoogleAuthState((current) => {
            if (current === "popup_open") {
              isAuthenticatingRef.current = false;
              toast.info("Google sign-in was dismissed. You can try signing in again.");
              return "idle";
            }
            return current;
          });
        }, 1200);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && googleAuthState === "popup_open") {
        isAuthenticatingRef.current = false;
        setGoogleAuthState("idle");
        toast.info("Google sign-in was cancelled.");
      }
    };

    let safetyTimeout: NodeJS.Timeout | null = null;
    if (googleAuthState === "popup_open") {
      safetyTimeout = setTimeout(() => {
        setGoogleAuthState((current) => {
          if (current === "popup_open") {
            isAuthenticatingRef.current = false;
            toast.info("Sign-in session timed out. You can click to try again.");
            return "idle";
          }
          return current;
        });
      }, 45000);
    }

    window.addEventListener("blur", handleWindowBlur);
    window.addEventListener("focus", handleWindowFocus);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("blur", handleWindowBlur);
      window.removeEventListener("focus", handleWindowFocus);
      window.removeEventListener("keydown", handleKeyDown);
      if (safetyTimeout) clearTimeout(safetyTimeout);
      if (popupOpenTimerRef.current) clearTimeout(popupOpenTimerRef.current);
      if (focusCheckTimeoutRef.current) clearTimeout(focusCheckTimeoutRef.current);
    };
  }, [googleAuthState]);

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

        // ONLY trigger video playback once authentication and wallet sync are confirmed successful
        setIsSuccessVideoPlaying(true);
        setIsOAuthSyncing(false);
        setLoading(false);

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
    if (focusCheckTimeoutRef.current) clearTimeout(focusCheckTimeoutRef.current);
    isAuthenticatingRef.current = true;
    setGoogleAuthState("verifying");
    setLoading(true);
    setError("");

    try {
      // 0. Ensure complete user session isolation: wipe all previous Supabase tokens and cached profiles
      clearAuthTokens();
      try {
        await supabase.auth.signOut();
      } catch (signOutErr) {
        console.warn("Pre-auth signOut error:", signOutErr);
      }

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

      // 5. SUCCESS: Transition spinner to Emerald Green (different color from initial connecting spinner)
      setGoogleAuthState("success");

      // 6. Setup navigation once success video finishes
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

      // 7. ONLY trigger video playback once credentials and wallet sync are 100% verified!
      setIsSuccessVideoPlaying(true);
      setLoading(false);

      if (hasNavigatedRef.current && pendingNavigationRef.current) {
        pendingNavigationRef.current();
      }
    } catch (err: any) {
      console.error("Google sign-in error:", err);
      toast.error(err.message || "Failed to finalize Google sign-in");
      clearAuthTokens();
      setGoogleAuthState("failed");
      setIsSuccessVideoPlaying(false);
      setLoading(false);
      isAuthenticatingRef.current = false;
      setTimeout(() => {
        setGoogleAuthState("idle");
      }, 1500);
    }
  };

  // Mount native Google Identity Services (GIS) buttons
  useEffect(() => {
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "1057115398692-c9nhbom5tetbpoaenvjh5j345kd24gsj.apps.googleusercontent.com";

    const renderGsiButtons = () => {
      if (!window.google?.accounts?.id || !googleClientId) return;

      try {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: async (response: { credential: string }) => {
            if (response?.credential) {
              await handleGoogleCredentialResponse(response.credential);
            } else {
              setLoading(false);
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        const buttonConfig: any = {
          type: "standard",
          theme: "outline",
          size: "large",
          text: "continue_with",
          shape: "rectangular",
          logo_alignment: "left",
          width: 380,
          click_listener: () => {
            triggerGooglePopupState();
          },
        };

        if (role === "creator" && creatorGoogleButtonRef.current) {
          creatorGoogleButtonRef.current.innerHTML = "";
          window.google.accounts.id.renderButton(creatorGoogleButtonRef.current, buttonConfig);
        }

        if (role === "brand" && brandGoogleButtonRef.current) {
          brandGoogleButtonRef.current.innerHTML = "";
          window.google.accounts.id.renderButton(brandGoogleButtonRef.current, buttonConfig);
        }

        setIsGsiReady(true);
      } catch (err) {
        console.warn("Failed to render Google Identity Services button:", err);
      }
    };

    if (window.google?.accounts?.id) {
      renderGsiButtons();
    } else {
      const interval = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(interval);
          renderGsiButtons();
        }
      }, 150);
      return () => clearInterval(interval);
    }
  }, [role]);

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

                {/* Primary: Continue with Google (rendered natively by Google Identity Services or dynamic status spinner) */}
                <div
                  className="relative w-full min-h-[48px] flex items-center justify-center"
                  onMouseEnter={() => { isHoveredOnGoogleBtn.current = true; }}
                  onMouseLeave={() => { isHoveredOnGoogleBtn.current = false; }}
                  onMouseDown={() => { isHoveredOnGoogleBtn.current = true; }}
                  onTouchStart={() => { isHoveredOnGoogleBtn.current = true; }}
                >
                  {!consentGiven && (
                    <div
                      onClick={() => {
                        toast.error("Please accept the Terms & Conditions and Privacy Policy to continue");
                      }}
                      className="absolute inset-0 z-20 cursor-pointer rounded-xl bg-transparent"
                      title="Please accept Terms & Privacy Policy first"
                    />
                  )}

                  {/* Google button container remains permanently mounted in DOM */}
                  <div
                    ref={creatorGoogleButtonRef}
                    className={`w-full flex justify-center transition-opacity duration-200 [&>div]:!w-full [&>div>iframe]:!w-full ${
                      !consentGiven || loading || isSuccessVideoPlaying || googleAuthState !== "idle"
                        ? "opacity-0 pointer-events-none"
                        : "opacity-100 pointer-events-auto"
                    }`}
                  />

                  {/* Spinner overlay displayed in place of the button when pop-up opens or authenticates */}
                  {googleAuthState !== "idle" && (
                    <div
                      className={`absolute inset-0 w-full h-12 flex items-center justify-between rounded-xl border px-4 py-3 text-xs font-semibold select-none transition-all duration-300 z-10 ${
                        googleAuthState === "success"
                          ? "border-emerald-200 bg-emerald-50 text-emerald-800 shadow-sm shadow-emerald-500/10 pointer-events-none"
                          : googleAuthState === "verifying"
                          ? "border-amber-200 bg-amber-50 text-amber-900 shadow-sm pointer-events-none"
                          : googleAuthState === "failed"
                          ? "border-red-200 bg-red-50 text-red-700 pointer-events-none"
                          : "border-indigo-200 bg-indigo-50/90 text-indigo-900 shadow-sm"
                      }`}
                    >
                      {googleAuthState === "success" ? (
                        <div className="flex items-center justify-center gap-3 w-full">
                          {/* Distinct Success Spinner Color: Vibrant Emerald Green */}
                          <div className="w-4 h-4 rounded-full border-2 border-emerald-300 border-t-emerald-600 animate-spin" />
                          <span>Verified! Launching workspace...</span>
                        </div>
                      ) : googleAuthState === "verifying" ? (
                        <div className="flex items-center justify-center gap-3 w-full">
                          <div className="w-4 h-4 rounded-full border-2 border-amber-300 border-t-amber-600 animate-spin" />
                          <span>Securing Base L2 smart account...</span>
                        </div>
                      ) : googleAuthState === "failed" ? (
                        <div className="flex items-center justify-center gap-3 w-full">
                          <span>Sign-in was cancelled. Restoring...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-2.5">
                            {/* Initial Spinner Color: Distinct Indigo / Brand Blue */}
                            <div className="w-4 h-4 rounded-full border-2 border-indigo-300 border-t-indigo-600 animate-spin" />
                            <span>Connecting to Google Account...</span>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              isAuthenticatingRef.current = false;
                              setGoogleAuthState("idle");
                            }}
                            className="pointer-events-auto text-[11px] font-medium text-indigo-600 hover:text-indigo-900 underline px-1 py-0.5 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {!isGsiReady && googleAuthState === "idle" && (
                    <div className="absolute inset-0 flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50 text-xs text-zinc-400">
                      <div className="w-4 h-4 border-2 border-zinc-300 border-t-[#FF5C00] rounded-full animate-spin" />
                      <span>Loading secure Google login...</span>
                    </div>
                  )}
                </div>
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

                <div
                  className="relative w-full min-h-[44px] flex items-center justify-center"
                  onMouseEnter={() => { isHoveredOnGoogleBtn.current = true; }}
                  onMouseLeave={() => { isHoveredOnGoogleBtn.current = false; }}
                  onMouseDown={() => { isHoveredOnGoogleBtn.current = true; }}
                  onTouchStart={() => { isHoveredOnGoogleBtn.current = true; }}
                  onTouchEnd={() => { isHoveredOnGoogleBtn.current = false; }}
                >
                  {!consentGiven && (
                    <div
                      onClick={() => {
                        toast.error("Please accept the Terms & Conditions and Privacy Policy to continue");
                      }}
                      className="absolute inset-0 z-20 cursor-pointer rounded-lg bg-transparent"
                      title="Please accept Terms & Privacy Policy first"
                    />
                  )}

                  {/* Google button container remains permanently mounted in DOM */}
                  <div
                    ref={brandGoogleButtonRef}
                    className={`w-full flex justify-center transition-opacity duration-200 [&>div]:!w-full [&>div>iframe]:!w-full ${
                      !consentGiven || loading || isSuccessVideoPlaying || googleAuthState !== "idle"
                        ? "opacity-0 pointer-events-none"
                        : "opacity-100 pointer-events-auto"
                    }`}
                  />

                  {/* Spinner overlay displayed in place of the button when pop-up opens or authenticates */}
                  {googleAuthState !== "idle" && (
                    <div
                      className={`absolute inset-0 w-full h-11 flex items-center justify-between rounded-lg border px-3 py-2.5 text-xs font-semibold select-none transition-all duration-300 z-10 ${
                        googleAuthState === "success"
                          ? "border-emerald-200 bg-emerald-50 text-emerald-800 shadow-sm pointer-events-none"
                          : googleAuthState === "verifying"
                          ? "border-amber-200 bg-amber-50 text-amber-900 shadow-sm pointer-events-none"
                          : googleAuthState === "failed"
                          ? "border-red-200 bg-red-50 text-red-700 pointer-events-none"
                          : "border-indigo-200 bg-indigo-50/90 text-indigo-900 shadow-sm"
                      }`}
                    >
                      {googleAuthState === "success" ? (
                        <div className="flex items-center justify-center gap-2.5 w-full">
                          <div className="w-3.5 h-3.5 rounded-full border-2 border-emerald-300 border-t-emerald-600 animate-spin" />
                          <span>Verified! Launching brand portal...</span>
                        </div>
                      ) : googleAuthState === "verifying" ? (
                        <div className="flex items-center justify-center gap-2.5 w-full">
                          <div className="w-3.5 h-3.5 rounded-full border-2 border-amber-300 border-t-amber-600 animate-spin" />
                          <span>Securing brand account...</span>
                        </div>
                      ) : googleAuthState === "failed" ? (
                        <div className="flex items-center justify-center gap-2.5 w-full">
                          <span>Sign-in was cancelled. Restoring...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-2">
                            <div className="w-3.5 h-3.5 rounded-full border-2 border-indigo-300 border-t-indigo-600 animate-spin" />
                            <span>Connecting to Google Account...</span>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              isAuthenticatingRef.current = false;
                              setGoogleAuthState("idle");
                            }}
                            className="pointer-events-auto text-[11px] font-medium text-indigo-600 hover:text-indigo-900 underline px-1 py-0.5 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {!isGsiReady && googleAuthState === "idle" && (
                    <div className="absolute inset-0 flex h-11 w-full items-center justify-center gap-2.5 rounded-lg border border-zinc-200 bg-zinc-50 text-xs text-zinc-400">
                      <div className="w-3.5 h-3.5 border-2 border-zinc-300 border-t-[#FF5C00] rounded-full animate-spin" />
                      <span>Loading secure Google login...</span>
                    </div>
                  )}
                </div>
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
