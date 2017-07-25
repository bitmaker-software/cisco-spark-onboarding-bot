"use strict";

const request = require('request');
const debug = require('debug')('botkit:subscribe_events');

module.exports = function (controller) {

  debug('Subscribing to Cisco webhook events...');

  console.log(`\n****************************************`);
  console.log(`****************************************`);
  console.log(`  Subscribing to Cisco webhook events   `);
  console.log(`****************************************`);
  console.log(`****************************************\n`);

  const webhook_name = controller.config.webhook_name || 'Botkit Firehose';

  console.log(`Resetting webhook subscriptions`);
  controller.resetWebhookSubscriptions();

  const list = controller.api.webhooks.list().then(function (list) {
    console.log(`List of hooks:`);
    console.log(list);
    console.log(list.items);
    console.log(`-----`);

    let hook_id = null;

    for (let i = 0; i < list.items.length; i++) {
      if (list.items[i].name == webhook_name) {
        hook_id = list.items[i].id;
      }
    }

    const hook_url = 'https://' + controller.config.public_address + '/ciscospark/receive';

    debug('Cisco Spark: incoming webhook url is ', hook_url);

    console.log(`Registering Hook`);
    console.log(`Name: ${webhook_name}`);
    console.log(`ID: ${hook_id}`);

    if (hook_id) {
      controller.api.webhooks.update({
        id: hook_id,
        resource: 'all',
        targetUrl: hook_url,
        event: 'all',
        secret: controller.config.secret,
        name: webhook_name,
      }).then(function (res) {
        debug('Cisco Spark: SUCCESSFULLY UPDATED CISCO SPARK WEBHOOKS');
      }).catch(function (err) {
        debug('FAILED TO REGISTER WEBHOOK', err);
        throw new Error(err);
      });

    } else {
      controller.api.webhooks.create({
        resource: 'all',
        targetUrl: hook_url,
        event: 'all',
        secret: controller.config.secret,
        name: webhook_name
      }).then(function (res) {

        debug('Cisco Spark: SUCCESSFULLY REGISTERED CISCO SPARK WEBHOOKS');
      }).catch(function (err) {
        debug('FAILED TO REGISTER WEBHOOK', err);
        throw new Error(err);
      });

    }
  });
};
