// var crypto = require("crypto");
// var path = require("path");
// var fs = require("fs");

// let Generate = (req, res) =>
//   crypto.generateKeyPair(
//     "rsa",
//     {
//       modulusLength: 4096,
//       publicKeyEncoding: {
//         type: "spki",
//         format: "pem",
//       },
//       privateKeyEncoding: {
//         type: "pkcs8",
//         format: "pem",
//         cipher: "aes-256-cbc",
//         passphrase: process.env.SECRET_KEY,
//       },
//     },
//     (err, publicKey, privateKey) => {
//       if (err) {
//         console.log(err);
//       } else {
//         // console.log(publicKey);
//         fs.writeFile("./utility/publicKey.pem", publicKey);
//         fs.writeFile("./utility/privateKey.pem", privateKey);
//         // fs.writeFileSync("private.pem", privateKey);
//         return true;
//       }
//       // return publicKey;
//     }
//   );

// module.exports = Generate;
