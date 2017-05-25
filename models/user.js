"use strict";

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('user', {
      name: {
        type: DataTypes.STRING
      },
      email: {
        type: DataTypes.STRING
      },
      password: {
        type: DataTypes.STRING
      },
      sparkId: {
        type: DataTypes.STRING,
          unique: true
      },
    },
    {});
};