"use strict";

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('manager', {
      name: {
        type: DataTypes.STRING
      },
      email: {
        type: DataTypes.STRING
      },
      password: {
        type: DataTypes.STRING
      },
      spark_id: {
        type: DataTypes.STRING,
          unique: true
      },
    },
    {});
};