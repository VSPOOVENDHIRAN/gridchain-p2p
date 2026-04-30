const Offer = require("../models/offers");
const User = require("../models/user");
const mongoose = require("mongoose");
const {get_balance, send_transaction } = require("./ganachecontroller");

//generate unique offer_id
async function generateOfferId() {
  const count = await Offer.countDocuments();
  return "OFF" + String(1000 + count + 1);
}


const N = v => (typeof v === "number" ? v : Number(v || 0));


const getTokenBalance = async (wallet_address) => {
  if (!wallet_address) throw new Error("Wallet address required");
  const tokenContract = new web3.eth.Contract(ERC20_ABI, TOKEN_ADDRESS);
  const balance = await tokenContract.methods.balanceOf(wallet_address).call();
  return Number(web3.utils.fromWei(balance, "ether")); // assuming token has 18 decimals
};

const {
  createSellerOfferOnChain,
  buyerConfirmOnChain
} = require("../blockchain/energyContract");

// Create offer
exports.createoffer = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();
    console.log("Create offer request:", req.body);

    const { creator_id, units, token_per_unit, offer_type } = req.body;

    const creator = await User.findOne({ user_id: creator_id }).session(session);
    console.log("Creator fetched from DB:", creator ? creator.user_id : "Not found");

    if (!creator) throw new Error("Creator not found");
    //console.log("Creator energy balance:", creator.energy_balance, "Reserved energy:", creator.reserved_energy);
    const totalTokens = units * token_per_unit;

    // 🟢 SELL OFFER
    if (offer_type === "sell") {
      console.log("Checking energy balance for sell offer:", { energy_balance: creator.energy_balance, reserved_energy: creator.reserved_energy, units });
      if (creator.energy_balance < units)
        return res.status(400).json({ msg: "Not enough energy" });

      creator.energy_balance -= units;
      creator.reserved_energy += units;

      console.log("Energy reserved:", units);
    }
      
    // 🔵 BUY OFFER
  //  console.log("before buy offer check:", { token_balance: creator.token_balance, totalTokens });

     else if(offer_type === "buy") {
      //console.log("total tokens to reserve:", totalTokens);
      if (creator.token_balance < totalTokens)
        return res.status(400).json({ msg: "Not enough tokens" });
       // console.log("total tokens to reserve:", totalTokens);
        //console.log("token balance before reservation:", creator.token_balance);
      creator.token_balance -= totalTokens;
      //console.log("token balance after reservation:", creator.token_balance);
      creator.reserved_tokens += totalTokens;

      //console.log("Tokens reserved:", totalTokens);
    }

    else {
      console.log("Invalid offer type:", offer_type);
      return res.status(400).json({ msg: "Invalid offer type" });
    }
    console.log("Creating offer in DB with:", { creator_id, units, token_per_unit, offer_type });

    const offer = new Offer({
      offer_id: await generateOfferId(),
      creator_id: creator.user_id,
      offer_type,
      transformer_id: creator.transformer_id,
      units,
      remaining_units: units,
      token_per_unit,
      total_tokens: totalTokens,
      status: "open",
      created_at: new Date()
    });

    console.log("New offer created:", offer.offer_id);

    // 🔗 ON-CHAIN (optional: handle differently for buy/sell)
    let chainRes = await createSellerOfferOnChain(
        creator.wallet_address,
        units,
        token_per_unit
        );
    

    console.log("On-chain result:", chainRes);

    if (!chainRes.success) throw new Error(chainRes.error);

    
    await creator.save({ session });
    await offer.save({ session });

