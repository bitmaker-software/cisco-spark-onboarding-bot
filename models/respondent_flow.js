"use strict";

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('respondent_flow', {
      assign_date: {
        type: DataTypes.DATE
      },
      start_date: {
        type: DataTypes.DATE
      },
      end_date: {
        type: DataTypes.DATE
      },
      duration_seconds: {
        type: DataTypes.INTEGER
      },
    },
    {});
};