let jwt = require("jsonwebtoken");
const VerifyToken = async (req, res, next) => {
  try {
    if (!req.get("Authorization"))
      return res.status(200).send({
        code: "E97",
        status: "error",
        message: "No token provided!",
        data: null,
      });

    const token = req.get("Authorization").split(" ")[1];
    let FindKey = [req.body, req.query];
    // console.log(token, process.env.SECRET_KEY);

    jwt.verify(token, process.env.SECRET_KEY, async (err, payload) => {
      try {
        if (err) {
          //--Error JWT--//
          console.log("Errro JWT Verify Access Token", err.message);

          res.status(200).send({
            code: "E98",
            status: "error",
            message: "Unauthorized!",
            data: null,
          });
          //----//
        } else {
          //--Verify UserID--//

          if (
            FindKey.some((val) => {
              if (Object.values(val).some((val2) => val2 == payload.id))
                return true;
            })
          ) {
            next();
            // let AccessTokenCheck = await Redis.get(`BL_${payload.id}`);
            // !AccessTokenCheck || AccessTokenCheck !== AccessToken
            //   ? next()
            //   : res.status(200).send({
            //       code: "E98",
            //       status: "error",
            //       message: "Unauthorized!",
            //       data: null,
            //     });
            // //---//
          } else {
            console.log("Not Allow to Access..");
            res.status(200).send({
              code: "E98",
              status: "error",
              message: "Unauthorized!",
              data: null,
            });
          }
        }
      } catch (error) {
        console.log("error verify", error);
        res.status(200).send({
          code: "E99",
          status: "error",
          message: "failed",
          data: null,
        });
      }
    });
  } catch (error) {
    console.log("Error Middleware AcccesToken", error.message);
    res.status(200).send({
      code: "E99",
      status: "error",
      message: "failed",
      data: error.message,
    });
  }
};

module.exports = { VerifyToken };
