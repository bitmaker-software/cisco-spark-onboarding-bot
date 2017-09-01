"use strict";

const env = require('node-env-file');
env(__dirname + '/.env');

const Botkit = require('botkit');
const debug = require('debug')('botkit:main');
const databaseServices = require('./database_services');
let controllers = [];

module.exports = {
  init: () => {
    return new Promise((resolve, reject) => {
      // Get the bots credentials from the database
      controllers = [];
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
};