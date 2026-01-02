import { useState,useEffect } from "react";
import { Link, useNavigate,useLocation } from "react-router-dom";
import AuthLayout from "@/layouts/AuthLayout";
import { login as loginApi, requestPasswordReset } from "@/lib/api";
import { preloadPostLoginRoutes } from "@/utils/route-preloader";
import { RoleSwitcher } from "@/components/ui/RoleSwitcher";
import { toast } from "sonner"; 
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
// Import UI components for Dialog (assuming shadcn/ui or similar)
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

const Login = () => {
  const [role, setRole] = useState<"brand" | "creator">("creator");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation()
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetStatus, setResetStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [resetMessage, setResetMessage] = useState("");

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
    try {
      const data = await loginApi({ email, password, role });
      // Tokens are now stored by loginApi in api.ts
      // localStorage.setItem("token", data.access_token); // REMOVED
      // localStorage.setItem("role", data.role); // REMOVED
      // localStorage.setItem("user_id", String(data.user_id)); // REMOVED
      
      preloadPostLoginRoutes();

      if (data.role === "brand") {
        navigate("/brand/dashboard");
      } else if (data.role === "creator") {
        if (data.profile_completed) {
          navigate("/creator/dashboard");
        } else {
          navigate("/creator/complete-profile");
        }
      }
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
const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `http://localhost:8080/auth/callback?role=${role}`, // Your frontend callback route
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
      await requestPasswordReset(resetEmail);
      setResetStatus("success");
      setResetMessage("Check your email for the password reset link.");
    } catch (err: any) {
      setResetStatus("error");
      setResetMessage(err.message || "Failed to send email. Please try again.");
    }
  };

  return (
    <AuthLayout>
      <div className="h-full w-full max-w-md mx-auto">
        <div className="text-center mb-10">
          <h1 className="font-display text-4xl font-bold mb-2 text-[#F7F7F7]">Welcome Back</h1>
          <p className="text-[#989898]">Sign in to continue your journey.</p>
        </div>

        <RoleSwitcher role={role} setRole={setRole} />

        <form className="space-y-6" onSubmit={handleLogin}>
          <div>
            <label className="block text-[#F7F7F7] text-sm font-medium pb-2">Email</label>
            <input
              className="form-input flex h-14 w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg border border-[#3A3A3A] bg-[#2A2A2A] p-[15px] text-base font-normal leading-normal text-[#F7F7F7] placeholder:text-[#989898] focus:border-[#FF5C00] focus:outline-0 focus:ring-2 focus:ring-[#FF5C00]/20"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>
          <div>
            <label className="block text-[#F7F7F7] text-sm font-medium pb-2">Password</label>
            <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-sm font-medium text-[#FF5C00] hover:underline focus:outline-none"
              >
                Forgot Password?
              </button>
            <input
              className="form-input flex h-14 w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg border border-[#3A3A3A] bg-[#2A2A2A] p-[15px] text-base font-normal leading-normal text-[#F7F7F7] placeholder:text-[#989898] focus:border-[#FF5C00] focus:outline-0 focus:ring-2 focus:ring-[#FF5C00]/20"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          {error && <div className="text-red-500 text-sm text-center">{error}</div>}

          <button
            type="submit"
            className="flex h-14 w-full items-center justify-center rounded-lg bg-[#FF5C00] px-4 text-base font-bold text-[#F7F7F7] shadow-lg shadow-[#FF5C00]/20 transition-all hover:bg-[#FF5C00]/90 focus:outline-none focus:ring-2 focus:ring-[#FF5C00] focus:ring-offset-2 focus:ring-offset-dark-void disabled:opacity-50"
            disabled={!email || !password || loading}
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <div className="relative flex items-center py-5">
          <div className="h-px w-full flex-1 bg-[#3A3A3A]"></div>
          <p className="shrink-0 px-4 text-sm text-[#989898]"></p>
          <div className="h-px w-full flex-1 bg-[#3A3A3A]"></div>
        </div>

        <button onClick={handleGoogleLogin} className="flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-[#3A3A3A] bg-[#2A2A2A] text-[#F7F7F7] transition-colors hover:bg-[#3A3A3A]">
          <svg className="h-5 w-5" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
            <path d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" fill="#FFC107"></path><path d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" fill="#FF3D00"></path><path d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" fill="#4CAF50"></path><path d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C42.022,35.244,44,30.036,44,24C44,22.659,43.862,21.35,43.611,20.083z" fill="#1976D2"></path>
          </svg>
          <span>Continue with Google</span>
        </button>

       

        <p className="text-center text-sm text-[#989898] mt-8">
          Don't have an account?{" "}
          <Link to="/register" className="font-semibold text-[#FF5C00] hover:underline">
            Register
          </Link>
        </p>
        <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
          <DialogContent className="bg-[#1A1A1A] border-[#3A3A3A] text-[#F7F7F7] sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Reset Password</DialogTitle>
              <DialogDescription className="text-[#989898]">
                Enter your email address and we'll send you a link to reset your password.
              </DialogDescription>
            </DialogHeader>
            
            {resetStatus === "success" ? (
              <div className="py-4">
                <div className="bg-green-500/10 text-green-500 p-3 rounded-md text-sm border border-green-500/20">
                  {resetMessage}
                </div>
                <Button 
                  onClick={() => setShowForgotPassword(false)} 
                  className="w-full mt-4 bg-[#2A2A2A] hover:bg-[#3A3A3A] text-white"
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
                    placeholder="Enter your email"
                    required
                    className="flex h-10 w-full rounded-md border border-[#3A3A3A] bg-[#2A2A2A] px-3 py-2 text-sm text-[#F7F7F7] placeholder:text-[#989898] focus:outline-none focus:ring-2 focus:ring-[#FF5C00]/20 focus:border-[#FF5C00]"
                  />
                </div>
                {resetStatus === "error" && (
                  <div className="text-red-500 text-sm">{resetMessage}</div>
                )}
                <DialogFooter>
                  <Button
                    type="submit"
                    disabled={resetStatus === "loading" || !resetEmail}
                    className="w-full bg-[#FF5C00] hover:bg-[#FF5C00]/90 text-white font-bold"
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
