$(function () {

  //
  // Get data
  //
  $.get('/manager/api/flow/12345', {}, function (flow) {
    flow.steps.forEach(function (step) {
      $('#flow-container').append(
        '<div class="step">' +
        '<h3>' + getStepTypeNameFromId(step.step_type).description + '</h3>' +
        '<span style="padding: 0 10px 0 10px">' + step.id + '</span>' +
        '<span style="text-decoration: dotted">' + step.text + '</span>' +
        '</div>'
      )
    });
  });

  function getStepTypeNameFromId(stepId) {
    for (var i = 0; i < stepTypes.length; i++) {
      if (stepTypes[i].id === stepId) {
        return stepTypes[i];
      }
    }
  }

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

  //
  // Other stuff
  //
});