"use strict";

const databaseServices = require('../database_services');
const fs = require('fs');
const request = require('request');

const STATUS_TYPES = require('../status_types');

//GDRIVE CONF

//require google apis
const google = require('googleapis');

//this is the json file with the private key
const key = require('../keys/Integration test-6661fdb0c0a7.json');

// create an access token for read only access
let jwtClient = new google.auth.JWT(
  key.client_email,
  null,
  key.private_key,
  ['https://www.googleapis.com/auth/drive'], //.readonly
  null
);

let drive = google.drive({
  version: 'v3',
  auth: jwtClient
});

//authorize a request
jwtClient.authorize(function (err, tokens) {
  if (err) {
    console.log(err);
    return;
  }

  // Make an authorized request to list Drive files.
  drive.files.list({
    folderId: '0B-65Xatz4HOrc25Gc2lrY2lPZW8',
    auth: jwtClient
  }, function (err, response) {
    if (err) {
      console.log('The API returned an error: ' + err);
      return;
    }
    let files = response.files;
    if (files.length === 0) {
      console.log('No files found.');
    } else {
      console.log('Files : \n');
      for (let i = 0; i < files.length; i++) {
        let file = files[i];
        console.log('%s (%s)', file.name, file.id);
/*
         //delete files
         drive.files.delete({
         fileId: file.id
         }, function (err, response) {
         if (err) {
         console.log('delete error: ' + err);
         return;
         }
         console.log("deleted "+file.id);
         });
*/
      }
    }
  });

  console.log("\n");
});

//google drive
function getDriveDocument(fileId, callback) {
  drive.files.get({
    'fileId': fileId,
    'fields': "id,mimeType,name"
  }, function (err, file) {
    console.log(file);
    let mimetype = file.mimeType;
    let parts = file.mimeType.split('google-apps');

    //google files => export
    if (parts.length > 1) {
      console.log(parts[1]);

      let mimetype;
      let extension;
      if (parts[1] === '.document') {
        mimetype = 'application/vnd.oasis.opendocument.text';
        extension = '.odt';
      }
      else if (parts[1] === '.spreadsheet') {
        mimetype = 'application/x-vnd.oasis.opendocument.spreadsheet';
        extension = '.ods';
      }
      else if (parts[1] === '.drawing') {
        mimetype = 'image/png';
        extension = '.png';
      }
      else if (parts[1] === '.presentation') {
        mimetype = 'application/vnd.oasis.opendocument.presentation';
        extension = '.odp';
      }
      else {
        mimetype = 'application/pdf';
        extension = '.pdf';
      }

      let filePath = "./bot/files_to_serve/" + file.name + extension;
      let dest = fs.createWriteStream(filePath);

      dest.on('open', function (fd) {
        drive.files.export({
          fileId: file.id,
          mimeType: mimetype
        }).on('end', function () {
          console.log('Done');
          callback(fs.createReadStream(filePath));
        }).on('error', function (err) {
          console.log('Error during download', err);
        }).pipe(dest);
      });
    }
    //download
    else {
      let filePath = "./bot/files_to_serve/" + file.name;
      let dest = fs.createWriteStream(filePath);

      dest.on('open', function (fd) {
        drive.files.get({
          fileId: fileId,
          alt: 'media'
        }).on('end', function () {
          console.log('Download Done');
          callback(fs.createReadStream(filePath));
        }).on('error', function (err) {
          console.log('Error during download', err);
        }).pipe(dest);
      });
    }
  });
}


