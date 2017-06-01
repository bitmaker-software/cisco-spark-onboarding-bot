"use strict";

var express = require('express');
var router = express.Router();
var ensureAuthenticated = require('./auth_middleware');

router.get('/', ensureAuthenticated, function (req, res, next) {
  res.render('settings', {
    title: 'Settings',
  });
});

router.post('/api/saveToken', ensureAuthenticated, function (req, res, next) {
  var token = req.body.token;
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
