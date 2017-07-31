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
    res.sendStatus(200);

    console.log(`Received from ${req.body.data.personEmail}`);

    const requestWebhookName = req.body.name;

    if (!requestWebhookName) {
      console.log(`No webhook name on the request`);
      return;
    }
    // console.log(`Request webhook name:`);
    // console.log(requestWebhookName);

    botsControllers.forEach(controller => {
      const controllerWebhookName = controller.config.webhook_name;
      // console.log(`Controller webhook name:`);
      // console.log(controllerWebhookName);

      if (requestWebhookName === controllerWebhookName) {
        console.log(`Dispatching message to "${controllerWebhookName}"`);
        let bot = controller.spawn({});
        // Pass the message into the controller to be processed.
        controller.handleWebhookPayload(req, res, bot);
      }
    });

  });

};