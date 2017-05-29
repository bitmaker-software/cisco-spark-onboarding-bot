"use strict";

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('step_choice', {
      choice_order: {
        type: DataTypes.INTEGER
      },
      text: {
        type: DataTypes.STRING
      },
    },
    {});
};