import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AuthLayout from "@/layouts/AuthLayout";
import { resetPassword } from "@/lib/api";
import { toast } from "sonner";

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
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-10">
          <h1 className="font-display text-4xl font-bold mb-2 text-[#F7F7F7]">New Password</h1>
          <p className="text-[#989898]">
            {isTokenMissing ? "This reset link is invalid." : "Enter your new password below."}
          </p>
        </div>

        <form onSubmit={handleReset} className="space-y-6">
          <div>
            <label className="block text-[#F7F7F7] text-sm font-medium pb-2">New Password</label>
            <input
              title="password reset"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input flex h-14 w-full rounded-lg border border-[#3A3A3A] bg-[#2A2A2A] p-[15px] text-[#F7F7F7] focus:border-[#FF5C00] focus:ring-2 focus:ring-[#FF5C00]/20 disabled:opacity-60"
              required
              disabled={isTokenMissing || loading}
            />
          </div>
          <div>
            <label className="block text-[#F7F7F7] text-sm font-medium pb-2">Confirm Password</label>
            <input
              title="confirm password reset"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="form-input flex h-14 w-full rounded-lg border border-[#3A3A3A] bg-[#2A2A2A] p-[15px] text-[#F7F7F7] focus:border-[#FF5C00] focus:ring-2 focus:ring-[#FF5C00]/20 disabled:opacity-60"
              required
              disabled={isTokenMissing || loading}
            />
          </div>

          {isTokenMissing && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
              Please request a new password reset link from the login page.
            </div>
          )}

          <button
            type="submit"
            disabled={loading || isTokenMissing}
            className="flex h-14 w-full items-center justify-center rounded-lg bg-[#FF5C00] px-4 text-base font-bold text-[#F7F7F7] shadow-lg shadow-[#FF5C00]/20 hover:bg-[#FF5C00]/90 disabled:opacity-50"
          >
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>
    </AuthLayout>
  );
};

export default ResetPassword;
