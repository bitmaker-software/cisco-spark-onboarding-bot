"use strict";

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('flow_status', {
      description: {
        type: DataTypes.STRING
      },
    },
    {});
};