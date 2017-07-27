"use strict";

const express = require('express');
const router = express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {
  if (req.isAuthenticated()) {
    res.render('homepage', {
        title: 'Homepage',
        active: 'Home',
    });
  }
  else{
      res.render('index', {
          title: 'Cisco Spark Onboarding Bot',
          manager_url: '/manager',
          user: req.user
      });
  }

});

module.exports = router;
