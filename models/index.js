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
  console.log('Describe relationships');

  //
  //
  // .belongsTo: 1:1
  //
  //

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
  m.step.hasMany(m.step_choice);

  // - Step Type

  // - Step Choice

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

// Add initial data
const normalizedPath = require("path").join(__dirname, "../fixtures");
let listOfFixtures = require("fs").readdirSync(normalizedPath)
  .filter(function (file) {
    return (file.indexOf('.') !== 0) && (file.slice(-3) === '.js');
  })
  .sort();
let fileIdx = 0;
function importFixture() {
  if (!listOfFixtures.length || fileIdx >= listOfFixtures.length) {
    return;
  }
  let file = listOfFixtures[fileIdx];
  console.log(`Importing fixtures ${file}`);
  let fixture = require("../fixtures/" + file);
  let modelName = fixture.model;
  fixture.data.forEach(item => {
    db[modelName].findOrCreate({
      where: {
        id: item.id
      },
      defaults: item
    }).then(function (result) {
      const record = result[0], // the instance
        created = result[1]; // boolean stating if it was created or not

      if (created) {
        console.log(`[Model ${modelName}] Created record with id ${record.id}`);
      } else {
        console.log(`[Model ${modelName}] Record with id ${record.id} already exists`);
      }
      tryToContinue();
    });
  });
  // Wait for all insertions
  let done = 0;

  function tryToContinue() {
    done++;
    if (done === fixture.data.length) {
      importFixture(fileIdx++);
    }
  }
}
// Start importing
importFixture(fileIdx);

//Export the db Object
db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;