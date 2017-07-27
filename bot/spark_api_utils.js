"use strict";

const request = require('request');
// const databaseServices = require('./database_services'); // this would be a circular dependency and would give an empty object; load it later when needed

function spawnBotAndStartConversation(flowId, sparkUserId, resume) {
    //
    // NOTE: we need a message object to pass to createConversation(), because if we just pass a context {toPersonId: ...},
    //       the bot will send the initial flow message but the user will not be inside/engaged into the conversation.
    //

    //
    // NOTE: startPrivateConversation and startPrivateConversationWithPersonId are not
    //       setting the user/channel in the returning convo object

    let bot = global.bot.spawn({});
    bot.startPrivateConversationWithPersonId(sparkUserId, function(err, convo) {
        if (!err && convo) {
            const databaseServices = require('./database_services');
            console.log(`Fetching flow ${flowId}`);
            console.log("Called help");
            databaseServices.getFlowName(flowId).then(flowName => {
                console.log(`Got flow name: ${flowName}`);
                if (resume) {
                    convo.say(`\n\nResuming onboarding for "${flowName}".\n\n *(Please type* **start** *to resume)*`);
                } else {
                    convo.say(`\n\nStarting onboarding for "${flowName}".\n\n *(Please say* **start** *to begin)*`);
                }
            }, error => {
                console.log(`Error fetching the flow: ${error}`);
            });
        }
    });
}

module.exports = {
    getUserFromSpark: (params, bearer) => {
        return new Promise((resolve, reject) => {

            let reqBody = {
                url: 'https://api.ciscospark.com/v1/people',
                qs: {},
                auth: {
                    user: null,
                    pass: null,
                    bearer: bearer
                }
            };

            let user = params.user;
            if (user) {
                if (user.includes('@')) {
                    reqBody.qs.email = user;
                } else {
                    reqBody.qs.displayName = user;
                }
            }

            if (params.sparkId) {
                reqBody.qs.id = params.sparkId;
            }
            request(reqBody, (error, response, body) => {
                if (!error && response.statusCode === 200) {
                    const json = JSON.parse(body);
                    const users = json.items.map(item => {
                        let email = '';
                        if (item.emails && item.emails.length > 0) {
                            email = item.emails[0];
                        }
                        return {
                            id: item.id,
                            displayName: item.displayName,
                            email: email
                        };
                    });
                    resolve(users);
                } else {
                    resolve([]);
                }
            });
        });
    },

    startFlowForUser: (flowId, sparkUserId) => {
        console.log(`startFlowForUser(flowId=${flowId}, sparkUserId=${sparkUserId})`);
        const resume = false;
        spawnBotAndStartConversation(flowId, sparkUserId, resume);
    },

    resumeFlowForUser: (flowId, sparkUserId) => {
        console.log(`resumeFlowForUser(flowId=${flowId}, sparkUserId=${sparkUserId})`);
        const resume = true;
        spawnBotAndStartConversation(flowId, sparkUserId, resume);
    }
};