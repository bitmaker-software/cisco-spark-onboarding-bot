"use strict";

var express = require('express');
var router = express.Router();
var ensureAuthenticated = require('./auth_middleware');

router.get('/settings', ensureAuthenticated, function (req, res, next) {
  res.render('settings', {
    title: 'Settings',
  });
});

module.exports = router;
