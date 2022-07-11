const express = require("express");
const { createUser, validasi } = require("../controller/user");

const router = express.Router();

router.post("/createuser", createUser);
router.post("/validasi", validasi);
router.post("/aktivasi", aktivasi);

module.exports = router;
