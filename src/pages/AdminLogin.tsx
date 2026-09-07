import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import AuthLayout from "@/layouts/AuthLayout";
import { login as loginApi } from "@/lib/api";
import { ArrowLeft } from "lucide-react";

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
      await loginApi({ email, password, role: "admin" });
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
      <div className="w-full">
        {/* Back Button */}
        <button
          onClick={() => navigate("/")}
          className="inline-flex items-center text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
        </button>

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 mb-1.5">
            Admin Sign In
          </h1>
          <p className="text-sm text-zinc-500">Sign in to access the administrator dashboard.</p>
        </div>

        {/* Form */}
        <form className="space-y-4" onSubmit={handleLogin}>
          <div>
            <label className="block text-zinc-700 text-xs sm:text-sm font-medium pb-1.5">Email</label>
            <input
              disabled={loading || isSuccessVideoPlaying}
              className="flex h-11 w-full rounded-lg border border-zinc-200 bg-white px-3.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-[#FF5C00] focus:outline-none focus:ring-2 focus:ring-[#FF5C00]/20 disabled:opacity-50 transition-colors"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              required
            />
          </div>
          <div>
            <label className="block text-zinc-700 text-xs sm:text-sm font-medium pb-1.5">Password</label>
            <input
              disabled={loading || isSuccessVideoPlaying}
              className="flex h-11 w-full rounded-lg border border-zinc-200 bg-white px-3.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-[#FF5C00] focus:outline-none focus:ring-2 focus:ring-[#FF5C00]/20 disabled:opacity-50 transition-colors"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
            />
          </div>

          {error && <div className="text-red-600 text-xs sm:text-sm text-center py-1">{error}</div>}

          <button
            type="submit"
            className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#FF5C00] px-4 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#FF5C00]/90 focus:outline-none focus:ring-2 focus:ring-[#FF5C00] focus:ring-offset-2 disabled:opacity-50"
            disabled={!email || !password || loading || isSuccessVideoPlaying}
          >
            {loading || isSuccessVideoPlaying ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>{isSuccessVideoPlaying ? "Entering dashboard..." : "Signing In..."}</span>
              </div>
            ) : (
              "Sign In as Admin"
            )}
          </button>
        </form>
      </div>
    </AuthLayout>
  );
};

export default AdminLogin;