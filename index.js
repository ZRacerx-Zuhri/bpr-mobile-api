const express = require("express");
const app = express();
const bodyParser = require("body-parser");
require("dotenv").config();
const cors = require("cors");
const User = require("./route/user");
const Ppob = require("./route/Ppob");
const tariktunai = require("./route/tariktunai");
const bpr = require("./route/bpr");
const otp = require("./route/smsOtp");
require("./utility/redis");

const { sequelize } = require("./dbConnect");

sequelize
  .authenticate()
  .then((db) => {
    console.log("CONNECTION ESTABLISHED! ");
  })
  .catch((err) => {
    console.error("UNABLE TO ESTABLISH CONNECTION: ", err);
  });

const port = process.env.PORT;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.text());
app.use(bodyParser.raw());
app.use(bodyParser.urlencoded({ extended: false }));
app.use("/user", User);
app.use("/tariktunai", tariktunai);
app.use("/ppob", Ppob);
app.use("/bpr", bpr);
app.use("/sms", otp);

app.get("/", (req, res) => {
  res.send("bpr-mobile-api");
});

app.listen(port, () => {
  console.log(`bpr-mobile-api listening at http://localhost:${port}`);
});
