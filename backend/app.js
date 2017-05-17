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
var botWebhooks = require('./bot/components/routes/incoming_webhooks');

var bot = require('./bot/bot');

var webserver = express();

// view engine setup
webserver.set('views', path.join(__dirname, 'views'));
webserver.set('view engine', 'pug');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
webserver.use(logger('dev'));
webserver.use(bodyParser.json());
webserver.use(bodyParser.urlencoded({ extended: false }));
webserver.use(cookieParser());
webserver.use(sassMiddleware({
  src: path.join(__dirname, 'public'),
  dest: path.join(__dirname, 'public'),
  indentedSyntax: true, // true = .sass and false = .scss
  sourceMap: true
}));
webserver.use(express.static(path.join(__dirname, 'public')));

webserver.use('/', index);
webserver.use('/manager', manager);
webserver.use('/webhooks', webhooks);

// import all the pre-defined bot routes that are present in /bot/components/routes
var normalizedPath = require("path").join(__dirname, "bot/components/routes");
require("fs").readdirSync(normalizedPath).forEach(function(file) {
  console.log(file);
  require("./bot/components/routes/" + file)(webserver, bot);
});

// catch 404 and forward to error handler
webserver.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
webserver.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = webserver;
