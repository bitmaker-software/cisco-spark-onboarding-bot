// Simple route middleware to ensure user is authenticated.
//   Use this route middleware on any resource that needs to be protected.  If
//   the request is authenticated (typically via a persistent login session),
//   the request will proceed.  Otherwise, the user will be redirected to the
//   login page.
module.exports = function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  if (req.header('X-Requested-With') === 'XMLHttpRequest') {
    // AJAX call, do not redirect, return 401 Unauthorized
    res.send(401);
  } else {
    res.redirect('/auth/login')
  }
};