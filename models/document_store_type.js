"use strict";

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('document_store_type', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true
      },
      name: {
        type: DataTypes.STRING
      },
    },
    {});
};