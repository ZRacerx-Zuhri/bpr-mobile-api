const express = require("express");
const { createUser, validasi, aktivasi, Login } = require("../controller/user");

const router = express.Router();

router.post("/createuser", createUser);
router.post("/validasi", validasi);
router.patch("/aktivasi", aktivasi);
router.post("/login", Login);

module.exports = router;
