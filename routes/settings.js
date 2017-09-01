"use strict";

const express = require('express');
const router = express.Router();
const ensureAuthenticated = require('./auth_middleware');
const databaseServices = require('../bot/database_services');

router.get('/', ensureAuthenticated, function(req, res, next) {
  let promises = [
    databaseServices.getBotsByUser(req.user.id),
    databaseServices.getDocumentStore(req.user.id, 1),
    databaseServices.getDocumentStore(req.user.id, 2)
  ];
  Promise.all(promises).then(values => {
    res.render('settings', {
      title: 'Settings',
      active: 'Settings', // left side bar icon
      serverSideSettingsList: {
        bots: values[0] !== null ? values[0] : [],
        gdriveSettings: values[1],
        boxSettings: values[2]
      }
    });
  }, err => {
    console.error(`Error fetching settings data:`);
    console.error(err);
  });
});

router.post('/api/saveBots', ensureAuthenticated, function(req, res, next) {
  const bots = req.body;
  let promises = [];
  bots.forEach(bot => {
    console.log(`Will save bot:`);
    console.log(bot);
    promises.push(databaseServices.saveBot({
      id: bot.id,
      managerId: req.user.id,
      name: bot.name,
      accessToken: bot.access_token,
      publicHttpsAddress: bot.public_https_address,
      webhookName: bot.webhook_name,
      secret: bot.secret,
    }));
  });

  Promise.all(promises).then(results => {

    console.log(`Finished saving the bots; will now reload the controllers`);
    require('../bot/bot').init();

    res.status(200).send();
  }, err => {
    console.log(`Error saving the bots:`);
    console.log(err);
    return res.send(err);
  });
  res.send('OK');
});


router.post('/api/save', ensureAuthenticated, function(req, res, next) {
  const settings = req.body;
  let promises = [];
  console.log("Saving settings...");
  promises.push(databaseServices.saveDocumentStore({
    google_drive_client_id: settings.gdriveSettings.google_drive_client_id,
    google_drive_developer_key: settings.gdriveSettings.google_drive_developer_key,
    google_drive_user_account: settings.gdriveSettings.google_drive_user_account,
    box_client_id: '',
    box_user_account: '',
    server_config_file: '../keys/sample-gdrive-settings.json'
  }, req.user.id, 1));

  promises.push(databaseServices.saveDocumentStore({
    google_drive_client_id: '',
    google_drive_developer_key: '',
    google_drive_user_account: '',
    box_client_id: settings.boxSettings.box_client_id,
    box_user_account: settings.boxSettings.box_user_account,
    server_config_file: '../keys/sample-box-settings.json'
  }, req.user.id, 2));

  Promise.all(promises).then(results => {
    res.status(200).send();
  }, err => {
    console.log(`Error saving settings`);
    console.log(err);
    return res.send(err);
  });
  res.send('OK');
});

module.exports = router;