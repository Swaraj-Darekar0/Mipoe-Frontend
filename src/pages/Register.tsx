import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import AuthLayout from "@/layouts/AuthLayout";
import { register as registerApi, syncWalletUser } from "@/lib/api";
import { toast } from "sonner"; 
import { supabase } from "@/lib/supabaseClient";
import { ArrowLeft, Sparkles } from "lucide-react";
import type { AvatarState, Vec2 } from "@/components/login/avatar/BibleStrongCloudAvatar";

const Register = () => {
  const [searchParams] = useSearchParams();
  const queryRole = searchParams.get("role") === "brand" ? "brand" : "creator";
  const [role, setRole] = useState<"creator" | "brand">(queryRole);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSuccessVideoPlaying, setIsSuccessVideoPlaying] = useState(false);
  const pendingNavigationRef = useRef<(() => void) | null>(null);
  const hasNavigatedRef = useRef(false);
  const navigate = useNavigate();

  const [consentGiven, setConsentGiven] = useState(false);

  // Avatar interactivity states
  const [avatarState, setAvatarState] = useState<AvatarState>("idle");
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const usernameInputRef = useRef<HTMLInputElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const confirmInputRef = useRef<HTMLInputElement>(null);

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

  const navigateAfterAuth = (registeredRole: string, profileCompleted?: boolean) => {
    const redirectParam = searchParams.get("redirect");
    if (redirectParam) {
      navigate(decodeURIComponent(redirectParam));
      return;
    }

    if (registeredRole === "brand") {
      navigate("/brand/dashboard");
      return;
    }

    if (registeredRole === "creator") {
      navigate(profileCompleted ? "/creator/dashboard" : "/creator/complete-profile");
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

  const handleSandboxQuickRegister = async (targetRole: "brand" | "creator") => {
    setLoading(true);
    try {
      const syncRes = await syncWalletUser({
        auth_token: `crossmint_sandbox_did:crossmint:dev_${targetRole}_99::0x742d35Cc6634C0532925a3b844Bc454e4438f44e::dev_${targetRole}@gmail.com`,
        role: targetRole,
        wallet_address: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
        email: `dev_${targetRole}@gmail.com`,
        name: `Dev ${targetRole === "brand" ? "D2C Brand" : "Creator"}`,
      });
      toast.success(`Registered as Sandbox ${targetRole}!`);
      navigateAfterAuth(syncRes.role, syncRes.profile_completed);
    } catch (err: any) {
      toast.error(err.message || "Failed sandbox registration");
    } finally {
      setLoading(false);
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
            {role === "brand" ? "Brand Registration" : "Creator Registration"}
          </h1>
          <p className="text-sm text-zinc-500">
            {role === "brand"
              ? "Create a corporate account to launch viral marketing campaigns."
              : "Zero-friction passwordless onboarding for Indian creators."}
          </p>
        </div>

        {role === "creator" ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl border border-orange-200/80 bg-orange-50/50 text-zinc-800 space-y-3 shadow-xs">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#FF5C00]">
                <Sparkles className="w-4 h-4 text-[#FF5C00]" />
                <span>No Passwords Needed for Creators!</span>
              </div>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Creators on Mipoe don't need passwords or seed phrases. Your secure Web 2.5 smart account is automatically provisioned via Google or Phone / WhatsApp OTP on our Sign In portal.
              </p>
              <div className="pt-2 flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="flex h-11 w-full items-center justify-center gap-2.5 rounded-lg border border-zinc-200 bg-white text-sm font-medium text-zinc-700 shadow-xs transition-colors hover:bg-zinc-50 hover:border-zinc-300"
                >
                  <svg className="h-4 w-4" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                    <path d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" fill="#FFC107"></path><path d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" fill="#FF3D00"></path><path d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" fill="#4CAF50"></path><path d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C42.022,35.244,44,30.036,44,24C44,22.659,43.862,21.35,43.611,20.083z" fill="#1976D2"></path>
                  </svg>
                  <span>1-Click Sign In with Google</span>
                </button>
                <Link
                  to={`/login?role=creator${searchParams.get("redirect") ? `&redirect=${encodeURIComponent(searchParams.get("redirect")!)}` : ""}`}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#FF5C00] px-4 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#FF5C00]/90"
                >
                  <span>Sign In with Phone / WhatsApp OTP</span>
                </Link>
              </div>
            </div>

            <div className="text-center pt-2">
              <span className="text-xs text-zinc-500">Are you a brand? </span>
              <button
                type="button"
                onClick={() => setRole("brand")}
                className="text-xs font-semibold text-[#FF5C00] hover:underline"
              >
                Register as Brand
              </button>
            </div>
          </div>
        ) : (
          <>
            <form
              className="space-y-4"
              onSubmit={async (e) => {
                e.preventDefault();
                if (password !== confirm) {
                  setError("Passwords do not match.");
                  setAvatarState("invalid");
                  return;
                }
                setError("");
                setLoading(true);
                setAvatarState("submitting");
                try {
                  const data = await registerApi({ username, email, password, role, consentGiven });
                  setAvatarState("success");
                  toast.success(data.msg || "Account created successfully.");
                  
                  pendingNavigationRef.current = () => {
                    navigateAfterAuth(data.role, data.profile_completed);
                  };

                  // Start video playback now that registration succeeded and access is granted
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
              }}
            >
              <div>
                <label className="block text-zinc-700 text-xs sm:text-sm font-medium pb-1.5">Full Name</label>
                <input
                  ref={usernameInputRef}
                  disabled={loading || isSuccessVideoPlaying}
                  className="flex h-11 w-full rounded-lg border border-zinc-200 bg-white px-3.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-[#FF5C00] focus:outline-none focus:ring-2 focus:ring-[#FF5C00]/20 disabled:opacity-50 transition-colors"
                  type="text"
                  value={username}
                  onFocus={() => updateLookTarget(usernameInputRef, "watching-name")}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (error) setError("");
                    updateLookTarget(usernameInputRef, "typing-name");
                  }}
                  onBlur={handleBlur}
                  placeholder="Enter your full name"
                  required
                />
              </div>
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
                <label className="block text-zinc-700 text-xs sm:text-sm font-medium pb-1.5">Password</label>
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
              <div>
                <label className="block text-zinc-700 text-xs sm:text-sm font-medium pb-1.5">Confirm Password</label>
                <input
                  ref={confirmInputRef}
                  disabled={loading || isSuccessVideoPlaying}
                  className="flex h-11 w-full rounded-lg border border-zinc-200 bg-white px-3.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-[#FF5C00] focus:outline-none focus:ring-2 focus:ring-[#FF5C00]/20 disabled:opacity-50 transition-colors"
                  type="password"
                  value={confirm}
                  onFocus={() => updateLookTarget(confirmInputRef, "watching-password")}
                  onChange={(e) => {
                    setConfirm(e.target.value);
                    if (error) setError("");
                    updateLookTarget(confirmInputRef, "typing-password");
                  }}
                  onBlur={handleBlur}
                  placeholder="Confirm your password"
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
                disabled={!username || !email || !password || !confirm || !consentGiven || loading || isSuccessVideoPlaying}
              >
                {loading || isSuccessVideoPlaying ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>{isSuccessVideoPlaying ? "Entering dashboard..." : "Creating Account..."}</span>
                  </div>
                ) : (
                  "Create Brand Account"
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

            <div className="text-center pt-2">
              <span className="text-xs text-zinc-500">Are you a creator? </span>
              <button
                type="button"
                onClick={() => setRole("creator")}
                className="text-xs font-semibold text-[#FF5C00] hover:underline"
              >
                Sign In as Creator (No Password)
              </button>
            </div>
          </>
        )}

        {!import.meta.env.PROD && (
          <div className="mt-3.5 pt-3 border-t border-zinc-100 flex flex-col gap-1.5">
            <div className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 text-center">
              Dev Sandbox 1-Click Register
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleSandboxQuickRegister("creator")}
                className="px-2.5 py-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
              >
                <span>⚡</span> Sandbox Creator
              </button>
              <button
                type="button"
                onClick={() => handleSandboxQuickRegister("brand")}
                className="px-2.5 py-2 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
              >
                <span>⚡</span> Sandbox Brand
              </button>
            </div>
          </div>
        )}

        <p className="text-center text-sm text-zinc-500 mt-6">
          Already have an account?{" "}
          <Link
            to={`/login?role=${role}${searchParams.get("redirect") ? `&redirect=${encodeURIComponent(searchParams.get("redirect")!)}` : ""}`}
            className="font-semibold text-[#FF5C00] hover:underline"
          >
            Sign In
          </Link>
        </p>

      </div>
    </AuthLayout>
  );
}
export default Register;
