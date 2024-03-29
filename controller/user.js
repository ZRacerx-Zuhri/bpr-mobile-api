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
const {
  Get_data_Firestore,
  post_data,
  Update_data_Firestore,
} = require("./firestore");
const moment = require("moment");
const {
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_SERVICE_SID,
  ADDS_MEDIA_KEY,
} = process.env;

const client = require("twilio")(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

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
        data: [],
      });
    } else {
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
      const request = await connect_axios(
        bpr[0].gateway,
        "gateway_bpr/inquiry_account",
        data
      );
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
  let { user_id, password, device_id } = req.body;

  try {
    let Password = encryptStringWithRsaPublicKey(
      password,
      "./utility/privateKey.pem"
    );

    console.log(Password);

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
      FROM acct_ebpr ac INNER JOIN kd_bpr kd on ac.bpr_id = kd.bpr_id WHERE ac.password = ? AND user_id = ?`,
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
        Request[0]["limit"] = "1250000";
        Request[0]["logo1"] = logo[0].logo;

        if (Request[0]["device_id"] === device_id) {
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
            data: [{ ...Request[0], accessToken, refreshToken, valid: true }],
          });
        } else {
          let otp = Math.floor(100000 + Math.random() * 900000);

          let otpEncrypt = encryptStringWithRsaPublicKey(
            `${otp}`,
            "./utility/privateKey.pem"
          );

          let statusSMS = await axios.post(
            "https://app.adsmedia.id/api/otp/sms",
            {
              messaging_product: "smsotp",
              phone: Request[0].no_hp,
              template: `sms_default`,
              secret: 0,
              parameters: {
                parameter1: otp,
              },
            },
            {
              headers: {
                Authorization: `Bearer ${ADDS_MEDIA_KEY}`,
                "Content-Type": "application/json",
              },
            }
          );

          let collOTP = await db.sequelize.query(
            `SELECT 
            failed_count
            ,generate_count  
            FROM  otp_log where user_id = ?`,
            {
              replacements: [user_id],
              type: db.sequelize.QueryTypes.SELECT,
            }
          );

          if (collOTP.length > 0) {
            if (
              collOTP[0].failed_count >= 3 ||
              collOTP[0].generate_count >= 3
            ) {
              res.status(200).send({
                code: "094",
                status: "ok",
                message: "Anda melewati batas OTP, silakan coba 1 jam lagi",
                data: null,
              });
              return;
            }
          }

          let inserOTPLog = await db.sequelize.query(`call insert_otp(?,?)`, {
            replacements: [user_id, otpEncrypt],
          });

          // let otpResponse = await client.verify.v2
          //   .services(TWILIO_SERVICE_SID)
          //   .verifications.create({
          //     to: `+62${Request[0].no_hp.replace(/^0/, "")}`,
          //     channel: "sms",
          //   });
          //console.log("sms terkirim", statusSMS);
          res.status(200).send({
            code: "000",
            status: "ok",
            message: "Success",
            data: [
              { ...Request[0], accessToken, refreshToken, valid: false, otp },
            ],
          });
        }
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
        bpr[0].gateway,
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
        bpr[0].gateway,
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
  let { ktp, tgl_trans, tgl_transmis, rrn, bpr_id } = req.body;
  try {
    console.log("REQ BODY VALIDATE KTP");
    console.log(req.body);

    let bpr = await db.sequelize.query(
      `SELECT * FROM kd_bpr WHERE bpr_id = ? AND status = '1'`,
      {
        replacements: ["600931"],
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
      const trx_code = "0800";
      const trx_type = "TRX";
      const data = {
        no_ktp: ktp,
        bpr_id,
        trx_code,
        trx_type,
      };
      console.log("data");
      console.log(data);
      const request = await connect_axios(
        bpr[0].gateway,
        "gateway_bpr/inquiry_account",
        data
      );
      if (request.code !== "000") {
        console.log(request);
        res.status(200).send(request);
      } else {
        console.log(request);
        res.status(200).send(request);
      }
    }

    // let user = await db.sequelize.query(
    //   `SELECT nama, no_hp FROM dummy_ktp WHERE no_ktp = ?`,
    //   {
    //     replacements: [ktp],
    //     type: db.sequelize.QueryTypes.SELECT,
    //   }
    // );
    // if (!user.length) {
    //   res.status(200).send({
    //     code: "002",
    //     status: "Failed",
    //     message: "Gagal, KTP Tidak Ditemukan",
    //     data: null,
    //   });
    // } else {
    //   console.log({
    //     code: "000",
    //     status: "ok",
    //     message: "Success",
    //     data: user[0],
    //   });
    //   res.status(200).send({
    //     code: "000",
    //     status: "ok",
    //     message: "Success",
    //     data: user[0],
    //   });
    // }
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
        `SELECT * FROM acct_ebpr WHERE bpr_id = ? AND no_rek = ? AND no_hp = ?`,
        {
          replacements: [bpr_id, no_rek, no_hp],
          type: db.sequelize.QueryTypes.SELECT,
        }
      );
      if (!acct.length) {
        let cek_user = await db.sequelize.query(
          `SELECT * FROM acct_ebpr WHERE user_id = ?`,
          {
            replacements: [user_id],
            type: db.sequelize.QueryTypes.SELECT,
          }
        );
        if (cek_user.length) {
          res.status(200).send({
            code: "002",
            status: "Failed",
            message: "Gagal, User ID telah digunakan",
            data: null,
          });
        } else {
          let Password = encryptStringWithRsaPublicKey(
            password,
            "./utility/privateKey.pem"
          );
          console.log(`${(parseInt(pin) + 111111 - 999999) / 2}`);
          console.log(
            `${pin}${no_hp.substring(no_hp.length - 4, no_hp.length)}`
          );
          let mpin = encryptStringWithRsaPublicKey(
            `${pin}${no_hp.substring(no_hp.length - 4, no_hp.length)}`,
            "./utility/privateKey.pem"
          );
          const trx_code = "0900";
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
            no_ktp,
            status,
            tgl_trans,
            tgl_transmis,
            rrn,
            xusername: bpr[0].username,
            xpassword: bpr[0].password,
          };
          console.log(data);
          console.log("REQ DATA KEEPING 1");
          const request = await connect_axios(
            bpr[0].gateway,
            "gateway_bpr/inquiry_account",
            data
          );
          console.log(request);
          if (request.code !== "000") {
            console.log(request);
            request.data = {
              status: "Gagal, Akun Tidak Ditemukan",
            };
            res.status(200).send(request);
          } else {
            let unique_id = moment().format("DDMMYY");
            let cek_unique_id = await db.sequelize.query(
              `SELECT * FROM acct_ebpr WHERE unique_id LIKE '%${unique_id}%'`,
              {
                type: db.sequelize.QueryTypes.SELECT,
              }
            );
            let run_number = `000${cek_unique_id.length + 1}`;
            unique_id = `${bpr_id}${unique_id}${run_number.substring(
              run_number.length - 4,
              run_number.length
            )}`;

            let [results, metadata] = await db.sequelize.query(
              `INSERT INTO acct_ebpr(unique_id,no_hp,bpr_id,no_rek,no_ktp,nama,nama_rek,user_id,password,status,id_nasabah_keeping) VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
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
                  request.data.id_nasabah
                ],
              }
            );
            request["status"] = "Akun telah diaktifkan";
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
      } else {
        let Password = encryptStringWithRsaPublicKey(
          password,
          "./utility/privateKey.pem"
        );
        const trx_code = "0900";
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
          pin,
          no_ktp,
          status,
          tgl_trans,
          tgl_transmis,
          rrn,
          xusername: bpr[0].username,
          xpassword: bpr[0].password,
        };
        console.log(data);
        console.log("REQ DATA KEEPING 2");
        const request = await connect_axios(
          bpr[0].gateway,
          "gateway_bpr/inquiry_account",
          data
        );
        console.log(request);
        if (request.code !== "000") {
          console.log(request);
          request.data = {
            status: "Gagal, Akun Tidak Ditemukan",
          };
          res.status(200).send(request);
        } else {
          let [results, metadata] = await db.sequelize.query(
            `UPDATE acct_ebpr SET status = ?, user_id = ?, password = ?, id_nasabah_keeping = ? WHERE no_hp = ? AND no_rek = ?`,
            {
              replacements: [status, user_id, Password, no_hp, no_rek, request.data.id_nasabah],
            }
          );
          console.log(metadata.rowCount);
          if (!metadata.rowCount) {
            res.status(200).send({
              code: "002",
              status: "ok",
              message: "Gagal Update Status",
              data: null,
            });
          } else {
            request["status"] = "Akun telah diaktifkan";
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
    let { user_id, no_hp, device_id, otp } = req.body;

    // let verifyResponse = await client.verify.v2
    //   .services(TWILIO_SERVICE_SID)
    //   .verificationChecks.create({
    //     to: `+62${no_hp.replace(/^0/, "")}`,
    //     code: otp,
    //   });

    let otpEncrypt = encryptStringWithRsaPublicKey(
      `${otp}`,
      "./utility/privateKey.pem"
    );

    let matchUser = await db.sequelize.query(
      `Select user_id, otp, tgl_expired, failed_count from otp_log a
      where a.user_id = ?;`,
      {
        replacements: [user_id],
        type: db.sequelize.QueryTypes.SELECT,
      }
    );

    if (!matchUser.length) {
      res.status(200).send({
        code: "091",
        status: "ok",
        message: "Verifikasi Gagal",
        data: null,
      });
      return;
    }

    if (matchUser[0].failed_count >= 3) {
      res.status(200).send({
        code: "094",
        status: "ok",
        message: "Anda melewati batas kesalahan memasukkan OTP",
        data: null,
      });
      return;
    }

    if (matchUser[0].otp != otpEncrypt) {
      let UpdateOTPTokenFailed = await db.sequelize.query(
        `UPDATE otp_log SET failed_count = failed_count + 1 WHERE user_id = ?`,
        {
          replacements: [user_id],
        }
      );

      res.status(200).send({
        code: "092",
        status: "ok",
        message: "Verifikasi Gagal",
        data: null,
      });
      return;
    }

    if (matchUser[0].tgl_expired < Date.now()) {
      res.status(200).send({
        code: "093",
        status: "ok",
        message: "OTP Expired",
        data: null,
      });
      return;
    }

    let [results, metadata] = await db.sequelize.query(
      `UPDATE acct_ebpr SET device_id = ? WHERE user_id = ? AND no_hp = ?`,
      {
        replacements: [device_id, user_id, no_hp],
      }
    );

    console.log(metadata.rowCount);
    if (!metadata.rowCount) {
      res.status(200).send({
        code: "002",
        status: "ok",
        message: "Verifikasi Gagal",
        data: null,
      });
    } else {
      let Request = await db.sequelize.query(
        `SELECT
         ac.unique_id
         FROM  acct_ebpr ac INNER JOIN kd_bpr kd on ac.bpr_id = kd.bpr_id WHERE user_id = ?`,
        {
          replacements: [user_id],
          type: db.sequelize.QueryTypes.SELECT,
        }
      );

      let docData = await Get_data_Firestore(
        "user_login",
        Request[0].unique_id
      );

      let deleteOTP = await db.sequelize.query(
        `DELETE from otp_log WHERE user_id = ?`,
        {
          replacements: [user_id],
        }
      );

      if (!docData.exists) {
        await post_data({ device_id }, "user_login", Request[0].unique_id);

        res.status(200).send({
          code: "000",
          status: "ok",
          message: "Success",
          data: "Verifikasi Berhasil",
        });
      } else {
        console.log("data not Found");
        await Update_data_Firestore("user_login", Request[0].unique_id, {
          device_id,
        });

        res.status(200).send({
          code: "000",
          status: "ok",
          message: "Success",
          data: "Verifikasi Berhasil",
        });
      }
    }
  } catch (error) {
    console.log("error device update", error);

    res.status(200).send({
      code: "E99",
      status: "error",
      message: error.message,
      data: null,
    });
  }
};

