const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cors = require("cors");
const User = require("./route/user");
const tunnel = require("tunnel-ssh");
const { sequelize } = require("./dbConnect");
var crypto = require("crypto");
var path = require("path");
var fs = require("fs");
const Generate = require("./utility/generateKey");

require("dotenv").config();

var config = {
  username: "ibpr",
  password: "JuaraBersama",
  host: `103.229.161.189`,
  port: 7755,
  dstHost: `127.0.0.1`,
  dstPort: 5432,
  localHost: "localhost",
  localPort: 3001,
  keepAlive: true,
};

// tunnel(config, async (error, server) => {
//   if (error) {
//     console.error("error tunnel", error.message);
//   } else {
//     console.log("server:", server);
//     await server;
//     // console.log("run...")
//     await sequelize
//       .authenticate()
//       .then((db) => {
//         console.log("CONNECTION ESTABLISHED! ", db);
//       })
//       .catch((err) => {
//         console.error("UNABLE TO ESTABLISH CONNECTION: ", err);
//       });
//   }
// });
const port = process.env.PORT;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.text());
app.use(bodyParser.raw());
app.use(bodyParser.urlencoded({ extended: false }));
app.use("/user", User);

app.get("/", (req, res) => {
  Generate();
  res.send("bpr-mobile-api");
});

app.listen(port, () => {
  console.log(`bpr-mobile-api listening at http://localhost:${port}`);
});
