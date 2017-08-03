"use strict";

import draggable from 'vuedraggable';

$(function () {
  console.log("manager_flow_steps.js");

  let app = new Vue({
    el: '#root',
    // app initial state
    data: {
      STEP_TYPES: {
        ANNOUNCEMENT: 1,
        FREE_TEXT: 2,
        MULTIPLE_CHOICE: 3,
        UPLOAD_TO_BOT: 4,
        DOWNLOAD_FROM_BOT: 5,
        DOWNLOAD_FROM_BOT_AND_UPLOAD_BACK: 6,
        PEOPLE_TO_MEET: 7,
      },
      bots: botsFromServer,
      selectedBot: selectedBotFromServer,
      steps: [],
      stepsToDelete: [],
      stepChoicesToDelete: [],
      stepTypes: stepTypesFromServer,
      stepTypes2: [],
      stepTypeIcons: {},
      newStepTypeSelected: 1,
      title: titleReceived,
    },
    methods: {

      addStepByDrop: () => {
        //verify step to add
        addNewStep(app.stepTypes2[0].id, false);

        //empty
        app.stepTypes2 = [];
      },

      addStep: stepType => addNewStep(stepType, true),

      deleteStep: (stepid, index) => {
        app.stepsToDelete.push(stepid);
        app.steps.splice(index, 1);
        //change background
        if (app.steps.length === 0) {
          $('#empty-flow').removeClass('hidden');
        }
        //backend
        /*if (typeof stepid !== 'undefined'){
          //delete at bd
          app.$http.delete('/manager/api/delete_step/'+stepid).then(response => {
            console.log('Delete step '+stepid);
          }, error => {
            if (error.status === 401) {
              window.location.replace('/auth/spark');
            }
          });
        }*/
      },

      deleteStepChoice: (step, index) => {
        let stepChoiceId = step.step_choices[index].id;
        app.stepChoicesToDelete.push(stepChoiceId);
        step.step_choices.splice(index, 1);
        //backend
        /*if (typeof step.id !== 'undefined') {
          app.$http.delete('/manager/api/delete_step_choice/' + step.id + '/' + stepChoiceId).then(response => {
            console.log('Delete step ' + stepid);
          }, error => {
            if (error.status === 401) {
              window.location.replace('/auth/spark');
            }
          });
        }*/
      },

      getFileId: (step) => {
        GDrive.selectFile(function (id, name) {
          if (id === 'wrong') {
            alert('The document ' + name + ' can not be shared due to incompatible document type.')
          }
          else {
            step.document_name = name;
            step.document_id = id;
          }
        })
      },

      getFolderId: (step) => {
        GDrive.selectFolder(function (id, name) {
          if (id === 'wrong') {
            alert('The document ' + name + ' can not be shared due to incompatible document type.')
          }
          else {
            step.upload_dir_name = name;
            step.upload_id = id;
          }
        })
      },

      saveSteps: saveSteps,

      startDraggingStepTypes: () => {
        console.log("Start dragging");
      },

      stopDraggingStepTypes: (x) => {
        console.log("Stop dragging");
      },

      searchUserToMeet: step => {
        step.peopleToMeet.searching = true;
        step.peopleToMeet.searchResultsInfo = '';
        step.peopleToMeet.searchResults = [];
        const searchString = encodeURIComponent(step.peopleToMeet.searchInput);
        console.log(this);
        app.$http.get('/manager/api/search_users/' + searchString).then(response => {
          step.peopleToMeet.searchResultsInfo = `Found ${response.body.length} result${response.body.length === 1 ? '' : 's' }.`;
          step.peopleToMeet.searchResults = response.body;
          step.peopleToMeet.searching = false;
        }, error => {
          if (error.status === 401) {
            window.location.replace('/auth/spark');
          }
        });
      },

      addPersonToPeopleToMeet: (person, list) => list.push(person),
      removePersonFromPeopleToMeet: (person, list) => list.splice(list.indexOf(person), 1),
      getPersonToAddButtonText: () => {
        return "fok";
      }
    },
    components: {
      draggable
    },
    mounted() {
      // WARNING: do not use ES6 arrow function (mounted: => {]) because it binds "this" to the parent context (the module instead of the Vue instance)
      this.stepTypeIcons[this.STEP_TYPES.ANNOUNCEMENT] = "announcement"; // Announcement
      this.stepTypeIcons[this.STEP_TYPES.FREE_TEXT] = "question"; // Question
      this.stepTypeIcons[this.STEP_TYPES.MULTIPLE_CHOICE] = "multiplechoice"; // Multiple Choice
      this.stepTypeIcons[this.STEP_TYPES.UPLOAD_TO_BOT] = "document"; // User upload Document
      this.stepTypeIcons[this.STEP_TYPES.DOWNLOAD_FROM_BOT] = "document"; // User read Document
      this.stepTypeIcons[this.STEP_TYPES.DOWNLOAD_FROM_BOT_AND_UPLOAD_BACK] = "document"; // User read and upload
      this.stepTypeIcons[this.STEP_TYPES.PEOPLE_TO_MEET] = ""; // People to meet // TODO: add the icon
    }
  });

  let addNewStep = (stepType, isModal) => {
    let stepTypeInt = parseInt(stepType);

    let step = {
      step_type_id: stepTypeInt,
      step_choices: [],
      document_id: null,
      upload_id: null,
      document_name: 'No Document Selected',
      upload_dir_name: 'No Folder Selected',
    };

    console.log(stepTypeInt);
    switch (stepTypeInt) {
      case app.STEP_TYPES.PEOPLE_TO_MEET:
        step.peopleToMeet = {
          list: [],
          searchInput: '',
          searching: false,
          searchResultsInfo: '',
          searchResults: [],
        };
        break;
    }

    app.steps.push(step);

    $('#empty-flow').addClass('hidden');
    $('#save-steps').removeClass('hidden');

    if (isModal) {
      // reset selected type, so the next time we open the modal the first one is selected
      app.newStepTypeSelected = 1;
      $('#myModal').modal('hide');
    }
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
          type_description: getStepTypeFromTypeId(step.step_type_id).description,
        };

        switch (step.step_type_id) {
          case app.STEP_TYPES.ANNOUNCEMENT:
            break;
          case app.STEP_TYPES.FREE_TEXT:
            break;
          case app.STEP_TYPES.MULTIPLE_CHOICE:
            curatedStep.step_choices = step.step_choices; // multiple choice questions
            break;
          case app.STEP_TYPES.UPLOAD_TO_BOT:
          case app.STEP_TYPES.DOWNLOAD_FROM_BOT:
          case app.STEP_TYPES.DOWNLOAD_FROM_BOT_AND_UPLOAD_BACK:
            curatedStep.document_id = getDocumentUrl(step);
            curatedStep.upload_id = getUploadDir(step);
            curatedStep.document_name = getDocumentName(step);
            curatedStep.upload_dir_name = getUploadDirName(step);
            break;
          case app.STEP_TYPES.PEOPLE_TO_MEET:
            curatedStep.peopleToMeet = {
              list: [],
              searchInput: '',
              searching: false,
              searchResultsInfo: '',
              searchResults: [],
            };
            break;
        }

        return curatedStep;
      });

      console.log('Steps:');
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

  function getDocumentUrl(step) {
    if (step.document_step !== null) {
      return step.document_step.document_url;
    }
    return null;
  }

  function getDocumentName(step) {
    if (step.document_step !== null) {
      const name = step.document_step.document_name;
      if (name === null)
        return "No Document Selected";
      return name;
      //return step.document_step.document_name;
    }
    return "No Document Selected";
  }

  function getUploadDir(step) {
    if (step.document_step !== null) {
      return step.document_step.upload_dir;
    }
    return null;
  }

  function getUploadDirName(step) {
    if (step.document_step !== null) {
      const name = step.document_step.upload_dir_name;
      if (name === null)
        return "No Folder Selected";
      return name;
      //return step.document_step.upload_dir_name;
    }
    return "No Folder Selected";
  }

  function saveSteps() {
    // TODO adapt to Vue
    let saveStepsButton = $('#save-steps');
    console.log('Clicked save steps');
    saveStepsButton.text("Saving…");

    console.log('Save Steps : ');
    console.log(app.steps);
    for (let i = 0; i < app.steps.length; i++)
      console.log(app.steps[i].id)

    let postData = {
      flowId: flowId,
      botId: app.selectedBot,
      steps: app.steps,
      title: app.title,
      stepsToDelete: app.stepsToDelete,
      stepChoicesToDelete: app.stepChoicesToDelete,
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
        app.stepsToDelete = [];
        app.stepChoicesToDelete = [];
        location.reload();
      }
    });
  }

  // Update tooltips
  $('[data-toggle="tooltip"]').tooltip();
});
