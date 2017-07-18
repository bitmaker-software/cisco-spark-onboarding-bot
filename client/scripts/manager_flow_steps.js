"use strict";

import draggable from 'vuedraggable';

$(function () {
    console.log("manager_flow_steps.js");

    let app = new Vue({
        el: '#root',
        // app initial state
        data: {
            steps: [],
            stepTypes: stepTypesArray,
            stepTypes2 : [],
            stepTypeIcons: {
                1: "announcement", // Announcement
                2: "question",  // Question
                3: "multiplechoice", // Multiple Choice
                4: "document", // User upload Document
                5: "document", // User read Document
                6: "document", // User read and upload
            },
            newStepTypeSelected: 1
        },
        methods: {
            addStepByDrop: () => {
                //verify step to add
                addNewStep(app.stepTypes2[0].id,false);

                //empty
                app.stepTypes2 = [];
            },
            addStep: stepType => addNewStep(stepType,true),
            deleteStep : (stepid,index) => {
              //frontend
              app.steps.splice(index,1);
              //change background
              if(app.steps.length == 0){
                $('#empty-flow').removeClass('hidden');
              }
              //backend
              if (typeof stepid !== 'undefined'){
                //delete at bd
                app.$http.delete('/manager/api/delete_step/'+stepid).then(response => {
                  console.log('Delete step '+stepid);
                }, error => {
                  if (error.status === 401) {
                    window.location.replace('/auth/spark');
                  }
                });
              }
            },
            deleteStepChoice : (step,index) => {
              //frontend
              let stepChoiceId = step.step_choices[index].id;
              step.step_choices.splice(index, 1);
              //backend
              if (typeof step.id !== 'undefined') {
                app.$http.delete('/manager/api/delete_step_choice/' + step.id + '/' + stepChoiceId).then(response => {
                  console.log('Delete step ' + stepid);
                }, error => {
                  if (error.status === 401) {
                    window.location.replace('/auth/spark');
                  }
                });
              }

            },
            getFileId: (step) => {
              GDrive.selectFile(function (id,name) {
                if(id === 'wrong'){
                  alert('The document '+name+' can not be shared due to incompatible document type.')
                }
                else{
                  step.document_name = name;
                  step.document_id = id;
                }
              })
            },
            getFolderId: (step) => {
              GDrive.selectFolder(function (id,name) {
                step.upload_dir_name = name;
                step.upload_id = id;
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
        }
    });

    let addNewStep = (stepType,isModal) => {
        let stepTypeInt = parseInt(stepType);

        app.steps.push({
            step_type_id: stepTypeInt,
            step_choices: [],
            document_id: null,
            upload_id: null,
            document_name: 'No Document Selected',
            upload_dir_name: 'No Folder Selected',
        });

        $('#empty-flow').addClass('hidden');
        $('#save-steps').removeClass('hidden');

        if(isModal){
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
            return {
                id: step.id,
                text: step.text,
                step_type_id: step.step_type_id,
                step_choices: step.step_choices, // multiple choice questions
                type_description: getStepTypeFromTypeId(step.step_type_id).description,
                document_id: getDocumentUrl(step),
                upload_id: getUploadDir(step),
                document_name: getDocumentName(step),
                upload_dir_name: getUploadDirName(step),
            }
          });

          console.log('Steps : ');
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

    function getDocumentUrl(step){
      if(step.document_step !== null){
        return step.document_step.document_url;
      }
      return null;
    }

    function getDocumentName(step){
        if(step.document_step !== null) {
            const name = step.document_step.document_name;
            if(name === null)
                return "No Document Selected";
            return name;
            //return step.document_step.document_name;
        }
        return "No Document Selected";
    }

    function getUploadDir(step){
      if(step.document_step !== null){
        return step.document_step.upload_dir;
      }
      return null;
    }

    function getUploadDirName(step){
        if(step.document_step !== null){
            const name = step.document_step.upload_dir_name;
            if(name === null)
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
        for(let i = 0; i < app.steps.length; i++)
            console.log(app.steps[i].id)

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
                location.reload();
            }
        });
    }

    // Update tooltips
    $('[data-toggle="tooltip"]').tooltip();
});
