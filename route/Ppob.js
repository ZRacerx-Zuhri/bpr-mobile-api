const express = require("express");
const {
  productPPOB,
  BillInquiry,
  BillPayment,
  PaymentStatus,
  productPPOBOy
} = require("../controller/ppob");

const { VerifyToken } = require("../authMiddleware/user");

const router = express.Router();

router.post("/productOy", productPPOBOy);
router.post("/product", productPPOB);
router.post(
  "/inquiry",
  //  VerifyToken,
  BillInquiry
);
router.post("/payment", BillPayment);
router.post("/status", PaymentStatus);

module.exports = router;
