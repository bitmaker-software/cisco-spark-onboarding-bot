"use strict";

const debug = require('debug')('botkit:incoming_webhooks');

module.exports = function (webserver, controller) {

  debug('Configured POST /ciscospark/receive url for receiving events');
  webserver.post('/ciscospark/receive', function (req, res) {

    // NOTE: we should enforce the token check here

    // respond to Spark that the webhook has been received.
    res.status(200);
    res.send('ok');

    let bot = controller.spawn({});

    // Now, pass the webhook into be processed
    controller.handleWebhookPayload(req, res, bot);

  });

};