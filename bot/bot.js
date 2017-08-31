"use strict";

/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 ______     ______     ______   __  __     __     ______
 /\  == \   /\  __ \   /\__  _\ /\ \/ /    /\ \   /\__  _\
 \ \  __<   \ \ \/\ \  \/_/\ \/ \ \  _"-.  \ \ \  \/_/\ \/
 \ \_____\  \ \_____\    \ \_\  \ \_\ \_\  \ \_\    \ \_\
 \/_____/   \/_____/     \/_/   \/_/\/_/   \/_/     \/_/


 This is a sample Cisco Spark bot built with Botkit.

 # RUN THE BOT:
 Follow the instructions here to set up your Cisco Spark bot:
 -> https://developer.ciscospark.com/bots.html
 Run your bot from the command line:
 access_token=<MY BOT ACCESS TOKEN> public_address=<MY PUBLIC HTTPS URL> node bot.js



 ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
const env = require('node-env-file');
env(__dirname + '/.env');

module.exports = callbackWhenBotsRegistered => {
  /*
  // Default: read from .env, but this will be replaced by what is on the database
  let botInfo = {
    accessToken: process.env.access_token,
    publicAddress: process.env.public_address,
    webhookName: process.env.webhook_name,
    secret: process.env.secret
  };

  if (!botInfo.accessToken) {
    console.log('Error: Specify a Cisco Spark access_token in environment.');
    usage_tip();
    process.exit(1);
  }

  if (!botInfo.publicAddress) {
    console.log('Error: Specify an SSL-enabled URL as this bot\'s public_address in environment.');
    usage_tip();
    process.exit(1);
  }
  */

  const Botkit = require('botkit');
  const debug = require('debug')('botkit:main');

  // Create the Botkit controllers, which controls all instances of each bot.
  const controllers = [];

  const databaseServices = require('./database_services');
  databaseServices.getAllBots().then(bots => {
    console.log(`Got ${bots.length} bot(s) from the database`);

    if (bots.length) {
      console.log(bots[0]);
    } else {
      console.error(`No bots in the database!`);
    }

    bots.forEach((bot, index) => {
      console.log(`Creating bot ${index + 1}`);
      if (!bot.access_token) {
        console.log(`Missing access_token for this bot; skipping`);
        return;
      }
      try {
        controllers.push(Botkit.sparkbot({
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
        }));
      } catch (err) {
        console.error(`Error creating the bot:`);
        console.error(err);
      }
    });

    console.log(`Bots created. controllers[] length: ${controllers.length}`);

    subscribeEvents();
    loadSkills(controllers);
    callbackWhenBotsRegistered(controllers);
  });

  // Set up an Express-powered webserver to expose oauth and webhook endpoints
  // const webserver = require(__dirname + '/components/express_webserver.js')(controller);

  function subscribeEvents() {
    // Tell Cisco Spark to start sending events to this application
    controllers.forEach(controller => {
      require(__dirname + '/components/subscribe_events.js')(controller);
    });
  }

  // Enable Dashbot.io plugin
  // require(__dirname + '/components/plugin_dashbot.js')(controller);

  function loadSkills(controllers) {
    // Load bot skills
    console.log(`Loading bots skills`);
    const normalizedPath = require("path").join(__dirname, "skills");
    require("fs").readdirSync(normalizedPath).forEach(file => {
      controllers.forEach(controller => {
        require("./skills/" + file)(controller);
      });
    });
  }


  // This captures and evaluates any message sent to the bot as a DM
  // or sent to the bot in the form "@bot message" and passes it to
  // Botkit Studio to evaluate for trigger words and patterns.
  // If a trigger is matched, the conversation will automatically fire!
  // You can tie into the execution of the script using the functions
  // controller.studio.before, controller.studio.after and controller.studio.validate
  // if (process.env.studio_token) {
  //   controller.on('direct_message,direct_mention', function (bot, message) {
  //     if (message.text) {
  //       controller.studio.runTrigger(bot, message.text, message.user, message.channel).then(function (convo) {
  //         if (!convo) {
  //           // no trigger was matched
  //           // If you want your bot to respond to every message,
  //           // define a 'fallback' script in Botkit Studio
  //           // and uncomment the line below.
  //           controller.studio.run(bot, 'fallback', message.user, message.channel);
  //         } else {
  //           // set variables here that are needed for EVERY script
  //           // use controller.studio.before('script') to set variables specific to a script
  //           convo.setVar('current_time', new Date());
  //         }
  //       }).catch(function (err) {
  //         if (err) {
  //           bot.reply(message, 'I experienced an error with a request to Botkit Studio: ' + err);
  //           debug('Botkit Studio: ', err);
  //         }
  //       });
  //     }
  //   });
  // } else {
  //   console.log('~~~~~~~~~~');
  //   console.log('NOTE: Botkit Studio functionality has not been enabled');
  //   console.log('To enable, pass in a studio_token parameter with a token from https://studio.botkit.ai/');
  // }

  function usage_tip() {
    console.log('~~~~~~~~~~');
    console.log('Botkit Studio Starter Kit');
    console.log('Execute your bot application like this:');
    console.log('access_token=<MY ACCESS TOKEN> public_address=<https://mybotapp/> node bot.js');
    console.log('Get Cisco Spark token here: https://developer.ciscospark.com/apps.html');
    console.log('Get a Botkit Studio token here: https://studio.botkit.ai/');
    console.log('~~~~~~~~~~');
  }

};