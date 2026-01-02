import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "@/layouts/AuthLayout";
import { register as registerApi } from "@/lib/api";
import { RoleSwitcher } from "@/components/ui/RoleSwitcher"; // Import the new component

const Register = () => {
  const [role, setRole] = useState<"creator" | "brand">("creator");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  return (
    <AuthLayout>
      <div className="w-full max-w-sm mx-auto">
        <div className="text-center mb-10">
          <h1 className="font-display text-4xl font-bold mb-2 text-[#F7F7F7]">Join Mipoe</h1>
          <p className="text-[#989898]">Create an account to start your journey.</p>
        </div>

        <RoleSwitcher role={role} setRole={setRole} />

        <form
          className="space-y-6"
          onSubmit={async (e) => {
            e.preventDefault();
            if (password !== confirm) {
              setError("Passwords do not match.");
              return;
            }
            setError("");
            setLoading(true);
            try {
              await registerApi({ username, email, password, role });
              navigate("/login", {
                state: {
                  toastMessage: "Account created! Please check your email to verify your account."
                }
              });
            } catch (err: unknown) {
              if (err instanceof Error) {
                setError(err.message);
              } else {
                setError("An unknown error occurred");
              }
            } finally {
              setLoading(false);
            }
          }}
        >
          <div>
            <label className="block text-[#F7F7F7] text-sm font-medium pb-2">Full Name</label>
            <input
              className="form-input flex h-14 w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg border border-[#3A3A3A] bg-[#2A2A2A] p-[15px] text-base font-normal leading-normal text-[#F7F7F7] placeholder:text-[#989898] focus:border-[#FF5C00] focus:outline-0 focus:ring-2 focus:ring-[#FF5C00]/20"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your full name"
              required
            />
          </div>
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
            <input
              className="form-input flex h-14 w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg border border-[#3A3A3A] bg-[#2A2A2A] p-[15px] text-base font-normal leading-normal text-[#F7F7F7] placeholder:text-[#989898] focus:border-[#FF5C00] focus:outline-0 focus:ring-2 focus:ring-[#FF5C00]/20"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>
          <div>
            <label className="block text-[#F7F7F7] text-sm font-medium pb-2">Confirm Password</label>
            <input
              className="form-input flex h-14 w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg border border-[#3A3A3A] bg-[#2A2A2A] p-[15px] text-base font-normal leading-normal text-[#F7F7F7] placeholder:text-[#989898] focus:border-[#FF5C00] focus:outline-0 focus:ring-2 focus:ring-[#FF5C00]/20"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Confirm your password"
              required
            />
          </div>

          {error && <div className="text-red-500 text-sm text-center">{error}</div>}

          <button
            type="submit"
            className="flex h-14 w-full items-center justify-center rounded-lg bg-[#FF5C00] px-4 text-base font-bold text-[#F7F7F7] shadow-lg shadow-[#FF5C00]/20 transition-all hover:bg-[#FF5C00]/90 focus:outline-none focus:ring-2 focus:ring-[#FF5C00] focus:ring-offset-2 focus:ring-offset-dark-void disabled:opacity-50"
            disabled={!username || !email || !password || !confirm || loading}
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <div className="relative flex items-center py-5">
          <div className="h-px w-full flex-1 bg-[#3A3A3A]"></div>
          <p className="shrink-0 px-4 text-sm text-[#989898]">Or continue with</p>
          <div className="h-px w-full flex-1 bg-[#3A3A3A]"></div>
        </div>

        <button className="flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-[#3A3A3A] bg-[#2A2A2A] text-[#F7F7F7] transition-colors hover:bg-[#3A3A3A]">
          <svg className="h-5 w-5" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
            <path d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" fill="#FFC107"></path><path d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" fill="#FF3D00"></path><path d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" fill="#4CAF50"></path><path d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C42.022,35.244,44,30.036,44,24C44,22.659,43.862,21.35,43.611,20.083z" fill="#1976D2"></path>
          </svg>
          <span>Continue with Google</span>
        </button>

        <p className="text-center text-sm text-[#989898] mt-8">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-[#FF5C00] hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
export default Register;