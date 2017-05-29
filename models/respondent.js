"use strict";

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('respondent', {
      name: {
        type: DataTypes.STRING
      },
      email: {
        type: DataTypes.STRING
      },
      spark_id: {
        type: DataTypes.STRING
      },
    },
    {});
};