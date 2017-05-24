"use strict";

var express = require('express');
var passport = require('passport');
var router = express.Router();

router.get('/login', function (req, res) {
  if (req.isAuthenticated()) {
    res.redirect('/');
  } else {
    res.render('login', {user: req.user});
  }
});

// GET /auth/spark
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  The first step in Cisco Spark authentication will involve
//   redirecting the user to ciscospark.com (https://api.ciscospark.com/v1/authorize).  After authorization, Cisco Spark
//   will redirect the user back to this application at /auth/spark/callback
router.get('/spark',
  passport.authenticate('cisco-spark'),
  function (req, res) {
    // The request will be redirected to Cisco Spark for authentication, so this
    // function will not be called.
  });

// GET /auth/spark/callback
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  If authentication fails, the user will be redirected back to the
//   login page.  Otherwise, the primary route function function will be called,
//   which, in this example, will redirect the user to the home page.
router.get('/spark/callback',
  passport.authenticate('cisco-spark', {
    failureRedirect: '/auth/loginFailed',
    successRedirect: '/manager'
  }));

router.get('/logout', function (req, res) {
  req.logout();
  res.header("Cache-Control", "no-cache, no-store, must-revalidate");
  res.header("Pragma", "no-cache");
  res.header("Expires", 0);
  res.redirect('/');
});

module.exports = router;