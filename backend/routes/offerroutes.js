const express = require("express");
const router = express.Router();
const offerController = require("../controllers/offercontroller");
const authMiddleware = require("../middleware/auth");

router.post("/create", authMiddleware, offerController.createoffer);

router.post("/cancel", authMiddleware, offerController.canceloffer);
router.post("/accept", authMiddleware,offerController.acceptoffer);
router.get("/complete", authMiddleware, offerController.getAllOffers);
router.get("/own", authMiddleware, offerController.getown);
router.get("/other", authMiddleware, offerController.getother);
router.get("/getchart", authMiddleware, offerController.getChartData);
module.exports = router;