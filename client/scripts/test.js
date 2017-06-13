"use strict";
import $ from 'jquery';

$(function () {
  const searchButton = $('#btn-search-user');
  const searchInput = $('#txt-search-user');
  const searchResultsList = $('#lst-result-user');

  searchInput.keyup(event => {
    if (event.keyCode === 13) {
      searchButton.click();
    }
  });

  searchButton.click(() => {
    // TODO: replace with VUE
    const searchString = encodeURIComponent(searchInput.val());
    $.get('/test/search_users/' + searchString, {}, res => {
      $('#result-info').text('Found ' + res.length + ' result(s).');

      // Clear previous results
      searchResultsList.empty();
      res.forEach(item => {
        searchResultsList.append('<li>' + item.displayName + ' (' + item.email + ') <input id="btn-send-flow" type="button" value="Send" data-sparkid="' + item.id + '" /></li>');
      });

      // Add the callback to all the buttons
      $('#btn-send-flow').click(sendFlow);
    }).fail(
      error => {
        if (error.status === 401) {
          window.location.replace('/auth/spark');
        }
      });
  });

  function sendFlow() {
    $.post('/test/send_flow/1/' + $(this).data('sparkid'), {}, res => {
      alert(res);
    }).fail(error => {
      if (error.status === 401) {
        window.location.replace('/auth/login');
      }
    });
  }
});