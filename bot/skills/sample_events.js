"use strict";

const databaseServices = require('../database_services');

module.exports = function(controller) {

    // reply to any incoming message
    controller.on('message_received', function(bot, message) {
        bot.reply(message, 'I heard... something!');
    });

    // reply to a direct mention - @bot hello
    controller.on('direct_mention', function(bot, message) {
        // reply to _message_ by using the _bot_ object
        bot.reply(message, 'I heard you mention me!');
    });

    // reply to a direct message
    controller.on('direct_message', function(bot, message) {
        // reply to _message_ by using the _bot_ object

        databaseServices.getOngoingFlowForUserEmail(message.user).then(respondentFlow => {
            //console.log('Here I am...');
            if (respondentFlow.respondent_flow_status_id === STATUS_TYPES.RESPONDENT_FLOW_STATUS.NOT_STARTED) {
                bot.reply(message, '\n\nStarting onboarding for, ${respondentFlow.flow.name}.\n\n *(Please say* **start** *to begin)*');
            } else {
                bot.reply(message, 'Hello, there is one onboarding process in progress, ${respondentFlow.flow.name}. Type **start** to resume it.');
            }
        }, err => {
            bot.reply(message, 'Hello, there is no onboarding process in progress.');
        });
    });

    controller.on('bot_space_join', function(bot, message) {
        bot.reply(message, 'Hello, welcome to the onboarding!');
        // bot.reply(message, 'Write **Start** as soon as you are ready.');
    });

    controller.on('user_space_join', function(bot, message) {
        bot.reply(message, 'Hello, ' + message.original_message.data.personDisplayName);
    });

};