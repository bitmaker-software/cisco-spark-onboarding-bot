'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(module.filename);
const db = {};

const env = require('node-env-file');
env(__dirname + '/../bot/.env');

//Create a Sequelize connection to the database
const sequelize = new Sequelize(process.env.db_db, process.env.db_user, process.env.db_pass, {
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

  // —————————— Tenant ——————————

  // —————————— Manager ——————————
  m.manager.belongsTo(m.tenant);
  // - Flow
  m.flow.belongsTo(m.manager, {as: 'owner'});
  m.flow.belongsTo(m.flow_status);
  m.flow.belongsTo(m.bot);

  // —————————— Bot ——————————
  m.bot.belongsTo(m.manager);

  // —————————— Step ——————————
  m.step.belongsTo(m.flow); // adds flow_id to step table
  m.step.belongsTo(m.step_type); // adds step_type_id to step table
  m.step.hasMany(m.step_choice); // adds step_id to step_choice table
  m.step.hasOne(m.document_step); // adds step_id to document_step table
  m.step.hasMany(m.people_to_meet, {as: 'people_to_meet'}); // adds respondent_flow_id to step table

  // —————————— Step Type ——————————

  // —————————— Step Choice ——————————

  // —————————— Document Store
  m.document_store.belongsTo(m.manager);
  m.document_store.belongsTo(m.document_store_type);

  // —————————— Document Store Type ——————————

  // —————————— Document Step ——————————
  m.document_step.belongsTo(m.document_store);
  //m.document_step.belongsTo(m.step);  //AQUI

  // —————————— Respondent ——————————
  m.respondent.belongsTo(m.manager);

  // —————————— Respondent Flow ——————————
  m.respondent_flow.belongsTo(m.manager, {as: 'assigner'});
  m.respondent_flow.belongsTo(m.respondent);
  m.respondent_flow.belongsTo(m.step, {as: 'current_step'});
  m.respondent_flow.belongsTo(m.flow);
  m.respondent_flow.belongsTo(m.respondent_flow_status);
  m.respondent_flow.hasMany(m.people_to_meet, {as: 'people_to_meet'}); // adds respondent_flow_id to people_to_meet table

  // —————————— Respondent Answer ——————————
  m.respondent_answer.belongsTo(m.respondent_flow);
  m.respondent_answer.belongsTo(m.step);
  m.respondent_answer.belongsTo(m.step_choice);
  m.respondent_answer.belongsTo(m.answer_status);

})(db);

// Add initial data
const normalizedPath = require("path").join(__dirname, "../fixtures");
let listOfFixtures = require("fs").readdirSync(normalizedPath)
  .filter(function (file) {
    return (file.indexOf('.') !== 0) && (file.slice(-3) === '.js');
  })
  .sort();
let fileIdx = 0;

function importFixture(callback) {
  if (!listOfFixtures.length || fileIdx >= listOfFixtures.length) {
    console.log(`\n\n`);
    console.log(`Ended loading the fixtures`);
    console.log(`\n`);
    callback();
    return;
  }
  let file = listOfFixtures[fileIdx];
  console.log(`\n——————————————————————————————————————————————————`);
  console.log(`Importing fixtures from ${file}`);
  console.log(`——————————————————————————————————————————————————\n`);
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
    }).spread((record, created) => {
      if (created) {
        console.log(`[Model ${modelName}] Created record with id ${record.id}`);
      } else {
        console.log(`[Model ${modelName}] Record with id ${record.id} already exists`);
      }
      tryToContinue(callback);
    }, error => {
      console.log(`Error finding/inserting record`);
      console.log(error);
    });
  });

  function tryToContinue(callback) {
    done++;
    if (done === fixture.data.length) {
      // Set PostgreSQL correct value for the sequence (as we inserted IDs manually)
      let updateSequence = "select setval('" + fixture.model + "_id_seq', (select max(id) from " + fixture.model + "));";
      console.log(updateSequence);
      sequelize.query(updateSequence).spread((results, metadata) => {
        // Results will be an empty array and metadata will contain the number of affected rows.
        // Continue
        fileIdx++;
        importFixture(callback);
      });
    }
  }
}

//Export the db Object
db.sequelize = sequelize;
db.Sequelize = Sequelize;
db.startLoadingDatabaseFixtures = importFixture;

module.exports = db;