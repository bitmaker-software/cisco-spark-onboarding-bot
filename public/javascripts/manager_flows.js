"use strict";

$(function () {
  $('#myModal').on('shown.bs.modal', function () {
    $('#myInput').focus()
  });

  let confirmAddFlowButton = $('#myModal button#modal-add-flow');
  confirmAddFlowButton.click(() => {
    confirmAddFlowButton.text('Adding…');
    let name = $('input#name').val();
    $.post('/manager/api/flow/', {name: name}, function (data) {
      $('#myModal').modal('hide');
      location.reload(); // refresh the page to show the new flow
    }).fail(err => {
      console.log("Error: " + err);
    });
  });
});