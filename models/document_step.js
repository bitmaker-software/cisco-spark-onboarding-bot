"use strict";

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('document_step', {
      document_url: {
        type: DataTypes.STRING
      },
      upload_dir: {
        type: DataTypes.STRING
      },
    },
    {});
};