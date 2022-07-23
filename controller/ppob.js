const axios = require("../Services/API");
const db = require("../dbConnect/index");
const moment = require("moment");

const productPPOBOy = async (req, res) => {
  try {
    let Request = await axios.get("/api/v2/bill/products");

    if (Request.data.status.code === "000") {
      //--berhasil dapat list product update atau insert ke db --//
      res.status(200).send(Request.data);
    } else {
      //--status gagal api--//
      res.status(200).send(Request.data);
    }
  } catch (error) {
    //--error server--//
    console.log("erro get product", error);
    res.send(error);
  }
};

const productPPOB = async (req, res) => {
  try {
    let Request = await db.sequelize.query(
      `SELECT A.produk_id, A.tipe_produk, A.urut_produk, A.nama_produk, C.nama_owner, B.produk_prov, A.nominal, B.admin_fee, B.denom, B.prioritas FROM kd_produk AS A INNER JOIN master_produk AS B ON A.produk_id = B.produk_id INNER JOIN produk_owner as C ON C.id_owner = A.id_owner WHERE A.status = '1'`,
      {
        replacements: [],
        type: db.sequelize.QueryTypes.SELECT,
      }
    );
    let Copy = Request.map((val) => {
      if (val.produk_prov.includes("plnpre")) {
        val.produk_prov = "plnpre";
      }
      return val;
    });
    res.status(200).send({
      code: "000",
      status: "ok",
      message: "Success",
      data: Copy,
    });
  } catch (error) {
    res.status(200).send({
      code: "E99",
      status: "error",
      message: error.message,
      data: null,
    });
  }
};

const BillInquiry = async (req, res) => {
  let {
    customer_id,
    product_id,
    nama_produk,
    partner_tx_id,
    amount,
    note,
    no_rek,
    customerName,
  } = req.body;
  partner_tx_id = `INV/${moment(new Date()).format(
    "YYYYMMDD"
  )}/${new Date().getTime()}`;
  try {
    console.log({
      customer_id,
      product_id,
      partner_tx_id,
      amount,
    });

    let Request = await axios.post("/api/v2/bill", {
      customer_id,
      product_id,
      partner_tx_id,
      amount,
    });

    if (Request.data.status.code === "000") {
      //--berhasil dapat list product update atau insert ke db --//

      console.log("datat", Request.data.data);
      const payload = {
        tcode: "5000",
        no_rek: no_rek,
        nama_rek: Request.data.data.customer_name,
        produk_id: Request.data.data.product_id,
        ket_trans: customerName + " " + nama_produk,
        reff: Request.data.data.partner_tx_id,
        amount:
          Request.data.data.amount +
          parseInt(JSON.parse(Request.data.data.additional_data).admin_fee),
        tgljam_trans: moment().format("YYYY-MM-DD HH:mm:ss"),
      };

      let [results, metadata] = await db.sequelize.query(
        `INSERT INTO dummy_transaksi(no_rek, nama_rek, tcode, produk_id, ket_trans, reff, amount, tgljam_trans, status_rek) VALUES (?,?,?,?,?,?,?,?,'0')`,
        {
          replacements: [
            payload.no_rek,
            payload.nama_rek,
            payload.tcode,
            payload.produk_id,
            payload.ket_trans,
            payload.reff,
            payload.amount,
            payload.tgljam_trans,
          ],
        }
      );

      console.log(metadata);

      if (!metadata) {
        res.status(200).send({
          code: "099",
          status: "ok",
          message: "Gagal, Terjadi Kesalahan Insert Transaksi!!!",
          data: null,
        });
      } else {
        res.status(200).send({
          code: "000",
          status: "ok",
          message: "Success",
          data: { ...Request.data.data, nama_produk },
        });
      }
    } else {
      //--status gagal api--//

      res.status(200).send({
        code: Request.data.status.code,
        status: "ok",
        message: Request.data.status.message,
        data: null,
      });
    }
  } catch (error) {
    //--error server--//
    console.log("error inquiry", error);
    res.status(200).send({
      code: "E99",
      status: "error",
      message: error.message,
      data: null,
    });
  }
};
const BillPayment = async (req, res) => {
  let { partner_tx_id, note, no_rek } = req.body;
  try {
    let Request = await axios.post("/api/v2/bill/payment", {
      partner_tx_id,
      note,
    });

    if (Request.data.status.code === "102") {
      //--berhasil dapat list product update atau insert ke db --//
      res.status(200).send(Request.data);
      const payload = {
        no_rek: no_rek,
        nama_rek: Request.data.customer_name,
        produk_id: Request.data.product_id,
        ket_trans: Request.data.note,
        reff: Request.data.partner_tx_id,
        amount: Request.data.total_amount,
      };
      let check_saldo = await db.sequelize.query(
        `SELECT * FROM dummy_rek_tabungan WHERE no_rek = ? AND nama_rek = ?`,
        {
          replacements: [payload.no_rek, payload.nama_rek],
          type: db.sequelize.QueryTypes.SELECT,
        }
      );
      if (!check_saldo.rowCount) {
        res.status(200).send({
          code: "099",
          status: "ok",
          message: "Gagal, Terjadi Kesalahan Pencarian Rekening!!!",
          data: null,
        });
      } else {
        let saldo = parseInt(check_saldo[0].saldo);
        let saldo_min = parseInt(check_saldo[0].saldo_min);
        if (saldo - payload.amount > saldo_min) {
          let pembayaran = await db.sequelize.query(
            `UPDATE dummy_transaksi SET status = '1', tcode = '5001' WHERE no_rek = ? AND nama_rek = ? AND tcode = '5000' AND produk_id = ? AND reff = ? AND amount = ? AND status_rek = '0'`,
            {
              replacements: [
                payload.no_rek,
                payload.nama_rek,
                payload.produk_id,
                payload.reff,
                payload.amount,
              ],
              type: db.sequelize.QueryTypes.SELECT,
            }
          );
          if (!pembayaran.rowCount) {
            res.status(200).send({
              code: "099",
              status: "ok",
              message: "Gagal, Terjadi Kesalahan Update Transaksi!!!",
              data: null,
            });
          } else {
            let bayar_ppob = await db.sequelize.query(
              `UPDATE dummy_rek_tabungan SET saldo = saldo - ? WHERE no_rek = ? AND status_rek = '1'`,
              {
                replacements: [payload.amount, payload.no_rek],
                type: db.sequelize.QueryTypes.SELECT,
              }
            );
            if (!bayar_ppob.rowCount) {
              res.status(200).send({
                code: "099",
                status: "ok",
                message: "Gagal, Terjadi Kesalahan Update Saldo!!!",
                data: null,
              });
            } else {
              res.status(200).send({
                code: "000",
                status: "ok",
                message: "Success",
                data: Request,
              });
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
    } else {
      //--status gagal api--//
      res.status(200).send(Request.data);
    }
  } catch (error) {
    //--error server--//
    console.log("erro get product", error);
    res.send(error);
  }
};

const PaymentStatus = async (req, res) => {
  let { partner_tx_id } = req.body;

  try {
    let Request = await axios.get("api/v2/bill/status", {
      params: {
        partner_tx_id,
      },
    });

    if (Request.data.status.code === "000") {
      //--berhasil dapat list product update atau insert ke db --//
      res.status(200).send(Request.data);
    } else {
      //--status gagal api--//
      res.status(200).send(Request.data);
    }
  } catch (error) {
    //--error server--//
    console.log("erro get product", error);
    res.send(error);
  }
};

module.exports = {
  productPPOB,
  BillInquiry,
  BillPayment,
  PaymentStatus,
  productPPOBOy,
};
