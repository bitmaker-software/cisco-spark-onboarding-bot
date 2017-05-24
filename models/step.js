"use strict";

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('step', {
      stepOrder: {
        type: DataTypes.INTEGER
      },
      text: {
        type: DataTypes.STRING
      },
    },
    {});
};