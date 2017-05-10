var express = require('express');
var router = express.Router();

/* GET manager. */
router.get('/', function(req, res, next) {
  res.render('manager', {title: 'Onboarding manager'});
});

module.exports = router;
