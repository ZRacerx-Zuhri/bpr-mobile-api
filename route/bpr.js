const express = require("express");
const { list_bpr } = require("../controller/bpr");

const router = express.Router();

router.get("/list_bpr", list_bpr);

module.exports = router;
