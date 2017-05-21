/**
 * Created by tiago on 19/05/17.
 */

module.exports = function (controller) {

    controller.hears(['cisco'], 'direct_message,direct_mention', function(bot, message) {
        buildConversationFromCurrentFlow(bot, message);
    });
    /*
        Retrieve the current flow from the datastore, and build the conversation accordingly
     */
    function buildConversationFromCurrentFlow(bot, message) {
        //get the flow from the database
        var flow = retrieveCurrentFlowFromDb(bot);

        var thread = 'default';
        //create the conversation
        bot.createConversation(message, function(err, convo){
            flow.steps.forEach(function(step){
                switch(step.step_type){
                    case "announcement":
                        addAnnouncementStep(bot, convo, step, flow.respondent_flow_id, thread);
                        break;
                    case "free_text":
                        addFreeTextStep(bot, convo, step, flow.respondent_flow_id, thread);
                        break;
                    case "multiple_choice":
                        addMultipleChoiceStep(bot, convo, step, flow.respondent_flow_id, thread);
                        break;
                    default:
                        break;
                }
            });

            convo.activate();

        });
    }

    function addAnnouncementStep(bot, convo, step, respondent_flow_id, thread){

        var text = step.text + '\n\nPlease type ok to continue';

        convo.addQuestion(text, [
            {
                "pattern": "^ok$",
                "callback": function(response, convo){
                    //save response
                    //go to next
                    convo.next();
                }
            },
            {
                "default": true,
                "callback": function(response, convo){
                    //repeat the question
                    convo.repeat();
                    convo.next();
                }
            }
        ], {}, thread);
    };

    function addFreeTextStep(bot, convo, step, respondent_flow_id, thread){
        var text = step.text + "\n\nYou can write as many lines as you want.\n\nPlease type @end in a single line when you're done";

        convo.addQuestion(text, [
            {
                "pattern": "^@end$",
                "callback": function(response, convo){
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
                "callback": function(response, convo){
                    //do nothing, wait for @end and collect all lines
                }
            }
        ], {"key": step.step_id, "multiple": true}, thread);
    }

    function addMultipleChoiceStep(bot, convo, step, respondent_flow_id, thread){
        var text = step.text + '\n\n';

        var patternsAndCallbacks = [];
        step.choices.forEach(function(choice){

            text += choice.choice_order + '. ' + choice.text + '\n\n';

            patternsAndCallbacks.push({
                "pattern": "^" + choice.choice_order + "$",
                "callback": function(response, convo){
                    //save response
                    saveMultipleChoiceAnswer(bot, step, respondent_flow_id, choice.step_choice_id);
                    //go to next
                    convo.next();
                }
            });

        });

        //add the default option
        patternsAndCallbacks.push({
            "default": true,
            "callback": function(response, convo){
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
    function saveTextAnswer(bot, step, respondent_flow_id, text){
        //insert into RespondentAnswers(respondent_flow_id, step_id, text, status, answer_date) values(respondent_flow_id, step.step_id, text, 'answered', new Date());
        console.log('saving text answer to database');
        console.log("insert into RespondentAnswers(respondent_flow_id, step_id, text, status, answer_date) values(" + respondent_flow_id + ", " + step.step_id + ", '" + text + "', 'answered', new Date());");
    }

    function saveMultipleChoiceAnswer(bot, step, respondent_flow_id, step_choice_id){
        //insert into RespondentAnswers(respondent_flow_id, step_id, step_choice_id, status, answer_date) values(respondent_flow_id, step.step_id, step_choice_id, 'answered', new Date());
        console.log('saving multiple choice answer to database');
        console.log("insert into RespondentAnswers(respondent_flow_id, step_id, step_choice_id, status, answer_date) values(" + respondent_flow_id + ", " + step.step_id + ", " + step_choice_id + ", 'answered', new Date());");
    }

    function retrieveCurrentFlowFromDb(bot){
        var flow = {
            "respondent_flow_id": 345,
            "flow_id": 123,
            "name": "HR onboarding",
            "status": "running",
            "steps": [
                {
                    "step_id": 51,
                    "step_type": "announcement",
                    "text": "Welcome to bitmaker! I will ask you some questions. Please provide accurate answers."
                },
                {
                    "step_id": 52,
                    "step_type": "free_text",
                    "text": "Please provide a brief description about you."
                },
                {
                    "step_id": 53,
                    "step_type": "multiple_choice",
                    "text": "How many years of experience do you have",
                    "choices": [
                        {
                            "step_choice_id": 91,
                            "choice_order": 1,
                            "text": "none"
                        },
                        {
                            "step_choice_id": 92,
                            "choice_order": 2,
                            "text": "less than 2 years"
                        },
                        {
                            "step_choice_id": 93,
                            "choice_order": 3,
                            "text": "between 2 and 5 years"
                        },
                        {
                            "step_choice_id": 94,
                            "choice_order": 4,
                            "text": "more than 5 years"
                        }
                    ]
                }
            ]
        };
        return flow;
    }
};