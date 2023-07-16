const express = require("express");
const { 
    createUser, validasi, aktivasi, Login, saldo, HistoryTransaction,
    inquiry_account, validate_user, validate_ktp, activate_user, update_device,
    update_mpin, update_pw, request_otp_mpin, request_update_pw, validate_otp
} = require("../controller/user");

const router = express.Router();

router.post("/createuser", createUser);
router.post("/validasi", validasi);
router.post("/saldo", saldo);
router.patch("/aktivasi", aktivasi);
router.post("/login", Login);
router.post("/history", HistoryTransaction);
router.post("/inquiry_account", inquiry_account);
router.post("/validate_user", validate_user);
router.post("/validate_ktp", validate_ktp);
router.post("/activate_user", activate_user);
router.post("/update_device", update_device);
router.post("/update_mpin", update_mpin);
router.post("/update_pw", update_pw);
router.post("/request_otp_mpin", request_otp_mpin);
router.post("/request_update_pw", request_update_pw);
router.post("/validate_otp", validate_otp);

module.exports = router;
