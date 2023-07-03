const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_SERVICE_SID } =
  process.env;

const client = require("twilio")(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

const sendOtp = async (req, res) => {
  let { countryCode, phoneNumber } = req.body;
  try {
    //   console.log(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_SERVICE_SID);
    let otpResponse = await client.verify.v2
      .services(TWILIO_SERVICE_SID)
      .verifications.create({
        to: `+${countryCode}${phoneNumber}`,
        channel: "sms",
      });
    res.status(200).send({
      code: "000",
      status: "ok",
      message: "Success",
      data: otpResponse,
    });
  } catch (error) {
    console.log("error sendotp", error.message);
    res.status(200).send({
      code: "099",
      status: "Failed",
      message: error.message,
    });
  }
};

const verifyOtp = async (req, res) => {
  let { countryCode, phoneNumber, otp } = req.body;
  try {
    let verifyResponse = await client.verify._v2
      .services(TWILIO_SERVICE_SID)
      .verificationChecks.create({
        to: `+${countryCode}${phoneNumber}`,
        code: otp,
      });
    res.status(200).send({
      code: "000",
      status: "ok",
      message: "Success",
      data: verifyResponse,
    });
  } catch (error) {
    console.log("error veriotp", error.message);
    res.status(200).send({
      code: "099",
      status: "Failed",
      message: error.message,
    });
  }
};

module.exports = {
  sendOtp,
  verifyOtp,
};