const update_mpin = async (req, res) => {
  try {
    let { user_id, no_rek, no_hp, bpr_id, mpin } = req.body;

    // let verifyResponse = await client.verify.v2
    //   .services(TWILIO_SERVICE_SID)
    //   .verificationChecks.create({
    //     to: `+62${no_hp.replace(/^0/, "")}`,
    //     code: otp,
    //   });

    // if (verifyResponse.valid) {
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
      let Mpin = encryptStringWithRsaPublicKey(
        `${mpin}${no_hp.substring(no_hp.length - 4, no_hp.length)}`,
        "./utility/privateKey.pem"
      );
      const trx_code = "0600";
      const trx_type = "TRX";
      const data = {
        user_id,
        no_rek,
        no_hp,
        bpr_id,
        trx_code,
        trx_type,
        pin: Mpin,
      };
      console.log(data);
      const request = await connect_axios(
        bpr[0].gateway,
        "gateway_bpr/inquiry_account",
        data
      );
      console.log(request);
      if (request.code !== "000") {
        request.data = {
          status: request.message,
        };
        res.status(200).send(request);
      } else {
        res.status(200).send({
          code: "000",
          status: "ok",
          message: "Success",
          data: "Update Mpin Berhasil",
        });
      }
    }
    // } else {
    //   res.status(200).send({
    //     code: "002",
    //     status: "ok",
    //     message: "Verifikasi Gagal",
    //     data: null,
    //   });
    // }
  } catch (error) {
    console.log("error device update", error);

    res.status(200).send({
      code: "E99",
      status: "error",
      message: error.message,
      data: null,
    });
  }
};
const update_pw = async (req, res) => {
  try {
    let { user_id, pw_baru, no_rek, no_hp, mpin } = req.body;

    let Pw_baru = encryptStringWithRsaPublicKey(
      pw_baru,
      "./utility/privateKey.pem"
    );
    let [results, metadata] = await db.sequelize.query(
      `UPDATE acct_ebpr SET password = ? WHERE user_id = ? AND no_hp = ? AND no_rek = ?`,
      {
        replacements: [Pw_baru, user_id, no_hp, no_rek],
      }
    );
    console.log(metadata.rowCount);
    if (!metadata.rowCount) {
      res.status(200).send({
        code: "002",
        status: "ok",
        message: "Gagal Update Password",
        data: null,
      });
    } else {
      res.status(200).send({
        code: "000",
        status: "ok",
        message: "Success",
        data: "Update Password Berhasil",
      });
    }
  } catch (error) {
    console.log("error device update", error);

    res.status(200).send({
      code: "E99",
      status: "error",
      message: error.message,
      data: null,
    });
  }
};

