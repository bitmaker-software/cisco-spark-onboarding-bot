"use strict";

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('step', {
      step_order: {
        type: DataTypes.INTEGER
      },
      text: {
        type: DataTypes.STRING
      },
    },
    {});
};