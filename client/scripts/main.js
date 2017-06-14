console.log('Main script, included on all pages...'); // eslint-disable-line no-console

// first jQuery, then Tether (needed by Bootstrap tooltips), then Bootstrap
window.$ = window.jQuery = require('jquery'); // "Bootstrap's JavaScript requires jQuery"
window.Tether = require('tether'); // "Bootstrap tooltips require Tether"
require('bootstrap');

import Vue from 'vue/dist/vue';
window.Vue = Vue;

// Vue must be defined on each page

if (module.hot) {
  module.hot.accept();
}

$('.navbar-brand').click(function() {
  $( "#sidenav" ).toggleClass('expanded');
});

$(function () {
  // Bootstrap: initialize all tooltips on a page
  $('[data-toggle="tooltip"]').tooltip()
});