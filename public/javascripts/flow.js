"use strict";

$(function () {
  //
  // Get data
  //
  $.get('/manager/api/flow/' + flowId, {}, function (flow) {
    flow.steps.forEach(function (step) {
      const stepsContainer = $('#steps');

      let stepHtml = '<div class="step" id="step-' + step.id + '" data-step-id="' + step.stepTypeId + '" data-step-type="' + step.stepTypeId + '">' +
        '<h5>' + getStepTypeNameFromId(step.stepTypeId).description + '</h5>';// +
      // '<div>Step ID: ' + step.id + '</div>' +
      // '<div>Step text: ' + step.text + '</div>';

      // TODO: refactor; do not use the ID to switch
      switch (step.stepTypeId) {
        case 1:
          // Announcement
          stepHtml += '<input type="text" value="' + step.text + '" class="question form-control" />';
          break;
        case 2:
          // Question
          stepHtml += '<input type="text" value="' + step.text + '" class="question form-control" />';
          break;
        case 3:
          // Document
          stepHtml += '<input type="text" value="' + step.text + '" class="question form-control" />';
          stepHtml += '<input type="file" />';
          break;
        case 4:
          // Multiple Choice
          stepHtml += '<div>' +
            '<div class="input-group"><label>Title</label><input type="text" class="question form-control" value="' + step.text + '" /></div>' +
            '<div class="input-group"><label>Question</label><input type="text" class="answer form-control" /><span class="input-group-addon">remove</span></div>' +
            '<div class="input-group"><label>Question</label><input type="text" class="answer form-control" /><span class="input-group-addon">remove</span></div>' +
            '<div class="input-group"><label>Question</label><input type="text" class="answer form-control" /><span class="input-group-addon">remove</span></div>' +
            '<div class="input-group"><label>Question</label><input type="text" class="answer form-control" /><span class="input-group-addon">remove</span></div>' +
            'add question' +
            '</div>';
          break;
        case 5:
          // Docusign
          stepHtml += '<input type="text" value="' + step.text + '" class="question form-control" />';
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
    let steps = [];
    $('#steps').children().each((idx, step) => {
      step = $(step);
      let currentStep = {
        id: parseInt(step.attr('data-step-id')),
        text: step.find('input.question').val()
      };
      let stepType = parseInt(step.attr('data-step-type'));
      switch (stepType) {
        case 1:
          // Announcement
          break;
        case 2:
          // Question
          break;
        case 3:
          // Document
          break;
        case 4:
          // Multiple Choice
          break;
        case 5:
          // Docusign
          break;
      }
      steps.push(currentStep);
    });

    console.log(steps);

    let postData = {
      flowId: flowId,
      steps: steps
    };
    $.ajax({
      url: '/manager/api/flow/save',
      type: 'POST',
      data: JSON.stringify(postData),
      contentType: 'application/json; charset=utf-8',
      dataType: 'json',
      complete: function (data) {
        // $('#results').html(data);
        // callback();
      }
    });
  });
});