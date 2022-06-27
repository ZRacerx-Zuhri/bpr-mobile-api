const {
  encryptStringWithRsaPublicKey,
  decryptStringWithRsaPrivateKey,
} = require("../utility/encrypt");
const Generate = require("../utility/generateKey");
var crypto = require("crypto");
var path = require("path");
var fs = require("fs");

const createUser = async (req, res) => {
  try {
    const privateKey = fs.readFileSync("./utility/privateKey.pem", "utf8");
    const publicKey = fs.readFileSync("./utility/publicKey.pem", "utf8");

    let password = encryptStringWithRsaPublicKey(
      "password",
      "./utility/privateKey.pem"
    );
    let decrypted = decryptStringWithRsaPrivateKey(
      password,
      "./utility/publicKey.pem"
    );

    res.status(200).send({ password, decrypted });
  } catch (error) {
    res.send(error);
  }
};

module.exports = { createUser };
