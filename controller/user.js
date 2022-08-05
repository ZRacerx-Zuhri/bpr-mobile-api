const {
  encryptStringWithRsaPublicKey,
  decryptStringWithRsaPrivateKey,
} = require("../utility/encrypt");
var crypto = require("crypto");
var path = require("path");
var fs = require("fs");
let db = require("../dbConnect/index");
let jwt = require("jsonwebtoken");
const { log } = require("console");
// const { Redis } = require("../utility/redis");

const createUser = async (req, res) => {
  let { pin } = req.body;
  console.log(pin);
  try {
    const privateKey = fs.readFileSync("./utility/privateKey.pem", "utf8");
    const publicKey = fs.readFileSync("./utility/publicKey.pem", "utf8");

    let password = encryptStringWithRsaPublicKey(
      pin,
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

const saldo = async (req, res) => {
  let { no_rek, nama_rek } = req.body;
  try {
    let check_saldo = await db.sequelize.query(
      `SELECT * FROM dummy_rek_tabungan WHERE no_rek = ? AND nama_rek = ?`,
      {
        replacements: [no_rek, nama_rek],
        type: db.sequelize.QueryTypes.SELECT,
      }
    );
    if (!check_saldo.length) {
      res.status(200).send({
        code: "099",
        status: "ok",
        message: "Gagal, Terjadi Kesalahan Pencarian Rekening!!!",
        data: null,
      });
    } else {
      res.status(200).send({
        code: "000",
        status: "ok",
        message: "Success",
        data: check_saldo,
      });
    }
  } catch (error) {
    console.log("error validasi", error);

    res.status(200).send({
      code: "E99",
      status: "error",
      message: error.message,
      data: null,
    });
  }
};

const validasi = async (req, res) => {
  try {
    let { user_id, pw_cetak } = req.body;

    let Request = await db.sequelize.query(
      `SELECT status,user_id FROM acct_ebpr WHERE user_id = ? AND pw_cetak = ?`,
      {
        replacements: [user_id, pw_cetak],
        type: db.sequelize.QueryTypes.SELECT,
      }
    );

    if (!Request.length) {
      res.status(200).send({
        code: "001",
        status: "ok",
        message: "User tidak ditemukan",
        data: null,
      });
    } else {
      if (Request[0].status === "0") {
        res.status(200).send({
          code: "000",
          status: "ok",
          message: "Success",
          data: Request,
        });
      } else {
        res.status(200).send({
          code: "002",
          status: "ok",
          message: "User Sudah Terverifikasi",
          data: null,
        });
      }
    }
  } catch (error) {
    console.log("error validasi", error);

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
    let { password, user_id, pin } = req.body;
    let Password = encryptStringWithRsaPublicKey(
      password,
      "./utility/privateKey.pem"
    );
    let Pin = encryptStringWithRsaPublicKey(pin, "./utility/privateKey.pem");
    let Auth = await db.sequelize.query(
      `SELECT user_id FROM acct_ebpr WHERE mpin = ? AND user_id = ?`,
      {
        replacements: [Pin, user_id],
        type: db.sequelize.QueryTypes.SELECT,
      }
    );
    console.log(Auth);

    if (!Auth.length) {
      res.status(200).send({
        code: "003",
        status: "ok",
        message: "Gagal, Terjadi Kesalahan!!!",
        data: null,
      });
    } else {
      let [results, metadata] = await db.sequelize.query(
        `UPDATE acct_ebpr SET password = ?, status = '1' WHERE user_id = ? AND mpin = ? AND status = '0'`,
        {
          replacements: [Password, user_id, Pin],
        }
      );
      console.log(metadata.rowCount);
      if (!metadata.rowCount) {
        res.status(200).send({
          code: "002",
          status: "ok",
          message: "User Sudah Terverifikasi",
          data: null,
        });
      } else {
        res.status(200).send({
          code: "000",
          status: "ok",
          message: "Success",
          data: "Aktivasi Berhasil",
        });
      }
    }
  } catch (error) {
    console.log("error aktivasi", error);

    res.status(200).send({
      code: "E99",
      status: "error",
      message: error.message,
      data: null,
    });
  }
};

const Login = async (req, res) => {
  let { user_id, password } = req.body;
  // console.log("tes...");
  try {
    let Password = encryptStringWithRsaPublicKey(
      password,
      "./utility/privateKey.pem"
    );
    let Request = await db.sequelize.query(
      `SELECT * FROM  acct_ebpr ac INNER JOIN dummy_rek_tabungan rk on ac.no_rek = rk.no_rek  WHERE password = ? AND user_id = ?`,
      {
        replacements: [Password, user_id],
        type: db.sequelize.QueryTypes.SELECT,
      }
    );

    if (!Request.length) {
      res.status(200).send({
        code: "001",
        status: "ok",
        message: "Nama Pengguna atau kata sandi salah",
        data: null,
      });
    } else {
      if (Request[0]["status"] === "0") {
        res.status(200).send({
          code: "004",
          status: "ok",
          message: "Akun tidak aktif",
          data: null,
        });
      } else {
        let accessToken = await jwt.sign(
          { id: Request[0]["user_id"] },
          process.env.SECRET_KEY,
          {
            expiresIn: "30m",
          }
        );
        let refreshToken = await jwt.sign(
          { id: Request[0]["user_id"] },
          process.env.SECRET_KEY,
          {
            expiresIn: "24h",
          }
        );

        // await Redis.set(
        //   Request[0]["user_id"],
        //   JSON.stringify({
        //     refreshToken,
        //   }),
        //   {
        //     EX: 60 * 60 * 24,
        //   }
        // );

        res.status(200).send({
          code: "000",
          status: "ok",
          message: "Success",
          data: [{ ...Request[0], accessToken, refreshToken }],
        });
      }
    }
  } catch (error) {
    console.log("error login", error.message);

    res.status(200).send({
      code: "E99",
      status: "error",
      message: error.message,
      data: null,
    });
  }
};

const HistoryTransaction = async (req, res) => {
  let { unique_id, no_rek, tcode, page } = req.body;
  page = page * 10 - 10;
  let Request = await db.sequelize.query(
    `SELECT * FROM dummy_transaksi WHERE unique_id = ? AND no_rek = ? AND tcode = ? ORDER BY tgljam_trans DESC OFFSET ? LIMIT 10`,
    {
      replacements: [unique_id, no_rek, tcode, page],
      type: db.sequelize.QueryTypes.SELECT,
    }
  );
  console.log(Request);
  res.status(200).send({
    code: "000",
    status: "ok",
    message: "Success",
    data: Request,
  });
  try {
  } catch (error) {
    //--error server--//
    console.log("erro get product", error);
    res.send(error);
  }
};

module.exports = { createUser, validasi, aktivasi, Login, HistoryTransaction, saldo };
