"use strict";

const databaseServices = require('../database_services');
const drive = require('../bot');

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


  /*
   Retrieve the current flow from the datastore, and build the conversation accordingly
   */
  let buildConversationFromCurrentFlow = function (bot, message, respondentFlow) {
    console.log(`buildConversationFromCurrentFlow(bot=${bot}, message=${message}, flowId=${respondentFlow.flow_id})`);
    //get the flow from the database
    getFlow(respondentFlow.flow_id).then(flow => {
      let thread = 'default';
      console.log(flow);
      //create the conversation
      bot.createConversation(message, function (err, convo) {
        // console.log("createConversation callback. convo: ⏎");
        // console.log(convo);
        if (!err && convo) {
          flow.steps.forEach(function (step) {
            console.log("STEP TYPE ID: ");
            console.log(step.step_type_id);
            switch (step.step_type_id) {
              // case "announcement":
              case 1:
                addAnnouncementStep(bot, convo, step, respondentFlow.id, thread);
                break;
              // case "free_text":
              case 2:
                addFreeTextStep(bot, convo, step, respondentFlow.id, thread);
                break;
              // case "multiple_choice":
              case 3:
                addMultipleChoiceStep(bot, convo, step, flow.respondent_flow_id, thread);
                break;
              //case "upload document" step
              case 4:
                addUploadDocumentStep(bot, convo, step, flow.respondent_flow_id, thread);
                break;
              //case "read document" step
              case 5:
                addReadDocumentStep(bot, convo, step, flow.respondent_flow_id, thread);
                break;
              //case "read and upload document" step
              case 6:
                addReadUploadDocumentStep(bot, convo, step, flow.respondent_flow_id, thread);
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

  function addAnnouncementStep(bot, convo, step, respondent_flow_id, thread) {
    console.log("Adding announcement step: " + step.text);
    let text = step.text + '\n\nPlease type ok to continue.';

    // var fs = require('fs');
    // var filePath = './bot/files_to_serve/test_file.txt';
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
  }

  function addFreeTextStep(bot, convo, step, respondent_flow_id, thread) {
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
          saveTextAnswer(bot, step, respondent_flow_id, answer);
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
  }

  function addMultipleChoiceStep(bot, convo, step, respondent_flow_id, thread) {
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
            saveMultipleChoiceAnswer(bot, step, respondent_flow_id, choice.id);
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
  }

  function addUploadDocumentStep(bot, convo, step, respondent_flow_id, thread) {
    console.log("Adding upload document step: " + step.text);
    //mudar para verificar que ja fez upload
    let text = step.text + '\n\nUpload the file to continue.';

    convo.addQuestion(text, [
      {
        "default": true,
        "callback": function (response, convo) {

          if (response.original_message.files) {
            console.log("OK");
            //save response
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

  function addReadDocumentStep(bot, convo, step, respondent_flow_id, thread) {
    console.log("Adding read document step: " + step.text);
    let text = step.text + '\n\nPlease type ok to continue.';

    let documents = [];

    if (!step.document_steps)
    {
      console.error("The read document step has no document!");
    }
    else
    {
      step.document_steps.forEach(function (doc) {
        //TODO INES: funcao que vai buscar a drive um url?
        var url = drive.getDriveDocument(doc);
        documents.push(url);
        documents.push('https://github.com/howdyai/botkit/blob/master/docs/readme-ciscospark.md#attaching-files');
      });
    }

    convo.addQuestion(
      {
        text: text,
        files: documents
      },[
      {
        "pattern": "^ok$",
        "callback": function (response, convo) {
          console.log("OK");
          //save response
          // go to next
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
  }

  function addReadUploadDocumentStep(bot, convo, step, respondent_flow_id, thread) {
    console.log("Adding read and upload document step: " + step.text);
    //verificar que fez upload
    let text = step.text + '\n\nUpload the file to continue.';

    convo.addQuestion(
      {
        text: text,
        files: ['https://github.com/howdyai/botkit/blob/master/docs/readme-ciscospark.md#attaching-files']
      },
      [
        {
          "default": true,
          "callback": function (response, convo) {
            if (response.original_message.files) {
              console.log("OK");
              //save response
              //TODO INES
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

  /*
   save an answer to the database
   */
  function saveTextAnswer(bot, step, respondent_flow_id, text) {
    //insert into RespondentAnswers(respondent_flow_id, step_id, text, status, answer_date) values(respondent_flow_id, step.step_id, text, 'answered', new Date());
    console.log('saving text answer to database');
    console.log("insert into RespondentAnswers(respondent_flow_id, step_id, text, status, answer_date) values(" + respondent_flow_id + ", " + step.id + ", '" + text + "', 'answered', new Date());");
    databaseServices.saveTextAnswer(respondent_flow_id, step.id, text);
  }

  function saveMultipleChoiceAnswer(bot, step, respondent_flow_id, step_choice_id) {
    //insert into RespondentAnswers(respondent_flow_id, step_id, step_choice_id, status, answer_date) values(respondent_flow_id, step.step_id, step_choice_id, 'answered', new Date());
    console.log('saving multiple choice answer to database');
    console.log("insert into RespondentAnswers(respondent_flow_id, step_id, step_choice_id, status, answer_date) values(" + respondent_flow_id + ", " + step.step_id + ", " + step_choice_id + ", 'answered', new Date());");
    databaseServices.saveMultipleChoiceAnswer(respondent_flow_id, step.id, step_choice_id);
  }

  function getFlow(flowId) {
    const SEND_DUMMY = false;
    if (!SEND_DUMMY) {
      // Get from the database
      return databaseServices.getFlow(flowId);
    } else {
      return new Promise(
        function (resolve, reject) {
          resolve({
            "respondent_flow_id": 345,
            "flow_id": 123,
            "name": "HR onboarding",
            "status": "running",
            "steps": [
              {
                "step_id": 51,
                // "step_type": "announcement",
                "stepTypeId": 1,
                "text": "Welcome to bitmaker! I will ask you some questions. Please provide accurate answers."
              },
              {
                "step_id": 52,
                // "step_type": "free_text",
                "stepTypeId": 2,
                "text": "Please provide a brief description about you."
              },
              {
                "step_id": 53,
                // "step_type": "multiple_choice",
                "stepTypeId": 4,
                "text": "How many years of experience do you have",
                "step_choices": [
                  {
                    "id": 91,
                    "choice_order": 1,
                    "text": "none"
                  },
                  {
                    "id": 92,
                    "choice_order": 2,
                    "text": "less than 2 years"
                  },
                  {
                    "id": 93,
                    "choice_order": 3,
                    "text": "between 2 and 5 years"
                  },
                  {
                    "id": 94,
                    "choice_order": 4,
                    "text": "more than 5 years"
                  }
                ]
              }
            ]
          });
        }
      );
    }
  }
};
