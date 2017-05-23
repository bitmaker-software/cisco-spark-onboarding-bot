var express = require('express');
var request = require('request');
var router = express.Router();
var ensureAuthenticated = require('./auth_middleware');

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
        }else{
            res.send('[]');
        }
    });
});

module.exports = router;