import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthLayout from "@/layouts/AuthLayout";
import { login as loginApi } from "@/lib/api";
import { ArrowLeft } from "lucide-react";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      // loginApi handles saving token/user_id/role keys internally in setAuthTokens
      await loginApi({ email, password, role: "admin" });
      navigate("/admin");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="h-full w-full max-w-md mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center text-sm font-medium text-[#989898] hover:text-[#FF5C00] transition-colors mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
        </button>

        {/* Title */}
        <div className="text-center mb-10">
          <h1 className="font-display text-4xl font-bold mb-2 text-[#F7F7F7]">
            Admin Sign In
          </h1>
          <p className="text-[#989898]">Sign in to access the administrator dashboard.</p>
        </div>

        {/* Form */}
        <form className="space-y-6" onSubmit={handleLogin}>
          <div>
            <label className="block text-[#F7F7F7] text-sm font-medium pb-2">Email</label>
            <input
              className="form-input flex h-14 w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg border border-[#3A3A3A] bg-[#2A2A2A] p-[15px] text-base font-normal leading-normal text-[#F7F7F7] placeholder:text-[#989898] focus:border-[#FF5C00] focus:outline-0 focus:ring-2 focus:ring-[#FF5C00]/20"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              required
            />
          </div>
          <div>
            <label className="block text-[#F7F7F7] text-sm font-medium pb-2">Password</label>
            <input
              className="form-input flex h-14 w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg border border-[#3A3A3A] bg-[#2A2A2A] p-[15px] text-base font-normal leading-normal text-[#F7F7F7] placeholder:text-[#989898] focus:border-[#FF5C00] focus:outline-0 focus:ring-2 focus:ring-[#FF5C00]/20"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
            />
          </div>

          {error && <div className="text-red-500 text-sm text-center">{error}</div>}

          <button
            type="submit"
            className="flex h-14 w-full items-center justify-center rounded-lg bg-[#FF5C00] px-4 text-base font-bold text-[#F7F7F7] shadow-lg shadow-[#FF5C00]/20 transition-all hover:bg-[#FF5C00]/90 focus:outline-none focus:ring-2 focus:ring-[#FF5C00] focus:ring-offset-2 focus:ring-offset-dark-void disabled:opacity-50"
            disabled={!email || !password || loading}
          >
            {loading ? "Signing In..." : "Sign In as Admin"}
          </button>
        </form>
      </div>
    </AuthLayout>
  );
};

export default AdminLogin;