import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import NavigationBar from '../components/navbar.jsx';
import './govledger.css';

const GovLedger = () => {
    const navigate = useNavigate();
    const [ledgerData, setLedgerData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    const token = localStorage.getItem('token');
    const API = process.env.REACT_APP_API_URL;

    useEffect(() => {
        if (!token) {
            navigate('/login');
            return;
        }
        fetchLedgerData();
    }, [token]);

    const fetchLedgerData = async (search = '') => {
        try {
            setLoading(true);
            setError(null);

            const params = search ? `?search=${search}` : '';
            const response = await axios.get(
                `${API}/api/gov/ledger${params}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                setLedgerData(response.data.data);
            } else {
                setError('Failed to load data');
            }
            setLoading(false);
        } catch (error) {
            console.error('Error fetching government ledger:', error);
            if (error.code === 'ERR_NETWORK') {
                setError('Cannot connect to backend server. Please ensure backend is running on port 5001');
            } else if (error.response?.status === 401) {
                navigate('/login');
            } else {
                setError(error.response?.data?.message || 'Failed to load data');
            }
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchLedgerData(searchQuery);
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="skeleton w-16 h-16 rounded-full mx-auto mb-4"></div>
                    <p className="text-xl font-semibold text-gray-300">Loading Government Ledger...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="energy-card max-w-md text-center">
                    <p className="text-red-400 text-lg mb-4">{error}</p>
                    <button
                        onClick={() => fetchLedgerData()}
                        className="px-4 py-2 bg-solar text-black rounded-lg font-semibold hover:bg-solar/90"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="min-h-screen p-6 pb-24 max-w-7xl mx-auto">
                <div className="energy-card">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-white mb-1">Govt Ledger</h1>
                            <p className="text-gray-400 text-sm">
                                Total Users: <span className="text-solar font-semibold">{ledgerData?.total_users || 0}</span>
                            </p>
                        </div>

                        {/* Search */}
                        <form onSubmit={handleSearch} className="relative">
                            <input
                                type="text"
                                placeholder="Search by User ID..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="search-input pl-10 pr-4 py-2 bg-energy-subtle border border-energy rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-solar w-64"
                            />
                            <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                        </form>
                    </div>

                    {/* Table */}
                    {!ledgerData || ledgerData.users.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-gray-400 text-lg">No users found</p>
                            {searchQuery && (
                                <button
                                    onClick={() => { setSearchQuery(''); fetchLedgerData(''); }}
                                    className="mt-4 text-solar hover:underline"
                                >
                                    Clear search
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="govt-ledger-table w-full">
                                <thead>
                                    <tr>
                                        <th>User ID</th>
                                        <th>Monthly EB Units Used</th>
                                        <th>Monthly EB Bill Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {ledgerData.users.map((user) => (
                                        <tr key={user.user_id}>
                                            <td className="font-mono text-blue-400">{user.user_id}</td>
                                            <td className="text-green-400">{user.monthly_units.toFixed(2)} kWh</td>
                                            <td className="text-yellow-400">{formatCurrency(user.monthly_bill)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            <NavigationBar active="Gov Ledger" />
        </>
    );
};

export default GovLedger;
