const express = require("express");
const { createUser } = require("../controller/user");

const router = express.Router();

router.post("/createuser", createUser);

module.exports = router;
