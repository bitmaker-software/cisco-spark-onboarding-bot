"use strict";

import draggable from 'vuedraggable';

$(function() {
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
      saveStepsButtonText: "Save Flow",
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
        GDrive.selectFile(function(id, name, document_store_id) {
          if (id === 'wrong') {
            alert('The document ' + name + ' can not be shared due to incompatible document type.')
          } else {
            step.document_name = name;
            step.document_id = id;
            step.document_store_id = document_store_id;
          }
        })
      },

      getFolderId: (step) => {
        GDrive.selectFolder(function(id, name, document_store_id) {
          if (id === 'wrong') {
            alert('The document ' + name + ' can not be shared due to incompatible document type.')
          } else {
            step.upload_dir_name = name;
            step.upload_id = id;
            step.document_store_id = document_store_id;
          }
        })
      },

      getBoxFileId: (step) => {
        Box.selectFile(function(id, name, document_store_id) {
          if (id === 'wrong') {
            alert('The document ' + name + ' can not be shared due to incompatible document type.')
          } else {
            step.document_name = name;
            step.document_id = id;
            step.document_store_id = document_store_id;
          }
        })
      },

      getBoxFolderId: (step) => {
        Box.selectFolder(function(id, name, document_store_id) {
          if (id === 'wrong') {
            alert('The document ' + name + ' can not be shared due to incompatible document type.')
          } else {
            step.upload_dir_name = name;
            step.upload_id = id;
            step.document_store_id = document_store_id;
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
    },
    components: {
      draggable
    },
    mounted() {
      // WARNING: do not use ES6 arrow function (mounted: => {]) because it binds "this" to the parent context (the module instead of the Vue instance)
      this.stepTypeIcons[this.STEP_TYPES.ANNOUNCEMENT] = "announcement"; // Announcement
      this.stepTypeIcons[this.STEP_TYPES.FREE_TEXT] = "question"; // Question
      this.stepTypeIcons[this.STEP_TYPES.MULTIPLE_CHOICE] = "multiplechoice"; // Multiple Choice
      this.stepTypeIcons[this.STEP_TYPES.UPLOAD_TO_BOT] = "upload"; // User upload Document
      this.stepTypeIcons[this.STEP_TYPES.DOWNLOAD_FROM_BOT] = "document"; // User read Document
      this.stepTypeIcons[this.STEP_TYPES.DOWNLOAD_FROM_BOT_AND_UPLOAD_BACK] = "readupload"; // User read and upload
      this.stepTypeIcons[this.STEP_TYPES.PEOPLE_TO_MEET] = "people"; // People to meet // TODO: add the icon
    }
  });

  let addNewStep = (stepType, isModal) => {
    let stepTypeInt = parseInt(stepType);

    let curatedStep = {
      // id: ---, // no ID for a new step
      text: '',
      step_type_id: stepTypeInt,
      // type_description: getStepTypeFromTypeId(step.step_type_id).description, // TODO: is this needed?
    };

    switch (stepTypeInt) {
      case app.STEP_TYPES.ANNOUNCEMENT:
        break;
      case app.STEP_TYPES.FREE_TEXT:
        break;
      case app.STEP_TYPES.MULTIPLE_CHOICE:
        curatedStep.step_choices = []; // multiple choice questions
        break;
      case app.STEP_TYPES.UPLOAD_TO_BOT:
      case app.STEP_TYPES.DOWNLOAD_FROM_BOT:
      case app.STEP_TYPES.DOWNLOAD_FROM_BOT_AND_UPLOAD_BACK:
        curatedStep.document_id = null;
        curatedStep.upload_id = null;
        curatedStep.document_name = 'No Document Selected';
        curatedStep.upload_dir_name = 'No Folder Selected';
        break;
      case app.STEP_TYPES.PEOPLE_TO_MEET:
        break;
    }

    app.steps.push(curatedStep);

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
    $.get('/manager/api/flow/' + flowId, {}, function(flow) {
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
            break;
        }

        return curatedStep;
      });

      console.log('Steps:');
      console.log(app.steps);
    });
  }

  fetchSteps();

  function getStepTypeFromTypeId(typeId) {
    if (stepTypesObj[typeId]) {
      return stepTypesObj[typeId];
    }
    return { description: "Unknown step type" };
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
    app.saveStepsButtonText = "Saving…";

    app.$http.put('/manager/api/flow', {
      flowId: flowId,
      botId: app.selectedBot,
      steps: app.steps,
      title: app.title,
      stepsToDelete: app.stepsToDelete,
      stepChoicesToDelete: app.stepChoicesToDelete,
    }).then(response => {
      // success callback
      swal({
        title: 'Saved',
        type: 'success'
      }).then(() => {
        // when clicking OK / closing the message:
        location.reload(); // TODO: is this needed?
      });

      console.log("Request to save flow complete");
      app.stepsToDelete = [];
      app.stepChoicesToDelete = [];

    }, error => {
      // error callback
      swal({
        title: 'Oops...',
        text: error.body,
        type: 'error'
      });
    }).finally(() => {
      app.saveStepsButtonText = "Save Flow";
    });
  }

  // Update tooltips
  $('[data-toggle="tooltip"]').tooltip();
});