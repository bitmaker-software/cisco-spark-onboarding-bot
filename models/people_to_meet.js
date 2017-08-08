"use strict";

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('people_to_meet', {
      spark_id: {
        type: DataTypes.STRING
      },
      display_name: {
        type: DataTypes.STRING
      },
      email: {
        type: DataTypes.STRING
      },
    },
    {});
};