"use strict";

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('step_choice', {
      choiceOrder: {
        type: DataTypes.INTEGER
      },
      text: {
        type: DataTypes.STRING
      },
    },
    {});
};