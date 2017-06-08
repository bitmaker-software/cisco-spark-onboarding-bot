"use strict";

window.$ = window.jQuery = require('jquery'); // "Bootstrap's JavaScript requires jQuery"
window.Tether = require('tether'); // "Bootstrap tooltips require Tether"
require('bootstrap');

$(function () {
  $('#myModal').on('shown.bs.modal', function () {
    $('#myInput').focus()
  });

  let confirmAddFlowButton = $('#myModal button#modal-add-flow');
  confirmAddFlowButton.click(() => {
    confirmAddFlowButton.text('Adding…');
    let name = $('input#name').val();
    $.post('/manager/api/flow/', {name: name}, function (data) {
      $('#myModal').modal('hide'); // TODO: $(...).modal is not a function
      location.reload(); // refresh the page to show the new flow
    }).fail(err => {
      console.log("Error: " + err);
    });
  });
});