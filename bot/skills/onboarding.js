"use strict";

var database_services = require('../database_services');

module.exports = function (controller) {

  controller.hears(['cisco'], 'direct_message,direct_mention', function (bot, message) {
    buildConversationFromCurrentFlow(bot, message);
  });
  /*
   Retrieve the current flow from the datastore, and build the conversation accordingly
   */
  function buildConversationFromCurrentFlow(bot, message) {
    //get the flow from the database
    retrieveCurrentFlowFromDb(bot).then(flow => {
      var thread = 'default';
      //create the conversation
      bot.createConversation(message, function (err, convo) {
        flow.steps.forEach(function (step) {
          switch (step.stepTypeId) {
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

        convo.activate();

      });
    }, err => {
      console.error("Error fetching the flow:");
      console.error(err);
    });
  }

  function addAnnouncementStep(bot, convo, step, respondent_flow_id, thread) {

    var text = step.text + '\n\nPlease type ok to continue';

    convo.addQuestion(text, [
      {
        "pattern": "^ok$",
        "callback": function (response, convo) {
          //save response
          //go to next
          convo.next();
        }
      },
      {
        "default": true,
        "callback": function (response, convo) {
          //repeat the question
          convo.repeat();
          convo.next();
        }
      }
    ], {}, thread);
  };

  function addFreeTextStep(bot, convo, step, respondent_flow_id, thread) {
    var text = step.text + "\n\nYou can write as many lines as you want.\n\nPlease type @end in a single line when you're done";

    convo.addQuestion(text, [
      {
        "pattern": "^@end$",
        "callback": function (response, convo) {
          //console.log(convo.extractResponse(step.step_id));
          var answer = convo.extractResponse(step.step_id);
          //remove the terminator
          answer = answer.replace("@end", "");
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
    ], {"key": step.step_id, "multiple": true}, thread);
  }

  function addMultipleChoiceStep(bot, convo, step, respondent_flow_id, thread) {
    var text = step.text + '\n\n';

    var patternsAndCallbacks = [];
    if (!step.step_choices) {
      console.error("The multiple choice step has no choices!");
    } else {
      step.step_choices.forEach(function (choice) {

        text += choice.choiceOrder + '. ' + choice.text + '\n\n';

        patternsAndCallbacks.push({
          "pattern": "^" + choice.choiceOrder + "$",
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
        convo.repeat();
        convo.next();
      }
    });
    text += 'Please choose one option';
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

  function retrieveCurrentFlowFromDb(bot) {
    const SEND_DUMMY = false;
    if (!SEND_DUMMY) {
      // Get from the database
      // TODO: which flow id?
      let id = 1;
      return database_services.getFlow(id);
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
                    "choiceOrder": 1,
                    "text": "none"
                  },
                  {
                    "id": 92,
                    "choiceOrder": 2,
                    "text": "less than 2 years"
                  },
                  {
                    "id": 93,
                    "choiceOrder": 3,
                    "text": "between 2 and 5 years"
                  },
                  {
                    "id": 94,
                    "choiceOrder": 4,
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