"use strict";

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('answer_status', {
      description: {
        type: DataTypes.STRING
      },
    },
    {});
};