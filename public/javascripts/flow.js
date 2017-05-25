"use strict";

$(function () {
  //
  // Get data
  //
  $.get('/manager/api/flow/' + flowId, {}, function (flow) {
    flow.steps.forEach(function (step) {
      const stepsContainer = $('#steps');

      let stepHtml = '<div class="step">' +
        '<h3>' + getStepTypeNameFromId(step.stepTypeId).description + '</h3>' +
        '<div>Step ID: ' + step.id + '</div>' +
        '<div>Step text: ' + step.text + '</div>';

      // TODO: refactor; do not use the ID to switch
      switch (step.stepTypeId) {
        case 0:
          // Announcement
          stepHtml += '<input type="text" value="' + step.text + '"/>';
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
            '<div><label>Title</label><input type="text" /></div>' +
            '<div><label>Question</label><input type="text" /> remove</div>' +
            '<div><label>Question</label><input type="text" /> remove</div>' +
            '<div><label>Question</label><input type="text" /> remove</div>' +
            '<div><label>Question</label><input type="text" /> remove</div>' +
            'add question' +
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