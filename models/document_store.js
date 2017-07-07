"use strict";

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('document_store', {
      name: {
        type: DataTypes.STRING
      },
      google_drive_client_id: {
        type: DataTypes.STRING
      },
      google_drive_developer_key: {
        type: DataTypes.STRING
      },
      google_drive_user_account: {
        type: DataTypes.STRING
      },
      sftp_host: {
        type: DataTypes.STRING
      },
      sftp_user: {
        type: DataTypes.STRING
      },
      sftp_password: {
        type: DataTypes.STRING
      },
    },
    {});
};