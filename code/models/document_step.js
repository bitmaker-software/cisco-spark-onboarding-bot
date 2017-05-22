"use strict";

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('document_step', {
      documentUrl: {
        type: DataTypes.STRING
      },
      uploadDir: {
        type: DataTypes.STRING
      },
    },
    {});
};