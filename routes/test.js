"use strict";

let router = require('express').Router();
let ensureAuthenticated = require('./auth_middleware');
let database_services = require('../bot/database_services');
let env = require('node-env-file');
env(__dirname + '/../bot/.env');

let gdrive_client_id = process.env.gdrive_client_id;
let gdrive_developer_key = process.env.gdrive_developer_key;
let gdrive_share_to = 'spark-drive@testdriveintegration-167213.iam.gserviceaccount.com';

let bot = require('../app').bot;

if (!gdrive_client_id) {
  console.error("WARNING: gdrive_client_id is not defined!");
}
if (!gdrive_developer_key) {
  console.error("WARNING: gdrive_developer_key is not defined!");
}
if (!gdrive_share_to) {
  console.error("WARNING: gdrive_share_to is not defined!");
}

router.get('/', ensureAuthenticated, (req, res, next) => {
  res.render('test', {
    title: 'Onboarding manager test page',
    active: 'Search user', // left side bar icon
    gdrive_client_id: gdrive_client_id,
    gdrive_developer_key: gdrive_developer_key,
    gdrive_share_to: gdrive_share_to
  });
});

router.get('/document_stores', ensureAuthenticated, (req, res, next) => {
  database_services.getGoogleDriveCredentials(2, 1).then(models => {
    res.send(models);
  }, err => res.send(err));
});

module.exports = router;