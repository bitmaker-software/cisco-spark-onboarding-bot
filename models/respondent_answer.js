"use strict";

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('respondent_answer', {
      text: {
        type: DataTypes.STRING
      },
      status: {
        type: DataTypes.STRING
      },
      documentUrl: {
        type: DataTypes.STRING
      },
      questionDate: {
        type: DataTypes.DATE
      },
      answerDate: {
        type: DataTypes.DATE
      },
    },
    {});
};