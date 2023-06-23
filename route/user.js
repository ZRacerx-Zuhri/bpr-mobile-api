const express = require("express");
const { createUser, validasi, aktivasi, Login, saldo, HistoryTransaction, inquiry_account, validate_user, validate_ktp, activate_user, update_device} = require("../controller/user");

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

module.exports = router;
