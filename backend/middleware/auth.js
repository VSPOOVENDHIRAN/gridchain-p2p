const jwt = require("jsonwebtoken");
const User = require("../models/user");

const auth = async (req, res, next) => {
  try { 
    console.log("Authenticating request...");
    const authHeader = req.headers.authorization;
   // console.log("check pipeline 1");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
   // console.log("Token decoded:", decoded);
    const user = await User.findById(decoded.user_id);
    if (!user) {
      return res.status(401).json({ message: "Invalid token user" });
    }
    console.log("User authenticated:", user.user_id);

    req.user = user;   // attach user
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token invalid or expired" });
  }
};

module.exports = auth;
