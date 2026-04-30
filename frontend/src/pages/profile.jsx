import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import {
  WalletIcon,
  CubeIcon,
  BoltIcon,
  UserIcon,
  CogIcon,
  KeyIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";

export default function Profile() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [passwordMsg, setPasswordMsg] = useState("");
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);

  const token = localStorage.getItem("token");
const API = process.env.REACT_APP_API_URL;
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user_id");
    navigate("/login");
  };

  const fetchProfile = async () => {
    setLoading(true);

    try {
      const res = await fetch(`${API}/api/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setUserData(data.data);
      } else {
        setUserData(null);
        console.error("Profile fetch error:", data.message);
      }
    } catch (err) {
      console.error("Unable to fetch profile:", err);
      setUserData(null);
    }

    setLoading(false);
  };

  useEffect(() => {
    if (!token) return;

    fetchProfile();

    const socket = io(`${API}`, {
      auth: { token },
    });

    socket.on("connect", () => console.log("Socket connected:", socket.id));

    socket.on("new_reading", (data) => {
      console.log("Realtime update received:", data);

      setUserData((prev) => ({
        ...prev,
        energy_balance: data.energy_balance ?? prev.energy_balance,
        last_import_reading: data.last_import_reading ?? prev.last_import_reading,
        last_export_reading: data.last_export_reading ?? prev.last_export_reading,
        total_energy_bought: data.total_energy_bought ?? prev.total_energy_bought,
        total_energy_sold: data.total_energy_sold ?? prev.total_energy_sold,
      }));
    });

    socket.on("disconnect", () => console.log("Socket disconnected"));

    return () => socket.disconnect();
  }, [token]);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      setPasswordMsg("Please fill both fields.");
      return;
    }

    setPasswordMsg("Processing...");

    try {
      const res = await fetch(`${API}/api/users/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();

      if (data.success) {
        setPasswordMsg("Secure Key Updated Successfully!");
        setCurrentPassword("");
        setNewPassword("");
      } else {
        setPasswordMsg(data.message || "Something went wrong.");
      }
    } catch {
      setPasswordMsg("Network error. Try again.");
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="energy-card max-w-md w-full text-center animate-fade-in">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2">Not Authenticated</h2>
          <p className="text-gray-400 mb-6">You need to log in to view your profile.</p>
          <a href="/login" className="btn-energy inline-block">
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="skeleton w-16 h-16 rounded-full mx-auto mb-4"></div>
          <p className="text-xl font-semibold text-gray-300">Loading Profile...</p>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="energy-card max-w-md text-center">
          <p className="text-red-400 text-lg">Unable to fetch profile. Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 pb-24 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8 animate-fade-in-up">
        <div>
          <h1 className="text-3xl font-bold mb-2">
            <span className="text-solar">User</span>{" "}
            <span className="text-energy">Profile</span>
          </h1>
          <p className="text-gray-400">Manage your energy trading account</p>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg transition-all font-semibold"
        >
          <ArrowRightOnRectangleIcon className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>

      {/* Personal Info Card */}
      <div className="energy-card energy-card-solar mb-6 animate-fade-in-up delay-100">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-700">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
            <UserIcon className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold">Personal Information</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-energy-subtle p-4 rounded-lg border border-energy">
            <p className="data-label">Full Name</p>
            <p className="data-value">{userData.name}</p>
          </div>
          <div className="bg-energy-subtle p-4 rounded-lg border border-energy">
            <p className="data-label">Email Address</p>
            <p className="data-value text-base">{userData.email}</p>
          </div>
          <div className="bg-energy-subtle p-4 rounded-lg border border-energy">
            <p className="data-label">User ID</p>
            <p className="data-value text-base">{userData.user_id}</p>
          </div>
        </div>
      </div>

      {/* Balances Section */}
      <h2 className="text-2xl font-bold mb-4 text-solar animate-fade-in-up delay-200">Current Balances</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 animate-fade-in-up delay-300">
        {/* Wallet Balance */}
        <div className="energy-card energy-card-blockchain">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
              <WalletIcon className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold text-lg text-gray-300">Wallet Balance</h3>
          </div>
          <p className="data-value data-value-solar">{userData.wallet_balance}</p>
          <p className="data-label mt-2">Available funds</p>
        </div>

        {/* Token Balance */}
        <div className="energy-card energy-card-solar">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-emerald-500 rounded-lg flex items-center justify-center">
              <CubeIcon className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold text-lg text-gray-300">Token Balance</h3>
          </div>
          <p className="data-value data-value-energy">{userData.token_balance}</p>
          <p className="data-label mt-2">Energy tokens</p>
        </div>

        {/* Energy Balance */}
        <div className="energy-card energy-card-solar">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center">
              <BoltIcon className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold text-lg text-gray-300">Energy Balance</h3>
          </div>
          <p className="data-value data-value-solar">{userData.energy_balance}</p>
          <p className="data-label mt-2">kWh available</p>
        </div>
      </div>

      {/* Reserved Balances */}
      <h2 className="text-2xl font-bold mb-4 text-energy animate-fade-in-up delay-400">Reserved Balances</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 animate-fade-in-up delay-500">
        <div className="energy-card">
          <p className="data-label">Reserved Token Balance</p>
          <p className="data-value data-value-energy">{userData.reserved_tokens}</p>
        </div>

        <div className="energy-card">
          <p className="data-label">Reserved Energy Balance</p>
          <p className="data-value data-value-solar">{userData.reserved_energy} kWh</p>
        </div>
      </div>

      {/* Technical Info */}
      <div className="energy-card mb-6 animate-fade-in-up delay-600">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-700">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center">
            <CogIcon className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-2xl font-bold">Technical Information</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="bg-solar-subtle p-4 rounded-lg border border-solar">
              <p className="data-label">Meter ID</p>
              <p className="data-value text-base">{userData.meter_id}</p>
            </div>
            <div className="bg-solar-subtle p-4 rounded-lg border border-solar">
              <p className="data-label">Transformer ID</p>
              <p className="data-value text-base">{userData.transformer_id}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-energy-subtle p-4 rounded-lg border border-energy">
              <p className="data-label">Total Energy Sold</p>
              <p className="data-value text-base">{userData.total_energy_sold} kWh</p>
            </div>
            <div className="bg-energy-subtle p-4 rounded-lg border border-energy">
              <p className="data-label">Total Energy Bought</p>
              <p className="data-value text-base">{userData.total_energy_bought} kWh</p>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="energy-card animate-fade-in-up delay-700">
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg flex items-center justify-center">
              <KeyIcon className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold">Change Secure Key</h3>
          </div>

          <button
            onClick={() => setShowPasswordFields(!showPasswordFields)}
            className="btn-solar"
          >
            {showPasswordFields ? "Cancel" : "Update"}
          </button>
        </div>

        {showPasswordFields && (
          <div className="space-y-4">
            {passwordMsg && (
              <div
                className={`p-4 rounded-lg text-sm font-semibold ${passwordMsg.includes("Success")
                  ? "status-completed"
                  : "status-cancelled"
                  }`}
              >
                {passwordMsg}
              </div>
            )}

            <div className="relative">
              <label className="data-label">Current Secure Key</label>
              <input
                type={showCurrentPass ? "text" : "password"}
                placeholder="Enter current password"
                className="input-energy pr-12"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute right-4 bottom-3 text-gray-400 hover:text-white transition-colors"
                onClick={() => setShowCurrentPass(!showCurrentPass)}
              >
                {showCurrentPass ? (
                  <EyeSlashIcon className="w-5 h-5" />
                ) : (
                  <EyeIcon className="w-5 h-5" />
                )}
              </button>
            </div>

            <div className="relative">
              <label className="data-label">New Secure Key</label>
              <input
                type={showNewPass ? "text" : "password"}
                placeholder="Enter new password"
                className="input-energy pr-12"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute right-4 bottom-3 text-gray-400 hover:text-white transition-colors"
                onClick={() => setShowNewPass(!showNewPass)}
              >
                {showNewPass ? (
                  <EyeSlashIcon className="w-5 h-5" />
                ) : (
                  <EyeIcon className="w-5 h-5" />
                )}
              </button>
            </div>

            <button
              className="btn-energy w-full"
              onClick={handleChangePassword}
            >
              {passwordMsg === "Processing..." ? "Updating..." : "Change Secure Key"}
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
