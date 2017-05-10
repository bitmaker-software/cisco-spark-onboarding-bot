var express = require('express');
var router = express.Router();

/* GET manager. */
router.get('/', function (req, res, next) {
  res.render('manager', {title: 'Onboarding manager'});
});

router.post('/api/saveToken', function (req, res, next) {
  // Simulate some work
  setTimeout(sendResponse, 2000);

  function sendResponse() {
    var token = req.body.token;
    if (token) {
      res.send('OK, saved token ' + token);
    } else {
      res.send('No token provided')
    }
  }
});

module.exports = router;
