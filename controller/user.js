const {
  encryptStringWithRsaPublicKey,
  decryptStringWithRsaPrivateKey,
} = require("../utility/encrypt");
var crypto = require("crypto");
var path = require("path");
var fs = require("fs");
let db = require("../dbConnect/index");
let jwt = require("jsonwebtoken");

const moment = require("moment");

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
      `SELECT ac.bpr_id,
      ac.no_rek,
      ac.nama_rek,
      ac.no_hp,
      ac.nama,
      ac.user_id,
      ac."password",
      ac.email,
      kd.bpr_logo,
      ac.unique_id
      FROM  acct_ebpr ac INNER JOIN dummy_rek_tabungan rk on ac.no_rek = rk.no_rek 
      INNER JOIN kd_bpr kd on ac.bpr_id = kd.bpr_id WHERE password = ? AND user_id = ?`,
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
  try {
    let cek_tgl = moment()
                  .subtract(24, "hours")
                  .format("YYYY-MM-DD HH:mm:ss")
    let jumlah_page = await db.sequelize.query(
      `SELECT COUNT(*) AS jumlah_page FROM dummy_transaksi WHERE unique_id = ? AND no_rek = ? AND tgljam_trans > ? AND tcode = ?`,
      {
        replacements: [unique_id, no_rek, cek_tgl, tcode],
        type: db.sequelize.QueryTypes.SELECT,
      }
    );

    let Request = await db.sequelize.query(
      `SELECT DT.no_rek, DT.nama_rek, DT.tcode, DT.ket_trans, DT.reff, DT.amount, T.token, T.status, T.tgl_trans, T.tgl_expired
      FROM dummy_transaksi AS DT INNER JOIN token AS T ON DT.tgljam_trans = T.tgl_trans
      WHERE unique_id = ? AND DT.no_rek = ? AND tcode = ? AND tgljam_trans > ?
      ORDER BY tgljam_trans DESC
      OFFSET ? LIMIT 10`,
      {
        replacements: [unique_id, no_rek, tcode, cek_tgl, page],
        type: db.sequelize.QueryTypes.SELECT,
      }
    );

    if (!Request.length) {
      res.status(200).send({
        code: "001",
        status: "ok",
        message: "Riwayat Transaksi Tidak Ada...",
        data: null,
      });
    } else {
      let CopyData = Request.map((val) => ({
        ...val,
        tgl_trans: moment(val.tgl_trans).format("dddd, DD MMM YYYY, HH:mm:ss"),
        tgl_expired: moment(val.tgl_expired).format(
          "dddd, DD MMM YYYY, HH:mm:ss"
        ),
      }));
      CopyData.push({
        TotalPage: Math.ceil(parseInt(jumlah_page[0].jumlah_page) / 10),
      });
      res.status(200).send({
        code: "000",
        status: "ok",
        message: "Success",
        data: CopyData,
      });
    }
  } catch (error) {
    //--error server--//
    console.log("erro get product", error);
    res.send(error);
  }
};

module.exports = {
  createUser,
  validasi,
  aktivasi,
  Login,
  HistoryTransaction,
  saldo,
};
