import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SearchIcon } from "@heroicons/react/24/outline";

// GovLedger component: displays electronic bill ledger for government users
export default function GovLedger() {
  const [ledgerData, setLedgerData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
const API = process.env.REACT_APP_API_URL;
  // Fetch ledger on mount
  useEffect(() => {
    if (!token) {
      navigate("/gov-login");
      return;
    }
    const fetchLedger = async () => {
      try {
        const res = await fetch(`${API}/api/gov/eb-bills`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setLedgerData(data.data || []);
          setFilteredData(data.data || []);
        } else {
          console.error("Failed to load ledger:", data);
        }
      } catch (err) {
        console.error("Error fetching ledger:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLedger();
  }, [token, navigate]);

  // Search filter
  useEffect(() => {
    if (!search.trim()) {
      setFilteredData(ledgerData);
    } else {
      const lower = search.toLowerCase();
      const filtered = ledgerData.filter(item =>
        (item.user_id && item.user_id.toLowerCase().includes(lower)) ||
        (item.bill_id && item.bill_id.toLowerCase().includes(lower))
      );
      setFilteredData(filtered);
    }
  }, [search, ledgerData]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400 animate-pulse">Loading Ledger...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-solar">Government Ledger</h1>

      <div className="flex items-center mb-4">
        <input
          type="text"
          placeholder="Search by User ID or Bill ID"
          className="input-energy flex-1 mr-2"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button className="btn-energy flex items-center">
          <SearchIcon className="h-5 w-5 mr-1" />
          Search
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full table-auto">
          <thead className="bg-energy-subtle">
            <tr>
              <th className="p-3 text-left">Bill ID</th>
              <th className="p-3 text-left">User ID</th>
              <th className="p-3 text-left">Amount (kWh)</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Created At</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-4 text-center text-gray-500">
                  No ledger records found.
                </td>
              </tr>
            ) : (
              filteredData.map((item, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? "bg-energy-subtle" : "bg-white"}>
                  <td className="p-3">{item.bill_id || "-"}</td>
                  <td className="p-3">{item.user_id || "-"}</td>
                  <td className="p-3">{item.amount_kwh ?? "-"}</td>
                  <td className="p-3 text-capitalize">{item.status || "-"}</td>
                  <td className="p-3">{item.created_at ? new Date(item.created_at).toLocaleString() : "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
