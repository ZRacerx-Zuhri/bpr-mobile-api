const {
  encryptStringWithRsaPublicKey,
  decryptStringWithRsaPrivateKey,
} = require("../utility/encrypt");
const { date } = require("../utility/getDate");
const axios = require("axios").default;
var crypto = require("crypto");
var path = require("path");
var fs = require("fs");
let db = require("../dbConnect/index");
let db1 = require("../dbConnect/middleware");
let jwt = require("jsonwebtoken");

const moment = require("moment");

const connect_axios = async (url, route, data) => {
  try {
    let Result = "";
    console.log(`${url}${route}`);
    await axios({
      method: "post",
      url: `${url}${route}`,
      timeout: 50000, //milisecond
      data,
    })
      .then((res) => {
        Result = res.data;
      })
      .catch((error) => {
        if (error.code == "ECONNABORTED") {
          Result = {
            code: "088",
            status: "ECONNABORTED",
            message: "Gateway Connection Timeout",
          };
        } else {
          Result = error;
        }
      });
    return Result;
  } catch (error) {
    res.status(200).send({
      code: "099",
      status: "Failed",
      message: error.message,
    });
  }
};

const URL_GATEWAY = process.env.URL_GATEWAY

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
  let { no_rek, nama_rek, bpr_id } = req.body;
  try {
    const trx_code = "0400";
    const trx_type = "TRX";
    const tgl_transmis = moment().format("YYMMDDHHmmss");
    const data = {
      no_rek,
      bpr_id,
      trx_code,
      trx_type,
      tgl_trans: moment().format("YYMMDDHHmmss"),
      tgl_transmis: moment().format("YYMMDDHHmmss"),
      rrn: "000000",
    };
    console.log("data");
    console.log(data);
    // const request = await connect_axios(
    //   "https://gw-dev-api.medtransdigital.com/",
    //   "gateway_bpr/inquiry_account",
    //   data
    // );
    const request = await connect_axios(URL_GATEWAY,"gateway_bpr/inquiry_account",data)
    if (request.code !== "000") {
      console.log(request);
      res.status(200).send(request);
    } else {
      console.log(request);
      res.status(200).send({
        code: "000",
        status: "ok",
        message: "Success",
        data: request,
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
      ac.device_id,
      ac.unique_id
      FROM  acct_ebpr ac INNER JOIN kd_bpr kd on ac.bpr_id = kd.bpr_id WHERE password = ? AND user_id = ?`,
      {
        replacements: [Password, user_id],
        type: db.sequelize.QueryTypes.SELECT,
      }
    );
    let logo = await db.sequelize.query(
      `SELECT * FROM logo WHERE nama_logo = 'mtd'`,
      {
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
        Request[0]["limit"] = "1250000"
        Request[0]["logo1"] = logo[0].logo

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
    const dateTimeDb = await date();
    let cek_tgl = moment(dateTimeDb[0].now)
      .subtract(24, "hours")
      .format("YYYY-MM-DD HH:mm:ss");
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
        expired: moment(dateTimeDb[0].now).isAfter(val.tgl_expired),
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

// API untuk Inquiry Account
const inquiry_account = async (req, res) => {
  let { no_rek, no_hp, bpr_id, tgl_trans, tgl_transmis, rrn } = req.body;
  try {
    console.log("REQ BODY INQUIRY");
    console.log(req.body);
    let bpr = await db1.sequelize.query(
      `SELECT * FROM kd_bpr WHERE bpr_id = ? AND status = '1'`,
      {
        replacements: [bpr_id],
        type: db.sequelize.QueryTypes.SELECT,
      }
    );
    if (!bpr.length) {
      res.status(200).send({
        code: "002",
        status: "Failed",
        message: "Gagal, Inquiry BPR Tidak Ditemukan",
        data: [],
      });
    } else {
      const trx_code = "0100";
      const trx_type = "TRX";
      const tgl_transmis = moment().format("YYMMDDHHmmss");
      const data = {
        no_rek,
        no_hp,
        bpr_id,
        trx_code,
        trx_type,
        tgl_trans,
        tgl_transmis,
        rrn,
      };
      const request = await connect_axios(
        URL_GATEWAY,
        "gateway_bpr/inquiry_account",
        data
      );
      if (request.code !== "000") {
        console.log(request);
        res.status(200).send(request);
      } else {
        response = request.data;
        if (trx_code == "0100") {
          if (response.status == "0") {
            response.status = "AKUN NON AKTIF";
          } else if (response.status == "1") {
            response.status = "AKUN AKTIF";
          } else if (response.status == "2") {
            response.status = "AKUN BLOCKED";
          } else {
            response.status_rek = "UNKNOWN STATUS";
          }
        } else if (trx_code == "0200") {
          if (response.status_rek == "0") {
            response.status_rek = "AKUN NON AKTIF";
          } else if (response.status_rek == "1") {
            response.status_rek = "AKUN AKTIF";
          } else if (response.status_rek == "2") {
            response.status_rek = "AKUN BLOCKED";
          } else {
            response.status_rek = "UNKNOWN STATUS";
          }
        }
        console.log({
          code: "000",
          status: "ok",
          message: "Success",
          data: response,
        });
        res.status(200).send({
          code: "000",
          status: "ok",
          message: "Success",
          data: response,
        });
      }
    }
  } catch (error) {
    //--error server--//
    console.log("erro get product", error);
    res.status(200).send({
      code: "099",
      status: "Failed",
      message: error.message,
    });
  }
};

// API untuk Inquiry Account
const validate_user = async (req, res) => {
  let { no_rek, no_hp, bpr_id, tgl_trans, tgl_transmis, rrn } = req.body;
  try {
    console.log("REQ BODY VALIDATE USER");
    console.log(req.body);
    let bpr = await db.sequelize.query(
      `SELECT * FROM kd_bpr WHERE bpr_id = ? AND status = '1'`,
      {
        replacements: [bpr_id],
        type: db.sequelize.QueryTypes.SELECT,
      }
    );
    if (!bpr.length) {
      res.status(200).send({
        code: "002",
        status: "Failed",
        message: "Gagal, Inquiry BPR Tidak Ditemukan",
        data: null,
      });
    } else {
      const trx_code = "0100";
      const trx_type = "TRX";
      const tgl_transmis = moment().format("YYMMDDHHmmss");
      const data = {
        no_rek,
        no_hp,
        bpr_id,
        trx_code,
        trx_type,
        tgl_trans,
        tgl_transmis,
        rrn,
      };
      console.log("data");
      console.log(data);
      const request = await connect_axios(
        URL_GATEWAY,
        "gateway_bpr/inquiry_account",
        data
      );
      if (request.code !== "000") {
        console.log(request);
        res.status(200).send(request);
      } else {
        if (request.status == "0") {
          request.status = "AKUN NON AKTIF";
        } else if (request.status == "1") {
          request.status = "AKUN AKTIF";
        } else if (request.status == "2") {
          request.status = "AKUN BLOCKED";
        } else {
          request.status = "UNKNOWN STATUS";
        }
        console.log({
          code: "000",
          status: "ok",
          message: "Success",
          data: request,
        });
        res.status(200).send({
          code: "000",
          status: "ok",
          message: "Success",
          data: request,
        });
      }
    }
  } catch (error) {
    //--error server--//
    console.log("erro get product", error);
    res.status(200).send({
      code: "099",
      status: "Failed",
      message: error.message,
    });
  }
};

// API untuk Inquiry Account
const validate_ktp = async (req, res) => {
  let { ktp, tgl_trans, tgl_transmis, rrn } = req.body;
  try {
    console.log("REQ BODY INQUIRY");
    console.log(req.body);

    let user = await db.sequelize.query(
      `SELECT nama, no_hp FROM dummy_ktp WHERE no_ktp = ?`,
      {
        replacements: [ktp],
        type: db.sequelize.QueryTypes.SELECT,
      }
    );
    if (!user.length) {
      res.status(200).send({
        code: "002",
        status: "Failed",
        message: "Gagal, KTP Tidak Ditemukan",
        data: null,
      });
    } else {
      console.log({
        code: "000",
        status: "ok",
        message: "Success",
        data: user[0],
      });
      res.status(200).send({
        code: "000",
        status: "ok",
        message: "Success",
        data: user[0],
      });
    }
  } catch (error) {
    //--error server--//
    console.log("erro get product", error);
    res.status(200).send({
      code: "099",
      status: "Failed",
      message: error.message,
    });
  }
};

// API untuk Inquiry Account
const activate_user = async (req, res) => {
  let {
    no_rek,
    no_hp,
    bpr_id,
    user_id,
    password,
    pin,
    no_ktp,
    nama,
    status,
    tgl_trans,
    tgl_transmis,
    rrn,
  } = req.body;
  try {
    console.log("REQ BODY AKTIVASI USER");
    console.log(req.body);
    let bpr = await db.sequelize.query(
      `SELECT * FROM kd_bpr WHERE bpr_id = ? AND status = '1'`,
      {
        replacements: [bpr_id],
        type: db.sequelize.QueryTypes.SELECT,
      }
    );
    if (!bpr.length) {
      res.status(200).send({
        code: "002",
        status: "Failed",
        message: "Gagal, Inquiry BPR Tidak Ditemukan",
        data: null,
      });
    } else {
      let acct = await db.sequelize.query(
        `SELECT * FROM acct_ebpr WHERE bpr_id = ? AND user_id = ? AND status != '6'`,
        {
          replacements: [bpr_id, user_id],
          type: db.sequelize.QueryTypes.SELECT,
        }
      );
      if (acct.length) {
        res.status(200).send({
          code: "002",
          status: "Failed",
          message: "Gagal, User ID telah digunakan",
          data: null,
        });
      } else if (!acct.length) {
        let Password = encryptStringWithRsaPublicKey(
          password,
          "./utility/privateKey.pem"
        );
        console.log(`${((parseInt(pin) + 111111 - 999999) / 2)}`);
        console.log(`${pin}${no_hp.substring(no_hp.length - 4, no_hp.length)}`);
        let mpin = encryptStringWithRsaPublicKey(
          `${pin}${no_hp.substring(no_hp.length - 4, no_hp.length)}`,
          "./utility/privateKey.pem"
        );
        const trx_code = "0200";
        const trx_type = "TRX";
        const tgl_transmis = moment().format("YYMMDDHHmmss");
        const data = {
          no_rek,
          no_hp,
          bpr_id,
          trx_code,
          trx_type,
          user_id,
          password: Password,
          pin: mpin,
          status,
          tgl_trans,
          tgl_transmis,
          rrn,
        };
        console.log(data);
        const request = await connect_axios(
          URL_GATEWAY,
          "gateway_bpr/inquiry_account",
          data
        );
        console.log(request);
        if (request.code !== "000") {
          console.log(request);
          request.data = {
            status : "Gagal, Akun Tidak Ditemukan"
          }
          res.status(200).send(request);
        } else {
          let unique_id = moment().format('DDMMYY');
          let cek_unique_id = await db.sequelize.query(
              `SELECT * FROM acct_ebpr WHERE unique_id LIKE '%${unique_id}%'`,{
                  type: db.sequelize.QueryTypes.SELECT,
              });
          let run_number = `000${cek_unique_id.length+1}`
          unique_id = `${bpr_id}${unique_id}${run_number.substring(run_number.length-4,run_number.length)}`
          let [results, metadata] = await db.sequelize.query(
            `INSERT INTO acct_ebpr(unique_id,no_hp,bpr_id,no_rek,no_ktp,nama,nama_rek,user_id,password,status) VALUES (?,?,?,?,?,?,?,?,?,?)`,
            {
              replacements: [
                unique_id,
                no_hp,
                bpr_id,
                no_rek,
                no_ktp,
                nama,
                request.data.nama_rek,
                user_id,
                Password,
                status,
              ],
            }
          );
          if (status == "0") {
            request["status"] = "Akun telah dinon-aktifkan";
          } else if (status == "1") {
            request["status"] = "Akun telah diaktifkan";
          }
          console.log({
            code: "000",
            status: "ok",
            message: "Success",
            data: request,
          });
          res.status(200).send({
            code: "000",
            status: "ok",
            message: "Success",
            data: request,
          });
        }
      }
    }
  } catch (error) {
    //--error server--//
    console.log("erro get product", error);
    res.status(200).send({
      code: "099",
      status: "Failed",
      message: error.message,
    });
  }
};

const update_device = async (req, res) => {
  try {
    let { user_id, no_hp } = req.body;

    let [results, metadata] = await db.sequelize.query(
      `UPDATE acct_ebpr SET device_id = ? WHERE user_id = ? AND no_hp = ?`,
      {
        replacements: [user_id, no_hp],
      }
    );
    console.log(metadata.rowCount);
    if (!metadata.rowCount) {
      res.status(200).send({
        code: "002",
        status: "ok",
        message: "Gagal update Device ID",
        data: null,
      });
    } else {
      res.status(200).send({
        code: "000",
        status: "ok",
        message: "Success",
        data: "Update Device ID Berhasil",
      });
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

module.exports = {
  createUser,
  validasi,
  aktivasi,
  Login,
  HistoryTransaction,
  saldo,
  inquiry_account,
  validate_user,
  validate_ktp,
  activate_user,
  update_device
};
