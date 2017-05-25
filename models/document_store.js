"use strict";

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('document_store', {
      name: {
        type: DataTypes.STRING
      },
      googleDriveClientId: {
          type: DataTypes.STRING
      },
      googleDriveDeveloperKey: {
          type: DataTypes.STRING
      },
      googleDriveUserAccount: {
        type: DataTypes.STRING
      },
      sftpHost: {
        type: DataTypes.STRING
      },
      sftpUser: {
        type: DataTypes.STRING
      },
      sftpPassword: {
        type: DataTypes.STRING
      },
    },
    {});
};