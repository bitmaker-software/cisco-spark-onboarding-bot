"use strict";

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('tenant', {
      name: {
        type: DataTypes.STRING
      },
      orgId: {
        type: DataTypes.STRING
      },
      botKey: {
        type: DataTypes.STRING
      },
    },
    {});
};