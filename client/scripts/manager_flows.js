"use strict";

window.$ = window.jQuery = require('jquery'); // "Bootstrap's JavaScript requires jQuery"
window.Tether = require('tether'); // "Bootstrap tooltips require Tether"
require('bootstrap');

$(function () {
  $('#myModal').on('shown.bs.modal', function () {
    $('#myInput').focus()
  });

  let confirmAddFlowButton = $('#myModal button#modal-add-flow');
  function submitSave() {
    // TODO: check for empty name (disable button if empty)
    let name = $('input#name').val();
    if (name.trim() === '') {
      return;
    }
    confirmAddFlowButton.text('Adding…');
    $.post('/manager/api/flow/', {name: name}, function (data) {
      $('#myModal').modal('hide'); // TODO: $(...).modal is not a function
      location.reload(); // refresh the page to show the new flow
    }).fail(err => {
      console.log("Error: " + err);
    });
  }
  $('input#name').on('keyup', function (e) {
    if (e.keyCode === 13) {
      submitSave();
    }
  });
  confirmAddFlowButton.click(submitSave);
});