"use strict";

const debug = require('debug')('botkit:incoming_webhooks');

module.exports = function (app, botsControllers) {

  debug('Configuring POST /ciscospark/receive url for receiving events');
  console.log(`Configuring POST /ciscospark/receive url for receiving events`);

  app.post('/ciscospark/receive', (req, res) => {
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
    // console.log(`Request webhook name:`);
    // console.log(requestWebhookName);

    let foundController = false;
    botsControllers.forEach(controller => {
      // Find the bot with this webhook name
      const controllerWebhookName = controller.config.webhook_name;
      // console.log(`Controller webhook name:`);
      // console.log(controllerWebhookName);

      if (requestWebhookName === controllerWebhookName) {
        foundController = true;
        console.log(`Dispatching message to "${controllerWebhookName}"`);
        let bot = controller.spawn({});
        // Pass the message into the controller to be processed.
        controller.handleWebhookPayload(req, res, bot);
      }
    });

    if (!foundController) {
      console.log(`WARNING, controller for webhook name "${requestWebhookName}" not found!`);
    }

  });

};