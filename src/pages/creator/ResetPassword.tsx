import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient"; // Direct Supabase client for session handling
import AuthLayout from "@/layouts/AuthLayout";
import { toast } from "sonner";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if we have a valid session (the link logs the user in automatically)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        toast.error("Invalid or expired reset link.");
        navigate("/login");
      }
    });
  }, [navigate]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: password });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password updated successfully!");
      navigate("/login");
    }
    setLoading(false);
  };

  return (
    <AuthLayout>
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-10">
          <h1 className="font-display text-4xl font-bold mb-2 text-[#F7F7F7]">New Password</h1>
          <p className="text-[#989898]">Enter your new password below.</p>
        </div>

        <form onSubmit={handleReset} className="space-y-6">
          <div>
            <label className="block text-[#F7F7F7] text-sm font-medium pb-2">New Password</label>
            <input
            title="password reset"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input flex h-14 w-full rounded-lg border border-[#3A3A3A] bg-[#2A2A2A] p-[15px] text-[#F7F7F7] focus:border-[#FF5C00] focus:ring-2 focus:ring-[#FF5C00]/20"
              required
            />
          </div>
          <div>
            <label className="block text-[#F7F7F7] text-sm font-medium pb-2">Confirm Password</label>
            <input
            title="confirm password reset"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="form-input flex h-14 w-full rounded-lg border border-[#3A3A3A] bg-[#2A2A2A] p-[15px] text-[#F7F7F7] focus:border-[#FF5C00] focus:ring-2 focus:ring-[#FF5C00]/20"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
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