import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Register() {
    // Multi-step registration state
    const [step, setStep] = useState(1); // 1: Phone, 2: OTP, 3: Email/Password, 4: Complete
    const [phoneNumber, setPhoneNumber] = useState("");
    const [otp, setOtp] = useState("");
    const [deviceInfo, setDeviceInfo] = useState(null); // meter_id, gridid from backend
    const [isPhoneVerified, setIsPhoneVerified] = useState(false);
    const API = process.env.REACT_APP_API_URL;
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        role: "buyer",
        walletAddress: "",
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const navigate = useNavigate();

    // Generate mock wallet address
    const generateWalletAddress = () => {
        const chars = "0123456789abcdef";
        let address = "0x";
        for (let i = 0; i < 40; i++) {
            address += chars[Math.floor(Math.random() * chars.length)];
        }
        setFormData({ ...formData, walletAddress: address });
    };

    // STEP 1: Send OTP (No device check for signup)
    const handlePhoneSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccessMessage("");

        if (!phoneNumber || phoneNumber.length < 10) {
            setError("Please enter a valid phone number with country code.");
            return;
        }

        setLoading(true);
        console.log("[REGISTER] Sending OTP to:", phoneNumber);

        try {
            // Send OTP directly without device validation (this is signup, not login)
            console.log("[REGISTER] Calling API: " + `${API}/api/auth/check-device`);
            const otpResponse = await fetch(`${API}/api/auth/check-device`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone: phoneNumber }),
            });

            console.log("[REGISTER] Response status:", otpResponse.status);
            const otpData = await otpResponse.json();
            console.log("[REGISTER] Response data:", otpData);

            if (otpResponse.ok && otpData.success) {
                setSuccessMessage("OTP sent to your phone number!");
                setStep(2); // Move to OTP verification
            } else {
                setError(otpData.message || "Failed to send OTP. Please try again.");
            }
        } catch (err) {
            console.error("[REGISTER] Phone verification error:", err);
            setError("Cannot reach server. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    // STEP 2: Verify OTP
    const handleOtpSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccessMessage("");

        // Clean OTP - remove any spaces or non-digits
        const cleanOtp = otp.replace(/\D/g, '');

        if (!cleanOtp || cleanOtp.length !== 6) {
            setError("Please enter the 6-digit OTP.");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(`${API}/api/auth/verify-otp`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    phone: phoneNumber,
                    otp: cleanOtp  // Send as string to preserve leading zeros
                }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setIsPhoneVerified(true);
                setSuccessMessage("Phone verified successfully!");
                setStep(3); // Move to email/password setup
            } else {
                setError(data.message || "Invalid or expired OTP. Please try again.");
            }
        } catch (err) {
            console.error("OTP verification error:", err);
            setError("Cannot reach server. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    // STEP 3 & 4: Register with email/password (only after OTP verification)
    const handleRegister = async (e) => {
        e.preventDefault();
        setError("");

        // Security check: Block if phone not verified
        if (!isPhoneVerified) {
            setError("Phone number must be verified before registration.");
            return;
        }

        // Validation
        if (!formData.name || !formData.email || !formData.password) {
            setError("Please fill all required fields.");
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        if (formData.password.length < 6) {
            setError("Password must be at least 6 characters.");
            return;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            setError("Please enter a valid email address.");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(`${API}/api/auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    password: formData.password,
                    phone: phoneNumber, // Verified phone number
                    role: formData.role,
                    wallet_address: formData.walletAddress,
                }),
            });

            const data = await response.json();

            if (response.ok && data.message) {
                // Registration successful - redirect to login
                setSuccessMessage("Account created successfully! Redirecting to login...");
                setTimeout(() => navigate("/login"), 2000);
            } else {
                setError(data.error || data.message || "Registration failed. Please try again.");
            }
        } catch (err) {
            console.error("Registration error:", err);
            setError("Cannot reach server. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    // Resend OTP
    const handleResendOtp = async () => {
        setError("");
        setSuccessMessage("");
        setLoading(true);

        try {
            const response = await fetch(`${API}/api/auth/send-otp`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone: phoneNumber }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setSuccessMessage("OTP resent successfully!");
            } else {
                setError(data.message || "Failed to resend OTP.");
            }
        } catch (err) {
            console.error("Resend OTP error:", err);
            setError("Cannot reach server. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen p-4 pb-32">
            <div className="w-full max-w-md animate-fade-in-up">
                {/* Logo/Brand Section */}
                <div className="text-center mb-8">
                    <h1 className="text-5xl font-bold mb-3">
                        <span className="text-solar">Gridchain</span>{" "}
                        <span className="text-energy">P2P</span>
                    </h1>
                    <p className="text-gray-400 text-lg">
                        Join the Energy Trading Network
                    </p>
                </div>

                {/* Registration Card */}
                <div className="energy-card energy-card-solar space-y-6">
                    <div className="text-center mb-6">
                        <h2 className="text-2xl font-bold text-white mb-2">Create Account</h2>
                        <p className="text-gray-400">Register to start trading energy</p>
                    </div>

                    {error && (
                        <div className="bg-red-500/20 border border-red-500 text-red-200 p-4 rounded-lg text-center animate-fade-in">
                            {error}
                        </div>
                    )}

                    {successMessage && (
                        <div className="bg-green-500/20 border border-green-500 text-green-200 p-4 rounded-lg text-center animate-fade-in">
                            {successMessage}
                        </div>
                    )}

                    {/* STEP 1: Phone Number Entry */}
                    {step === 1 && (
                        <form onSubmit={handlePhoneSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <label className="data-label">Phone Number *</label>
                                <input
                                    type="tel"
                                    placeholder="+1234567890 (with country code)"
                                    className="input-energy"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    disabled={loading}
                                />
                                <p className="text-xs text-gray-500">
                                    Enter your phone number with country code (e.g., +1 for USA)
                                </p>
                            </div>

                            <button
                                type="submit"
                                className={`btn-energy w-full ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
                                disabled={loading}
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Verifying Device...
                                    </span>
                                ) : (
                                    "Continue"
                                )}
                            </button>
                        </form>
                    )}

                    {/* STEP 2: OTP Verification */}
                    {step === 2 && (
                        <form onSubmit={handleOtpSubmit} className="space-y-4">
                            <div className="text-center mb-4">
                                <p className="text-gray-400 text-sm">
                                    OTP sent to <span className="text-energy font-semibold">{phoneNumber}</span>
                                </p>
                            </div>

                            <div className="space-y-2">
                                <label className="data-label">Enter OTP *</label>
                                <input
                                    type="text"
                                    placeholder="Enter 6-digit OTP"
                                    className="input-energy text-center text-2xl tracking-widest"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    disabled={loading}
                                    maxLength={6}
                                />
                            </div>

                            <button
                                type="submit"
                                className={`btn-energy w-full ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
                                disabled={loading}
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Verifying OTP...
                                    </span>
                                ) : (
                                    "Verify OTP"
                                )}
                            </button>

                            <div className="flex justify-between items-center text-sm">
                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="text-gray-400 hover:text-energy transition-colors"
                                    disabled={loading}
                                >
                                    ← Change Number
                                </button>
                                <button
                                    type="button"
                                    onClick={handleResendOtp}
                                    className="text-energy hover:text-solar transition-colors font-semibold"
                                    disabled={loading}
                                >
                                    Resend OTP
                                </button>
                            </div>
                        </form>
                    )}

                    {/* STEP 3: Email & Password Setup */}
                    {step === 3 && (
                        <form onSubmit={handleRegister} className="space-y-4">
                            <div className="text-center mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                                <p className="text-green-400 text-sm flex items-center justify-center gap-2">
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    Phone Verified: {phoneNumber}
                                </p>
                            </div>

                            {/* Name */}
                            <div className="space-y-2">
                                <label className="data-label">Full Name *</label>
                                <input
                                    type="text"
                                    placeholder="Enter your full name"
                                    className="input-energy"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    disabled={loading}
                                />
                            </div>

                            {/* Email */}
                            <div className="space-y-2">
                                <label className="data-label">Email Address *</label>
                                <input
                                    type="email"
                                    placeholder="your.email@example.com"
                                    className="input-energy"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    disabled={loading}
                                />
                            </div>

                            {/* Password */}
                            <div className="space-y-2">
                                <label className="data-label">Password *</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Minimum 6 characters"
                                        className="input-energy pr-12"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        disabled={loading}
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.17.203-2.293.575-3.345M6.6 6.6a9.953 9.953 0 0110.8 10.8M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Confirm Password */}
                            <div className="space-y-2">
                                <label className="data-label">Confirm Password *</label>
                                <div className="relative">
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        placeholder="Re-enter password"
                                        className="input-energy pr-12"
                                        value={formData.confirmPassword}
                                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                        disabled={loading}
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    >
                                        {showConfirmPassword ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.17.203-2.293.575-3.345M6.6 6.6a9.953 9.953 0 0110.8 10.8M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Role Selection */}
                            <div className="space-y-2">
                                <label className="data-label">Role *</label>
                                <select
                                    className="input-energy"
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    disabled={loading}
                                >
                                    <option value="buyer">Buyer (Purchase Energy)</option>
                                    <option value="seller">Seller (Sell Energy)</option>
                                    <option value="both">Both (Buy & Sell)</option>
                                </select>
                            </div>

                            {/* Wallet Address */}
                            <div className="space-y-2">
                                <label className="data-label">Wallet Address (Optional)</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="0x..."
                                        className="input-energy flex-1 font-mono text-sm"
                                        value={formData.walletAddress}
                                        onChange={(e) => setFormData({ ...formData, walletAddress: e.target.value })}
                                        disabled={loading}
                                    />
                                    <button
                                        type="button"
                                        onClick={generateWalletAddress}
                                        className="btn-solar px-4"
                                        disabled={loading}
                                    >
                                        Generate
                                    </button>
                                </div>
                                <p className="text-xs text-gray-500">
                                    Leave empty to generate automatically
                                </p>
                            </div>

                            {/* Register Button */}
                            <button
                                type="submit"
                                className={`btn-energy w-full ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
                                disabled={loading}
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Creating Account...
                                    </span>
                                ) : (
                                    "Create Account"
                                )}
                            </button>
                        </form>
                    )}

                    {/* Divider */}
                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-700"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-[#1e293b] text-gray-500">Already have an account?</span>
                        </div>
                    </div>

                    {/* Login Link */}
                    <div className="text-center">
                        <a
                            href="/login"
                            className="inline-block text-energy hover:text-solar transition-colors font-semibold"
                        >
                            Sign In →
                        </a>
                    </div>
                </div>

                {/* Footer Info */}
                <div className="mt-8 text-center">
                    <p className="text-gray-500 text-sm">
                        Secured by blockchain technology
                    </p>
                </div>
            </div>
        </div>
    );
}
