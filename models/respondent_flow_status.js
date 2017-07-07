"use strict";

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('respondent_flow_status', {
      description: {
        type: DataTypes.STRING
      },
    },
    {});
};