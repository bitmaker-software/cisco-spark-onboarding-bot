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

  let gdriveFilename = `bot/keys/user_${req.user.id}_gdrive_settings.json`;
  let boxFilename = `bot/keys/user_${req.user.id}_box_settings.json`;
  let gdriveFilenameDB = `../keys/user_${req.user.id}_gdrive_settings.json`;
  let boxFilenameDB = `../keys/user_${req.user.id}_box_settings.json`;

  if (req.files) {
    // console.log(`Got files`);
    // console.log(req.files);

    // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
    let gdriveKeyFile = req.files['file-gdrive'];
    let boxKeyFile = req.files['file-box'];

    if (gdriveKeyFile) {
      // Use the mv() method to place the file somewhere on your server
      gdriveKeyFile.mv(gdriveFilename, err => {
        if (err) {
          console.log(`Error saving the file:`);
          console.log(err);
        } else {
          console.log('File saved!');
        }
      });
    }

    if (boxKeyFile) {
      // Use the mv() method to place the file somewhere on your server
      boxKeyFile.mv(boxFilename, err => {
        if (err) {
          console.log(`Error saving the file:`);
          console.log(err);
        } else {
          console.log('File saved!');
        }
      });
    }
  }

  const gdriveSettings = JSON.parse(req.body.gdriveSettings);
  const boxSettings = JSON.parse(req.body.boxSettings);

  let promises = [];
  console.log("Gdrive settings:");
  console.log(gdriveSettings);
  console.log("Box settings:");
  console.log(boxSettings);

  const GDRIVE_DOCUMENT_STORE_TYPE = 1;
  const BOX_DOCUMENT_STORE_TYPE = 2;

  if (gdriveSettings) {
    promises.push(databaseServices.saveDocumentStore({
      google_drive_client_id: gdriveSettings.google_drive_client_id,
      google_drive_developer_key: gdriveSettings.google_drive_developer_key,
      google_drive_user_account: gdriveSettings.google_drive_user_account,
      box_client_id: '',
      box_user_account: '',
      server_config_file: gdriveFilenameDB
    }, req.user.id, GDRIVE_DOCUMENT_STORE_TYPE));
  }
  if (boxSettings) {
    promises.push(databaseServices.saveDocumentStore({
      google_drive_client_id: '',
      google_drive_developer_key: '',
      google_drive_user_account: '',
      box_client_id: boxSettings.box_client_id,
      box_user_account: boxSettings.box_user_account,
      server_config_file: boxFilenameDB
    }, req.user.id, BOX_DOCUMENT_STORE_TYPE));
  }

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