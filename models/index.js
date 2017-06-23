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
  dialect: 'postgres',
  define: {
    // don't use camelcase for automatically added attributes but underscore style
    // so updatedAt will be updated_at
    underscored: true,
    // disable the modification of tablenames; By default, sequelize will automatically
    // transform all passed model names (first parameter of define) into plural.
    // if you don't want that, set the following
    freezeTableName: true, // we need to update the sequences after inserting IDs manually, and it's hard with mixed plural names!
    // defaultScope: {
    // attributes: {
    // // Setting this will disable the related tables attributes :(
    // exclude: ['created_at', 'updated_at']
    // }
    // }
  }
});

//Load all the models
fs
  .readdirSync(__dirname)
  .filter(function (file) {
    return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
  })
  .forEach(function (file) {
    let model = sequelize.import(__dirname + '/' + file);
    db[model.name] = model;
  });

Object.keys(db).forEach(function (modelName) {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});


// describe relationships
(function (m) {
  console.log('\nSetting up models relationships');

  //
  //
  // .belongsTo: 1:1
  //
  //

  // - Tenant
  //m.tenant.hasMany(m.manager);

  // - Manager
  m.manager.belongsTo(m.tenant);
  // - Flow
  m.flow.belongsTo(m.tenant);
  m.flow.belongsTo(m.manager, {as: 'owner'});
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
  m.respondent_flow.belongsTo(m.manager, {as: 'assigner'});
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
    console.log('Ended loading the fixtures');
    return;
  }
  let file = listOfFixtures[fileIdx];
  console.log(`\nImporting fixtures ${file}\n`);
  let fixture = require("../fixtures/" + file);
  let modelName = fixture.model;
  let sequelizeModel = db[modelName];
  // Wait for all insertions
  let done = 0;
  fixture.data.forEach(item => {
    sequelizeModel.findOrCreate({
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

  function tryToContinue() {
    done++;
    if (done === fixture.data.length) {
      // Set PostgreSQL correct value for the sequence (as we inserted IDs manually)
      let updateSequence = "select setval('" + fixture.model + "_id_seq', (select max(id) from " + fixture.model + "));";
      console.log(updateSequence);
      sequelize.query(updateSequence).spread((results, metadata) => {
        // Results will be an empty array and metadata will contain the number of affected rows.
        // Continue
        fileIdx++;
        importFixture();
      });
    }
  }
}

//Export the db Object
db.sequelize = sequelize;
db.Sequelize = Sequelize;
db.startLoadingDatabaseFixtures = importFixture;

module.exports = db;