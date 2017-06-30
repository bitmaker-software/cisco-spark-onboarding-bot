"use strict";

let request = require('request');

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

    let bot = global.bot.spawn({});
    let context = {
      toPersonId: sparkUserId
    };
    buildConversationFromCurrentFlow(bot, context, flowId);

    // return new Promise((resolve, reject) => {
    // request({
    //   url: 'https://api.ciscospark.com/v1/messages',
    //   method: 'POST',
    //   auth: {
    //     user: null,
    //     pass: null,
    //     bearer: process.env.access_token
    //   },
    //   json: true,
    //   body: {toPersonId: req.params.spark_id, text: 'Hello. I am the onboarding bot!'}
    // }, (error, response, body) => {
    //   if (!error && response.statusCode === 200) {
    //     resolve();
    //   } else {
    //     reject(error);
    //   }
    // });
    // });
  }
};