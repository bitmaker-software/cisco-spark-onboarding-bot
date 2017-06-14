console.log('Main script, included on all pages...'); // eslint-disable-line no-console

// jQuery first, then Tether, then Bootstrap JS.
window.$ = window.jQuery = require('jquery'); // "Bootstrap's JavaScript requires jQuery"
window.Tether = require('tether'); // "Bootstrap tooltips require Tether"
require('bootstrap');

// Vue
//script(src='/javascripts/libs/vue-2.3.3/vue.js')

if (module.hot) {
  module.hot.accept();
}

$('.navbar-brand').click(function() {
  $( "#sidenav" ).toggleClass('expanded');
});

$(function () {
  // Bootstrap: initialize all tooltips on a page
  $('[data-toggle="tooltip"]').tooltip();
});
