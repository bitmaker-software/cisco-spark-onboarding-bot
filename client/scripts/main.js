console.log('Main script, included on all pages...'); // eslint-disable-line no-console

// jQuery first, then Tether, then Bootstrap JS.
//script(src='/javascripts/libs/jquery-3.2.1/jquery-3.2.1.js')
//script(src='/javascripts/libs/tether-1.4.0/js/tether.min.js')
//script(src='/javascripts/libs/bootstrap-4.0.0-alpha.6-dist/js/bootstrap.js')
// Vue
//script(src='/javascripts/libs/vue-2.3.3/vue.js')

global.$ = global.jQuery = require('jquery');
require('bootstrap');

if (module.hot) {
  module.hot.accept();
}