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

console.log(
  "kgAzXtorOedBo7VcAzrV16Otj5SePeWvrfVmVRHxpPH2M05lps/V3pAyTm5bqj9MS+iKxykUwqA6lnvjNVz+taZ3swiY9jFts6FrbmZVcXZtwNFXA3nbvKwSgLOdh04sr9dks2z7AUN7bC2YIM7YJHdFKg4xfWZblu1HNVtXzXLbwXqX0o61Vtev9cV/ELLIUFYlZvQ1KqmLOVEgWPIkjaKgGjlPZ30R26A0HjE7GvQ8ae6Mwuz2ceOJmjjaX83QxHCmRHCS46aWOh+mGGMsuuIlH8Dd6pGYwe+k6lA2dfIBcma+EOvuJlBYT84iEk5Db1+c3w6L5g8y5ykLT0SgWQ==" ===
    "kgAzXtorOedBo7VcAzrV16Otj5SePeWvrfVmVRHxpPH2M05lps/V3pAyTm5bqj9MS+iKxykUwqA6lnvjNVz+taZ3swiY9jFts6FrbmZVcXZtwNFXA3nbvKwSgLOdh04sr9dks2z7AUN7bC2YIM7YJHdFKg4xfWZblu1HNVtXzXLbwXqX0o61Vtev9cV/ELLIUFYlZvQ1KqmLOVEgWPIkjaKgGjlPZ30R26A0HjE7GvQ8ae6Mwuz2ceOJmjjaX83QxHCmRHCS46aWOh+mGGMsuuIlH8Dd6pGYwe+k6lA2dfIBcma+EOvuJlBYT84iEk5Db1+c3w6L5g8y5ykLT0SgWQ=="
);
app.listen(port, () => {
  console.log(`bpr-mobile-api listening at http://localhost:${port}`);
});
