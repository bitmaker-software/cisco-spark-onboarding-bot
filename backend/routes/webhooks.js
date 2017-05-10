var express = require('express');
var router = express.Router();

/* POST webhooks. */
router.post('/', function (req, res, next) {
  var token = req.body.token;
  var response;
  if (token) {
    response = {
      id: req.body.id,
      date: new Date()
    }
  } else {
    response = "Invalid token."
  }
  res.send(response);
});

module.exports = router;