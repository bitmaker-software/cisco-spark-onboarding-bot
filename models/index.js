'use strict';

var fs = require('fs');
var path = require('path');
var Sequelize = require('sequelize');
var basename = path.basename(module.filename);
var db = {};

var env = require('node-env-file');
env(__dirname + '/../bot/.env');

//Create a Sequelize connection to the database
var sequelize = new Sequelize(process.env.db_db, process.env.db_user, process.env.db_pass, {
  host: process.env.db_host,
  port: process.env.db_port,
  dialect: 'postgres'
});

//Load all the models
fs
  .readdirSync(__dirname)
  .filter(function (file) {
    return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
  })
  .forEach(function (file) {
    var model = sequelize.import(__dirname + '/' + file);
    // var model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);

    db[model.name] = model;
  });

Object.keys(db).forEach(function (modelName) {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});


// describe relationships
(function (m) {
  console.log("Describe relationships");

  // - Tenant

  // - User
  m.user.belongsTo(m.tenant);

  // - Flow
  m.flow.belongsTo(m.tenant);
  m.flow.belongsTo(m.user, {as: 'owner'});
  m.flow.belongsTo(m.flow_status);

  // - Step
  m.step.belongsTo(m.flow);
  m.step.belongsTo(m.step_type);

  // - Step Type

  // - Step Choice
  m.step_choice.belongsTo(m.step);

  // - Document Store
  m.document_store.belongsTo(m.tenant);
  m.document_store.belongsTo(m.document_store_type);

  // - Document Store Type

  // - Document Step
  m.document_step.belongsTo(m.document_store);

  // - Respondent
  m.respondent.belongsTo(m.tenant);

  // - Respondent Flow
  m.respondent_flow.belongsTo(m.user, {as: 'assigner'});
  m.respondent_flow.belongsTo(m.respondent);
  m.respondent_flow.belongsTo(m.step, {as: 'current_step'});
  m.respondent_flow.belongsTo(m.flow);
  m.respondent_flow.belongsTo(m.flow_status);

  // - Respondent Answer
  m.respondent_answer.belongsTo(m.respondent_flow);
  m.respondent_answer.belongsTo(m.step);
  m.respondent_answer.belongsTo(m.step_choice);


})(db);

//Export the db Object
db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;