const request_otp_mpin = async (req, res) => {
  let { user_id, password, no_rek, rrn } = req.body;
  // console.log("tes...");
  try {
    let Password = encryptStringWithRsaPublicKey(
      password,
      "./utility/privateKey.pem"
    );
    let Request = await db.sequelize.query(
      `SELECT * FROM acct_ebpr WHERE password = ? AND user_id = ? AND no_rek = ?`,
      {
        replacements: [Password, user_id, no_rek],
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
      } else if (Request[0]["status"] === "1") {
        let otpResponse = await client.verify.v2
          .services(TWILIO_SERVICE_SID)
          .verifications.create({
            to: `+62${Request[0].no_hp.replace(/^0/, "")}`,
            channel: "sms",
          });
        console.log("sms terkirim", otpResponse);

        res.status(200).send({
          code: "000",
          status: "ok",
          message: "Success",
          data: {
            no_hp: Request[0]["no_hp"],
            no_rek: Request[0]["no_rek"],
            user_id: Request[0]["user_id"],
            bpr_id: Request[0]["bpr_id"],
          },
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

const request_update_pw = async (req, res) => {
  let { user_id, no_hp } = req.body;
  // console.log("tes...");
  try {
    let Request = await db.sequelize.query(
      `SELECT * FROM acct_ebpr WHERE status = '1' AND user_id = ? AND no_hp = ?`,
      {
        replacements: [user_id, no_hp],
        type: db.sequelize.QueryTypes.SELECT,
      }
    );

    if (!Request.length) {
      res.status(200).send({
        code: "001",
        status: "ok",
        message: "User ID Tidak Ditemukan",
        data: null,
      });
    } else {
      res.status(200).send({
        code: "000",
        status: "ok",
        message: "Success",
        data: {
          no_hp: Request[0]["no_hp"],
          no_rek: Request[0]["no_rek"],
          user_id: Request[0]["user_id"],
          bpr_id: Request[0]["bpr_id"],
        },
      });
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

const validate_otp = async (req, res) => {
  let { user_id, otp, no_hp, no_rek, rrn } = req.body;
  // console.log("tes...");
  try {
    let Request = await db.sequelize.query(
      `SELECT * FROM otp WHERE status = '0' AND user_id = ? AND no_rek = ? AND otp = ? AND no_hp = ?`,
      {
        replacements: [user_id, no_rek, otp, no_hp],
        type: db.sequelize.QueryTypes.SELECT,
      }
    );

    if (!Request.length) {
      res.status(200).send({
        code: "001",
        status: "ok",
        message: "OTP Tidak ditemukan",
        data: null,
      });
    } else {
      let [results, metadata] = await db.sequelize.query(
        `UPDATE otp SET status = '1' WHERE user_id = ? AND no_rek = ? AND otp = ? AND no_hp = ? AND status = '0'`,
        {
          replacements: [user_id, no_rek, otp, no_hp],
        }
      );
      res.status(200).send({
        code: "000",
        status: "ok",
        message: "Success",
        data: no_hp,
      });
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
  update_device,
  update_mpin,
  update_pw,
  request_otp_mpin,
  request_update_pw,
  validate_otp,
};
