var crypto = require("crypto");
var path = require("path");
var fs = require("fs");

const encryptStringWithRsaPublicKey = (originMSG, private) => {
  let absolutePath = path.resolve(private);
  var privateKey = fs.readFileSync(absolutePath, "utf8");

  let encmsg = crypto
    .privateEncrypt(
      { key: privateKey, passphrase: process.env.SECRET_KEY },
      Buffer.from(originMSG, "utf8")
    )
    .toString("base64");

  // console.log("Encrypted with private key : " + encmsg);
  return encmsg;
};

const decryptStringWithRsaPrivateKey = (encmsg, pbKey) => {
  let publicKey = fs.readFileSync(path.resolve(pbKey), "utf8");
  let msg = crypto.publicDecrypt(publicKey, Buffer.from(encmsg, "base64"));
  // console.log(msg.toString());
  return msg.toString();
};
module.exports = {
  encryptStringWithRsaPublicKey,
  decryptStringWithRsaPrivateKey,
};
