"use strict";

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('flow', {
      name: {
        type: DataTypes.STRING
      },
      status: {
        type: DataTypes.STRING
      },
    },
    {});
};