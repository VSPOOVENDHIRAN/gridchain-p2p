const User = require("../models/user");
const bcrypt = require("bcryptjs"); // needed for changePassword
const Offer = require("../models/offers");

const usercontroller = {

  // 1. Get user profile
  async getUserProfile (req, res) {
    try {
     
     const user = req.user; // password excluded in auth middleware
      if (!user) return res.status(404).json({ message: "User not found" });

      res.json({ success: true, data: user });
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  },

  // 2. Change password
  async changePassword (req, res) {
    try {
      console.log("Change password request received");
      console.log("Request body:", req.body);
      const { currentPassword, newPassword } = req.body;
      console.log("Current Password:", currentPassword ? "Provided" : "Not provided");
      const user =req.user;
      console.log("Changing password for user:", req.user.user_id);
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch)
        return res.status(400).json({ message: "Current password incorrect" });
      console.log("Current password verified");
      const hashed = await bcrypt.hash(newPassword, 10);

      user.password = hashed;
      await user.save();

      res.json({ success: true, message: "Password updated successfully" });

    } catch (err) {
      res.status(500).json({ message: "Server error", error: err.message });
    }
  },

  // 3. Get balances
  async getBalances (req, res) {
    try {
      const user = await User.findById(req.user.user_id)
        .select(
          "wallet_balance token_balance last_export_reading last_import_reading total_energy_sold total_energy_bought"
        );

      if (!user) return res.status(404).json({ message: "User not found" });

      const energy_balance =
        user.last_export_reading -
        user.last_import_reading -
        user.total_energy_sold +
        user.total_energy_bought;

      res.json({
        success: true,
        data: {
          wallet_balance: user.wallet_balance,
          token_balance: user.token_balance,
          energy_balance
        }
      });

    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  },

  // 4. Update balances
  async updateBalances (req, res) {
    try {
      const { wallet, tokens, energy } = req.body;

      const user = await User.findByIdAndUpdate(
        req.user.id,
        {
          walletBalance: wallet,
          tokenBalance: tokens,
          energyBalance: energy
        },
        { new: true }
      ).select("walletBalance tokenBalance energyBalance");

      res.json({ success: true, data: user });

    } catch (err) {
      res.status(500).json({ message: "Server error", error: err.message });
    }
  },

  // 5. Get technical info
  async getTechnicalInfo (req, res) {
    try {
      const user = await User.findById(req.user.id).select("meterId transformerId");

      res.json({
        success: true,
        data: {
          meterId: user.meterId,
          transformerId: user.transformerId
        }
      });

    } catch (err) {
      res.status(500).json({ message: "Server error", error: err.message });
    }
  },

  // 6. Find user by meter ID
  async findUserByMeterId (meterId) {
    if (!meterId) throw new Error("Meter ID is required");

    try {
      const user = await User.findOne({ meter_id: meterId }).exec();

      if (!user) {
        console.log(`User NOT found for meter: ${meterId}`);
        return null;
      }

      console.log(`User found: ${user._id}`);
      return user;

    } catch (err) {
      console.error("Error finding user:", err);
      return null;
    }
  },



 // adjust path if needed

// helper function


// ✅ Controller function
async getRecentActivity (req, res) {
  try {
    const userId = req.user.user_id;
    console.log("Fetching recent activity for user:", userId);
    const activities = await Offer.find({
      creator_id: userId,
      status: "completed"
    })
      .sort({ completed_at: -1 })
      .limit(5);

    const formatted = activities.map(a => ({
      type: a.offer_type,
      amount: `${a.units} kWh`,
      tokens: a.total_tokens,
      time: timeAgo(a.completed_at),
      status: a.status
    }));
    console.log("Recent activities fetched:", formatted);

    res.json({ success: true, data: formatted });

  } catch (err) {
    console.error("Recent activity error:", err);
    res.status(500).json({ msg: err.message });
  }
},

async getDashboardStats(req, res){
  try {
    const userId = req.user.user_id;

    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - 30);

    // Total Sold
    const sold = await Offer.aggregate([
      {
        $match: {
          creator_id: userId,
          offer_type: "sell",
          created_at: { $gte: fromDate },
          status: "completed"
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$units" }
        }
      }
    ]);

    // Total Bought
    const bought = await Offer.aggregate([
      {
        $match: {
          creator_id: userId,
          offer_type: "buy",
          created_at: { $gte: fromDate },
          status: "completed"
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$units" }
        }
      }
    ]);

    const totalSold = sold[0]?.total || 0;
    const totalBought = bought[0]?.total || 0;

    res.json({
      success: true,
      data: {
        totalSold,
        totalBought,
        net: totalSold - totalBought
      }
    });

  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
}

};

 const timeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);

  const intervals = [
    { label: "day", value: 86400 },
    { label: "hour", value: 3600 },
    { label: "minute", value: 60 }
  ];

  for (let i of intervals) {
    const count = Math.floor(seconds / i.value);
    if (count > 0) {
      return `${count} ${i.label}${count > 1 ? "s" : ""} ago`;
    }
  }

  return "just now";
}

module.exports = usercontroller;