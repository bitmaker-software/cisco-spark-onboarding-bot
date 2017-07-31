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
  bots.forEach(bot => {
    console.log(`Will save bot:`);
    console.log(bot);
    databaseServices.saveBot({
      id: bot.id,
      managerId: 1,
      name: bot.name,
      accessToken: bot.access_token,
      publicHttpsAddress: bot.public_https_address,
      webhookName: bot.webhook_name,
      secret: bot.secret,
    });
  });
  // const token = req.body.token;
  // if (token) {
  //   models.tenant.create({
  //     name: 'auto',
  //     bot_key: req.body.token
  //   }).then(function () {
  //     res.send('OK, saved token ' + token);
  //   }, err => {
  //     console.error("Error saving the token:");
  //     console.error(err);
  //   });
  // } else {
  //   res.send('No token provided')
  // }
  res.send('OK');
});

// router.post('/api/saveToken', ensureAuthenticated, function (req, res, next) {
//   const token = req.body.token;
//   if (token) {
//     models.tenant.create({
//       name: 'auto',
//       bot_key: req.body.token
//     }).then(function () {
//       res.send('OK, saved token ' + token);
//     }, err => {
//       console.error("Error saving the token:");
//       console.error(err);
//     });
//   } else {
//     res.send('No token provided')
//   }
// });

module.exports = router;
