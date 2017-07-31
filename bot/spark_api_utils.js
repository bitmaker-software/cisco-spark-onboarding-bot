"use strict";

const request = require('request');

// const databaseServices = require('./database_services'); // this would be a circular dependency and would give an empty object; load it later when needed

function spawnBotAndStartConversation(flowId, sparkUserId, botController, resume) {
  //
  // NOTE: we need a message object to pass to createConversation(), because if we just pass a context {toPersonId: ...},
  //       the bot will send the initial flow message but the user will not be inside/engaged into the conversation.
  //

  //
  // NOTE: startPrivateConversation and startPrivateConversationWithPersonId are not
  //       setting the user/channel in the returning convo object

  console.log(`\n\n\n*****`);
  console.log(`*****`);
  console.log(`Will now try to start a private conversation`);
  console.log(`Flow ID: ${flowId}`);
  console.log(`Spark User ID: ${sparkUserId}`);
  console.log(`Bot controller:`);

  // console.log(botController);
  console.log(`<commented out>`);

  console.log(`*****`);
  console.log(`*****\n\n`);

  let bot = botController.spawn({});

  bot.startPrivateConversationWithPersonId(sparkUserId, function (err, convo) {
    console.log(`Callback of botkit startPrivateConversationWithPersonId()`);
    console.log(`Convo context:`);
    console.log(convo.context);
    if (!err && convo) {
      const databaseServices = require('./database_services');
      console.log(`Fetching flow ${flowId}`);
      console.log("Called help");
      databaseServices.getFlowName(flowId).then(flowName => {
        console.log(`Got flow name: ${flowName}`);

        console.log(`\n\n\nWe'll receive a "Conversation with  undefined in undefined", "Task for  undefined in undefined", "info: An error occurred while sending a message:  ReferenceError: message is not defined" here\n\n`);
        if (resume) {
          convo.say(`Resuming onboarding for "${flowName}". Please say "Start" to resume.`);
        } else {
          convo.say(`Starting onboarding for "${flowName}". Please say "Start" to begin.`);
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

  startFlowForUser: (flowId, sparkUserId, bot) => {
    console.log(`startFlowForUser(flowId=${flowId}, sparkUserId=${sparkUserId})`);
    const resume = false;
    spawnBotAndStartConversation(flowId, sparkUserId, bot, resume);
  },

  resumeFlowForUser: (flowId, sparkUserId, bot) => {
    console.log(`resumeFlowForUser(flowId=${flowId}, sparkUserId=${sparkUserId})`);
    const resume = true;
    spawnBotAndStartConversation(flowId, sparkUserId, bot, resume);
  }
};