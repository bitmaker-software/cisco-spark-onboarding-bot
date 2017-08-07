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
const session = require('express-session');
const models = require('./models/index.js');
const sequelize = models.sequelize;
const SequelizeStore = require('connect-session-sequelize')(session.Store);


const env = require('node-env-file');
env(__dirname + '/bot/.env');


// ——————————————————————————————————————————————————
//             Database (create tables)
// ——————————————————————————————————————————————————

//
// sync() will create all table if they doesn't exist in database
//
// {force: true} means DROP TABLE IF EXISTS before trying to create the table
// {alter: true} uses ALTER TABLE
//
const CREATE_DB_AND_LOAD_FIXTURES = false;
let databaseReady = true;
if (CREATE_DB_AND_LOAD_FIXTURES) {
  databaseReady = false;
  sequelize.sync({force: true}).then(() => {
    console.log(`\n\n`);
    console.log(`Database models synced, will now load the fixtures`);
    console.log(`\n`);
    // Load database fixtures
    models.startLoadingDatabaseFixtures(() => {
      databaseReady = true;
    });
  }, err => {
    console.error("Error on sequelize.sync():");
    console.error(err);
  });
}


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
    clientID: process.env.cisco_spark_client_id,
    clientSecret: process.env.cisco_spark_client_secret,
    callbackURL: "/auth/spark/callback",
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

app.use(session({
  secret: process.env.session_secret,
  resave: false,
  saveUninitialized: false,
  store: new SequelizeStore({db: sequelize})
}));
app.use(passport.initialize());
app.use(passport.session());


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
// Read from the .env file and save to the database (the first bot only)
(function checkDatabaseReadyAndSaveTheBot() {
  if (!databaseReady) {
    console.log('Saving the bot but the database is not ready yet; waiting 1 second.');
    setTimeout(checkDatabaseReadyAndSaveTheBot, 1000);
  } else {
    console.log('The database is ready.');

    if (CREATE_DB_AND_LOAD_FIXTURES) {
      console.log(`Will save the bot to the database with the info from the env file`);
      databaseServices.saveBot({
        managerId: 1,
        name: `Read from env`,
        accessToken: process.env.access_token,
        publicHttpsAddress: process.env.public_address,
        webhookName: process.env.webhook_name,
        secret: process.env.secret
      }).then(registerBot);
    } else {
      registerBot()
    }

  }
})();

function registerBot() {
  // called from checkDatabaseReadyAndSaveTheBot
  console.log(`Registering the bot`);
  if (REGISTER_WITH_SPARK) {
    botsReady = false;

    require('./bot/bot')(callbackWhenBotsRegistered);
  }
}

function callbackWhenBotsRegistered(botsControllers) {
  // Setup bot routes
  databaseServices.takeTheBotsControllers(botsControllers);
  // import all the pre-defined bot routes that are present in /bot/components/routes
  const normalizedPath = require("path").join(__dirname, "bot/components/routes");
  require("fs").readdirSync(normalizedPath).forEach(file => {
    console.log(`Processing bot route file: ${file}`);
    require("./bot/components/routes/" + file)(app, botsControllers); // incoming_webhooks.js
  });

  console.log(`\nThe bots are ready`);
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
    resumeOngoingFlowsAfterServerStart();
  });
}

function resumeOngoingFlowsAfterServerStart() {
  // TODO: fetch also the flows that are ready to start (status 1)
  console.log('resumeOngoingFlowsAfterServerStart()');
  console.log(`Will call getAllOngoingFlows`);
  databaseServices.getAllOngoingFlows().then(respondentFlows => {
    console.log(`Result from getAllOngoingFlows:`);
    console.log(respondentFlows);
    respondentFlows.forEach(respondentFlow => {
      console.log(`Resuming flow ${respondentFlow.id}`); // TODO
      databaseServices.getFlowBotController(respondentFlow.flow_id).then(bot => {
        sparkAPIUtils.resumeFlowForUser(respondentFlow.flow_id, respondentFlow.respondent.spark_id, bot);
      });
    });
  });
}


(function checkDatabaseReadyAndStartTheServer() {
  if (!databaseReady || !botsReady) {
    console.log('The database or the bots are not ready yet; waiting 1 second.');
    setTimeout(checkDatabaseReadyAndStartTheServer, 1000);
  } else {
    console.log('Database and bots ready.');
    setupLastRoutes();
    startTheServer();
  }
})();


// ——————————————————————————————————————————————————
//                 Export the app
// ——————————————————————————————————————————————————

module.exports = app;
