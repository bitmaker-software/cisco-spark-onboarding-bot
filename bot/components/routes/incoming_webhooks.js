"use strict";

const debug = require('debug')('botkit:incoming_webhooks');
const bots = require('../../bot');

module.exports = function (app) {

  debug('Configuring POST /ciscospark/receive url for receiving events');
  console.log(`Configuring POST /ciscospark/receive url for receiving events`);

  app.post('/ciscospark/receive', ciscoSparkReceive);

  function ciscoSparkReceive(req, res) {
    //
    // This is called by Spark for "all" messages (even the ones the bot sends)
    //

    // NOTE: we should enforce the token check here

    // Respond to Spark that the message has been received.


    const requestWebhookName = req.body.name;

    console.log(`\n\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~`);
    console.log(`POST /ciscospark/receive from ${req.body.data.personEmail} (webhook: ${requestWebhookName})`);
    console.log(`Will answer with 200 and will process the message after that.`);
    res.sendStatus(200);

    if (!requestWebhookName) {
      console.log(`No webhook name on the request`);
      return;
    }
    bots.getControllerForWebhook(requestWebhookName).then(controller => {
      console.log(`Dispatching message to "${requestWebhookName}"`);
      let bot = controller.spawn({});
      // Pass the message into the controller to be processed.
      controller.handleWebhookPayload(req, res, bot);
    }, () => {
      console.log(`WARNING, controller for webhook name "${requestWebhookName}" not found!`);
    });
  }
};