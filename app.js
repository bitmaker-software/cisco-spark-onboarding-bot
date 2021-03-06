"use strict";

import express from 'express';
// import path           from 'path';
// import favicon        from 'serve-favicon';
import logger from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import mime from 'mime';
// const sassMiddleware = require('node-sass-middleware');

import config from './app.config';

const routes_index = require('./routes/index');
const routes_settings = require('./routes/settings');
const routes_manager = require('./routes/manager');
const routes_webhooks = require('./routes/webhooks');
const routes_auth = require('./routes/auth');
const routes_test = require('./routes/test');

const databaseServices = require('./bot/database_services');
const sparkAPIUtils = require('./bot/spark_api_utils');

const passport = require('passport');
const CiscoSparkStrategy = require('passport-cisco-spark').Strategy;
const models = require('./models/index.js');
const sequelize = models.sequelize;
const expressSession = require('express-session');
const SequelizeStore = require('connect-session-sequelize')(expressSession.Store);


const env = require('node-env-file');
env(__dirname + '/bot/.env', {raise: false});


// ——————————————————————————————————————————————————
//             Passport configuration
// ——————————————————————————————————————————————————

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((obj, done) => {
  done(null, obj);
});

// Use the CiscoSparkStrategy within passport
passport.use(new CiscoSparkStrategy({
    clientID: process.env.SPARK_OAUTH__CLIENT_ID,
    clientSecret: process.env.SPARK_OAUTH__CLIENT_SECRET,
    callbackURL: config.hostAndPortForPassport + "/auth/spark/callback",
    scope: [
      'spark:all'
    ]
  },
  (accessToken, refreshToken, profile, done) => {
    databaseServices.userLoggedIn(profile.id, profile.displayName, profile.emails, profile._json.orgId).then(user => {
      const sessionUser = {id: user.id, name: user.name, avatar: profile._json.avatar, spark_token: accessToken};
      return done(null, sessionUser);
    }, err => {
      return done(err);
    });
  }
));

const app = express();

app.locals.static = config.static; // expose the static URLs structure


// ——————————————————————————————————————————————————
//               View engine setup
// ——————————————————————————————————————————————————

app.set('views', `${__dirname}/views`);
app.set('view engine', 'pug');


// ——————————————————————————————————————————————————
//                    Favicon
// ——————————————————————————————————————————————————

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));


// ——————————————————————————————————————————————————
//                    Logging
// ——————————————————————————————————————————————————

app.use(logger('dev'));


// ——————————————————————————————————————————————————
//                  Static content
// ——————————————————————————————————————————————————

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


// ——————————————————————————————————————————————————
//             Setup session & passport
// ——————————————————————————————————————————————————

if (!process.env.EXPRESS_SESSION_SECRET) {
  console.error(`Missing EXPRESS_SESSION_SECRET env var!`);
}
app.use(expressSession({
  secret: process.env.EXPRESS_SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: new SequelizeStore({db: sequelize})
}));
app.use(passport.initialize());
app.use(passport.session());


// ——————————————————————————————————————————————————
//                   File upload
// ——————————————————————————————————————————————————
const fileUpload = require('express-fileupload');
app.use(fileUpload());


// ——————————————————————————————————————————————————
//  Middleware accessible on templates via 'locals'
// ——————————————————————————————————————————————————

const middleware = {
  globalLocals: (req, res, next) => {
    res.locals = {
      user: {
        isAuthenticated: req.isAuthenticated(),
        user: req.user,
      },
      // siteTitle: "My Website's Title",
      // pageTitle: "The Root Splash Page",
      // author: "Cory Gross",
      // description: "My app's description",
    };
    next();
  },
};
app.use(middleware.globalLocals);


// ——————————————————————————————————————————————————
//                      Routes
// ——————————————————————————————————————————————————

app.use('/', routes_index);
app.use('/manager', routes_manager);
app.use('/settings', routes_settings);
app.use('/webhooks', routes_webhooks);
app.use('/auth', routes_auth);
app.use('/test', routes_test);


// ——————————————————————————————————————————————————
//                  Bot & Bot routes
// ——————————————————————————————————————————————————

const REGISTER_WITH_SPARK = true; // set to false to avoid registering with Spark
let botsReady = true;
if (REGISTER_WITH_SPARK) {
  console.log(`Registering the bot`);
  botsReady = false;
  require('./bot/bot').init().then(() => {
    setupBotRoutes();
  });
} else {
  console.log(`Skipping registering the bot`);
}

function setupBotRoutes() {
  // Import all the pre-defined bot routes that are present in /bot/components/routes
  const normalizedPath = require("path").join(__dirname, "bot/components/routes");
  require("fs").readdirSync(normalizedPath).forEach(file => {
    console.log(`Processing bot route file: ${file}`);
    require("./bot/components/routes/" + file)(app); // incoming_webhooks.js
  });
  console.log(`\nThe bots are now ready.`);
  botsReady = true;
}


// ——————————————————————————————————————————————————
//      Catch 404 and forward to error handler
// ——————————————————————————————————————————————————

function setupLastRoutes() {
  app.use((req, res, next) => {
    const err = new Error('Not Found');
    err.status = 404;
    next(err);
  });

  // error handler
  app.use((err, req, res, next) => {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
  });
}


// ——————————————————————————————————————————————————
//                 Start the server
// ——————————————————————————————————————————————————

function startTheServer() {
  console.log('Will now start the server.');
  app.listen(config.port, config.host, () => {
    console.log(`Application listening on ${config.host}:${config.port}...`);
  });
}

let retryCount = 0;
(function checkBotsReadyAndStartTheServer() {
  if (!botsReady) {
    if (retryCount > 10) {
      console.log('The bots are not ready; will not retry again.');
      return;
    }
    retryCount++;
    console.log('The bots are not ready yet; waiting 1 second.');
    setTimeout(checkBotsReadyAndStartTheServer, 1000);
  } else {
    console.log('Bots ready.');
    setupLastRoutes();
    startTheServer();
  }
})();


// ——————————————————————————————————————————————————
//                 Export the app
// ——————————————————————————————————————————————————

module.exports = app;