const express = require("express");
const {
  productPPOB,
  BillInquiry,
  BillPayment,
  PaymentStatus,
} = require("../controller/ppob");

const router = express.Router();

router.post("/product", productPPOB);
router.post("/inquiry", BillInquiry);
router.post("/payment", BillPayment);
router.post("/status", PaymentStatus);

module.exports = router;
