const { Sequelize } = require("sequelize");

const sequelize = new Sequelize("db_middleware", "zuhri", "JuaraMobile", {
  host: "127.0.0.1",
  dialect: "postgres",
  port: 5432,
  pool: {
    max: 5,
    min: 0,
    idle: 10000,
  },
});

module.exports = { sequelize };
