"use strict";

const databaseServices = require('../database_services');

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
    // Get the oldest pending flow and start it
    databaseServices.getOldestPendingFlowForUserEmail(message.user).then(flow => {
      console.log(`getOldestPendingFlowForUserEmail ${message.user}`);
      console.log(flow.id);
      buildConversationFromCurrentFlow(bot, message, flow.id);
    });
  });


  /*
   Retrieve the current flow from the datastore, and build the conversation accordingly
   */
  // TODO: exposing buildConversationFromCurrentFlow function (there must be a better way to do this!)
  // global.buildConversationFromCurrentFlow = function (bot, message, flowId) {
  let buildConversationFromCurrentFlow = function (bot, message, flowId) {
    console.log(`buildConversationFromCurrentFlow(bot=${bot}, message=${message}, flowId=${flowId})`);
    //get the flow from the database
    retrieveCurrentFlowFromDb(flowId).then(flow => {
      let thread = 'default';
      console.log(flow);
      //create the conversation
      bot.createConversation(message, function (err, convo) {
        console.log("createConversation callback. convo: ⏎");
        console.log(convo);
        if (!err && convo) {
          flow.steps.forEach(function (step) {
            console.log("STEP TYPE ID: ");
            console.log(step.step_type_id);
            switch (step.step_type_id) {
              // case "announcement":
              case 1:
                addAnnouncementStep(bot, convo, step, flow.respondent_flow_id, thread);
                break;
              // case "free_text":
              case 2:
                addFreeTextStep(bot, convo, step, flow.respondent_flow_id, thread);
                break;
              // case "multiple_choice":
              case 4:
                addMultipleChoiceStep(bot, convo, step, flow.respondent_flow_id, thread);
                break;
              default:
                break;
            }
          });

          addEndConversationHandler(bot, convo);

          console.log('Activating the conversation');
          convo.activate();
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

  function addEndConversationHandler(bot, convo) {
    convo.on('end', function (convo) {
      if (convo.status === 'completed') {
        bot.reply(convo.source_message, "Thank you so much for your time! Have a nice day!");
      } else {
        bot.reply(convo.source_message, "Sorry, something went wrong. Please contact your HR department for more information.");
      }
    });
  }

  function addAnnouncementStep(bot, convo, step, respondent_flow_id, thread) {
    console.log("Adding announcement step: " + step.text);
    let text = step.text + '\n\nPlease type ok to continue.';

    convo.addQuestion(text, [
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

  /*
   save an answer to the database
   */
  function saveTextAnswer(bot, step, respondent_flow_id, text) {
    //insert into RespondentAnswers(respondent_flow_id, step_id, text, status, answer_date) values(respondent_flow_id, step.step_id, text, 'answered', new Date());
    console.log('saving text answer to database');
    console.log("insert into RespondentAnswers(respondent_flow_id, step_id, text, status, answer_date) values(" + respondent_flow_id + ", " + step.step_id + ", '" + text + "', 'answered', new Date());");
  }

  function saveMultipleChoiceAnswer(bot, step, respondent_flow_id, step_choice_id) {
    //insert into RespondentAnswers(respondent_flow_id, step_id, step_choice_id, status, answer_date) values(respondent_flow_id, step.step_id, step_choice_id, 'answered', new Date());
    console.log('saving multiple choice answer to database');
    console.log("insert into RespondentAnswers(respondent_flow_id, step_id, step_choice_id, status, answer_date) values(" + respondent_flow_id + ", " + step.step_id + ", " + step_choice_id + ", 'answered', new Date());");
  }

  function retrieveCurrentFlowFromDb(flowId) {
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
