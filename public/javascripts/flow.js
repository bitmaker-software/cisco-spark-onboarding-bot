"use strict";

$(function () {
  //
  // Get data
  //
  $.get('/manager/api/flow/12345', {}, function (flow) {
    flow.steps.forEach(function (step) {
      const stepsContainer = $('#steps');

      let stepHtml = '<div class="step">' +
        '<h3>' + getStepTypeNameFromId(step.step_type).description + '</h3>' +
        '<div>Step ID: ' + step.id + '</div>' +
        '<div>Step text: ' + step.text + '</div>';

      // TODO: refactor; do not use the ID to switch
      switch (step.step_type) {
        case 0:
          // Announcement
          stepHtml += '<input type="text" />';
          break;
        case 1:
          // Question
          stepHtml += '<input type="text" />';
          break;
        case 2:
          // Document
          stepHtml += '<input type="file" />';
          break;
        case 3:
          // Multiple Choice
          stepHtml += '<div>' +
            '<label>Label</label><input type="text" />' +
            '<label>Label</label><input type="text" />' +
            '<label>Label</label><input type="text" />' +
            '<label>Label</label><input type="text" />' +
            '</div>';
          break;
        case 4:
          // Docusign
          break;
      }

      stepHtml += '</div>';
      stepsContainer.append(stepHtml);
    });
  });

  function getStepTypeNameFromId(stepId) {
    for (var i = 0; i < stepTypes.length; i++) {
      if (stepTypes[i].id === stepId) {
        return stepTypes[i];
      }
    }
  }

  $('#save-steps').click(() => {
    console.log("Clicked save steps");
  });
});