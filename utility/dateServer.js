const moment = require("moment");
const { Sequelize } = require("sequelize");

let DateTime = (type, datetime) => {
  Sequelize.DATE.prototype._stringify = function (date, options) {
    date = this._applyTimezone(date, options);
    return date.format("YYYY-MM-DD HH:mm:ss.SSS");
  }.bind(Sequelize.DATE.prototype);

  if (type === "Model")
    return moment(datetime).add(7, "hours").format("YYYY-MM-DD HH:mm:ss");
  return moment(datetime).format("YYYY-MM-DD HH:mm:ss");
};
module.exports = { DateTime };
