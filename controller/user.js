const {
  encryptStringWithRsaPublicKey,
  decryptStringWithRsaPrivateKey,
} = require("../utility/encrypt");
var crypto = require("crypto");
var path = require("path");
var fs = require("fs");
let db = require("../DbConnect/index");


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

const validasi = async (req, res) => {
  try {
    let { user_id, pw_cetak } = req.body;
  
    let Request = await db.sequelize.query(`SELECT * FROM acct_ebpr WHERE user_id = ? AND pw_cetak = ? AND status != '6'`, {
      replacements: [user_id, pw_cetak],
      type: db.sequelize.QueryTypes.SELECT,
    });

    res.status(200).send({
      code: "000",
      status: "ok",
      message: "Success",
      data: Request,
    });
  } catch (error) {
    console.log("error get clinic", error);

    res.status(200).send({
      code: "E99",
      status: "error",
      message: error.message,
      data: null,
    });
  }
};

const aktivasi = async (req, res) => {
  try {
    let { password, user_id } = req.body;
  
    let Request = await db.sequelize.query(`UPDATE acct_ebpr SET password = ?, status = '1' WHERE user_id = ? AND status = '0'`, {
      replacements: [password, user_id],
      type: db.sequelize.QueryTypes.SELECT,
    });

    res.status(200).send({
      code: "000",
      status: "ok",
      message: "Success",
      data: Request,
    });
  } catch (error) {
    console.log("error get clinic", error);

    res.status(200).send({
      code: "E99",
      status: "error",
      message: error.message,
      data: null,
    });
  }
};

module.exports = { createUser, validasi, aktivasi };
