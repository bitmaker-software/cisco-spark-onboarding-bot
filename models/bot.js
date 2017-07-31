"use strict";

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('bot', {
      name: {
        type: DataTypes.STRING,
        unique: true
      },
      access_token: {
        type: DataTypes.STRING
      },
      public_https_address: {
        type: DataTypes.STRING
      },
      webhook_name: {
        type: DataTypes.STRING
      },
      secret: {
        type: DataTypes.STRING
      }
    },
    {});
};