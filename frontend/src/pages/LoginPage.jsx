// src/pages/LoginPage.jsx
import React, { useState } from "react";
import { User, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/api";

const LoginPage = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const loadingToast = toast.loading("Logging in...");

    try {
      console.log("📤 Sending login request:", { username, password });

      const response = await api.post("/users/login/", {
        username: username.trim(),
        password: password.trim(),
      });

      console.log("✅ Response status:", response.status);
      console.log("📥 Response data:", response.data);

      // If we get a 200, treat it as success
      if (response.status === 200) {
        let token = null;
        let user = null;

        // Try to extract token and user from response if they exist
        if (typeof response.data === "object" && response.data !== null) {
          token = response.data.token ||
                  response.data.access_token ||
                  response.data.access ||
                  response.data.refresh ||
                  response.data.key ||
                  null;

          user = response.data.user || response.data;
        }

        // If no token, create a dummy one
        if (!token) {
          console.warn("⚠️ No token received – creating dummy token");
          token = "dummy-token-" + Date.now();
          // Optional: show a toast notification (without .warning)
          toast("Using dummy token (backend did not return one)", {
            icon: "⚠️",
            id: loadingToast,
          });
        }

        // If no user object, create one from the entered username
        if (!user || typeof user !== "object") {
          user = { username: username.trim(), full_name: username.trim() };
          console.warn("⚠️ No user data received – created basic user object");
        }

        // Store in localStorage
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));

        toast.success("Login Successful", { id: loadingToast });

        // Redirect to dashboard
        setTimeout(() => navigate("/admin"), 500);
      } else {
        // Non-200 status
        throw new Error("Login failed with status " + response.status);
      }
    } catch (err) {
      console.error("❌ Login error:", err);
      console.log("Server Response:", err.response?.data);

      localStorage.removeItem("user");
      localStorage.removeItem("token");

      toast.error(
        err.response?.data?.message ||
        err.response?.data?.detail ||
        "Invalid username or password",
        { id: loadingToast }
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-2xl p-8">
        <p className="text-sm uppercase tracking-widest text-center text-gray-400">Login Please</p>
        <h1 className="text-3xl font-bold text-center mt-2">WELCOME!</h1>
        <p className="text-center text-gray-500 mt-2">Enter your username and password</p>
        <form onSubmit={handleSubmit} className="space-y-5 mt-8">
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border rounded-sm focus:ring-2 focus:ring-orange-500 outline-none"
              required
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border rounded-sm focus:ring-2 focus:ring-orange-500 outline-none"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-sm font-semibold disabled:bg-gray-400"
          >
            {loading ? "Logging In..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;