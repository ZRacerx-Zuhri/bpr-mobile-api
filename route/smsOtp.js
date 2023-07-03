const express = require("express");
const { sendOtp, verifyOtp } = require("../controller/smsOtp");

const router = express.Router();

router.post("/otp", sendOtp);
router.post("/verifyotp", verifyOtp);

module.exports = router;
