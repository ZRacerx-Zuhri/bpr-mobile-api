// const axios = require("../Services/API");
const router = require('express').Router()
const {
    encryptStringWithRsaPublicKey,
    decryptStringWithRsaPrivateKey,
  } = require("../utility/encrypt");
const db = require("../dbConnect");
const moment = require("moment");
moment.locale("id");

// API untuk list BPR
const list_bpr = async (req, res) => {
    try {
        let response = await db.sequelize.query(
            `SELECT * FROM kd_bpr`,
            {
                type: db.sequelize.QueryTypes.SELECT,
            }
        );
        if (!response.length) {
            res.status(200).send({
                code: "002",
                status: "Failed",
                message: "Gagal Mencari List BPR",
                data: null,
            });
        } else {
            res.status(200).send({
                code: "000",
                status: "ok",
                message: "Success",
                data: response,
            });
        }
    } catch (error) {
      //--error server--//
      console.log("erro get product", error);
      res.send(error);
    }
};

module.exports = {
    list_bpr,
};