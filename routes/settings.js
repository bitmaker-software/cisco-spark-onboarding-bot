"use strict";

const express = require('express');
const router = express.Router();
const ensureAuthenticated = require('./auth_middleware');

router.get('/', ensureAuthenticated, function (req, res, next) {
  res.render('settings', {
    title: 'Settings',
    active: 'Settings' // left side bar icon
  });
});

router.post('/api/saveToken', ensureAuthenticated, function (req, res, next) {
  const token = req.body.token;
  if (token) {
    models.tenant.create({
      name: 'auto',
      bot_key: req.body.token
    }).then(function () {
      res.send('OK, saved token ' + token);
    }, err => {
      console.error("Error saving the token:");
      console.error(err);
    });
  } else {
    res.send('No token provided')
  }
});

module.exports = router;
