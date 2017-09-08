"use strict";

const express = require('express');
const router = express.Router();
const ensureAuthenticated = require('./auth_middleware');
const databaseServices = require('../bot/database_services');

router.get('/', ensureAuthenticated, function (req, res, next) {
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

router.post('/api/saveBots', ensureAuthenticated, function (req, res, next) {
  const bots = req.body;
  let promises = [];
  bots.forEach(bot => {
    console.log(`Will save the bot:`);
    console.log(bot);
    promises.push(databaseServices.saveBot({
      id: bot.id,
      managerId: req.user.id,
      name: bot.name,
      accessToken: bot.access_token,
      publicHttpsAddress: bot.public_https_address,
      webhookName: bot.webhook_name,
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


router.post('/api/save', ensureAuthenticated, function (req, res, next) {
  let gdriveKeyFileString = '';
  let boxKeyFileString = '';

  if (req.files) {
    // The name of the input field is used to retrieve the uploaded file
    // We can use the mv() method to save the file to the file system
    // but we are saving its content to the database
    let gdriveKeyFile = req.files['file-gdrive'];
    let boxKeyFile = req.files['file-box'];

    if (gdriveKeyFile) {
      gdriveKeyFileString = getFileString(gdriveKeyFile);
    }
    if (boxKeyFile) {
      boxKeyFileString = getFileString(boxKeyFile);
    }
  }

  function getFileString(file) {
    const APPLICATION_JSON = 'application/json';
    if (file.mimetype === APPLICATION_JSON) {
      return file.data.toString();
    } else {
      console.log(`File mimetype "${file.mimetype}" is not "${APPLICATION_JSON}"`);
      return '';
    }
  }

  const gdriveSettings = JSON.parse(req.body.gdriveSettings);
  const boxSettings = JSON.parse(req.body.boxSettings);
  console.log("Gdrive settings from POST:");
  console.log(gdriveSettings);
  console.log("Box settings from POST:");
  console.log(boxSettings);

  let promises = [];

  const GDRIVE_DOCUMENT_STORE_TYPE = 1;
  const BOX_DOCUMENT_STORE_TYPE = 2;

  if (gdriveSettings) {
    let data = {
      gdrive_or_box_client_id: gdriveSettings.gdrive_or_box_client_id,
      gdrive_or_box_user_account: gdriveSettings.gdrive_or_box_user_account,
      google_drive_developer_key: gdriveSettings.google_drive_developer_key,
    };
    if (gdriveKeyFileString) {
      data.key_file = gdriveKeyFileString;
    }
    promises.push(databaseServices.saveDocumentStore(data, req.user.id, GDRIVE_DOCUMENT_STORE_TYPE));
  }
  if (boxSettings) {
    let data = {
      gdrive_or_box_client_id: boxSettings.gdrive_or_box_client_id,
      gdrive_or_box_user_account: boxSettings.gdrive_or_box_user_account,
      google_drive_developer_key: '',
    };
    if (boxKeyFileString) {
      data.key_file = boxKeyFileString;
    }
    promises.push(databaseServices.saveDocumentStore(data, req.user.id, BOX_DOCUMENT_STORE_TYPE));
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