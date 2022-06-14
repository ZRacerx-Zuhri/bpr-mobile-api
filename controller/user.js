const { encryptStringWithRsaPublicKey } = require("../utility/encrypt");
const Generate = require("../utility/generateKey");
var crypto = require("crypto");
var path = require("path");
var fs = require("fs");

const createUser = async (req, res) => {
  try {
    const privateKey = fs.readFileSync("./utility/privateKey.pem", "utf8");
    const publicKey = fs.readFileSync("./utility/publicKey.pem", "utf8");

    // const data = Buffer.from(process.env.SECRET_KEY);
    // const signature = crypto.createSign("RSA-SHA256").update(data).sign(
    //   {
    //     key: privateKey,
    //     passphrase: process.env.SECRET_KEY,
    //   },
    //   "hex"
    // );
    // console.log(signature);
    // const isVerified = crypto.verify(
    //   "RSA-SHA256",
    //   data,
    //   publicKey,
    //   Buffer.from(data, "hex")
    // );
    // console.log("isverified", isVerified);
    // res.send("lalal");
    let password = encryptStringWithRsaPublicKey(
      "password",
      "./utility/privateKey.pem"
    );
    console.log(password);
    res.send(password);
  } catch (error) {
    res.send(error);
  }
};

module.exports = { createUser };
