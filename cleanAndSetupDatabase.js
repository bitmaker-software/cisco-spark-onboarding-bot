const models = require('./models/index.js');
const sequelize = models.sequelize;

// ——————————————————————————————————————————————————
//             Database (create tables)
// ——————————————————————————————————————————————————

//
// sync() will create all table if they doesn't exist in database
//
// {force: true} means DROP TABLE IF EXISTS before trying to create the table
// {alter: true} uses ALTER TABLE
//
sequelize.sync({force: true}).then(() => {
  console.log(`\n\n`);
  console.log(`Database models synced, will now load the fixtures.`);
  // Load database fixtures
  models.startLoadingDatabaseFixtures(() => {
    console.log(`Done loading database fixtures.`);
  });
}, err => {
  console.error("Error on sequelize.sync():");
  console.error(err);
});