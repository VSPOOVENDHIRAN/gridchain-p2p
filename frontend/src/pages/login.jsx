import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
const API = process.env.REACT_APP_API_URL;
// Login API call with proper error handling
const loginUser = async (email, password) => {
  try {
    const response = await fetch(`${API}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { message: errorData.message || "Invalid email or password" };
    }

    return await response.json();
  } catch (err) {
    console.error("Network error:", err);
    return { networkError: true, message: "Cannot reach server. Try again later." };
  }
};

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    setError("");

    if (!email) {
      setError("Please enter your email.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);
    const data = await loginUser(email, password);
    setLoading(false);

    if (data.token) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("user_id", data.user.user_id);

      // Trigger celebration animation
      setCelebrating(true);

      // Navigate after celebration completes
      setTimeout(() => {
        navigate("/dashboard");
      }, 1000);
    } else if (data.networkError) {
      setError(data.message);
    } else {
      setError(data.message);
    }
  };

  const startGanache = async () => {
  try {
    setError("");
    const res = await fetch(`${API}/api/ganache/start-ganache`, {
      method: "POST",
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.message || "Failed to start Ganache");
    } else {
      alert("Ganache started successfully 🚀");
    }
  } catch (err) {
    console.error(err);
    setError("Cannot reach backend to start Ganache");
  }
};



  return (
    <div className="flex items-center justify-center min-h-screen p-4 pb-32">
      <div className="w-full max-w-md animate-login-entry">
        {/* Logo/Brand Section */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-3">
            <span className="text-solar">Gridchain</span>{" "}
            <span className="text-energy">P2P</span>
          </h1>
          <p className="text-gray-400 text-lg">
            Blockchain-Powered Energy Trading
          </p>
        </div>

        {/* Login Card */}
        <div className={`energy-card energy-card-solar space-y-6 ${celebrating ? 'celebrate-login success-shimmer' : ''}`}>
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">Welcome Back</h2>
            <p className="text-gray-400">Sign in to your energy trading account</p>
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-200 p-4 rounded-lg text-center animate-fade-in">
              {error}
            </div>
          )}

          {/* Email Input */}
          <div className="space-y-2">
            <label className="data-label">
              Email Address
            </label>
            <input
              type="email"
              placeholder="your.email@example.com"
              className="input-energy"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Password Input */}
          <div className="space-y-2">
            <label className="data-label">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                className="input-energy pr-12"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
              />
              <button
                type="button"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.17.203-2.293.575-3.345M6.6 6.6a9.953 9.953 0 0110.8 10.8M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>

          

          {/* Login Button */}
          <button
            onClick={handleLogin}
            className={`btn-energy w-full ${loading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Signing In...
              </span>
            ) : (
              "Sign In"
            )}
          </button>
          <button
  onClick={startGanache}
  className="btn-energy w-full bg-purple-600 hover:bg-purple-700 mt-3"
>
  ⚡ Start Ganache
</button>


          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-[#1e293b] text-gray-400">New user?</span>
            </div>
          </div>

          {/* Register Link */}
          <div className="text-center">
            <a
              href="/register"
              className="inline-block text-energy hover:text-solar transition-colors font-semibold"
            >
              Create an Account →
            </a>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center space-y-4">
          <p className="text-gray-500 text-sm">
            Secured by blockchain technology
          </p>
        </div>
      </div>
    </div>
  );
}
