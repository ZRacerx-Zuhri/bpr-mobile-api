// var crypto = require("crypto");
// var path = require("path");
// var fs = require("fs");

// const { writeFileSync } = require("fs");
// const { generateKeyPairSync } = require("crypto");

// function Generate() {
//   const { privateKey, publicKey } = generateKeyPairSync("rsa", {
//     modulusLength: 2048,
//     publicKeyEncoding: {
//       type: "pkcs1",
//       format: "pem",
//     },
//     privateKeyEncoding: {
//       type: "pkcs1",
//       format: "pem",
//       cipher: "aes-256-cbc",
//       passphrase: process.env.SECRET_KEY,
//     },
//   });

//   writeFileSync("./utility/privateKey.pem", privateKey);
//   writeFileSync("./utility/publicKey.pem", publicKey);
// }

// module.exports = Generate;
