var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var sassMiddleware = require('node-sass-middleware');

var index = require('./routes/index');
var manager = require('./routes/manager');
var webhooks = require('./routes/webhooks');
var auth = require('./routes/auth');
var testPages = require('./routes/test');
var services = require('./bot/services');

var botWebhooks = require('./bot/components/routes/incoming_webhooks');

var bot;
bot = require('./bot/bot'); // comment to avoid registering with Spark

var passport = require('passport');
var CiscoSparkStrategy = require('passport-cisco-spark').Strategy;
var session = require('express-session');
var sequelize = require('./models/index.js').sequelize;
var SequelizeStore = require('connect-session-sequelize')(session.Store);


var env = require('node-env-file');
env(__dirname + '/bot/.env');


// Passport configuration
passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done){
  done(null, obj);
});

//use the SparkStrategy within passport
passport.use(new CiscoSparkStrategy({
      clientID: process.env.cisco_spark_client_id,
      clientSecret: process.env.cisco_spark_client_secret,
      callbackURL: "/auth/spark/callback",
      scope: [
        'spark:all'
      ]
    },
    function(accessToken, refreshToken, profile, done) {
      services.userLoggedIn(profile.id, profile.displayName, profile.emails, profile._json.orgId).then(user => {
        var sessionUser = { id: user.id, name: user.name, avatar: profile._json.avatar, spark_token: accessToken };
        return done(null, sessionUser);
      }, err => {
        return done(err);
      });


    }
));

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(sassMiddleware({
  src: path.join(__dirname, 'public'),
  dest: path.join(__dirname, 'public'),
  indentedSyntax: true, // true = .sass and false = .scss
  sourceMap: true
}));

//setup session & passport
app.use(session({ secret: process.env.session_secret, resave: false, saveUninitialized: false, store: new SequelizeStore({db: sequelize}) }));
app.use(passport.initialize());
app.use(passport.session());

app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/manager', manager);
app.use('/webhooks', webhooks);
app.use('/auth', auth);
app.use('/test', testPages);

// import all the pre-defined bot routes that are present in /bot/components/routes
if (bot) {
  var normalizedPath = require("path").join(__dirname, "bot/components/routes");
  require("fs").readdirSync(normalizedPath).forEach(function (file) {
    console.log(file);
    require("./bot/components/routes/" + file)(app, bot);
  });
} else {
  console.log("Warning: bot is not defined; did you import it?");
}

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
