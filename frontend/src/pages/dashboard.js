import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    WalletIcon,
    BoltIcon,
    CubeIcon,
    UserIcon,
    ArrowTrendingUpIcon,
    ArrowTrendingDownIcon,
} from "@heroicons/react/24/outline";

import LineChart from "../components/LineChart.jsx";
import { init3DCardTilt } from "../card-3d-tilt.js";


export default function Dashboard() {
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activities, setActivities] = useState([]);
const [activityLoading, setActivityLoading] = useState(true);
    const [showBookIntro, setShowBookIntro] = useState(false);
    const [showLedgerModal, setShowLedgerModal] = useState(false);
    const [ledgerData, setLedgerData] = useState([]);
    const [ledgerLoading, setLedgerLoading] = useState(false);
    const [searchUserId, setSearchUserId] = useState("");
    const [filteredLedger, setFilteredLedger] = useState([]);
    const navigate = useNavigate();

    const token = localStorage.getItem("token");
    const API = process.env.REACT_APP_API_URL;
    // Check if book intro should play (only once ever)
    useEffect(() => {
        const hasSeenBookIntro = localStorage.getItem("dashboard_book_intro_seen");
        if (!hasSeenBookIntro) {
            setShowBookIntro(true);
            localStorage.setItem("dashboard_book_intro_seen", "true");
            // Auto-hide after animation completes (7 seconds total)
            setTimeout(() => {
                setShowBookIntro(false);
            }, 7000);
        }
    }, []);

    // Fetch user data
    useEffect(() => {
        const fetchData = async () => {
            if (!token) {
                navigate("/login");
                return;
            }

            try {
                const res = await fetch(`${API}/api/auth/profile`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                const data = await res.json();
                if (res.ok && data.success) {
                    setUserData(data.data);
                } else {
                    // Invalid token - redirect to login
                    localStorage.removeItem("token");
                    localStorage.removeItem("user_id");
                    navigate("/login");
                }
            } catch (err) {
                console.error("Failed to fetch profile:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [token, navigate]);

    // Initialize 3D card tilt after dashboard loads
    useEffect(() => {
        if (userData) {
            // Small delay to ensure cards are rendered
            const timer = setTimeout(() => {
                init3DCardTilt();
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [userData]);


    // Generate realistic chart data with logical trends
const generateChartData = async (type, days = 30, mode = "created") => {
  try {
    const token = localStorage.getItem("token");

    const res = await fetch(
      `${API}/api/offers/getchart?type=${type}&days=${days}&mode=${mode}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    if (!res.ok) throw new Error("Failed to fetch chart data");

    const backendData = await res.json();

    const today = new Date();
    const data = [];

    // 🔥 Fast lookup map
    const map = new Map(
      backendData.map(d => [d._id, d.total])
    );

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      const formattedDate = date.toLocaleDateString("en-CA"); // YYYY-MM-DD

      const value = map.get(formattedDate) || 0;

      let label;
      if (i === 0) label = "Today";
      else if (i === 1) label = "Yesterday";
      else if (i <= 7) label = `${i}d ago`;
      else if (i % 5 === 0) label = `${i}d`;
      else label = "";

      data.push({ label, value });
    }

    return data;

  } catch (err) {
    console.error("Chart fetch failed:", err);
    return []; // fallback
  }
};

    const [energySoldData, setEnergySoldData] = useState([]);
const [energyBoughtData, setEnergyBoughtData] = useState([]);
const [chartLoading, setChartLoading] = useState(true);

const [stats, setStats] = useState({
  totalSold: 0,
  totalBought: 0,
  net: 0
});

useEffect(() => {
    const loadChartData = async () => {
        try {
            const sold = await generateChartData("sell", 30);
            const bought = await generateChartData("buy", 30);

            setEnergySoldData(sold);
            setEnergyBoughtData(bought);
        } catch (err) {
            console.error("Chart load error:", err);
        } finally {
            setChartLoading(false);
        }
    };

    loadChartData();
}, []);
useEffect(() => {
    const fetchActivity = async () => {
        try {
            const res = await fetch(`${API}/api/users/activity`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const result = await res.json();

            if (result.success) {
                setActivities(result.data);
            }
        } catch (err) {
            console.error("Activity fetch error:", err);
        } finally {
            setActivityLoading(false);
        }
    };

    fetchActivity();
}, []);

useEffect(() => {
    const fetchStats = async () => {
        try {
            const res = await fetch(`${API}/api/users/dashboard-stats`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const result = await res.json();

            if (result.success) {
                setStats(result.data);
            }
        } catch (err) {
            console.error("Stats error:", err);
        }
    };

    fetchStats();
}, []);

const totalSold = Array.isArray(energySoldData)
    ? energySoldData.reduce((sum, d) => sum + d.value, 0)
    : 0;

const totalBought = Array.isArray(energyBoughtData)
    ? energyBoughtData.reduce((sum, d) => sum + d.value, 0)
    : 0;

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="skeleton w-16 h-16 rounded-full mx-auto mb-4"></div>
                    <p className="text-xl font-semibold text-gray-300">Loading Dashboard...</p>
                </div>
            </div>
        );
    }
{chartLoading ? (
    <div className="h-[250px] flex items-center justify-center text-gray-400">
        Loading chart...
    </div>
) : (
    <LineChart
        data={energySoldData}
        color="#10b981"
        label="kWh Sold"
        height={250}
    />
)}
    if (!userData) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="energy-card max-w-md text-center">
                    <p className="text-red-400 text-lg">Unable to load dashboard. Please try again.</p>
                </div>
            </div>
        );
    }

    // Open Ledger Modal
    const openLedger = async () => {
        setShowLedgerModal(true);
        setLedgerLoading(true);
        console.log("[LEDGER] Fetching EB bills from backend...");
        try {
            const res = await fetch(`${API}/api/gov/eb-bills`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            console.log("[LEDGER] Response status:", res.ok, "Data:", data);
            if (res.ok && data.success) {
                console.log("[LEDGER] Setting ledger data, count:", data.count);
                setLedgerData(data.data || []);
                setFilteredLedger(data.data || []);
            } else {
                console.error("[LEDGER] API returned error:", data);
            }
        } catch (err) {
            console.error("[LEDGER] Error fetching ledger:", err);
        } finally {
            setLedgerLoading(false);
        }
    };

    const handleLedgerSearch = (userId) => {
        setSearchUserId(userId);
        if (!userId.trim()) {
            setFilteredLedger(ledgerData);
        } else {
            const filtered = ledgerData.filter(item =>
                item.user_id.toLowerCase().includes(userId.toLowerCase())
            );
            setFilteredLedger(filtered);
        }
    };

    const activeDaysBought = energyBoughtData.filter(d => d.value > 0).length;

const avgBought = activeDaysBought > 0
  ? (totalBought / activeDaysBought)
  : 0;

  const activeDaysSold = energySoldData.filter(d => d.value > 0).length;

const avgSold = activeDaysSold > 0
  ? (stats.totalSold / activeDaysSold)
  : 0;

    // Shorten wallet address
    const shortenAddress = (address) => {
        console.log("Shortening address:", address);
        if (!address) return "N/A";
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    return (
        <>
            {/* ONE-TIME 3D BOOK INTRO ANIMATION */}
            {showBookIntro && (
                <div className="dashboard-3d-intro-overlay">
                    {/* The Compressed Book */}
                    <div className="intro-compressed-book"></div>

                    {/* Dashboard Sections - Start compressed, then scatter */}
                    <div className="intro-dashboard-section intro-section-1">
                        <div className="intro-section-icon" style={{ background: '#10b981' }}>
                            <WalletIcon className="w-8 h-8 text-white" />
                        </div>
                        <div className="intro-section-label">Welcome</div>
                    </div>

                    <div className="intro-dashboard-section intro-section-2">
                        <div className="intro-section-icon" style={{ background: '#3b82f6' }}>
                            <UserIcon className="w-8 h-8 text-white" />
                        </div>
                        <div className="intro-section-label">User Info</div>
                    </div>

                    <div className="intro-dashboard-section intro-section-3">
                        <div className="intro-section-icon" style={{ background: '#fbbf24' }}>
                            <CubeIcon className="w-8 h-8 text-white" />
                        </div>
                        <div className="intro-section-label">Statistics</div>
                    </div>

                    <div className="intro-dashboard-section intro-section-4">
                        <div className="intro-section-icon" style={{ background: '#22c55e' }}>
                            <ArrowTrendingUpIcon className="w-8 h-8 text-white" />
                        </div>
                        <div className="intro-section-label">Charts</div>
                    </div>

                    <div className="intro-dashboard-section intro-section-5">
                        <div className="intro-section-icon" style={{ background: '#f59e0b' }}>
                            <BoltIcon className="w-8 h-8 text-white" />
                        </div>
                        <div className="intro-section-label">Activity</div>
                    </div>

                    <div className="intro-dashboard-section intro-section-6">
                        <div className="intro-section-icon" style={{ background: '#6366f1' }}>
                            <ArrowTrendingDownIcon className="w-8 h-8 text-white" />
                        </div>
                        <div className="intro-section-label">Navigation</div>
                    </div>
                </div>
            )}

            {/* MAIN DASHBOARD CONTENT */}
            <div className={`min-h-screen p-6 pb-24 max-w-7xl mx-auto ${showBookIntro ? 'dashboard-3d-expand-settle' : 'dashboard-entrance'}`}>
                {/* Welcome Message - ONLY IN DASHBOARD */}
                <div className="mb-6 card-stagger card-stagger-1">
                    <h2 className="text-xl font-semibold text-gray-300">
                        Welcome, <span className="text-solar">{userData.name || "User"}</span>
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">
                        Here's your energy trading overview
                    </p>
                </div>


                {/* Header */}
                <div className="mb-8 card-stagger card-stagger-2">
                    <h1 className="text-3xl font-bold mb-2">
                        <span className="text-solar">Dash</span>
                        <span className="text-energy">board</span>
                    </h1>
                </div>


                {/* User Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    {/* Wallet Address */}
                    <div className="energy-card energy-card-blockchain card-stagger card-stagger-3">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                                <WalletIcon className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <p className="data-label text-xs">Wallet Address</p>
                                <p className="text-sm font-mono text-blue-400">
                                    {shortenAddress(userData.wallet_address)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Role */}
                    <div className="energy-card energy-card-solar card-stagger card-stagger-4">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center">
                                <UserIcon className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <p className="data-label text-xs">Role</p>
                                <p className="text-sm font-semibold text-solar">
                                    Seller / Buyer
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Token Balance */}
                    <div className="energy-card card-stagger card-stagger-5">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
                                <CubeIcon className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <p className="data-label text-xs">Token Balance</p>
                                <p className="data-value text-lg data-value-energy counter-animate">
                                    {userData.token_balance}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Energy Balance */}
                    <div className="energy-card card-stagger card-stagger-6">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center">
                                <BoltIcon className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <p className="data-label text-xs">Energy Balance</p>
                                <p className="data-value text-lg data-value-solar counter-animate">
                                    {userData.energy_balance} kWh
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                

                {/* Stats Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* Total Sold */}
                    <div className="energy-card energy-card-solar card-stagger card-stagger-7">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <p className="data-label">Total Energy Sold (30d)</p>
                                <p className="data-value data-value-solar">{stats.totalSold.toFixed(1)} kWh</p>
                            </div>
                            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                                <ArrowTrendingUpIcon className="w-6 h-6 text-green-500" />
                            </div>
                        </div>
                        <p className="text-sm text-gray-400">
                            Avg: {(stats.totalSold/ 30).toFixed(1)} kWh/day
                        </p>
                    </div>
                      
                    {/* Total Bought */}
                    <div className="energy-card energy-card-blockchain card-stagger card-stagger-8">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <p className="data-label">Total Energy Bought (30d)</p>
                                <p className="data-value text-blue-400">{stats.totalBought.toFixed(1)} kWh</p>
                            </div>
                            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                                <ArrowTrendingDownIcon className="w-6 h-6 text-blue-500" />
                            </div>
                        </div>
                        <p className="text-sm text-gray-400">
                            Avg: {(stats.totalBought / 30).toFixed(1)} kWh/day
                        </p>
                    </div>

                    {/* Net Balance */}
                    <div className="energy-card card-stagger card-stagger-9">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <p className="data-label">Net Energy (30d)</p>
                                <p className={`data-value ${totalSold > totalBought ? 'text-energy' : 'text-blue-400'}`}>
                                  {stats.net.toFixed(1)} kWh
                                </p>
                            </div>
                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${totalSold > totalBought ? 'bg-green-500/20' : 'bg-blue-500/20'
                                }`}>
                                <BoltIcon className={`w-6 h-6 ${totalSold > totalBought ? 'text-green-500' : 'text-blue-500'}`} />
                            </div>
                        </div>
                        <p className="text-sm text-gray-400">
                            {totalSold > totalBought ? 'Net Seller' : 'Net Buyer'}
                        </p>
                    </div>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Energy Sold Chart */}
                    <div className="energy-card energy-card-solar card-stagger card-stagger-10">
                        <h3 className="chart-title flex items-center gap-2">
                            <ArrowTrendingUpIcon className="w-5 h-5 text-solar" />
                            Energy Sold (Last 30 Days)
                        </h3>
                        <div className="chart-container">
                            <LineChart
                                data={energySoldData}
                                color="#10b981"
                                label="kWh Sold"
                                height={250}
                            />
                        </div>
                    </div>

                    {/* Energy Bought Chart */}
                    <div className="energy-card energy-card-blockchain card-stagger card-stagger-10">
                        <h3 className="chart-title flex items-center gap-2">
                            <ArrowTrendingDownIcon className="w-5 h-5 text-blue-400" />
                            Energy Bought (Last 30 Days)
                        </h3>
                        <div className="chart-container">
                            <LineChart
                                data={energyBoughtData}
                                color="#3b82f6"
                                label="kWh Bought"
                                height={250}
                            />
                        </div>
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="energy-card card-stagger card-stagger-10">
                    <h3 className="text-xl font-bold mb-4">Recent Activity</h3>
                    <div className="space-y-3">
    {activityLoading ? (
        <p className="text-gray-400">Loading activity...</p>
    ) : activities.length === 0 ? (
        <p className="text-gray-400">No recent activity</p>
    ) : (
        activities.map((activity, i) => (
            <div
                key={i}
                className={`activity-item flex items-center justify-between p-4 bg-energy-subtle rounded-lg border border-energy`}
            >
                <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        activity.type === 'sell' ? 'bg-green-500/20' : 'bg-blue-500/20'
                    }`}>
                        {activity.type === 'sell' ? (
                            <ArrowTrendingUpIcon className="w-5 h-5 text-green-500" />
                        ) : (
                            <ArrowTrendingDownIcon className="w-5 h-5 text-blue-500" />
                        )}
                    </div>

                    <div>
                        <p className="font-semibold">
                            {activity.type === 'sell' ? 'Sold' : 'Bought'} {activity.amount}
                        </p>
                        <p className="text-sm text-gray-400">{activity.time}</p>
                    </div>
                </div>

                <div className="text-right">
                    <p className="font-semibold text-solar">
                        {activity.tokens} Tokens
                    </p>
                    <span className="status-badge status-completed text-xs">
                        {activity.status}
                    </span>
                </div>
            </div>
        ))
    )}
</div>
                </div>


            </div>


        </>
    );
}
