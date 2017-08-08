"use strict";

const express = require('express');
const router = express.Router();
const ensureAuthenticated = require('./auth_middleware');
const databaseServices = require('../bot/database_services');

router.get('/', ensureAuthenticated, function (req, res, next) {
  databaseServices.getBots().then(bots => {
    res.render('settings', {
      title: 'Settings',
      active: 'Settings', // left side bar icon
      serverSideSettingsList: {
        bots: bots,
      }
    });
  });
});

router.post('/api/saveBots', ensureAuthenticated, function (req, res, next) {
  const bots = req.body;
  let promises = [];
  bots.forEach(bot => {
    console.log(`Will save bot:`);
    console.log(bot);
    promises.push(databaseServices.saveBot({
      id: bot.id,
      managerId: 1,
      name: bot.name,
      accessToken: bot.access_token,
      publicHttpsAddress: bot.public_https_address,
      webhookName: bot.webhook_name,
      secret: bot.secret,
    }));
  });

  Promise.all(promises).then(results => {
    // TODO: reload bots
    res.status(200).send();
  }, err => {
    console.log(`Error saving the bots:`);
    console.log(err);
    return res.send(err);
  });
  res.send('OK');
});

module.exports = router;
