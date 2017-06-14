"use strict";

// In this order: Vue, Sortable, Vue.Draggable
// script(src='/javascripts/libs/Sortable-1.5.1/Sortable.js')
// script(src='/javascripts/libs/vue.draggable/vuedraggable.js')
import Vue from 'vue/dist/vue';
// require('sortablejs');
import draggable from 'vuedraggable';


$(function () {
  console.log("manager_flow_steps.js");

  let app = new Vue({
    el: '#root',
    // app initial state
    data: {
      steps: [],
      stepTypes: stepTypesObj,
      stepTypeIcons: {
        1: "announcement", // Announcement
        2: "question",  // Question
        3: "document", // Document
        4: "multiplechoice", // Multiple Choice
        5: "signature", // Docusign
      },
      newStepTypeSelected: 1,
    },
    methods: {
      addStep: stepType => addNewStep(stepType),
      saveSteps: saveSteps,
      startDraggingStepTypes: () => {
        console.log("Start dragging");
      },
      stopDraggingStepTypes: (x) => {
        console.log("Stop dragging");
      },
    },
    components: {
      draggable
    }
  });

  let addNewStep = stepType => {
    let stepTypeInt = parseInt(stepType);

    app.steps.push({
      step_type_id: stepTypeInt
    });

    $('#myModal').modal('hide');
    $('#empty-flow').addClass('hidden');
    $('#save-steps').removeClass('hidden');

    // reset selected type, so the next time we open the modal the first one is selected
    app.newStepTypeSelected = 1;
  };

//
// Get data
//
  function fetchSteps() {
    $.get('/manager/api/flow/' + flowId, {}, function (flow) {
      // console.log("Raw flow steps from the server:");
      // console.log(flow.steps);
      // console.log("Flow steps curated to be handled by Vue:"); // TODO: do it on server-side?
      app.steps = flow.steps.map(step => {
        let curatedStep = {
          id: step.id,
          text: step.text,
          step_type_id: step.step_type_id,
          step_choices: step.step_choices, // multiple choice questions
          type_description: getStepTypeFromTypeId(step.step_type_id).description
        };
        return curatedStep;
      });

      console.log('Steps');
      console.log(app.steps);

      if (flow.steps.length === 0) {
        // TODO: do it on Vue, template side
        $('#empty-flow').removeClass('hidden');
      } else {
        $('#save-steps').removeClass('hidden');
      }
    });
  }

  fetchSteps();

  function getStepTypeFromTypeId(typeId) {
    if (stepTypesObj[typeId]) {
      return stepTypesObj[typeId];
    }
    return {description: "Unknown step type"};
  }

  function saveSteps() {
    // TODO adapt to Vue
    let saveStepsButton = $('#save-steps');
    console.log('Clicked save steps');
    saveStepsButton.text("Saving…");

    let postData = {
      flow_id: flowId,
      steps: app.steps
    };

    $.ajax({
      url: '/manager/api/flow',
      type: 'PUT',
      data: JSON.stringify(postData),
      contentType: 'application/json; charset=utf-8',
      dataType: 'json',
      complete: function (data) {
        console.log("Request to save flow complete");
        saveStepsButton.text("Saved");
        // location.reload();
      }
    });
  }

  // Update tooltips
  $('[data-toggle="tooltip"]').tooltip();
});
