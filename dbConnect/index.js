const { Sequelize } = require("sequelize");

const sequelize = new Sequelize("db_middleware", "zuhri", "JuaraMobile", {
  host: "103.229.161.187",
  dialect: "postgres",
  port: 7432,
  pool: {
    max: 5,
    min: 0,
    idle: 10000,
  },
});

module.exports = { sequelize };
