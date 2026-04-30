import React, { useEffect, useState } from "react";
import { BoltIcon, ClockIcon } from "@heroicons/react/24/outline";

export default function History() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [serverError, setServerError] = useState(false);
 const API = process.env.REACT_APP_API_URL;
  const fetchOffers = async () => {
    try {
      const token = localStorage.getItem("token");
      console.log("[HISTORY] Fetching closed offers...");
      const res = await fetch(`${API}/api/offers/complete`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        console.error("[HISTORY] Server error:", res.status);
        setServerError(true);
        setLoading(false);
        return;
      }

      const data = await res.json();
      console.log("[HISTORY] Response:", data);
      setOffers(Array.isArray(data) ? data : []);
      setServerError(false);
    } catch (err) {
      console.error("[HISTORY] Fetch error:", err);
      setServerError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const statusColors = {
    completed: "bg-emerald-600",
    cancelled: "bg-red-600",
    pending: "bg-yellow-500",
  };

  return (
    <div className="min-h-screen p-6 pb-24">
      <h1 className="text-3xl font-bold text-center mb-8 animate-fade-in-up">
        <span className="text-solar">Energy Trading</span>{" "}
        <span className="text-energy">History</span>
      </h1>

      {/* Server error */}
      {serverError && (
        <div className="text-center text-lg font-semibold p-3 bg-red-500/20 border border-red-500 rounded-lg mb-4 animate-fade-in">
          ⚠️ Connecting to server...
        </div>
      )}

      {/* Loading */}
      {loading && !serverError && (
        <div className="text-center text-lg font-semibold text-gray-300 mb-4 animate-fade-in">
          ⏳ Loading history...
        </div>
      )}

      {/* No offers */}
      {!loading && !serverError && offers.length === 0 && (
        <div className="energy-card text-center text-xl mb-4 animate-fade-in">
          No closed offers in the last 30 days.
        </div>
      )}

      {/* Offer cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {!loading &&
          !serverError &&
          offers.map((offer, index) => (
            <div
              key={offer._id}
              className="energy-card energy-card-solar animate-fade-in-up"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="flex justify-between items-center mb-3">
                <h2 className="font-bold text-lg flex items-center gap-2">
                  <BoltIcon className="w-6 h-6 text-solar" />
                  {offer.offer_id}
                </h2>

                <span
                  className={`status-badge ${offer.status === 'completed' ? 'status-completed' :
                    offer.status === 'cancelled' ? 'status-cancelled' :
                      'status-open'
                    }`}
                >
                  {offer.status}
                </span>
              </div>

              <div className="space-y-1">
                <p>
                  <strong className="text-energy">Type:</strong> {offer.offer_type}
                </p>
                <p>
                  <strong className="text-emerald-300">Units:</strong> {offer.units} kWh
                </p>
                <p>
                  <strong className="text-emerald-300">Rate/Unit:</strong> {offer.token_per_unit} Tokens
                </p>
                <p>
                  <strong className="text-emerald-300">Total Tokens:</strong> {offer.total_tokens}
                </p>
              </div>

              <div className="mt-4 text-sm p-3 bg-white/10 rounded-xl">
                <p>
                  <strong>Created By:</strong> {offer.creator_id}
                </p>
                {offer.negotiated_by && (
                  <p>
                    <strong>Accepted By:</strong> {offer.negotiated_by}
                  </p>
                )}
              </div>

              <div className="mt-4 space-y-1 text-sm opacity-80 flex flex-col gap-1">
                <p className="flex items-center gap-1">
                  <ClockIcon className="w-5 h-5 text-green-300" /> Created: {formatDate(offer.created_at)}
                </p>
                {offer.completed_at && (
                  <p className="flex items-center gap-1">
                    <ClockIcon className="w-5 h-5 text-yellow-300" /> Completed: {formatDate(offer.completed_at)}
                  </p>
                )}
              </div>
            </div>
          ))}
      </div>

    </div>
  );
}
