var express = require('express');
var router = express.Router();

/* POST webhooks. */
router.post('/', function (req, res, next) {
  var response = {
    date: new Date()
  };
  res.send(response);
});

module.exports = router;