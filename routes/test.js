"use strict";

let express = require('express');
let request = require('request');
let router = express.Router();
let ensureAuthenticated = require('./auth_middleware');
let database_services = require('../bot/database_services');
let env = require('node-env-file');
env(__dirname + '/../bot/.env');

let gdrive_client_id = process.env.gdrive_client_id;
let gdrive_developer_key = process.env.gdrive_developer_key;
let gdrive_share_to = 'spark-drive@testdriveintegration-167213.iam.gserviceaccount.com';

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
    gdrive_client_id: gdrive_client_id,
    gdrive_developer_key: gdrive_developer_key,
    gdrive_share_to: gdrive_share_to
  });
});

router.get('/search_users/:user', ensureAuthenticated, (req, res, next) => {
  request({
    url: 'https://api.ciscospark.com/v1/people',
    qs: {
      email: req.params.user
    },
    auth: {
      user: null,
      pass: null,
      bearer: req.user.spark_token
    }
  }, (error, response, body) => {
    if (!error && response.statusCode == 200) {
      var json = JSON.parse(body);
      var users = json.items.map(item => {
        var email = '';
        if (item.emails && item.emails.length > 0) {
          email = item.emails[0];
        }
        return {
          id: item.id,
          displayName: item.displayName,
          email: email
        };
      });
      res.send(users);
    } else {
      res.send([]);
    }
  });
});

router.post('/send_flow/:flow_id/:spark_id', ensureAuthenticated, (req, res, next) => {
  request({
    url: 'https://api.ciscospark.com/v1/messages',
    method: 'POST',
    auth: {
      user: null,
      pass: null,
      bearer: process.env.access_token
    },
    json: true,
    body: {toPersonId: req.params.spark_id, text: 'Hello. I am the onboarding bot!'}
  }, (error, response, body) => {
    if (!error && response.statusCode == 200) {
      res.send("flow sent!")
    } else {
      res.send("flow not sent: " + error)
    }
  });
});

router.get('/document_stores', ensureAuthenticated, (req, res, next) => {
  database_services.getGoogleDriveCredentials(2, 1).then(models => {
    res.send(models);
  }, err => res.send(err));
});

module.exports = router;