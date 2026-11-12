import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import AuthLayout from "@/layouts/AuthLayout";
import { resetPassword } from "@/lib/api";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";
import { HighlightedText } from "@/components/Home/persona/HighlightedText";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get("token")?.trim() || "", [searchParams]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const isTokenMissing = !token;

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isTokenMissing) {
      toast.error("Invalid or expired reset link.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const response = await resetPassword(token, password);
      toast.success(response.msg || "Password updated successfully!");
      navigate("/login", {
        state: {
          toastMessage: "Password updated successfully. Please sign in with your new password."
        }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to reset password.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="w-full space-y-5">
        {/* Top Navigation */}
        <div className="flex items-center justify-between gap-3">
          <Link
            to="/login?role=brand"
            className="inline-flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-slate hover:text-ink transition-colors duration-150"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Sign In</span>
          </Link>
          <Link
            to="/"
            className="font-display text-lg font-bold tracking-tight text-ink shrink-0"
          >
            sellr.
          </Link>
        </div>

        {/* Light Paper Card */}
        <div className="rounded-2xl bg-white text-ink border border-black/10 shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-5 sm:p-7 space-y-6">
          <div className="space-y-1.5">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-steel">
              01 // CREDENTIAL RECOVERY
            </p>
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-ink leading-[1.15]">
              New{" "}
              <HighlightedText
                animated={false}
                colorClass="bg-brand-blue/15"
                textColorClass="text-ink"
              >
                Password
              </HighlightedText>
            </h1>
            <p className="text-sm text-slate leading-relaxed">
              {isTokenMissing
                ? "This password reset link is invalid or has expired."
                : "Enter and confirm your new password below."}
            </p>
          </div>

          <form onSubmit={handleReset} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="reset-password"
                className="block font-mono text-[10px] font-bold uppercase tracking-wider text-slate"
              >
                New Password
              </label>
              <input
                id="reset-password"
                title="password reset"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                className="flex h-11 w-full rounded-xl border border-black/15 bg-white px-3.5 text-sm text-ink placeholder:text-steel focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/15 disabled:opacity-50 transition-colors duration-150"
                required
                disabled={isTokenMissing || loading}
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="reset-confirm-password"
                className="block font-mono text-[10px] font-bold uppercase tracking-wider text-slate"
              >
                Confirm Password
              </label>
              <input
                id="reset-confirm-password"
                title="confirm password reset"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="flex h-11 w-full rounded-xl border border-black/15 bg-white px-3.5 text-sm text-ink placeholder:text-steel focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/15 disabled:opacity-50 transition-colors duration-150"
                required
                disabled={isTokenMissing || loading}
              />
            </div>

            {isTokenMissing && (
              <div className="rounded-xl border border-rose-500/25 bg-rose-50 p-3.5 text-xs font-medium text-rose-700 leading-relaxed">
                Missing reset token. Please request a fresh password reset link from the Brand Sign In page.
              </div>
            )}

            <button
              type="submit"
              disabled={loading || isTokenMissing}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-ink px-4 text-sm font-semibold text-white transition-colors duration-150 hover:bg-charcoal focus:outline-none focus:ring-2 focus:ring-ink/20 focus:ring-offset-1 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Updating Password...</span>
                </>
              ) : (
                "Update Password"
              )}
            </button>
          </form>
        </div>
      </div>
    </AuthLayout>
  );
};

export default ResetPassword;

