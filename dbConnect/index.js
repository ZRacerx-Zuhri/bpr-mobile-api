const { Sequelize } = require("sequelize");
const tunnel = require("tunnel-ssh");

const sequelize = new Sequelize("db_middleware", "zuhri", "JuaraMobile", {
  host: "localhost",
  dialect: "postgres",
  port: 5432,
  pool: {
    max: 5,
    min: 0,
    idle: 10000,
  },
});

const config = {
  // I have confirmed that the local values are unnecessary (defaults work)

  // Configuration for SSH bastion
  username: "ibpr",
  password: "JuaraBersama",
  host: "103.229.161.189",
  port: 5432,

  // Configuration for destination (database)
  //   dstHost: "localhost",
  //   dstPort: 7755,
  keepAlive: true,
};

// NOTE: Moved to its own function, refactor likely fixed a few issues along the way
const getDB = () =>
  new Promise(async (resolve, reject) => {
    const tnl = await tunnel(config, async (error, server) => {
      console.log("server");
      if (error) return reject(error);

      const db = await sequelize.authenticate();
      console.log("status ");
      //   return resolve(db);
    });
  });

module.exports = { sequelize, getDB };