await session.commitTransaction();
    session.endSession();
    
    res.json({ success: true, offer });

  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ msg: err.message });
  }
};
exports.canceloffer = async (req, res) => {
  const io = req.app.get("io");
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const { user_id, offer_id } = req.body;

    if (!user_id || !offer_id) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ msg: "Missing fields" });
    }

    const offer = await Offer.findOne({ offer_id }).session(session);
    if (!offer) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ msg: "Offer not found" });
    }

    if (offer.creator_id !== user_id) {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({ msg: "Only creator can cancel" });
    }

    if (offer.status !== "open") {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ msg: "Cannot cancel in current status" });
    }

    const creator = await User.findOne({ user_id: offer.creator_id }).session(session);
    if (!creator) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ msg: "Creator not found" });
    }

    const remainingUnits = offer.remaining_units;
    const totalTokens = remainingUnits * offer.token_per_unit;

    // ============================
    // 🟢 SELL OFFER
    // ============================
    if (offer.offer_type === "sell") {

      console.log("Restoring energy to seller");

      creator.reserved_energy = Math.max(
        0,
        creator.reserved_energy - remainingUnits
      );

      creator.energy_balance += remainingUnits;
    }

    // ============================
    // 🔵 BUY OFFER
    // ============================
    else if (offer.offer_type === "buy") {

      console.log("Restoring tokens to buyer");

      creator.reserved_tokens = Math.max(
        0,
        creator.reserved_tokens - totalTokens
      );

      creator.token_balance += totalTokens;
    }

    // ============================
    // Update offer
    // ============================
    offer.status = "cancelled";
    offer.completed_at = new Date();

    await creator.save({ session });
    await offer.save({ session });

    await session.commitTransaction();
    session.endSession();

    // 🔔 Socket notify
    const users = await User.find({ transformer_id: offer.transformer_id }).select("user_id");

    users.forEach(u => {
      io.to(u.user_id.toString()).emit("offer_cancelled", {
        msg: "Offer cancelled",
        offer
      });
    });

    return res.json({
      success: true,
      msg: "Offer cancelled and funds restored",
      offer
    });

  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error("cancelOffer error:", err);
    return res.status(500).json({ msg: "Server error" });
  }
};
//--accept offer function--exports.acceptoffer = async (req, res) => {
  exports.acceptoffer = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const { offer_id, user_id, unit } = req.body;

    const offer = await Offer.findOne({ offer_id }).session(session);
    if (!offer || offer.status !== "open") {
      return res.status(400).json({ msg: "Invalid offer" });
    }

    if (unit > offer.remaining_units) {
      return res.status(400).json({ msg: "Units exceed offer" });
    }

    const creator = await User.findOne({ user_id: offer.creator_id }).session(session);
    const accepter = await User.findOne({ user_id }).session(session);

    if (!creator || !accepter) {
      throw new Error("Users not found");
    }

    const totalTokens = unit * offer.token_per_unit;

    // 🔗 ON-CHAIN CONFIRM (same for both)
    // const chainRes = await buyerConfirmOnChain(
    //   accepter.wallet_address,
    //   creator.wallet_address,
    //   unit
    // );

    // if (!chainRes.success) throw new Error(chainRes.error);

    // ================================
    // 🟢 SELL OFFER (creator = seller)
    // ================================
    if (offer.offer_type === "sell") {
      
       
      creator.reserved_energy -= unit;   // seller gives energy
      accepter.energy_balance += unit;   // buyer receives energy
        if(accepter.token_balance < totalTokens) {
          throw new Error("Buyer has insufficient tokens");
        }   
      accepter.token_balance -= totalTokens; // buyer pays tokens
      creator.token_balance += totalTokens;    // seller gets tokens

      creator.total_energy_sold += unit;
      accepter.total_energy_bought += unit;

    }

    // ================================
    // 🔵 BUY OFFER (creator = buyer)
    // ================================
    else if (offer.offer_type === "buy") {
     
      if(accepter.energy_balance < unit) {
        throw new Error("Seller has insufficient energy");
      }
      accepter.energy_balance -= unit;   // seller gives energy
      creator.energy_balance += unit;   // buyer receives energy

      creator.reserved_tokens -= totalTokens; // buyer pays tokens
      accepter.token_balance += totalTokens;  // seller gets tokens

      creator.total_energy_bought += unit;
      accepter.total_energy_sold += unit;

    }

    // ================================
    // Update offer
    // ================================
    offer.remaining_units -= unit;
    offer.buyers.push({
      buyer_id: accepter.user_id,
      buying_units: unit
    });

    if (offer.remaining_units === 0) {
      offer.status = "completed";
      offer.completed_at = new Date();
    }

    await creator.save({ session });
    await accepter.save({ session });
    await offer.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.json({ success: true, offer });

  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ msg: err.message });
  }
};
 // adjust the path

exports.getAllOffers = async(req, res) => {
  try {
      const offers = await Offer.find({
      status: { $in: ["completed", "cancelled"] }
    });
  // fetch all documen  ts
 //   console.log('All Offers:', offers);
 
    return res.json(offers);
  } catch (err) {
    console.error('Error fetching offers:', err);
    throw err;
  }
};

exports.getown = async(req, res) => {
  try {
   // console.log("Request body for getown:", req.body);
    const user_id = req.user.user_id; 
    console.log("get own offers for user:",user_id);
     
   // console.log("Fetching own offers for user_id:", user_id);
    const offers = await Offer.find({ creator_id: user_id,
      status: { $in: ["open"] }
     });
 //   console.log('All Offers:', offers);
    return res.json(offers);
  } catch (err) {
    console.error('Error fetching offers:', err);
    throw err;
  }
};
exports.getother = async(req, res) => {
  try {
    const user_id = req.user;  
    console.log("Fetching other offers for user_id:", user_id.user_id);
   const offers = await Offer.find({ creator_id: { $ne: user_id.user_id },
      status: { $in: ["open"] }
     });  // fetch all documents
   // console.log('All Offers:', offers);
    return res.json(offers);
  } catch (err) {
    console.error('Error fetching offers:', err);
    throw err;
  }
};

// GET /api/chart?type=sold&days=30
exports.getChartData = async (req, res) => {
  try {
    const { type, days = 30 } = req.query;
    const userId = req.user.user_id;

    if (!type || !["buy", "sell"].includes(type)) {
      return res.status(400).json({ msg: "Invalid type (buy/sell required)" });
    }

    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - Number(days));

    const data = await Offer.aggregate([
      {
        $match: {
          creator_id: userId,
          offer_type: type,
          status: "completed",
          completed_at: { $gte: fromDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$completed_at"
            }
          },
          total: { $sum: "$units" }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    console.log("Completed chart data:", data);

    res.json(data);

  } catch (err) {
    console.error("Chart error:", err);
    res.status(500).json({ msg: err.message });
  }
};