"use strict";

const env = require('node-env-file');
env(__dirname + '/.env', {raise: false});

const Botkit = require('botkit');
const debug = require('debug')('botkit:main');
const databaseServices = require('./database_services');
let controllers = [];
let conversationsPerFlow = {};

module.exports = {
  init: () => {
    return new Promise((resolve, reject) => {
      // Get the bots credentials from the database
      controllers = [];
      conversationsPerFlow = {};
      databaseServices.getAllBots().then(bots => {
        console.log(`Got ${bots.length} bot(s) from the database`);

        if (!bots.length) {
          // No bots
          resolve();
          return;
        }

        bots.forEach((bot, index) => {
          console.log(`Creating bot ${index + 1}`);
          if (!bot.access_token) {
            console.log(`Missing access_token for this bot; skipping`);
            return;
          }
          try {
            let controller = Botkit.sparkbot({
              stats_optout: true, // Opt-out of Botkit Statistics Gathering
              // debug: true,
              // limit_to_domain: ['mycompany.com'],
              // limit_to_org: 'my_cisco_org_id',
              public_address: bot.public_https_address,
              ciscospark_access_token: bot.access_token,
              // studio_token: process.env.studio_token, // get one from studio.botkit.ai to enable content management, stats, message console and more
              secret: bot.secret, // this is an RECOMMENDED but optional setting that enables validation of incoming webhooks
              webhook_name: bot.webhook_name,
              // studio_command_uri: process.env.studio_command_uri,
            });
            controllers.push(controller);

            // Subscribe to Cisco Spark (so it starts sending events to this application)
            require(__dirname + '/components/subscribe_events.js')(controller);

            // Load the bot skills
            console.log(`Loading bots skills`);
            const normalizedPath = require("path").join(__dirname, "skills");
            require("fs").readdirSync(normalizedPath).forEach(file => {
              require("./skills/" + file)(controller);
            });

          } catch (err) {
            console.error(`Error creating the bot:`);
            console.error(err);
          }
        });

        console.log(`Bots created. controllers[] length: ${controllers.length}`);

        resolve();
      });
    });
  },
  // getControllers: () => controllers,
  getControllerForWebhook: requestWebhookName => {
    return new Promise((resolve, reject) => {
      controllers.forEach(controller => {
        // Find the bot with this webhook name
        if (requestWebhookName === controller.config.webhook_name) {
          resolve(controller);
        }
      });
    });
  },
  addConversationToFlow: addConversationForFlow,
  getConversationsForFlow: getConversationsForFlow,
  stopConversationsForFlow: stopConversationsForFlow,
  removeConversationForFlow: removeConversationForFlow,
};

function addConversationForFlow(conversation, flowId) {
  console.log(`Adding a conversation to the flow ${flowId}`);
  getConversationsForFlow(flowId).push(conversation);
}

function getConversationsForFlow(flowId) {
  if (flowId in conversationsPerFlow) {
    return conversationsPerFlow[flowId];
  }
  // Does not exist yet
  conversationsPerFlow[flowId] = [];
  return conversationsPerFlow[flowId];
}

function stopConversationsForFlow(flowId) {
  console.log(`STOP conversations for the flow ${flowId}`);
  let conversations = getConversationsForFlow(flowId);
  conversations.forEach(conversation => {
    conversation.flowDisabled = true;
    conversation.stop(); // end the conversation immediately, and set convo.status to stopped
  });
  conversationsPerFlow[flowId] = []; // Clear all
}

function removeConversationForFlow(conversationToRemove, flowId) {
  console.log(`The conversation ended up naturally, will now remove it.`);
  let conversations = getConversationsForFlow(flowId);
  // console.log(conversations);
  conversations.some((conversation, index) => {
    if (conversationToRemove.id === conversation.id) {
      conversations.splice(index, 1);
    }
    return conversationToRemove.id === conversation.id;
  });
  // console.log(conversations);
}