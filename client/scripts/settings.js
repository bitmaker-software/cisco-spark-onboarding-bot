"use strict";


let app = new Vue({
  el: '#app',
  data: {
    bots: serverSideSettingsList.bots,
    other: "Hello1"
  },
  methods: {
    addBot: () => {
      app.bots.push({
        name: undefined,
        access_token: undefined,
        public_https_address: undefined,
        secret: undefined
      });
    },
    saveBots: () => {
      // TODO
      app.$http.post('/settings/api/saveBots', app.bots).then(response => {
        // success callback
      }, response => {
        // error callback
      });
    }
  }
});


$(function () {
  //
  // Bot token
  //
  const button = {
    element: $("#save-bot-token"),
    saving: false,
    value: 'Save',
    savingTitle: 'Saving',
    savedTitle: 'Saved'
  };
  const submitBotToken = function () {
    if (button.saving) {
      return;
    }
    changeButtonToSaving();
    const token = $('#bot-token').val();
    $.post('/settings/api/saveToken', {token: token}, function (data) {
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