"use strict";

import express        from 'express';
import path           from 'path';
import favicon        from 'serve-favicon';
import logger         from 'morgan';
import compression    from 'compression';
import cookieParser   from 'cookie-parser';
import bodyParser     from 'body-parser';
import mime           from 'mime';
// var sassMiddleware = require('node-sass-middleware');

import config from './app.config';

var routes_index = require('./routes/index');
var routes_settings = require('./routes/settings');
var routes_manager = require('./routes/manager');
var routes_webhooks = require('./routes/webhooks');
var routes_auth = require('./routes/auth');
var routes_test = require('./routes/test');

var database_services = require('./bot/database_services');

var botWebhooks = require('./bot/components/routes/incoming_webhooks');

var bot;
// bot = require('./bot/bot'); // comment to avoid registering with Spark

var passport = require('passport');
var CiscoSparkStrategy = require('passport-cisco-spark').Strategy;
var session = require('express-session');
var sequelize = require('./models/index.js').sequelize;
var SequelizeStore = require('connect-session-sequelize')(session.Store);


var env = require('node-env-file');
env(__dirname + '/bot/.env');


//
// Passport configuration
//
passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (obj, done) {
  done(null, obj);
});

// Use the SparkStrategy within passport
passport.use(new CiscoSparkStrategy({
    clientID: process.env.cisco_spark_client_id,
    clientSecret: process.env.cisco_spark_client_secret,
    callbackURL: "/auth/spark/callback",
    scope: [
      'spark:all'
    ]
  },
  function (accessToken, refreshToken, profile, done) {
    database_services.userLoggedIn(profile.id, profile.displayName, profile.emails, profile._json.orgId).then(user => {
      var sessionUser = {id: user.id, name: user.name, avatar: profile._json.avatar, spark_token: accessToken};
      return done(null, sessionUser);
    }, err => {
      return done(err);
    });
  }
));

var app = express();

app.locals.static = config.static;

// view engine setup
app.set('views', `${__dirname}/views`);
app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));

// app.use(express.static(path.join(__dirname, 'public')));
app.use(config.static.root, express.static(`${__dirname}/public`, {
  setHeaders: (res, path) => {
    if (path.endsWith('.gz')) {
      res.set('Content-Encoding', 'gzip');
      res.type(mime.lookup(path.slice(0, -3)));
    }
  }
}));

app.use(compression());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());

// app.use(sassMiddleware({
//   src: path.join(__dirname, 'public'),
//   dest: path.join(__dirname, 'public'),
//   indentedSyntax: true, // true = .sass and false = .scss
//   sourceMap: true
// }));

//
// Setup session & passport
//
app.use(session({
  secret: process.env.session_secret,
  resave: false,
  saveUninitialized: false,
  store: new SequelizeStore({db: sequelize})
}));
app.use(passport.initialize());
app.use(passport.session());


const middleware = {
  globalLocals: function (req, res, next) {
    res.locals = {
      user: {isAuthenticated: req.isAuthenticated()},
      // siteTitle: "My Website's Title",
      // pageTitle: "The Root Splash Page",
      // author: "Cory Gross",
      // description: "My app's description",
    };
    next();
  },
};
app.use(middleware.globalLocals);

app.use('/', routes_index);
app.use('/manager', routes_manager);
app.use('/settings', routes_settings);
app.use('/webhooks', routes_webhooks);
app.use('/auth', routes_auth);
app.use('/test', routes_test);

// import all the pre-defined bot routes that are present in /bot/components/routes
if (bot) {
  var normalizedPath = require("path").join(__dirname, "bot/components/routes");
  require("fs").readdirSync(normalizedPath).forEach(function (file) {
    console.log(file);
    require("./bot/components/routes/" + file)(app, bot);
  });
} else {
  console.log('WARNING: bot is not defined; did you import it? (OK if you are just testing without needing to register the callbacks with Spark)');
}

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

app.listen(config.port, config.host, () => {
  console.log(`Application listening on ${config.host}:${config.port}...`);
});

module.exports = app;
