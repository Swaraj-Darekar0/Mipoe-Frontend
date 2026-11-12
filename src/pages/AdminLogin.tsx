import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "@/layouts/AuthLayout";
import { login as loginApi } from "@/lib/api";
import { ArrowLeft, Loader2, Shield } from "lucide-react";
import { HighlightedText } from "@/components/Home/persona/HighlightedText";
import { StatusPill } from "@/components/ui/PortalPrimitives";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSuccessVideoPlaying, setIsSuccessVideoPlaying] = useState(false);
  const pendingNavigationRef = useRef<(() => void) | null>(null);
  const hasNavigatedRef = useRef(false);
  const navigate = useNavigate();

  const handleVideoEnded = () => {
    if (hasNavigatedRef.current) return;
    hasNavigatedRef.current = true;
    if (pendingNavigationRef.current) {
      pendingNavigationRef.current();
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      // loginApi handles saving token/user_id/role keys internally in setAuthTokens
      await loginApi({ email, password, role: "admin", consentGiven: false });
      pendingNavigationRef.current = () => {
        navigate("/admin");
      };
      setIsSuccessVideoPlaying(true);
    } catch (err: unknown) {
      setLoading(false);
      setIsSuccessVideoPlaying(false);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred");
      }
    }
  };

  return (
    <AuthLayout
      isSuccessVideoPlaying={isSuccessVideoPlaying}
      onVideoEnded={handleVideoEnded}
    >
      <div className="w-full space-y-5">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-slate hover:text-ink transition-colors duration-150 cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Home</span>
          </button>
          <Link
            to="/"
            className="font-display text-lg font-bold tracking-tight text-ink shrink-0"
          >
            sellr.
          </Link>
        </div>

        {/* Auth Card */}
        <div className="rounded-2xl bg-white text-ink border border-black/10 shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-5 sm:p-7 space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-steel">
                01 // ADMINISTRATOR ACCESS
              </p>
              <StatusPill tone="neutral" showDot>
                <Shield className="w-3 h-3" />
                Internal
              </StatusPill>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-ink leading-[1.15]">
              Admin{" "}
              <HighlightedText
                animated={false}
                colorClass="bg-highlight/60"
                textColorClass="text-ink"
              >
                Sign In
              </HighlightedText>
            </h1>
            <p className="text-sm text-slate leading-relaxed">
              Sign in with authorized credentials to enter the moderation and compliance console.
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleLogin}>
            <div className="space-y-1.5">
              <label
                htmlFor="admin-email"
                className="block font-mono text-[10px] font-bold uppercase tracking-wider text-slate"
              >
                Admin Email
              </label>
              <input
                id="admin-email"
                disabled={loading || isSuccessVideoPlaying}
                className="flex h-11 w-full rounded-xl border border-black/15 bg-white px-3.5 text-sm text-ink placeholder:text-steel focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/15 disabled:opacity-50 transition-colors duration-150"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError("");
                }}
                placeholder="admin@sellr.in"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="admin-password"
                className="block font-mono text-[10px] font-bold uppercase tracking-wider text-slate"
              >
                Password
              </label>
              <input
                id="admin-password"
                disabled={loading || isSuccessVideoPlaying}
                className="flex h-11 w-full rounded-xl border border-black/15 bg-white px-3.5 text-sm text-ink placeholder:text-steel focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/15 disabled:opacity-50 transition-colors duration-150"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError("");
                }}
                placeholder="Enter password"
                required
              />
            </div>

            {error && (
              <div className="rounded-xl border border-rose-500/25 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-ink px-4 text-sm font-semibold text-white transition-colors duration-150 hover:bg-charcoal focus:outline-none focus:ring-2 focus:ring-ink/20 focus:ring-offset-1 disabled:opacity-50 cursor-pointer"
              disabled={!email || !password || loading || isSuccessVideoPlaying}
            >
              {loading || isSuccessVideoPlaying ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{isSuccessVideoPlaying ? "Entering console..." : "Signing In..."}</span>
                </>
              ) : (
                "Sign In as Admin"
              )}
            </button>
          </form>
        </div>
      </div>
    </AuthLayout>
  );
};

export default AdminLogin;