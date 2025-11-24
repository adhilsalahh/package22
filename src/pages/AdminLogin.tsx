import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";   // ✅ FIXED
import { useNavigate } from "react-router-dom";      // ✅ FIXED

type Props = {
  showToast?: (msg: string, type?: "success" | "error") => void;
};

export const AdminLogin: React.FC<Props> = ({ showToast }) => {
  const { signIn, isAdmin } = useAuth();     // <-- now works
  const navigate = useNavigate();            // <-- now works

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await signIn(email.trim(), password);
    setLoading(false);

    if (res && res.error) {
      showToast?.("Login failed: " + res.error.message, "error");
      return;
    }

    // Check admin
    if (isAdmin()) {
      showToast?.("Login successful", "success");
      navigate("/admin/dashboard");
    } else {
      showToast?.("You are not an admin", "error");
    }
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <h2 className="text-xl font-semibold mb-4">Admin Login</h2>
      <form onSubmit={onSubmit}>
        <label className="block mb-2">Email</label>
        <input
          className="w-full p-2 border rounded mb-3"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <label className="block mb-2">Password</label>
        <input
          type="password"
          className="w-full p-2 border rounded mb-3"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          type="submit"
          className="w-full p-2 bg-blue-600 text-white rounded"
          disabled={loading}
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
};

export default AdminLogin;
