"use strict";

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('tenant', {
      name: {
        type: DataTypes.STRING
      },
      org_id: {
        type: DataTypes.STRING,
        unique: true
      },
    },
    {});
};