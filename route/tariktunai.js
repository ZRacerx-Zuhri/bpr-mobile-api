const express = require("express");
const { request_token, request_token_new } = require("../controller/tariktunai");

const router = express.Router();

router.post("/token", request_token);
router.post("/token_new", request_token_new);

module.exports = router;
