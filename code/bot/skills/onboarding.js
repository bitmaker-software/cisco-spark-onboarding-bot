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
        //get from data base
        var flow = retrieveCurrentFlowFromDb(bot);
        var thread = 'default';
        //create the conversation
        bot.createConversation(message, function(err, convo){
            flow.steps.forEach(function(step){
                switch(step.step_type){
                    case "announcement":
                        addAnnouncementStep(convo, step, thread);
                        break;
                    case "free_text":
                        addFreeTextStep(convo, step, thread);
                        break;
                    case "multiple_choice":
                        addMultipleChoiceStep(convo, step, thread);
                        break;
                    default:
                        break;
                }
            });

            convo.activate();

        });
    }

    function addAnnouncementStep(convo, step, thread){
/*
        convo.addMessage(step.text, thread);

        convo.addQuestion("Please type ok to continue", [
*/
        var text = 'primeira linha 1 \n\n **segunda** linha\n';

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

    function addFreeTextStep(convo, step, thread){
        convo.addMessage(step.text, thread);
        convo.addMessage("You can write as many lines as you want.")
        convo.addQuestion("Please type @end in a single line when you're done", [
            {
                "pattern": "^@end$",
                "callback": function(response, convo){
                    console.log(convo.extractResponse(step.step_id));
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

    function addMultipleChoiceStep(convo, step, thread){
        convo.addMessage(step.text, thread);
        var firstOption = -1;
        var lastOption;
        var patternsAndCallbacks = [];
        step.choices.forEach(function(choice){
            convo.addMessage(choice.choice_order + " - " + choice.text);

            patternsAndCallbacks.push({
                "pattern": "^" + choice.choice_order + "$",
                "callback": function(response, convo){
                    //save response
                    //go to next
                    convo.next();
                }
            });

            //update first and last choices indexes
            if(firstOption == -1){
                firstOption = choice.choice_order;
            }
            lastOption = choice.choice_order;
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
        convo.addQuestion("Please choose one (" + firstOption + " - " + lastOption + ")", patternsAndCallbacks, {}, thread);
    }

    function retrieveCurrentFlowFromDb(bot){
        var flow = {
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