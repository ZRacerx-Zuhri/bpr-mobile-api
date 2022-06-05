const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cors = require("cors");

const { sequelize } = require("./dbConnect");

require("dotenv").config();
const { Client } = require("ssh2");

const conn = new Client();
conn
  .on("ready", () => {
    console.log("Client :: ready");
    conn.exec("uptime", (err, stream) => {
      if (err) throw err;
      //ORM -- conection///
      sequelize
        .authenticate()
        .then((db) => {
          console.log("CONNECTION ESTABLISHED! ", db);
        })
        .catch((err) => {
          console.error("UNABLE TO ESTABLISH CONNECTION: ", err.message);
        });
      // --///
      stream
        .on("close", (code, signal) => {
          console.log(
            "Stream :: close :: code: " + code + ", signal: " + signal
          );
          conn.end();
        })
        .on("data", (data) => {
          console.log("STDOUT: " + data);
        })
        .stderr.on("data", (data) => {
          console.log("STDERR: " + data);
        });
    });
  })
  .connect({
    host: "103.229.161.189",
    port: 7755,
    username: "ibpr",
    password: "JuaraBersama",
    // privateKey: readFileSync("/path/to/my/key"),
  });

const port = process.env.PORT;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.text());
app.use(bodyParser.raw());
app.use(bodyParser.urlencoded({ extended: false }));

app.get("/", async (req, res) => {
  try {
    console.log("Request");
    let Request = await sequelize.query(`SELECT * FROM acct_ebpr`, {
      type: QueryTypes.SELECT,
    });

    res.send(Request);
  } catch (error) {
    res.send(error);
  }
});

app.listen(port, () => {
  console.log(`bpr-mobile-api listening at http://localhost:${port}`);
});
