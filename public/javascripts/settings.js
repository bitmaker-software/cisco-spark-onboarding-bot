"use strict";

$(function () {
  //
  // Bot token
  //
  var button = {
    element: $("#save-bot-token"),
    saving: false,
    value: 'Save',
    savingTitle: 'Saving',
    savedTitle: 'Saved'
  };
  var submitBotToken = function () {
    if (button.saving) {
      return;
    }
    changeButtonToSaving();
    var token = $('#bot-token').val();
    $.post('/manager/api/saveToken', {token: token}, function (data) {
      $('#results').html(data);
      changeButtonToSaved();
    });
  };

  $('#bot-token').on('keyup', function (e) {
    if (e.keyCode === 13) {
      submitBotToken();
    }
  });

  $('#save-bot-token').click(submitBotToken);

  function changeButtonToSaving() {
    button.saving = true;
    button.value = 'Saving';
    updateButtonDOMProps();
  }

  function changeButtonToSaved() {
    button.saving = false;
    button.value = 'Saved';
    updateButtonDOMProps();
  }

  function updateButtonDOMProps() {
    button.element
      .prop('disabled', button.saving)
      .prop('value', button.value);
  }

});