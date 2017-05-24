"use strict";

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('document_store_type', {
      name: {
        type: DataTypes.STRING
      },
    },
    {});
};