"use strict";

const debug = require('debug')('botkit:incoming_webhooks');

module.exports = function (webserver, controller) {

  debug('Configured POST /ciscospark/receive url for receiving events');
  webserver.post('/ciscospark/receive', function (req, res) {
    // This is called by Spark for "all" messages (even the ones the bot sends)

    // NOTE: we should enforce the token check here

    // Respond to Spark that the message has been received.
    res.sendStatus(200);

    let bot = controller.spawn({});

    // Pass the message into the controller to be processed.
    controller.handleWebhookPayload(req, res, bot);

  });

};