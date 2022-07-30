let db = require("../dbConnect/index");
let moment = require("moment");
moment.locale("id");
const { encryptStringWithRsaPublicKey } = require("../utility/encrypt");

const generate_token = () => {
  // generate token OY sementara
  var mpin = "";
  var possible = "0123456789";

  for (var i = 0; i < 6; i++)
    mpin += possible.charAt(Math.floor(Math.random() * possible.length));

  return mpin;
};

const request_token = async (req, res) => {
  let { no_rek, ket_trans, amount, pin, user_id } = req.body;
  const token = generate_token();
  try {
    let Auth = await db.sequelize.query(
      `SELECT user_id, no_rek, nama_rek FROM acct_ebpr WHERE mpin = ? AND user_id = ? AND no_rek = ?`,
      {
        replacements: [
          encryptStringWithRsaPublicKey(pin, "./utility/privateKey.pem"),
          user_id,
          no_rek,
        ],
        type: db.sequelize.QueryTypes.SELECT,
      }
    );
    console.log();

    if (!Auth.length) {
      res.status(200).send({
        code: "003",
        status: "ok",
        message: "Pin yang anda masukan Salah",
        data: null,
      });
    } else {
      const dateTimeDb = await db.sequelize.query(`SELECT CURRENT_TIMESTAMP`, {
        type: db.sequelize.QueryTypes.SELECT,
      });
      const tgl_trans = moment(dateTimeDb[0].current_timestamp).format();
      const tgl_expired = moment(dateTimeDb[0].current_timestamp)
        .add(1, "hours")
        .format();

      let reff = `TT/${Auth[0].nama_rek}/${moment(
        dateTimeDb[0].current_timestamp
      ).format("YYYYMMDD")}/${moment(
        dateTimeDb[0].current_timestamp
      ).valueOf()}`;

      ket_trans = `${Auth[0].nama_rek} tarik tunai ${moment(
        dateTimeDb[0].current_timestamp
      ).format()} nominal ${amount}`;
      console.log(reff);

      let [results, metadata] = await db.sequelize.query(
        `INSERT INTO dummy_hold_dana(no_rek, nama_rek, tcode, ket_trans, reff, amount,tgl_trans, status) VALUES (?,?,?,?,?,?,?,'0')`,
        {
          replacements: [
            Auth[0].no_rek,
            Auth[0].nama_rek,
            "0200",
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
          `INSERT INTO token(no_rek, token, tgl_trans, tgl_expired, status) VALUES (?,?,?,?,'0')`,
          {
            replacements: [Auth[0].no_rek, token, tgl_trans, tgl_expired],
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
              tgl_trans: moment(tgl_trans).format("dddd,DD MMM YYYY, HH:mm:ss"),
              tgl_expired: moment(tgl_expired).format(
                "dddd,DD MMM YYYY, HH:mm:ss"
              ),
            },
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

module.exports = { request_token };
