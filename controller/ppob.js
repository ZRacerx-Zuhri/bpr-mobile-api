const axios = require("../Services/API");

// const productPPOB = async (req, res) => {
//   try {
//     let Request = await axios.get("/api/v2/bill/products");

//     if (Request.data.status.code === "000") {
//       //--berhasil dapat list product update atau insert ke db --//
//       res.status(200).send(Request.data);
//     } else {
//       //--status gagal api--//
//       res.status(200).send(Request.data);
//     }
//   } catch (error) {
//     //--error server--//
//     console.log("erro get product", error);
//     res.send(error);
//   }
// };

const productPPOB = async (req, res) => {
  try {
    let {} = req.body;
    
    let Request = await db.sequelize.query(`SELECT A.produk_id, A.tipe_produk, A.urut_produk, A.nama_produk, B.produk_prov, B.admin_fee, B.denom, B.prioritas FROM kd_produk AS A INNER JOIN master_produk AS B ON A.produk_id = B.produk_id WHERE A.status = '1'`, {
      replacements: [],
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

const BillInquiry = async (req, res) => {
  let { customer_id, product_id, partner_tx_id, amount } = req.body;
  try {
    let Request = await axios.post("/api/v2/bill", {
      customer_id,
      product_id,
      partner_tx_id,
      amount,
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
const BillPayment = async (req, res) => {
  let { partner_tx_id, note } = req.body;
  try {
    let Request = await axios.post("/api/v2/bill/payment", {
      partner_tx_id,
      note,
    });

    if (Request.data.status.code === "102") {
      //--berhasil dapat list product update atau insert ke db --//
      res.status(200).send(Request.data);
      console.log("berhasil...");
    } else {
      //--status gagal api--//
      res.status(200).send(Request.data);
      console.log("Gagal...");
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
};
