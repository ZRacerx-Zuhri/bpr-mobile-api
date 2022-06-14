var crypto = require("crypto");
var path = require("path");
var fs = require("fs");

var encryptStringWithRsaPublicKey = function (
  toEncrypt,
  relativeOrAbsolutePathToPublicKey
) {
  var absolutePath = path.resolve(relativeOrAbsolutePathToPublicKey);
  var publicKey = fs.readFileSync(absolutePath, "utf8");
  var buffer = Buffer.from(toEncrypt);
  var encrypted = crypto.privateEncrypt(
    { key: publicKey, passphrase: process.env.SECRET_KEY },
    buffer
  );
  return encrypted.toString("base64");
};

module.exports = {
  encryptStringWithRsaPublicKey,
};
