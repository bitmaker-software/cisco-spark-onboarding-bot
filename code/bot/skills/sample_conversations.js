/*

 WHAT IS THIS?

 This module demonstrates simple uses of Botkit's conversation system.

 In this example, Botkit hears a keyword, then asks a question. Different paths
 through the conversation are chosen based on the user's response.

 */

module.exports = function (controller) {

  controller.hears(['color'], 'direct_message,direct_mention', function (bot, message) {

    bot.startConversation(message, function (err, convo) {
      convo.say('This is an example of using convo.ask with a single callback.');

      convo.ask('What is your favorite color?', function (response, convo) {

        convo.say('Cool, I like ' + response.text + ' too!');
        convo.next();

      });
    });

  });


  controller.hears(['question'], 'direct_message,direct_mention', function (bot, message) {

    bot.createConversation(message, function (err, convo) {

      // create a path for when a user says YES
      convo.addMessage({
        text: 'How wonderful.',
      }, 'yes_thread');

      // create a path for when a user says NO
      // mark the conversation as unsuccessful at the end
      convo.addMessage({
        text: 'Cheese! It is not for everyone.',
        action: 'stop', // this marks the converation as unsuccessful
      }, 'no_thread');

      // create a path where neither option was matched
      // this message has an action field, which directs botkit to go back to the `default` thread after sending this message.
      convo.addMessage({
        text: 'Sorry I did not understand. Say `yes` or `no`',
        action: 'default',
      }, 'bad_response');

      // Create a yes/no question in the default thread...
      convo.ask('Do you like cheese?', [
        {
          pattern: bot.utterances.yes,
          callback: function (response, convo) {
            convo.gotoThread('yes_thread');
          }
        },
        {
          pattern: bot.utterances.no,
          callback: function (response, convo) {
            convo.gotoThread('no_thread');
          }
        },
        {
          default: true,
          callback: function (response, convo) {
            convo.gotoThread('bad_response');
          }
        }
      ]);

      convo.activate();

      // capture the results of the conversation and see what happened...
      convo.on('end', function (convo) {

        bot.reply(message, 'Convo on end');

        if (convo.successful()) {
          // this still works to send individual replies...
          bot.reply(message, 'Let us eat some!');

          // and now deliver cheese via tcp/ip...
        } else {
          bot.reply(message, 'Ok, no problem. Convo ended.');
        }

      });
    });

  });

  // Testing patterns (order matters, stops on the first match)
  // controller.hears(['o$'], 'direct_message', function (bot, message) {
  //   bot.reply(message, 'o$');
  // });
  // controller.hears(['^o'], 'direct_message', function (bot, message) {
  //   bot.reply(message, '^o');
  // });
  // controller.hears(['o'], 'direct_message', function (bot, message) {
  //   bot.reply(message, 'o again');
  // });

  controller.hears('Come on baby light my (.*)', ['direct_message'], function (bot, message) {
    var type = message.match[1]; // match[0] is the entire group.Come on baby light my fire
    if (type === 'fire') {
      return bot.reply(message, 'That\'s dangerous, ' + message.original_message.data.personDisplayName + '.');
    }
    return bot.reply(message, 'Okay');
  });

  controller.hears('file', 'direct_message', function (bot, message) {
    var fs = require('fs');
    var filePath = './bot/files_to_serve/test_file.txt';
    fs.exists(filePath, function (exists) {
      if (exists) {
        var readStream = fs.createReadStream(filePath);
        bot.reply(message, {text: 'I made this file for you.', files: [readStream]});
      } else {
        bot.reply(message, {text: 'Sorry, there was a problem reading the file. Please contact your supervisor.'});
      }
    });
  });

};
