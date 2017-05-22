"use strict";

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('step_type', {
      description: {
        type: DataTypes.STRING
      },
    },
    {});
};