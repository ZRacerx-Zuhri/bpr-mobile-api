const express = require("express");
const { request_token } = require("../controller/tariktunai");

const router = express.Router();

router.post("/token", request_token);

module.exports = router;
