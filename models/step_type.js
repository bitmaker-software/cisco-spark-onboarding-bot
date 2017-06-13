"use strict";

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('step_type', {
      name: {
        type: DataTypes.STRING
      },
      description: {
        type: DataTypes.STRING
      },
    },
    {});
};