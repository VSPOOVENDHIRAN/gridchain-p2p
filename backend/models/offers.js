const mongoose = require("mongoose");

const offerSchema = new mongoose.Schema({
  offer_id: { type: String, required: true, unique: true },
  creator_id: { type: String, required: true },       // user_id\
  offer_type: { type: String, default: "sell", enum: ["sell", "buy"] },
  transformer_id: { type: String, required: true },
  units: { type: Number, required: true },
 
  remaining_units: { type: Number, required: true },
  token_per_unit: { type: Number, required: true },
  total_tokens: { type: Number, required: true },
  status: { type: String, default: "open", enum: ["open", "negotiation", "accepted", "cancelled", "completed"] },
  buyers: [
    {
      buyer_id: { type: String, required: true },
      buying_units: { type: Number, required: true },
      created_at: { type: Date, default: Date.now }
    }
  ],
  created_at: { type: Date, default: Date.now },
  completed_at: { type: Date, default: null }
});

module.exports = mongoose.model("Offer", offerSchema, "offers");