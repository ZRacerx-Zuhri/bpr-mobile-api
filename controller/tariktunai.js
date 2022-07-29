    let db = require("../dbConnect/index");

    const generate_token = () => {
        // generate token OY sementara
        var mpin = ""
        var possible = "0123456789";
    
        for (var i = 0; i < 6; i++)
        mpin += possible.charAt(Math.floor(Math.random() * possible.length));
    
        return mpin;
    }

  const request_token = async (req, res) => {
    let { pin, user_id, no_rek, nama_rek, ket_trans, reff, amount } = req.body;
    const token = generate_token()
    let d = new Date();
    let year = d.getFullYear();
    let month = d.getMonth();
    if (month < 9) {
        month = `0${month+1}`
    }else{
        month = `${month+1}`
    }
    let day = d.getDate();
    let hour = d.getHours();
    if (hour < 10) {
        hour = `0${hour}`
    }
    let min = d.getMinutes();
    if (min < 10) {
        min = `0${min}`
    }
    let sec = d.getSeconds();
    if (sec < 10) {
        sec = `0${sec}`
    }
    let tgl_trans = `${year}${month}${day}${hour}${min}${sec}`
    hour = parseInt(hour)+1
    if (hour < 10) {
        hour = `0${hour}`
    }
    let tgl_expired = `${year}${month}${day}${hour}${min}${sec}`
    try {
        let Auth = await db.sequelize.query(
            `SELECT user_id FROM acct_ebpr WHERE mpin = ? AND user_id = ?`,
            {
              replacements: [
                encryptStringWithRsaPublicKey(pin, "./utility/privateKey.pem"),
                user_id,
              ],
              type: db.sequelize.QueryTypes.SELECT,
            }
          );
          // console.log("au", Auth);
          if (!Auth.length) {
            res.status(200).send({
              code: "003",
              status: "ok",
              message: "Gagal, Terjadi Kesalahan!!!",
              data: null,
            });
          } else {
            let [results, metadata] = await db.sequelize.query(
                    `INSERT INTO dummy_hold_dana(no_rek, nama_rek, tcode, ket_trans, reff, amount, tgl_trans, status) VALUES (?,?,?,?,?,?,?,'0')`,
                {
                    replacements: [
                        no_rek,
                        nama_rek,
                        "0200",
                        ket_trans,
                        reff,
                        amount,
                        tgl_trans
                    ],
                }
            );
            if (!metadata) {
            res.status(200).send({
            code: "099",
            status: "ok",
            message: "Gagal, Terjadi Kesalahan Hold Dana!!!",
            data: null,
            });
            } else {
                let [results, metadata] = await db.sequelize.query(
                        `INSERT INTO token(token, tgl_trans, tgl_expired, status) VALUES (?,?,?,'0')`,
                    {
                        replacements: [
                            token,
                            tgl_trans,
                            tgl_expired
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
                        data: { token, no_rek, nama_rek, reff, amount, tgl_trans, tgl_expired},
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
  