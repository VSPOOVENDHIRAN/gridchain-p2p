import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import socket from "../socket";

import {
  BoltIcon,
  ClockIcon,
  UserIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";

import NavigationBar from "../components/navbar.jsx";

export default function TradePage() {
  const [myOffers, setMyOffers] = useState([]);
  const [marketOffers, setMarketOffers] = useState([]);
  const [newOffer, setNewOffer] = useState({
    offer_type: "sell",
    units: "",
    token_per_unit: "",
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const API = process.env.REACT_APP_API_URL;

  // -------------------------------
  // AUTH HEADER
  // -------------------------------
  const authHeader = () => {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  };

  // -------------------------------
  // FETCH BOTH: OWN + MARKET OFFERS
  // -------------------------------
  const fetchOffers = useCallback(async () => {
    try {
      setLoading(true);
      console.log("[TRADE] Fetching offers from backend...");

      // My offers
      const own = await axios.get(`${API}/api/offers/own`, {
        headers: authHeader(),
      });
      console.log("[TRADE] Own offers response:", own.data);
      setMyOffers(Array.isArray(own.data) ? own.data : []);

      // Market offers
      const all = await axios.get(`${API}/api/offers/other`, {
        headers: authHeader(),
      });
       
      console.log("[TRADE] Market offers response:", all.data);
      setMarketOffers(Array.isArray(all.data) ? all.data : []);

      setError("");
    } catch (err) {
      console.error("[TRADE] Fetch Offers Error:", err);
      const backendMessage =
        err.response?.data?.msg ||
        err.response?.data?.message ||
        "Server connection issue.";
      setError(`Failed to load offers: ${backendMessage}`);
    } finally {
      setLoading(false);
    }
  }, []);

  // -------------------------------
  // SOCKET + INITIAL FETCH
  // -------------------------------
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (token) {
      socket.auth = { token: token };
      socket.connect();
    } else {
      setError("Please log in to view and create offers.");
      setLoading(false);
    }

    fetchOffers();
    socket.on("offersUpdated", fetchOffers);

    return () => {
      socket.off("offersUpdated", fetchOffers);
      if (socket.connected) socket.disconnect();
    };
  }, [fetchOffers]);

  // -------------------------------
  // CREATE OFFER
  // -------------------------------
  const handleCreateOffer = async (e) => {
    e.preventDefault();

    const creator_id = localStorage.getItem("user_id");
    if (!creator_id) {
      setError("User ID missing. Please log in again.");
      return;
    }

    if (!newOffer.units || !newOffer.token_per_unit) {
      setError("Please enter valid units and token rate.");
      return;
    }

    const unitsNum = Number(newOffer.units);
    const tokenRateNum = Number(newOffer.token_per_unit);

    if (
      isNaN(unitsNum) ||
      unitsNum <= 0 ||
      isNaN(tokenRateNum) ||
      tokenRateNum <= 0
    ) {
      setError("Units and Token / Unit must be positive numbers.");
      return;
    }

    const offerBody = {
      creator_id,
      units: unitsNum,
      token_per_unit: tokenRateNum,
      offer_type: newOffer.offer_type,
    };

    console.log("[TRADE] Creating offer:", offerBody);

    try {
      const res = await axios.post(`${API}/api/offers/create`, offerBody, {
        headers: authHeader(),
      });

      console.log("[TRADE] Create offer response:", res.data);

      if (res.data && (res.data.offer || res.data.success)) {
        setNewOffer({ offer_type: "sell", units: "", token_per_unit: "" });
        setError("");
        socket.emit("offerCreated");
        fetchOffers();
      } else {
        setError(res.data?.message || "Offer created, but update failed.");
      }
    } catch (err) {
      console.error("[TRADE] Create Offer Error:", err);
      const backendMessage = err.response?.data?.msg || err.response?.data?.message;
      setError(`Failed to create offer: ${backendMessage || "Unknown error"}`);
    }
  };

  const totalTokens =
    (Number(newOffer.units) || 0) * (Number(newOffer.token_per_unit) || 0);

  const acceptNegotiation = async (offerId) => {
    const loggedUserId = localStorage.getItem("user_id");
    if (!loggedUserId) {
      alert("User not logged in.");
      return;
    }

    try {
      const res = await axios.post(
        `${API}/api/offers/accept`,
        { offer_id: offerId, user_id: loggedUserId },
        { headers: authHeader() }
      );

      if (res.data.success) {
        socket.emit("offersUpdated");
        fetchOffers();
      } else {
        alert(res.data.message || "Failed to accept negotiation.");
      }
    } catch (error) {
      console.error(
        "Accept Negotiation Error:",
        error.response?.data || error.message || error
      );
      alert("Server error while accepting negotiation.");
    }
  };

  const cancelNegotiation = async (offerId) => {
    const loggedUserId = localStorage.getItem("user_id");
    if (!loggedUserId) return;

    try {
      const res = await axios.post(
        `${API}/api/offers/cancelnegotiation`,
        {
          offer_id: offerId,
          user_id: loggedUserId,
        }
      );

      if (res.data.success) {
        fetchOffers();
      } else {
        alert(res.data.message || "Failed to cancel negotiation.");
      }
    } catch (error) {
      console.error(error);
      alert("Server error while cancelling negotiation.");
    }
  };

  // -------------------------------
  // CANCEL OFFER
  const handleCancelOffer = async (offerId) => {
  try {
    const user_id = localStorage.getItem("user_id");
    if (!user_id) {
      alert("User not logged in.");
      return;
    }

    const res = await axios.post(
      `${API}/api/offers/cancel`,
      { user_id, offer_id: offerId },
      { headers: authHeader() }
    );

    if (res.data?.success || res.status === 200) {
      socket.emit("offerCanceled");
      fetchOffers();
    }
  } catch (err) {
    console.error("Cancel Offer Error:", err);
    alert("Failed to cancel offer.");
  }
};

  // -------------------------------
  // PURCHASE UNITS (PARTIAL)
  // -------------------------------
  const handlePurchase = async (offerId, units) => {
  const loggedUserId = localStorage.getItem("user_id");
  if (!loggedUserId) {
    alert("Please log in.");
    return;
  }

  const payload = {
    offer_id: offerId,
    user_id: loggedUserId,
    unit: Number(units),
  };

  console.log("[TRADE] Purchasing units:", payload);

  try {
    const res = await axios.post(
      `${API}/api/offers/accept`,
      payload,
      { headers: authHeader() }
    );

    console.log("[TRADE] Purchase response:", res.data);

    if (res.data.success) {
      // optional: remove this alert too if you want silent UX
      // alert("Purchase successful!");
      socket.emit("offersUpdated");
      fetchOffers();
    }
  } catch (err) {
    console.error("[TRADE] Purchase Error:", err);
    const msg = err.response?.data?.msg || "Purchase failed";
    alert(msg);
  }
};

  // -------------------------------
  // OFFER CARD COMPONENT
  // -------------------------------
  const OfferCard = ({
    offer,
    isOwnOffer,
    handleCancelOffer,
    acceptNegotiation,
    cancelNegotiation,
  }) => {
    const created = offer.created_at ? new Date(offer.created_at) : null;
    const [purchaseUnits, setPurchaseUnits] = useState(1); // Default 1 unit

    // Calculate total cost for selected units
    const totalPurchaseCost = (purchaseUnits * offer.token_per_unit).toFixed(2);

    return (
      <div
        className={`energy-card ${offer.offer_type === "sell" ? "energy-card-solar" : "energy-card-blockchain"
          } transition-all duration-300`}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-3 pb-2 border-b border-gray-700">
          <h3 className="font-extrabold text-lg flex items-center gap-2">
            <ArrowRightIcon className="w-5 h-5 text-solar" />
            {String(offer.offer_type || "").toUpperCase()} OFFER
          </h3>

          <span
            className={`status-badge ${offer.status === "open"
              ? "status-open"
              : offer.status === "negotiation"
                ? "status-negotiation"
                : "status-completed"
              }`}
          >
            {String(offer.status || "").toUpperCase()}
          </span>
        </div>

        {/* Info */}
        <div className="space-y-1 text-sm">
          <p>
            <b>ID:</b> {offer.offer_id || offer._id}
          </p>
          <div className="flex justify-between items-center">
            <p>
              <b>Available:</b>{" "}
              <span className="font-semibold text-lg">{offer.remaining_units}</span> kWh
            </p>
            <p className="text-solar font-bold">
              {offer.token_per_unit} T/unit
            </p>
          </div>

          {offer.status === "negotiation" && offer.negotiated_tokens && (
            <p className="text-yellow-300">
              <b>Negotiated Rate:</b> {offer.negotiated_tokens}
            </p>
          )}

          <p className="flex items-center gap-1 text-xs text-gray-400 pt-2">
            <UserIcon className="w-4 h-4" /> Creator: {offer.creator_id}
          </p>

          <p className="flex items-center gap-1 text-xs text-gray-400">
            <ClockIcon className="w-4 h-4" /> Created:{" "}
            {created ? created.toLocaleString() : "—"}
          </p>
        </div>

        {/* Own Offer Buttons */}
        {isOwnOffer && offer.status === "open" && (
          <button
            onClick={() => handleCancelOffer(offer.offer_id || offer._id)}
            className="mt-3 bg-red-500 hover:bg-red-600 text-white font-bold px-3 py-2 rounded-lg shadow-md w-full"
          >
            Cancel Offer
          </button>
        )}

        {isOwnOffer && offer.status === "negotiation" && (
          <div className="mt-4 flex gap-3">
            <button
              onClick={() => acceptNegotiation(offer.offer_id)}
              className="bg-green-600 hover:bg-green-700 text-white font-bold px-3 py-2 rounded-lg shadow-md flex-1"
            >
              Accept
            </button>

            <button
              onClick={() => cancelNegotiation(offer.offer_id)}
              className="bg-red-600 hover:bg-red-700 text-white font-bold px-3 py-2 rounded-lg shadow-md flex-1"
            >
              Reject
            </button>
          </div>
        )}

        {/* Market Offer Purchase */}
        {!isOwnOffer && offer.status === "open" && (
          <div className="mt-4">
            <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700">
              <div className="flex justify-between text-xs mb-2 text-gray-300">
                <span>Purchase Quantity:</span>
                <span>Total: <b className="text-solar">{totalPurchaseCost} Tokens</b></span>
              </div>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  max={offer.remaining_units}
                  value={purchaseUnits}
                  onChange={(e) => {
                    let val = parseInt(e.target.value);
                    if (isNaN(val)) val = 1;
                    if (val > offer.remaining_units) val = offer.remaining_units;
                    if (val < 1) val = 1;
                    setPurchaseUnits(val);
                  }}
                  className="w-20 rounded bg-gray-700 border border-gray-600 px-2 py-1 text-white text-center"
                  placeholder="Qty"
                />
                <button
                  onClick={() => handlePurchase(offer.offer_id || offer._id, purchaseUnits)}
                  disabled={purchaseUnits <= 0 || purchaseUnits > offer.remaining_units}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold px-3 py-2 rounded-lg shadow-md transition-colors"
                >
                  Buy Now
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // -------------------------------
  // CLIENT-SIDE FILTERS / SORTS
  // -------------------------------
  const loggedUserId = localStorage.getItem("user_id");
  const loggedTransformer = localStorage.getItem("transformer_id");

  const myOnlyOffers = useMemo(() => {
    if (!loggedUserId) return [];
    return (myOffers || [])
      .filter((o) => String(o.creator_id) === String(loggedUserId))
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  }, [myOffers, loggedUserId]);

  const filteredMarketOffers = useMemo(() => {
    return (marketOffers || [])
      .filter((o) => {
        if (loggedUserId && String(o.creator_id) === String(loggedUserId))
          return false;
        if (o.status && o.status !== "open") return false;
        if (
          loggedTransformer &&
          o.transformer_id &&
          String(o.transformer_id) !== String(loggedTransformer)
        )
          return false;
        return true;
      })
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  }, [marketOffers, loggedUserId, loggedTransformer]);

  // -------------------------------
  // RENDER UI
  // -------------------------------
  return (
    <div className="min-h-screen p-6 pb-24">
      <h1 className="text-3xl font-bold text-center mb-6 animate-fade-in-up">
        <span className="text-solar">Energy</span>{" "}
        <span className="text-energy">Trading</span>
      </h1>

      {error && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-200 font-semibold animate-fade-in">
          ⚠ {error}
        </div>
      )}

      {/* CREATE OFFER */}
      <div className="energy-card energy-card-solar mb-8 animate-fade-in-up delay-100">
        <h2 className="font-bold text-xl mb-3 pb-2 border-b border-gray-700">
          Create New Offer
        </h2>

        <form
          className="flex flex-col md:flex-row gap-4 items-end"
          onSubmit={handleCreateOffer}
        >
          <div className="flex-1">
            <label className="block mb-2 text-sm font-medium text-gray-300">Type</label>
            <select
              value={newOffer.offer_type}
              onChange={(e) =>
                setNewOffer({ ...newOffer, offer_type: e.target.value })
              }
              className="w-full px-4 py-2.5 rounded-lg bg-[#1e293b] border border-gray-700 text-white focus:border-white focus:outline-none transition-all h-11"
            >
              <option value="sell" className="bg-[#1e293b] text-white">Sell Energy</option>
              <option value="buy" className="bg-[#1b2b46] text-white">Buy Energy</option>
            </select>
          </div>

          <div className="flex-1">
            <label className="block mb-2 text-sm font-medium text-gray-300">Units (kWh)</label>
            <input
              type="number"
              placeholder="Enter units"
              value={newOffer.units}
              onChange={(e) =>
                setNewOffer({
                  ...newOffer,
                  units: e.target.value.replace(/[^0-9.]/g, ""),
                })
              }
              className="input-energy h-11"
              min="1"
            />
          </div>

          <div className="flex-1">
            <label className="block mb-2 text-sm font-medium text-gray-300">Token / Unit</label>
            <input
              type="number"
              placeholder="Enter rate"
              value={newOffer.token_per_unit}
              onChange={(e) =>
                setNewOffer({
                  ...newOffer,
                  token_per_unit: e.target.value.replace(/[^0-9.]/g, ""),
                })
              }
              className="input-energy h-11"
              min="1"
            />
          </div>

          <div className="bg-[#1e293b] border border-gray-700 p-3 rounded-lg h-11 flex items-center px-4">
            <div>
              <p className="text-xs text-gray-400 leading-none">Total {newOffer.offer_type === "buy" ? "Cost" : "Earning"}</p>
              <p className="font-bold text-sm text-solar leading-none mt-1">{totalTokens.toFixed(2)} Tokens</p>
            </div>
          </div>

          <button
            type="submit"
            className="btn-solar px-8 py-2.5 h-11 whitespace-nowrap"
          >
            Create Offer
          </button>
        </form>
      </div>

      {/* MARKET OFFERS - MOVED TO TOP */}
      <div className="mb-12">
        <h2 className="font-bold text-3xl mb-2 text-center animate-fade-in-up delay-100">
          <span className="text-energy">⚡ Market Offers</span>{" "}
          <span className="text-white/80">Near You</span>
        </h2>
        <p className="text-center text-gray-400 mb-6 text-sm">Browse and purchase energy from sellers in your area</p>

        {loading ? (
          <p className="energy-card text-center text-xl p-8 animate-fade-in">
            <ClockIcon className="w-6 h-6 inline-block animate-spin mr-2" />
            Loading...
          </p>
        ) : filteredMarketOffers.length === 0 ? (
          <p className="energy-card text-center text-lg p-5 animate-fade-in">
            No available offers in your transformer area.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredMarketOffers.map((offer, index) => (
              <div
                key={offer.offer_id || offer._id}
                className="animate-fade-in-up"
                style={{ animationDelay: `${(index + 1) * 0.05}s` }}
              >
                <OfferCard
                  offer={offer}
                  isOwnOffer={false}
                  handleCancelOffer={handleCancelOffer}
                  acceptNegotiation={acceptNegotiation}
                  cancelNegotiation={cancelNegotiation}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* YOUR OFFERS - MOVED TO BOTTOM */}
      <h2 className="font-bold text-2xl mb-3 text-solar text-center animate-fade-in-up delay-200">
        Your Active Offers
      </h2>

      {loading ? (
        <p className="energy-card text-center text-xl p-8 animate-fade-in">
          <ClockIcon className="w-6 h-6 inline-block animate-spin mr-2" />
          Loading...
        </p>
      ) : myOnlyOffers.length === 0 ? (
        <p className="energy-card text-center text-lg p-5 animate-fade-in">
          You have no active offers.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
          {myOnlyOffers.map((offer, index) => (
            <div
              key={offer.offer_id || offer._id}
              className="animate-fade-in-up"
              style={{ animationDelay: `${(index + 3) * 0.1}s` }}
            >
              <OfferCard
                offer={offer}
                isOwnOffer={true}
                handleCancelOffer={handleCancelOffer}
                acceptNegotiation={acceptNegotiation}
                cancelNegotiation={cancelNegotiation}
              />
            </div>
          ))}
        </div>
      )}

      <NavigationBar active="Trade" />
    </div>
  );
}
