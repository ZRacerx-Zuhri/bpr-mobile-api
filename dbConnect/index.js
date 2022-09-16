const { DateTime } = require("../utility/dateServer");
const { Sequelize } = require("sequelize");

let name = process.env.DBNAME;
let username = process.env.DBUSERNAME;
let pass = process.env.DBPASS;
let host = process.env.DBHOST;

const sequelize = new Sequelize(name, username, pass, {
  host,
  dialect: "postgres",
  logging: (...msg) => console.log(DateTime() + " ----- " + msg),
  pool: {
    max: 10000,
    min: 0,
    idle: 10000,
  },
  dialectOptions: { connectionTimeoutMillis: 600000 },
});

module.exports = { sequelize };
