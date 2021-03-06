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
  //       setting the user/channel in the returning convo object (fixed on 0.5.6?)

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
    console.log(`\n\nInside the callback of BotKit startPrivateConversationWithPersonId()`);
    console.log(`Conversation context.user: ${convo.context.user}`);
    console.log(`Conversation context.channel: ${convo.context.channel}`);
    // console.log(convo);

    if (!err && convo) {
      const databaseServices = require('./database_services');
      console.log(`Fetching flow ${flowId}`);
      databaseServices.getFlowName(flowId).then(flowName => {
        console.log(`Got flow ${flowId} (${flowName})`);

        // console.log(`\nWill now call convo.say() and we'll receive a "Conversation with  undefined in undefined", "Task for  undefined in undefined"\n`);

        if (resume) {
          convo.say(`\n\nOnboarding for ${flowName} can be resumed.\n\n *(Please say* **start** *to resume)*`);
        } else {
          convo.say(`\n\nNew onboarding for ${flowName}.\n\n *(Please say* **start** *to begin)*`);
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

  createRoom: (params, bearer) => {
    return new Promise((resolve, reject) => {

      let reqBody = {
        url: 'https://api.ciscospark.com/v1/rooms',
        method: 'POST',
        // qs: {name: params.name},
        auth: {
          user: null,
          pass: null,
          bearer: bearer
        },
        form: {title: params.name} // the body
      };

      request(reqBody, (error, response, body) => {
        if (!error && response.statusCode === 200) {
          console.log(`~~~ Created room:`);
          console.log(body);
          console.log(`~~~`);
          const json = JSON.parse(body);
          resolve(json.id);
        } else {
          console.log(`~~~ Creating room FAILED:`);
          console.log(body);
          resolve(body);
        }
      });
    });
  },

  addPeopleToRoom: (params, bearer) => {
    let roomId = params.roomId;
    let people = params.people;

    let promises = [];
    people.forEach(person => {
      console.log(`Adding ${person.personId} to the room`);
      promises.push(
        new Promise((resolve, reject) => {

          let reqBody = {
            url: 'https://api.ciscospark.com/v1/memberships',
            method: 'POST',
            // qs: {name: params.name},
            auth: {
              user: null,
              pass: null,
              bearer: bearer
            },
            form: {roomId: roomId, personEmail: person.email} // the body
          };

          request(reqBody, (error, response, body) => {
            if (!error && response.statusCode === 200) {
              console.log(`~~~ Created membership (added person to room):`);
              console.log(body);
              console.log(`~~~`);
              // const json = JSON.parse(body);
              // resolve(json.id);
              resolve('OK');
            } else {
              console.log(`~~~ Creating membership (adding person to room) FAILED:`);
              console.log(body);
              resolve(body);
            }
          });
        })
      );
    });

    Promise.all(promises).then(results => {
      resolve(results);
    }, error => {
      reject(error);
    });
  },

  startFlowForUser: (flowId, sparkUserId, bot) => {
    // This is only called from "Send flow" page ( POST to /api/flow/:id/send )
    console.log(`startFlowForUser(flowId=${flowId}, sparkUserId=${sparkUserId})`);
    const resume = false;
    spawnBotAndStartConversation(flowId, sparkUserId, bot, resume);
  },

  resumeFlowForUser: (flowId, sparkUserId, bot) => {
    // This is only called from "resumeOngoingFlowsAfterServerStart" from the app.js
    console.log(`resumeFlowForUser(flowId=${flowId}, sparkUserId=${sparkUserId})`);
    const resume = true;
    spawnBotAndStartConversation(flowId, sparkUserId, bot, resume);
  }
};