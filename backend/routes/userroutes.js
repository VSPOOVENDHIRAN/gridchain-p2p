const express = require("express");
const router = express.Router();

const authController = require("../controllers/authcontroller");
const userController = require("../controllers/usercontroller");
const authMiddleware = require("../middleware/auth");

router.post("/check-device", authController.checkDevice);
router.post("/verify-otp", authController.verifyOtp);
router.post("/register", authController.registerUser);
router.post("/login", authController.login);
router.post("/change-password",authMiddleware,userController.changePassword);
router.get("/profile",authMiddleware,userController.getUserProfile);
router.get("/activity", authMiddleware, userController.getRecentActivity);
router.get("/dashboard-stats", authMiddleware, userController.getDashboardStats);

module.exports = router;
