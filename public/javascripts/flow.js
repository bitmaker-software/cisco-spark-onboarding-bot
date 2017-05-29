"use strict";

$(function () {
  // Sortable
  // List with handle
  Sortable.create(document.getElementById('steps'), {
    handle: '.drag-handle-step',
    animation: 150
  });
  //
  // Get data
  //

  const stepsContainer = $('#steps');


  $.get('/manager/api/flow/' + flowId, {}, function (flow) {
    if (flow.steps.length === 0) {
      $('#empty-flow').removeClass('hidden');
    } else {
      $('#save-steps').removeClass('hidden');
    }
    flow.steps.forEach(function (step) {
      getStepHtmlAndAddToContainer(step);
    });

    // Create a Sortable for each multiple choice question
    $('#steps').find('.multiple-choice').each((idx, multipleChoiceElement) => {
      Sortable.create(multipleChoiceElement, {
        handle: '.drag-handle-multiple-choice',
        animation: 150
      });
    });
  });

  function getStepTypeNameFromId(stepId) {
    for (var i = 0; i < stepTypes.length; i++) {
      if (stepTypes[i].id === stepId) {
        return stepTypes[i];
      }
    }
  }

  function getNewStepHtmlAndAddToContainer(stepType) {
    getStepHtmlAndAddToContainer({
      step_type_id: stepType,
      text: ''
    });
  }

  function getStepHtmlAndAddToContainer(step) {
    let stepHtml = getHtmlStepStart(step);
    // TODO: refactor; do not use the ID to switch
    switch (step.step_type_id) {
      case 1:
        stepHtml += getHtmlStepAnnouncement(step);
        break;
      case 2:
        stepHtml += getHtmlStepQuestion(step);
        break;
      case 3:
        stepHtml += getHtmlStepDocument(step);
        break;
      case 4:
        stepHtml += getHtmlStepMultipleChoice(step);
        break;
      case 5:
        stepHtml += getHtmlStepDocusign(step);
        break;
    }
    stepHtml += getHtmlStepEnd();
    stepsContainer.append(stepHtml);
  }

  function getHtmlStepStart(step) {
    // Do not add the ID if it is a new step
    return '<div class="list-group-item"' + (step.id ? ( 'id="step-' + step.id + '" data-step-id="' + step.id + '"') : '') + ' data-step-type="' + step.step_type_id + '">' +
      '<span class="drag-handle drag-handle-step">☰</span>' +
      '<h5>' + getStepTypeNameFromId(step.step_type_id).description + '</h5>';
  }

  function getHtmlStepAnnouncement(step) {
    return '<div class="input-group"><input type="text" value="' + step.text + '" class="question form-control" /></div>';
  }

  function getHtmlStepQuestion(step) {
    return '<div class="input-group"><input type="text" value="' + step.text + '" class="question form-control" /></div>';
  }

  function getHtmlStepDocument(step) {
    return '<div class="input-group"><input type="text" value="' + step.text + '" class="question form-control" /></div>' +
      '<div class="input-group"><input type="file" /></div>';
  }

  function getHtmlStepMultipleChoice(step) {
    // Title
    let stepHtml = '<div class="input-group">' +
      '<label>Title</label>' +
      '<input type="text" class="question form-control" value="' + step.text + '" />' +
      '</div>';
    // Choices
    stepHtml += '<div class="multiple-choice">';
    if (step.step_choices) {
      step.step_choices.forEach(choice => {
        stepHtml += '<div class="input-group">' +
          '<span class="drag-handle drag-handle-multiple-choice">☰</span>' +
          '<label>Question</label>' +
          '<input type="text" class="answer form-control" value="' + choice.text + '" data-id="' + choice.id + '" data-choice-order="' + choice.choice_order + '"/>' +
          '<span class="input-group-addon">remove</span>' +
          '</div>';
      });
    } else {
      // Add an empty one
      stepHtml += '<div class="input-group">' +
        '<span class="drag-handle drag-handle-multiple-choice">☰</span>' +
        '<label>Question</label>' +
        '<input type="text" class="answer form-control" value=""/>' +
        '<span class="input-group-addon">remove</span>' +
        '</div>';
      stepHtml += '<div class="input-group">' +
        '<span class="drag-handle drag-handle-multiple-choice">☰</span>' +
        '<label>Question</label>' +
        '<input type="text" class="answer form-control" value=""/>' +
        '<span class="input-group-addon">remove</span>' +
        '</div>';
    }
    // TODO: activate the drag and drop on the new elements
    stepHtml += '<div>add question</div>';
    stepHtml += '</div>';
    return stepHtml;
  }

  function getHtmlStepDocusign(step) {
    return '<div class="input-group"><input type="text" value="' + step.text + '" class="question form-control" /></div>';
  }

  function getHtmlStepEnd() {
    return '</div>';
  }

  let saveStepsButton = $('#save-steps');
  saveStepsButton.click(() => {
    console.log('Clicked save steps');
    saveStepsButton.text("Saving…");
    let steps = [];
    let currentStepOrder = 1;
    $('#steps').children().each((idx, step) => {
      step = $(step);
      let stepType = parseInt(step.attr('data-step-type'));
      let currentStep = {
        text: step.find('input.question').val(),
        step_type: stepType,
        step_order: currentStepOrder++
      };
      if (step.attr('data-step-id') !== undefined) {
        // Add the ID if it is not a new step
        currentStep.id = parseInt(step.attr('data-step-id'));
      }
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
          currentStep.step_choices = [];
          let currentChoiceOrder = 1;
          step.find('input.answer').each((idx, answer) => {
            let choice = {
              choice_order: currentChoiceOrder++,
              text: answer.value
            };
            if (answer.getAttribute('data-id') !== null) {
              // Add the ID if it is not a new choice
              choice.id = parseInt(answer.getAttribute('data-id'));
            }
            currentStep.step_choices.push(choice);
          });
          break;
        case 5:
          // Docusign
          break;
      }
      steps.push(currentStep);
    });

    console.log(steps);

    let postData = {
      flow_id: flowId,
      steps: steps
    };

    $.ajax({
      url: '/manager/api/flow',
      type: 'PUT',
      data: JSON.stringify(postData),
      contentType: 'application/json; charset=utf-8',
      dataType: 'json',
      complete: function (data) {
        // $('#results').html(data);
        // callback();
        console.log("Request to save flow complete");
        saveStepsButton.text("Saved");
        location.reload();
      }
    });
  });

  let confirmAddStepButton = $('#myModal button#modal-add-step');
  confirmAddStepButton.click(() => {
    let stepType = parseInt($('#new-step-selector').find("option:selected").val());
    getNewStepHtmlAndAddToContainer(stepType);
    $('#myModal').modal('hide');
    $('#empty-flow').addClass('hidden');
    $('#save-steps').removeClass('hidden');
  });
});