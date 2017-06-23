"use strict";

const request = require('request');
// const databaseServices = require('./database_services'); // this would be a circular dependency and would give an empty object; load it later when needed

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

      if (params.email) {
        reqBody.qs.email = params.email;
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

  initiateFlowForUser: (flowId, sparkUserId) => {

    console.log(`initiateFlowForUser(flowId=${flowId}, sparkUserId=${sparkUserId})`);

    //
    // NOTE: we need a message object to pass to createConversation(), because if we just pass a context {toPersonId: ...},
    //       the bot will send the initial flow message but the user will not be inside/engaged into the conversation.
    //

    //
    // NOTE: startPrivateConversation and startPrivateConversationWithPersonId are not
    //       setting the user/channel in the returning convo object

    let bot = global.bot.spawn({});
    bot.startPrivateConversationWithPersonId(sparkUserId, function (err, convo) {
      if (!err && convo) {
        const databaseServices = require('./database_services');
        console.log(`Fetching flow ${flowId}`);
        console.log("Called help");
        databaseServices.getFlowName(flowId).then(flowName => {
          console.log(`Got flow name: ${flowName}`);
          convo.say(`Starting onboarding for "${flowName}". Please say "Start" to begin.`);
        }, error => {
          console.log(`Error fetching the flow: ${error}`);
        });
      }
    });
  }
};