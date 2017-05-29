"use strict";

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('respondent_answer', {
      text: {
        type: DataTypes.STRING
      },
      status: {
        type: DataTypes.STRING
      },
      document_url: {
        type: DataTypes.STRING
      },
      question_date: {
        type: DataTypes.DATE
      },
      answer_date: {
        type: DataTypes.DATE
      },
    },
    {});
};