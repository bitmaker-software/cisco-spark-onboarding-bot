"use strict";

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('document_store', {
    name: {
      type: DataTypes.STRING
    },
    gdrive_or_box_client_id: {
      type: DataTypes.STRING
    },
    gdrive_or_box_user_account: {
      type: DataTypes.STRING
    },
    google_drive_developer_key: {
      type: DataTypes.STRING
    },
    box_user_id: {
      type: DataTypes.STRING
    },
    key_file: {
      type: DataTypes.TEXT
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
  }, {});
};