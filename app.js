"use strict";

import express        from 'express';
// import path           from 'path';
// import favicon        from 'serve-favicon';
import logger         from 'morgan';
import compression    from 'compression';
import cookieParser   from 'cookie-parser';
import bodyParser     from 'body-parser';
import mime           from 'mime';
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

const botWebhooks = require('./bot/components/routes/incoming_webhooks'); // TODO: not in use?


// ——————————————————————————————————————————————————
//                       Bot
// ——————————————————————————————————————————————————

let bot;
const REGISTER_WITH_SPARK = true; // set to false to avoid registering with Spark
if (REGISTER_WITH_SPARK) {
  bot = require('./bot/bot');
  global.bot = bot;
}

const passport = require('passport');
const CiscoSparkStrategy = require('passport-cisco-spark').Strategy;
const session = require('express-session');
const models = require('./models/index.js');
const sequelize = models.sequelize;
const SequelizeStore = require('connect-session-sequelize')(session.Store);


const env = require('node-env-file');
env(__dirname + '/bot/.env');


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

// import all the pre-defined bot routes that are present in /bot/components/routes
if (typeof bot !== 'undefined') {
  const normalizedPath = require("path").join(__dirname, "bot/components/routes");
  require("fs").readdirSync(normalizedPath).forEach(file => {
    console.log(file);
    require("./bot/components/routes/" + file)(app, bot);
  });
} else {
  console.log('WARNING: bot is not defined; did you import it? (OK if you are just testing without needing to register the callbacks with Spark)');
}


// ——————————————————————————————————————————————————
//      Catch 404 and forward to error handler
// ——————————————————————————————————————————————————

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
if (CREATE_DB_AND_LOAD_FIXTURES) {
  sequelize.sync({alter: true}).then(() => {
    console.log("Database models synced, will load the fixtures");
    // Load database fixtures
    models.startLoadingDatabaseFixtures();
    startTheServer();
  }, err => {
    console.error("Error on sequelize.sync():");
    console.error(err);
  });
} else {
  startTheServer();
}

function startTheServer() {
  console.log('Will now start the server.');
  app.listen(config.port, config.host, () => {
    console.log(`Application listening on ${config.host}:${config.port}...`);
    resumeOngoingFlowsAfterServerStart();
  });
}

function resumeOngoingFlowsAfterServerStart() {
 console.log('resumeOngoingFlowsAfterServerStart()');
 databaseServices.getAllOngoingFlows().then(respondentFlows => {
  // console.log('Pending flows:');
  // console.log(flows);
   respondentFlows.forEach(respondentFlow => {
    console.log(`Resuming flow ${respondentFlow.id}`); // TODO
    sparkAPIUtils.resumeFlowForUser(respondentFlow.flow_id, respondentFlow.respondent.spark_id);
  });
 });
}


// ——————————————————————————————————————————————————
//                 Export the app
// ——————————————————————————————————————————————————

module.exports = app;
