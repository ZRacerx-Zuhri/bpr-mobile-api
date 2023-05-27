let db = require("../dbConnect/index");
let db1 = require("../dbConnect/ibprdev");
let moment = require("moment");
moment.locale("id");
const { encryptStringWithRsaPublicKey } = require("../utility/encrypt");
const { date } = require("../utility/getDate");

const generate_token = () => {
  // generate token OY sementara
  var mpin = "";
  var possible = "0123456789";

  for (var i = 0; i < 6; i++)
    mpin += possible.charAt(Math.floor(Math.random() * possible.length));

  return mpin;
};

const request_token = async (req, res) => {
  let { no_rek, amount, pin, user_id } = req.body;
  const token = generate_token();
  try {
    let Auth = await db.sequelize.query(
      `SELECT unique_id, user_id, no_rek, nama_rek FROM acct_ebpr WHERE mpin = ? AND user_id = ? AND no_rek = ?`,
      {
        replacements: [
          encryptStringWithRsaPublicKey(pin, "./utility/privateKey.pem"),
          user_id,
          no_rek,
        ],
        type: db.sequelize.QueryTypes.SELECT,
      }
    );

    if (!Auth.length) {
      res.status(200).send({
        code: "003",
        status: "ok",
        message: "Pin yang anda masukan Salah",
        data: null,
      });
    } else {
      let check_saldo = await db.sequelize.query(
        `SELECT saldo,saldo_min FROM dummy_rek_tabungan WHERE no_rek = ? AND nama_rek = ?`,
        {
          replacements: [Auth[0].no_rek, Auth[0].nama_rek],
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
        let saldo = parseInt(check_saldo[0].saldo);
        let saldo_min = parseInt(check_saldo[0].saldo_min);
        if (saldo - amount > saldo_min) {
          const dateTimeDb = await date()
          const tgl_trans = moment(dateTimeDb[0].now).format();
          const tgl_expired = moment(dateTimeDb[0].now)
            .add(1, "hours")
            .format();

          let reff = `TT/${Auth[0].nama_rek}/${moment(
            dateTimeDb[0].now
          ).format("YYYYMMDD")}/${moment(
            dateTimeDb[0].now
          ).valueOf()}`;

          ket_trans = `${Auth[0].nama_rek} tarik tunai ${moment(
            dateTimeDb[0].now
          ).format()} nominal ${amount}`;

          let [results, metadata] = await db.sequelize.query(
            `INSERT INTO dummy_hold_dana(no_rek, nama_rek, token, tcode, ket_trans, reff, amount,tgl_trans, status) VALUES (?,?,?,?,?,?,?,?,'0')`,
            {
              replacements: [
                Auth[0].no_rek,
                Auth[0].nama_rek,
                token,
                "1000",
                ket_trans,
                reff,
                amount,
                tgl_trans,
              ],
            }
          );
          console.log("run...", results, metadata);

          if (!metadata) {
            res.status(200).send({
              code: "099",
              status: "ok",
              message: "Gagal, Terjadi Kesalahan Hold Dana!!!",
              data: null,
            });
          } else {
            let [results, metadata] = await db.sequelize.query(
              `INSERT INTO dummy_transaksi(unique_id, no_rek, nama_rek, tcode, produk_id, ket_trans, reff, amount, tgljam_trans, status_rek) VALUES (?,?,?,?,?,?,?,?,?,'0')`,
              {
                replacements: [
                  Auth[0].unique_id,
                  Auth[0].no_rek,
                  Auth[0].nama_rek,
                  "1000",
                  "tariktunai",
                  ket_trans,
                  reff,
                  amount,
                  tgl_trans,
                ],
              }
            );
            if (!metadata) {
              res.status(200).send({
                code: "099",
                status: "ok",
                message: "Gagal, Terjadi Kesalahan Insert Transaksi!!!",
                data: null,
              });
            } else {
              let [results, metadata] = await db.sequelize.query(
                `UPDATE dummy_rek_tabungan SET saldo = saldo - ? WHERE no_rek = ? AND status_rek = '1'`,
                {
                  replacements: [amount, no_rek],
                }
              );
              if (!metadata) {
                res.status(200).send({
                  code: "099",
                  status: "ok",
                  message: "Gagal, Terjadi Kesalahan Update Saldo!!!",
                  data: null,
                });
              } else {
                let [results, metadata] = await db.sequelize.query(
                  `INSERT INTO token(no_rek, token, tgl_trans, tgl_expired, status) VALUES (?,?,?,?,'0')`,
                  {
                    replacements: [
                      Auth[0].no_rek,
                      token,
                      tgl_trans,
                      tgl_expired,
                    ],
                  }
                );
                console.log(metadata);
                if (!metadata) {
                  res.status(200).send({
                    code: "099",
                    status: "ok",
                    message: "Gagal, Terjadi Kesalahan Membuat Token!!!",
                    data: null,
                  });
                } else {
                  res.status(200).send({
                    code: "000",
                    status: "ok",
                    message: "Success",
                    data: {
                      token,
                      no_rek: Auth[0].no_rek,
                      nama_rek: Auth[0].nama_rek,
                      reff,
                      amount,
                      tgl_trans: moment(tgl_trans).format(
                        "dddd,DD MMM YYYY, HH:mm:ss"
                      ),
                      tgl_expired: moment(tgl_expired).format(
                        "dddd,DD MMM YYYY, HH:mm:ss"
                      ),
                    },
                  });
                }
              }
            }
          }
        } else {
          res.status(200).send({
            code: "099",
            status: "ok",
            message: "Gagal, Terjadi Kesalahan Kurangin Saldo!!!",
            data: null,
          });
        }
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

const request_token_new = async (req, res) => {
  let { no_rek, no_hp, bpr_id, amount, pin, user_id } = req.body;
  const token = generate_token();
  try {
    let Auth = await db.sequelize.query(
      `SELECT unique_id, user_id, no_rek, nama_rek, no_hp, bpr_id FROM acct_ebpr WHERE mpin = ? AND user_id = ? AND no_rek = ?`,
      {
        replacements: [
          encryptStringWithRsaPublicKey(pin, "./utility/privateKey.pem"),
          user_id,
          no_rek,
        ],
        type: db.sequelize.QueryTypes.SELECT,
      }
    );

    if (!Auth.length) {
      res.status(200).send({
        code: "003",
        status: "ok",
        message: "Pin yang anda masukan Salah",
        data: null,
      });
    } else {
      const dateTimeDb = await date()
      const tgl_trans = moment(dateTimeDb[0].now).format();
      const tgl_expired = moment(dateTimeDb[0].now)
        .add(1, "hours")
        .format();

      let reff = `TT/${Auth[0].nama_rek}/${moment(
        dateTimeDb[0].now
      ).format("YYYYMMDD")}/${moment(
        dateTimeDb[0].now
      ).valueOf()}`;

      ket_trans = `${Auth[0].nama_rek} tarik tunai ${moment(
        dateTimeDb[0].now
      ).format()} nominal ${amount}`;

      
      if (trx_type === "TRX") {
        const keterangan = `TOKEN ${amount} ${moment().format('YYYY-MM-DD HH:mm:ss')}`;
        const data = { no_hp: Auth[0].no_hp, bpr_id: Auth[0].bpr_id, no_rek, amount, trans_fee, trx_code, trx_type, keterangan, acq_id: "", terminal_id: "", token: "", lokasi: "", tgl_trans, tgl_transmis, rrn }
        const request = await connect_axios(bpr[0].gateway, "gateway_bpr/withdrawal", data)
        if (request.code !== "000") {
            console.log("request");
            console.log(request);
            let [results, metadata] = await db.sequelize.query(
                `INSERT INTO dummy_transaksi(no_hp, bpr_id, no_rek, nama_rek, tcode, produk_id, ket_trans, reff, amount, admin_fee, tgl_trans, token, rrn, code, message, status_rek) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'0')`,
                {
                    replacements: [
                        Auth[0].no_hp,
                        Auth[0].bpr_id,
                        Auth[0].no_rek,
                        "",
                        trx_code,
                        "Token",
                        keterangan,
                        "",
                        amount,
                        trans_fee,
                        tgl_trans,
                        "",
                        rrn,
                        request.code,
                        request.message,
                    ],
                }
            );
            // if (bpr_id === "600998") {
            //     console.log("MDW Token Timeout");
            // } else {
                res.status(200).send(request);
            // }
        } else {
            console.log("request.data");
            console.log(request.data);
            let [results, metadata] = await db.sequelize.query(
              `INSERT INTO dummy_hold_dana(no_rek, nama_rek, token, tcode, ket_trans, reff, amount,tgl_trans, status) VALUES (?,?,?,?,?,?,?,?,'0')`,
              {
                replacements: [
                  Auth[0].no_rek,
                  Auth[0].nama_rek,
                  token,
                  "1000",
                  ket_trans,
                  reff,
                  amount,
                  tgl_trans,
                ],
              }
            );
            console.log("run...", results, metadata);
      
            if (!metadata) {
              res.status(200).send({
                code: "099",
                status: "ok",
                message: "Gagal, Terjadi Kesalahan Hold Dana!!!",
                data: null,
              });
            } else {
              let [results, metadata] = await db.sequelize.query(
                `INSERT INTO dummy_transaksi(unique_id, no_rek, nama_rek, tcode, produk_id, ket_trans, reff, amount, tgljam_trans, status_rek) VALUES (?,?,?,?,?,?,?,?,?,'0')`,
                {
                  replacements: [
                    Auth[0].unique_id,
                    Auth[0].no_rek,
                    Auth[0].nama_rek,
                    "1000",
                    "tariktunai",
                    ket_trans,
                    reff,
                    amount,
                    tgl_trans,
                  ],
                }
              );
              if (!metadata) {
                res.status(200).send({
                  code: "099",
                  status: "ok",
                  message: "Gagal, Terjadi Kesalahan Insert Transaksi!!!",
                  data: null,
                });
              } else {
                let [results, metadata] = await db.sequelize.query(
                  `INSERT INTO token(no_rek, token, tgl_trans, tgl_expired, status) VALUES (?,?,?,?,'0')`,
                  {
                    replacements: [
                      Auth[0].no_rek,
                      token,
                      tgl_trans,
                      tgl_expired,
                    ],
                  }
                );
                console.log(metadata);
                if (!metadata) {
                  res.status(200).send({
                    code: "099",
                    status: "ok",
                    message: "Gagal, Terjadi Kesalahan Membuat Token!!!",
                    data: null,
                  });
                } else {
                  res.status(200).send({
                    code: "000",
                    status: "ok",
                    message: "Success",
                    data: {
                      token,
                      no_rek: Auth[0].no_rek,
                      bpr_id: Auth[0].bpr_id,
                      nama_rek: Auth[0].nama_rek,
                      reff,
                      amount,
                      tgl_trans: moment(tgl_trans).format(
                        "dddd,DD MMM YYYY, HH:mm:ss"
                      ),
                      tgl_expired: moment(tgl_expired).format(
                        "dddd,DD MMM YYYY, HH:mm:ss"
                      ),
                    },
                  });
                }
              }
            }
            // let [results, metadata] = await db.sequelize.query(
            //     `INSERT INTO dummy_transaksi(no_hp, bpr_id, no_rek, nama_rek, tcode, produk_id, ket_trans, reff, amount, admin_fee, tgl_trans, token, rrn, code, status_rek) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,'1')`,
            //     {
            //         replacements: [
            //             no_hp,
            //             bpr_id,
            //             no_rek,
            //             request.data.nama,
            //             trx_code,
            //             "Token",
            //             keterangan,
            //             request.data.noreff,
            //             amount,
            //             trans_fee,
            //             tgl_trans,
            //             "",
            //             rrn,
            //             request.code
            //         ],
            //     }
            // );
            console.log({
                code: "000",
                status: "ok",
                message: "Success",
                rrn: rrn,
                data: request.data,
            });
            // if (bpr_id === "600998") {
            //     console.log("MDW Token Timeout");
            // } else {
                res.status(200).send({
                    code: "000",
                    status: "ok",
                    message: "Success",
                    rrn: rrn,
                    data: request.data,
                });
            // }
        }
      } else if (trx_type === "REV") {
          const keterangan = `Token ${amount} ${moment().format('YYYY-MM-DD HH:mm:ss')}`;
          const data = { no_hp: Auth[0].no_hp, bpr_id: Auth[0].bpr_id, no_rek, amount, trans_fee, trx_code, trx_type, keterangan, acq_id: "", terminal_id: "", token: "", lokasi: "", tgl_trans, tgl_transmis, rrn }
          const request = await connect_axios(bpr[0].gateway, "gateway_bpr/withdrawal", data)
          if (request.code !== "000") {
              console.log("request");
              console.log(request);
              let [results, metadata] = await db.sequelize.query(
                  `INSERT INTO dummy_transaksi(no_hp, bpr_id, no_rek, nama_rek, tcode, produk_id, ket_trans, reff, amount, admin_fee, tgl_trans, token, rrn, code, message, status_rek) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'0')`,
                  {
                      replacements: [
                          Auth[0].no_hp,
                          Auth[0].bpr_id,
                          Auth[0].no_rek,
                          "",
                          trx_code,
                          "Token",
                          keterangan,
                          "",
                          amount,
                          trans_fee,
                          tgl_trans,
                          "",
                          rrn,
                          request.code,
                          request.message,
                      ],
                  }
              );
              res.status(200).send(request);
          } else {
              console.log("request.data");
              console.log(request.data);
              let [results2, metadata2] = await db.sequelize.query(
                  `UPDATE dummy_transaksi SET status_rek = 'R' WHERE no_hp = ? AND bpr_id = ? AND no_rek = ? AND tcode = ? AND amount = ? AND rrn = ? AND status_rek = '1'`,
                  {
                      replacements: [
                          Auth[0].no_hp,
                          Auth[0].bpr_id,
                          Auth[0].no_rek,
                          "1000",
                          amount,
                          rrn
                      ],
                  }
              );
              console.log({
                  code: "000",
                  status: "ok",
                  message: "Success",
                  rrn: rrn,
                  data: request.data,
              });
              res.status(200).send({
                  code: "000",
                  status: "ok",
                  message: "Success",
                  rrn: rrn,
                  data: request.data,
              });
          }
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

module.exports = { request_token, request_token_new };
