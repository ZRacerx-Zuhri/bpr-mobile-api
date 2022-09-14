const { Sequelize } = require("sequelize");

const sequelize = new Sequelize("db_middleware", "ibpr", "JuaraBersama", {
  host: "103.229.161.189",
  dialect: "postgres",
  port: 7755,
  pool: {
    max: 10000,
    min: 0,
    idle: 10000,
  },
});

module.exports = { sequelize };
