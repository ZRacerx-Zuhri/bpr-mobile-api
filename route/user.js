const express = require("express");
const { createUser, validasi, aktivasi, Login, saldo } = require("../controller/user");

const router = express.Router();

router.post("/createuser", createUser);
router.post("/validasi", validasi);
router.post("/saldo", saldo);
router.patch("/aktivasi", aktivasi);
router.post("/login", Login);

module.exports = router;
