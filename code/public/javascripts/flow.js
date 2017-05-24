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
});