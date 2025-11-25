import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "@/layouts/AuthLayout";
import { register as registerApi } from "@/lib/api";

const Register = () => {
  const [role, setRole] = useState<"brand" | "creator">("brand");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  return (
    <AuthLayout>
      <div className="bg-white p-8 rounded-lg shadow w-80 space-y-5">
        <h2 className="text-2xl font-bold text-center">Register</h2>
        <div className="flex justify-center gap-2 mb-2">
          <button
            onClick={() => setRole("brand")}
            className={`px-4 py-2 rounded ${
              role === "brand"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            Brand
          </button>
          <button
            onClick={() => setRole("creator")}
            className={`px-4 py-2 rounded ${
              role === "creator"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            Creator
          </button>
        </div>
        <form
          className="space-y-4"
          onSubmit={async e => {
            e.preventDefault();
            setError("");
            setLoading(true);
            try {
              await registerApi({ username, email, password, role });
              localStorage.setItem("role", role);
              if (role === "brand") navigate("/brand/dashboard");
              else navigate("/creator/dashboard");
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
            <label className="block text-gray-700 mb-1">Username</label>
            <input
              className="w-full border rounded px-3 py-2"
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="username"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-1">Email</label>
            <input
              className="w-full border rounded px-3 py-2"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="email"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-1">Password</label>
            <input
              className="w-full border rounded px-3 py-2"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="password"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-1">
              Confirm Password
            </label>
            <input
              className="w-full border rounded px-3 py-2"
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="confirm password"
              required
            />
          </div>
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
            disabled={!username || !email || !password || !confirm || password !== confirm || loading}
          >
            {loading ? "Registering..." : `Register as ${role.charAt(0).toUpperCase() + role.slice(1)}`}
          </button>
        </form>
        <p className="text-center text-sm mt-2">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-600 hover:underline">
            Login
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
};

export default Register;
