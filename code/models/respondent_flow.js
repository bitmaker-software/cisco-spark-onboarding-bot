"use strict";

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('respondent_flow', {
      assignDate: {
        type: DataTypes.DATE
      },
      status: {
        type: DataTypes.STRING
      },
      startDate: {
        type: DataTypes.DATE
      },
      endDate: {
        type: DataTypes.DATE
      },
    },
    {});
};