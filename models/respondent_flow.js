"use strict";

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('respondent_flow', {
      assignDate: {
        type: DataTypes.DATE
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