"use strict";

const databaseServices = require('../database_services');
const sparkAPIUtils = require('../spark_api_utils');
const fs = require('fs');
const request = require('request');
const drive = require('../integrations/drive.js');

const STATUS_TYPES = require('../status_types');


module.exports = controller => {

  controller.hears(['start'], 'direct_message', function (bot, message) {

    // Is there an ongoing flow? Resume it.
    console.log(`Calling getOngoingFlowForUserEmail for user ${message.user}`);
    databaseServices.getOngoingFlowForUserEmail(message.user).then(respondentFlow => {
      console.log(`getOngoingFlowForUserEmail result flow_id:`);
      console.log(respondentFlow.flow_id);
      buildConversationFromCurrentFlow(bot, message, respondentFlow);
    }, error => {
      console.log(error);
      // No flow to resume, check for flows to be started
      // Get the oldest pending (not started) flow and start it
      console.log(`Calling getOldestPendingFlowForUserEmail for user ${message.user}`);
      databaseServices.getOldestPendingFlowForUserEmail(message.user).then(respondentFlow => {
        console.log(`getOldestPendingFlowForUserEmail result flow_id:`);
        console.log(respondentFlow.flow_id);
        buildConversationFromCurrentFlow(bot, message, respondentFlow);
      }, error => {
        console.log(error);
        bot.reply(message, 'No onboarding in progress.');
      });
    });
  });


  /*
   Retrieve the current flow from the datastore, and build the conversation accordingly
   */
  let buildConversationFromCurrentFlow = function (bot, message, respondentFlow) {
    console.log(`buildConversationFromCurrentFlow(bot=${bot}, message=${message}, flowId=${respondentFlow.flow_id})`);
    //get the flow from the database
    databaseServices.getFlow(respondentFlow.flow_id, respondentFlow.current_step_id).then(flow => {
      let thread = 'default';

      updateDownloadedDocs(flow).then(function (flow) {

        //create the conversation
        bot.createConversation(message, function (err, convo) {
          // console.log("createConversation callback. convo: ⏎");
          // console.log(convo);
          if (!err && convo) {
            flow.steps.forEach((step, index) => {
              const nextStep = flow.steps[index + 1]; // used to save the "current step" after the user answers
              console.log(`Step type ID: ${step.step_type_id}`);
              const stepArguments = {
                flow,
                bot,
                convo,
                step,
                nextStep,
                respondentFlow,
                thread
              };
              switch (step.step_type_id) {
                case STATUS_TYPES.STEP_TYPES.ANNOUNCEMENT:
                  addStepToConversation.announcement(stepArguments);
                  break;
                case STATUS_TYPES.STEP_TYPES.FREE_TEXT:
                  addStepToConversation.freeText(stepArguments);
                  break;
                case STATUS_TYPES.STEP_TYPES.MULTIPLE_CHOICE:
                  addStepToConversation.multipleChoice(stepArguments);
                  break;
                case STATUS_TYPES.STEP_TYPES.UPLOAD_TO_BOT:
                  addStepToConversation.uploadDocumentToTheBot(stepArguments);
                  break;
                case STATUS_TYPES.STEP_TYPES.DOWNLOAD_FROM_BOT:
                  addStepToConversation.downloadDocumentFromTheBot(stepArguments);
                  break;
                case STATUS_TYPES.STEP_TYPES.DOWNLOAD_FROM_BOT_AND_UPLOAD_BACK:
                  addStepToConversation.downloadDocumentFromTheBotAndUploadItBack(stepArguments);
                  break;
                case STATUS_TYPES.STEP_TYPES.PEOPLE_TO_MEET:
                  addStepToConversation.peopleToMeet(stepArguments);
                  break;
                default:
                  break;
              }
            });

            addEndConversationHandler(bot, convo, respondentFlow);

            console.log('Activating the conversation');
            convo.activate();

            databaseServices.setRespondentFlowStarted(respondentFlow);

            // TODO: when/where to update current step id on the respondent flow?

          } else {
            console.log('Error creating the conversation');
            console.log(err);
          }
        });

      }); //END FUNCTION

    }, err => {
      console.error("Error fetching the flow:");
      console.error(err);
    });
  };

  function addEndConversationHandler(bot, convo, respondentFlow) {
    convo.on('end', function (convo) {
      if (convo.status === 'completed') {
        databaseServices.setRespondentFlowFinished(respondentFlow);
        bot.reply(convo.source_message, "Thank you so much for your time! Have a nice day!");
      } else {
        bot.reply(convo.source_message, "Sorry, something went wrong. Please contact your HR department for more information.");
      }
    });
  }

  const addStepToConversation = {

    announcement(stepArguments) {
      let {
        flow,
        bot,
        convo,
        step,
        nextStep,
        respondentFlow,
        thread
      } = stepArguments;

      console.log("Adding announcement step: " + step.text);
      let text = step.text + '\n\n*(Please type* **ok** *to continue.)*';

      // const fs = require('fs');
      // const filePath = './bot/files_to_serve/test_file.txt';
      // bot.say({channel: convo.source_message.channel, text: text, files: [fs.createReadStream(filePath)]}); // OK
      // convo.say({text: text}); // OK
      // convo.say({text: text, files: ['http://pre10.deviantart.net/3354/th/pre/i/2012/175/9/6/af_monogrammatic_type____logos_for_sale_by_aeldesign-d54ngvf.png']});
      // convo.say({text: text, files: [fs.createReadStream(filePath)]}); // TypeError: First argument must be a string or Buffer
      // convo.addQuestion({text: text, files: ['http://pre10.deviantart.net/3354/th/pre/i/2012/175/9/6/af_monogrammatic_type____logos_for_sale_by_aeldesign-d54ngvf.png']}, [ // OK
      // convo.addQuestion({text: text, files: [fs.createReadStream(filePath)]}, [ // NOT OK
      convo.addQuestion(text, [ // OK
        {
          "pattern": "^ok$",
          "callback": function (response, convo) {
            console.log("OK");
            //save response
            databaseServices.saveAnnouncementAnswer(respondentFlow, step, nextStep);
            //go to next
            convo.next();
          }
        },
        {
          "default": true,
          "callback": function (response, convo) {
            console.log("NOT OK");
            //repeat the question
            //convo.say("Please type ok to continue");
            bot.reply(convo.source_message, "Sorry, I didn't get that. Please type **ok** to continue");
            //convo.repeat();
            //convo.silentRepeat();
            //convo.next();
          }
        }
      ], {}, thread);
    },


    freeText(stepArguments) {
      console.log('OK?');
      let {
        flow,
        bot,
        convo,
        step,
        nextStep,
        respondentFlow,
        thread
      } = stepArguments;

      console.log("Adding free text step: " + step.text);
      let text = step.text + "\n\n*(You can write as many lines as you want. Please type* **@end** *in a single line when you're done)*";

      convo.addQuestion(text, [{
        "pattern": "^@end$",
        "callback": function (response, convo) {
          let answer = convo.extractResponse(step.id);
          //remove the terminator
          answer = answer.replace("@end", "");
          console.log("Answer: " + answer);
          databaseServices.saveTextAnswer(respondentFlow, step, nextStep, answer);
          //save response
          //go to next
          convo.next();
        }
      },
        {
          "default": true,
          "callback": function (response, convo) {
            //do nothing, wait for @end and collect all lines
          }
        }
      ], {
        "key": step.id,
        "multiple": true
      }, thread);
    },

    multipleChoice(stepArguments) {
      let {
        flow,
        bot,
        convo,
        step,
        nextStep,
        respondentFlow,
        thread
      } = stepArguments;

      console.log("Adding multiple choice step: " + step.text);
      let text = step.text + '\n\n';

      let patternsAndCallbacks = [];
      if (!step.step_choices) {
        console.error("The multiple choice step has no choices!");
      } else {
        step.step_choices.forEach(function (choice) {
          console.log(choice.choice_order);
          console.log(choice.text);

          text += choice.choice_order + '. ' + choice.text + '\n\n';

          patternsAndCallbacks.push({
            "pattern": "^" + choice.choice_order + "$",
            "callback": function (response, convo) {
              // TODO: check the option is valid! repeat the question if not
              //save response
              databaseServices.saveMultipleChoiceAnswer(respondentFlow, step, nextStep, choice.id);
              //go to next
              convo.next();
            }
          });

        });
      }

      //add the default option
      patternsAndCallbacks.push({
        "default": true,
        "callback": function (response, convo) {
          //repeat the question
          bot.reply(convo.source_message, "Sorry, that's not an option. Please choose one of the available options.");
          //convo.repeat();
          //convo.next();
        }
      });
      text += '*(Please choose one of the available options)*';
      convo.addQuestion(text, patternsAndCallbacks, {}, thread);
    },

    uploadDocumentToTheBot(stepArguments) {
      let {
        flow,
        bot,
        convo,
        step,
        nextStep,
        respondentFlow,
        thread
      } = stepArguments;

      console.log("Adding upload document step: " + step.text);
      //mudar para verificar que ja fez upload
      const text = step.text + '\n\n*(Upload the file to continue)*';

      convo.addQuestion(text, [{
        "default": true,
        "callback": function (response, convo) {
          if (response.original_message.files) {
            console.log("OK");
            //save answer
            bot.retrieveFileInfo(response.original_message.files[0], function (err, file_info) {
              request({
                url: response.original_message.files[0],
                headers: {
                  'Authorization': 'Bearer ' + process.env.access_token
                },
                encoding: null,
              }, function (err, response, body) {
                if (step.document_step !== null) {
                  if (step.document_step.upload_dir !== null) {
                    drive.uploadToDrive(step.document_step.document_store_id, file_info, body, step.document_step.upload_dir, function (file) {
                      databaseServices.saveDocumentUploadAnswer(respondentFlow, step, nextStep, file.id, file.webContentLink);
                    });
                  } else {
                    console.error('Document step\'s upload dir is null, won\'t save the document');
                  }
                } else {
                  console.error('Document step is null, won\'t save the document');
                }
              });
            });
            //go to next
            convo.next();
          } else {
            console.log("NOT OK");
            //repeat the question
            //convo.say("Please type ok to continue");
            bot.reply(convo.source_message, "Sorry, I didn't get that. Please upload the file to continue.");
            //convo.repeat();
            //convo.silentRepeat();
            //convo.next();
          }
        }
      }], {}, thread);
    },

    downloadDocumentFromTheBot(stepArguments) {
      let {
        flow,
        bot,
        convo,
        step,
        nextStep,
        respondentFlow,
        thread
      } = stepArguments;

      console.log("Adding read document step: " + step.text);
      const text = step.text + '\n\n*(Please type* **ok** *to receive the file)*';

      if (step.document_step === null) {
        console.error("The read document step has no document!");
      } else {
        //let filePath = './bot/files_to_serve/test_file.txt';
        //fs.exists(filePath, function (exists) {
        //if (exists) {
        //let readStream = fs.createReadStream(filePath);
        // bot.reply(convo.source_message, {text: 'I made this file for you.', files: [readStream]});
        // bot.reply(convo.source_message, {text: 'I made this file for you.', files: [step.stream]});
        // convo.say({text: 'I made this file for you.', files: [readStream]}); // IF BEFORE addQuestion: First argument must be a string or Buffer
        // convo.next();
        //convo.addMessage({files: [step.stream]}, thread);
        // }
        //});

        convo.addQuestion({
          text: text,
          // files: [step.stream] // does not work with private files
          // files: [fs.createReadStream(filePath)] // TypeError: source.on is not a function
        }, [{
          "pattern": "^ok$",
          "callback": function (response, convo) {
            // go to next
            bot.reply(convo.source_message, {
              text: 'I made this file for you.',
              files: [step.stream]
            });
            convo.next();
          }
        },
          {
            "default": true,
            "callback": function (response, convo) {
              console.log("NOT OK");
              //repeat the question
              //convo.say("Please type ok to continue");
              bot.reply(convo.source_message, "Sorry, I didn't get that. Please type **ok** to continue");
              //convo.repeat();
              // convo.silentRepeat();
              // convo.next();
            }
          }
        ], {}, thread);

        convo.addQuestion({
          text: '*(Type* **ok** *after reading the document)*',
          // files: [step.stream] // does not work with private files
          // files: [fs.createReadStream(filePath)] // TypeError: source.on is not a function
        }, [{
          "pattern": "^ok$",
          "callback": function (response, convo) {
            databaseServices.saveDocumentDownloadAnswer(respondentFlow, step, nextStep);
            // go to next
            convo.next();
          }
        },
          {
            "default": true,
            "callback": function (response, convo) {
              console.log("NOT OK");
              //repeat the question
              bot.reply(convo.source_message, "Sorry, I didn't get that. Please type **ok** to continue.");
            }
          }
        ], {}, thread);

        /*} else {
         console.log('The file does not exist! Not adding the step.');
         // convo.next();
         }
         });*/
      }
    },

    downloadDocumentFromTheBotAndUploadItBack(stepArguments) {
      let {
        flow,
        bot,
        convo,
        step,
        nextStep,
        respondentFlow,
        thread
      } = stepArguments;

      console.log("Adding read and upload document step: " + step.text);
      //verificar que fez upload
      let text = step.text + '\n\n*(Upload the file to continue)*';

      if (step.document_step === null) {
        console.error("The read document step has no document!");
      } else {

        convo.addQuestion({
          text: text,
          //files: [step.stream]
        }, [{
          "default": true,
          "callback": function (response, convo) {
            if (response.original_message.files) {
              console.log("OK");
              //save answer
              bot.retrieveFileInfo(response.original_message.files[0], function (err, file_info) {
                request({
                  url: response.original_message.files[0],
                  headers: {
                    'Authorization': 'Bearer ' + process.env.access_token
                  },
                  encoding: null,
                }, function (err, response, body) {
                  if (step.document_step !== null) {
                    if (step.document_step.upload_dir !== null) {
                      drive.uploadToDrive(step.document_step.document_store_id, file_info, body, step.document_step.upload_dir, function (file) {
                        databaseServices.saveDocumentUploadAnswer(respondentFlow, step, nextStep, file.id, file.webContentLink);
                      });
                    } else {
                      console.error('Document step\'s upload dir is null, won\'t save the document');
                    }
                  } else {
                    console.error('Document step is null, won\'t save the document');
                  }
                });
              });
              //go to next
              convo.next();
            } else {
              console.log("NOT OK");
              //repeat the question
              //convo.say("Please type ok to continue");
              bot.reply(convo.source_message, "Sorry, I didn't get that. Please upload the file to continue.");
              //convo.repeat();
              //convo.silentRepeat();
              //convo.next();
            }
          }
        }], {}, thread);
      }
    },

    peopleToMeet(stepArguments) {
      let {
        flow,
        bot,
        convo,
        step,
        nextStep,
        respondentFlow,
        thread
      } = stepArguments;

      console.log(`Adding "people to meet" step: ${step.text}`);

      console.log(step.people_to_meet);
      let peopleText = '';
      const lastPersonIndex = respondentFlow.people_to_meet.length - 1; // TODO: fix this
      const penultimatePersonIndex = respondentFlow.people_to_meet.length - 2; // TODO: fix this
      let peopleToMeetInThisStep = [{email: convo.context.user}]; // start with the user itself and then add the others
      respondentFlow.people_to_meet.forEach((person, index) => {
        if (person.step_id === step.id) {
          peopleToMeetInThisStep.push(person);
          peopleText += person.display_name;
          if (index === penultimatePersonIndex) {
            peopleText += ' and '
          } else if (index !== lastPersonIndex) {
            peopleText += ', '
          }
          console.log(`Should meet ${person.display_name} (${person.email})`);
        }
      });

      convo.addQuestion({
        text: `${step.text}.\n\n You should now meet with ${peopleText} in a new chat room. Type **ok** so I can create the room for you.`,
      }, [{
        "pattern": "^ok$",
        "callback": function (response, convo) {

          // Create a room (using the bot access token)
          let bearer = bot.botkit.config.ciscospark_access_token;
          console.log(bot);
          console.log(`Bearer: ${bearer}`);
          console.log(`Room name: ${step.text}`);
          sparkAPIUtils.createRoom({name: step.text}, bearer).then(roomId => {
            console.log(`Got room ID ${roomId}`);

            bot.say({
              channel: roomId,
              text: `This is a room that I created from the onboarding flow "${flow.name}", step "${step.text}", so you can know each other.`
            });

            console.log(`People to add:`);
            console.log(peopleToMeetInThisStep);
            sparkAPIUtils.addPeopleToRoom({roomId: roomId, people: peopleToMeetInThisStep}, bearer).then(response => {
              console.log(`Added people to the room.`);
            }, error => {
              console.log(`Error adding people to the room. ${error}`);
            });
          }, error => {
            console.log(`Error creating the room: ${error}`);
          });

          databaseServices.savePeopleToMeetAnswer(respondentFlow, step, nextStep);
          // go to next
          convo.next();
        }
      },
        {
          "default": true,
          "callback": function (response, convo) {
            console.log("NOT OK");
            //repeat the question
            bot.reply(convo.source_message, "Sorry, I didn't get that. Please type **ok** to continue.");
          }
        }
      ], {}, thread);
    },
  };

  // function uploadToDrive(file_info, file, folderId, callback) {

  //   const timeStamp = Math.floor(Date.now() / 1000);
  //   const name = timeStamp + file_info.filename.replace(/[\/\\]/g, '_');

  //   const fileMetadata = {
  //     'name': name,
  //     'parents': [folderId],
  //     'mimeType': file_info['content-type'],
  //   };

  //   const media = {
  //     'mimeType': file_info['content-type'],
  //     'body': file
  //   };

  //   drive.files.create({
  //     resource: fileMetadata,
  //     media: media,
  //     fields: 'id',
  //   }, function(err, file) {
  //     if (err) {
  //       console.log("Error uploading file :");
  //       console.log(err);
  //     } else {
  //       callback(file);
  //     }
  //   });
  // }

  //
  // Downloads all documents the user needs for a local folder
  //
  function updateDownloadedDocs(flow) {
    return new Promise(function (resolve, reject) {
      console.log('updateDownloadedDocs()');
      let stepsMax = flow.steps.length - 1;

      flow.steps.forEach((step, index) => {
        //read documents
        console.log(index + " in " + stepsMax);
        if (step.step_type_id === STATUS_TYPES.STEP_TYPES.DOWNLOAD_FROM_BOT || step.step_type_id === STATUS_TYPES.STEP_TYPES.DOWNLOAD_FROM_BOT_AND_UPLOAD_BACK) {
          // console.log(`Step ${step.id} is a download (or download+upload) document step`);
          if (step.document_step !== null) {
            const documentUrl = step.document_step.document_url;
            if (documentUrl !== null) {
              console.log(`Reading document (URL = ${documentUrl})`);
              drive.getDriveDocument(step.document_step.document_store_id, documentUrl, stream => {
                step.stream = stream;
                if (index === stepsMax) {
                  console.log('Finished reading documents');
                  resolve(flow);
                }
              });
            } else {
              console.log('Null URL, skipping.');
              step.stream = null;
            }
          } else {
            console.log('Null document_step, skipping.');
          }
        }

        if (index === stepsMax) {
          console.log('Finished reading documents');
          resolve(flow);
        }
      });
    });
  }
};