module.exports = function (controller) {

  // const selfMessageInitializationOfFlow = 'Initialization of flow ';
  // controller.on('self_message', function (bot, message) {
  //   console.log(`Self message: ⏎`);
  //   console.log(message);
  //   if (message.text.startsWith(selfMessageInitializationOfFlow)) {
  //     console.log(`Got message starting with "${selfMessageInitializationOfFlow}"`);
  //     let flowId = message.text.replace(selfMessageInitializationOfFlow, '');
  //// if we pass this message we'll enter into a loop (because the message source user is the bot)
  //// buildConversationFromCurrentFlow(bot, message, flowId); // LOOP!
  // buildConversationFromCurrentFlow(bot, {channel: message.channel}, flowId); // Not working, user is undefined
  // }
  // });

  controller.hears(['start'], 'direct_message', function (bot, message) {

    // Is there an ongoing flow? Resume it.
    databaseServices.getOngoingFlowForUserEmail(message.user).then(respondentFlow => {
      console.log(`getOldestPendingFlowForUserEmail ${message.user}`);
      console.log(respondentFlow.flow_id);
      buildConversationFromCurrentFlow(bot, message, respondentFlow);
    }, error => {
      console.log(error);
      // No flow to resume, check for flows to be started
      // Get the oldest pending (not started) flow and start it
      databaseServices.getOldestPendingFlowForUserEmail(message.user).then(respondentFlow => {
        console.log(`getOldestPendingFlowForUserEmail ${message.user}`);
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
      let {bot, convo, step, nextStep, respondentFlow, thread} = stepArguments;

      console.log("Adding announcement step: " + step.text);
      let text = step.text + '\n\nPlease type ok to continue.';

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
            bot.reply(convo.source_message, "Sorry, I didn't get that. Please type ok to continue");
            //convo.repeat();
            //convo.silentRepeat();
            //convo.next();
          }
        }
      ], {}, thread);
    },


    freeText(stepArguments) {
      console.log('OK?');
      let {bot, convo, step, nextStep, respondentFlow, thread} = stepArguments;

      console.log("Adding free text step: " + step.text);
      let text = step.text + "\n\nYou can write as many lines as you want.\n\nPlease type @end in a single line when you're done!";

      convo.addQuestion(text, [
        {
          "pattern": "^@end$",
          "callback": function (response, convo) {
            //console.log(convo.extractResponse(step.step_id));
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
      ], {"key": step.id, "multiple": true}, thread);
    },

    multipleChoice(stepArguments) {
      let {bot, convo, step, nextStep, respondentFlow, thread} = stepArguments;

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
      text += 'Please choose one of the available options.';
      convo.addQuestion(text, patternsAndCallbacks, {}, thread);
    },

    uploadDocumentToTheBot(stepArguments) {
      let {bot, convo, step, nextStep, respondentFlow, thread} = stepArguments;

      console.log("Adding upload document step: " + step.text);
      //mudar para verificar que ja fez upload
      const text = step.text + '\n\nUpload the file to continue.';

      convo.addQuestion(text, [
        {
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
                      uploadToDrive(file_info, body, step.document_step.upload_dir, function (fileId) {
                        databaseServices.saveDocumentUploadAnswer(respondentFlow, step, nextStep, fileId);
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
            }
            else {
              console.log("NOT OK");
              //repeat the question
              //convo.say("Please type ok to continue");
              bot.reply(convo.source_message, "Sorry, I didn't get that. Please upload the file to continue.");
              //convo.repeat();
              //convo.silentRepeat();
              //convo.next();
            }
          }
        }
      ], {}, thread);
    },

    downloadDocumentFromTheBot(stepArguments) {
      let {bot, convo, step, nextStep, respondentFlow, thread} = stepArguments;

      console.log("Adding read document step: " + step.text);
      const text = step.text + '\n\nPlease type ok to receive the file.';

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
        }, [
          {
            "pattern": "^ok$",
            "callback": function (response, convo) {
              // go to next
              bot.reply(convo.source_message, {text: 'I made this file for you.', files: [step.stream]});
              convo.next();
            }
          },
          {
            "default": true,
            "callback": function (response, convo) {
              console.log("NOT OK");
              //repeat the question
              //convo.say("Please type ok to continue");
              bot.reply(convo.source_message, "Sorry, I didn't get that. Please type ok to continue");
              //convo.repeat();
              // convo.silentRepeat();
              // convo.next();
            }
          }
        ], {}, thread);

        convo.addQuestion({
          text: 'Type ok after reading the document',
          // files: [step.stream] // does not work with private files
          // files: [fs.createReadStream(filePath)] // TypeError: source.on is not a function
        }, [
          {
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
              bot.reply(convo.source_message, "Sorry, I didn't get that. Please type ok to continue");
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
      let {bot, convo, step, nextStep, respondentFlow, thread} = stepArguments;

      console.log("Adding read and upload document step: " + step.text);
      //verificar que fez upload
      let text = step.text + '\n\nUpload the file to continue.';

      if (step.document_step === null) {
        console.error("The read document step has no document!");
      }
      else {

        convo.addQuestion(
          {
            text: text,
            //files: [step.stream]
          },
          [
            {
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
                          uploadToDrive(file_info, body, step.document_step.upload_dir, function (fileId) {
                            databaseServices.saveDocumentUploadAnswer(respondentFlow, step, nextStep, fileId);
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
                }
                else {
                  console.log("NOT OK");
                  //repeat the question
                  //convo.say("Please type ok to continue");
                  bot.reply(convo.source_message, "Sorry, I didn't get that. Please upload the file to continue.");
                  //convo.repeat();
                  //convo.silentRepeat();
                  //convo.next();
                }
              }
            }
          ], {}, thread);
      }
    }
  };

  function uploadToDrive(file_info, file, folderId, callback) {

    const timeStamp = Math.floor(Date.now() / 1000);
    const name = timeStamp + file_info.filename;

    const fileMetadata = {
      'name': name,
      'parents': [folderId],
      'mimeType': file_info['content-type'],
    };

    const media = {
      'mimeType': file_info['content-type'],
      'body': file
    };

    drive.files.create({
      resource: fileMetadata,
      media: media,
      //uploadType: 'media',
    }, function (err, file) {
      if (err) {
        console.log("Error uploading file :");
        console.log(err);
      } else {
        //isto
        callback(name);
      }
    });
  }

  //faz download dos documentos que o utilizador precisa de ler para um ficheiro local
  function updateDownloadedDocs(flow) {
    return new Promise(function (resolve, reject) {
      console.log('updateDownloadedDocs()');
      let stepsMax = flow.steps.length - 1;

      flow.steps.forEach((step, index) => {
        //read documents
        console.log(index+ " in "+stepsMax);
        if (step.step_type_id === STATUS_TYPES.STEP_TYPES.DOWNLOAD_FROM_BOT || step.step_type_id === STATUS_TYPES.STEP_TYPES.DOWNLOAD_FROM_BOT_AND_UPLOAD_BACK) {
          // console.log(`Step ${step.id} is a download (or download+upload) document step`);
          if (step.document_step !== null) {
            const documentUrl = step.document_step.document_url;
            if (documentUrl !== null) {
              console.log(`Reading document (URL = ${documentUrl})`);
              getDriveDocument(documentUrl, stream => {
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
