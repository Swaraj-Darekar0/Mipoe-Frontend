import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthLayout from "@/layouts/AuthLayout";
import { login as loginApi } from "@/lib/api";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  return (
    <AuthLayout>
      <div className="bg-white p-8 rounded-lg shadow w-80 space-y-5">
        <h2 className="text-2xl font-bold text-center">Admin Login</h2>
        <form
          className="space-y-4"
          onSubmit={async e => {
            e.preventDefault();
            setError("");
            setLoading(true);
            try {
              const data = await loginApi({ email, password, role: "admin" });
              localStorage.setItem("token", data.access_token);
              localStorage.setItem("role", data.role);
              localStorage.setItem("user_id", String(data.user_id));
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
          }}
        >
          <div>
            <label className="block text-gray-700 mb-1">Email</label>
            <input
              className="w-full border rounded px-3 py-2"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@example.com"
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
              placeholder="********"
              required
            />
          </div>
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login as Admin"}
          </button>
        </form>
      </div>
    </AuthLayout>
  );
};

export default AdminLogin; 