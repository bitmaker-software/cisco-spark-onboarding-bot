var express = require('express');
var request = require('request');
var router = express.Router();
var ensureAuthenticated = require('./auth_middleware');
var env = require('node-env-file');
env(__dirname + '/../bot/.env');


router.get('/', ensureAuthenticated, (req, res, next) => {
  res.render('test', {
    title: 'Onboarding manager test page'
  });
});

router.get('/search_users/:user', ensureAuthenticated, (req, res, next) => {
  request({
    url: 'https://api.ciscospark.com/v1/people',
    qs: {
      email: req.params.user
    },
    auth: {
      user: null,
      pass: null,
      bearer: req.user.spark_token
    }
  }, (error, response, body) => {
    if (!error && response.statusCode == 200) {
      var json = JSON.parse(body);
      var users = json.items.map(item => {
        var email = '';
        if (item.emails && item.emails.length > 0) {
          email = item.emails[0];
        }
        return {
          id: item.id,
          displayName: item.displayName,
          email: email
        };
      });
      res.send(users);
    } else {
      res.send([]);
    }
  });
});

router.post('/send_flow/:flowid/:sparkuserid', ensureAuthenticated, (req, res, next) => {
  request({
    url: 'https://api.ciscospark.com/v1/messages',
    method: 'POST',
    auth: {
      user: null,
      pass: null,
      bearer: process.env.access_token
    },
    json: true,
    body: {toPersonId: req.params.sparkuserid, text: 'Hello. I am the onboarding bot!'}
  }, (error, response, body) => {
    if (!error && response.statusCode == 200) {
      res.send("flow sent!")
    } else {
      res.send("flow not sent: " + error)
    }
  });
});

module.exports = router;