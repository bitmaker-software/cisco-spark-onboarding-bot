/*

 Botkit hears a keyword, then asks a question. Different paths
 through the conversation are chosen based on the user's response.

 */

module.exports = function (controller) {

  var currentThread = 0;

  const THREADS = {
    cheese: {
      name: 'cheese_thread',
      thread_yes: {
        name: 'cheese_yes', message: {
          text: '[cheese] You answered yes, let\'s go to chocolate thread.',
          action: 'chocolate_thread'
        }
      },
      thread_no: {
        name: 'cheese_no', message: {
          text: '[cheese] You answered no, let\'s stop.',
          action: 'stop' // this marks the converation as unsuccessful
        }
      },
      thread_bad_message: {
        name: 'cheese_bad_message', message: {
          text: '[cheese] Sorry I did not understand. Say `yes` or `no`',
          action: 'default' // will go to the default thread
        }
      }
    },
    chocolate: {
      name: 'chocolate_thread',
      thread_yes: {
        name: 'cheese_yes', message: {
          text: '[cheese] You answered yes, let\'s go to birds thread.',
          action: 'birds_thread'
        }
      },
      thread_no: {
        name: 'cheese_no', message: {
          text: '[cheese] You answered no, let\'s stop.',
          action: 'stop' // this marks the converation as unsuccessful
        }
      },
      thread_bad_message: {
        name: 'cheese_bad_message', message: {
          text: '[cheese] Sorry I did not understand. Say `yes` or `no`',
          action: 'default' // will go to the default thread
        }
      }
    },
    birds: {
      name: 'birds_thread',
      thread_yes: {
        name: 'birds_yes', message: {
          text: '[birds] You answered yes, let\'s go to default thread.',
          action: 'default'
        }
      },
      thread_no: {
        name: 'birds_no', message: {
          text: '[birds] You answered no, let\'s stop.',
          action: 'stop' // this marks the converation as unsuccessful
        }
      },
      thread_bad_message: {
        name: 'birds_bad_message', message: {
          text: '[birds] Sorry I did not understand. Say `yes` or `no`',
          action: 'default' // will go to the default thread
        }
      }
    }
  };

  var questions = [];
  questions.push(
    function cheese(convo, bot) {
      // Create a yes/no question in the default thread...
      convo.addQuestion('Do you like cheese?', [
        {
          pattern: bot.utterances.yes,
          callback: function (response, convo) {
            convo.next();
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
      ], {}, THREADS.cheese.name);

      convo.addQuestion('Just one more about cheese, is it blue?', function (response, convo) {
        convo.say('Okay, don\'t really care, let\'s proceed.');
        convo.gotoThread(THREADS.chocolate.name);
      }, {}, THREADS.cheese.name)
    });
  questions.push(
    function chocolate(convo, bot) {
      convo.addQuestion('And chocolate?', [
        {
          pattern: bot.utterances.yes,
          callback: function (response, convo) {
            convo.gotoThread(THREADS.birds.name);
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
      ], {}, 'chocolate_thread');
    });
  questions.push(
    function cheese(convo, bot) {
      // Create a yes/no question in the default thread...
      convo.addQuestion('Do you like birds?', [
        {
          pattern: bot.utterances.yes,
          callback: function (response, convo) {
            convo.gotoThread('default');
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
      ], {}, THREADS.birds.name);
    });
  questions.push(
    function finish(convo, bot) {
      convo.ask('Hello, welcome to the onboarding! Say yes to continue.', [
        {
          pattern: bot.utterances.yes,
          callback: function (response, convo) {
            convo.gotoThread(THREADS.cheese.name);
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
    }
  );

  controller.hears(['start'], 'direct_message', function (bot, message) {

    bot.createConversation(message, function (err, convo) {

      // Add each message to its thread

      // Cheese sub-threads
      convo.addMessage(THREADS.cheese.thread_yes.message, THREADS.cheese.thread_yes.name); // user says YES
      convo.addMessage(THREADS.cheese.thread_no.message, THREADS.cheese.thread_no.name); // user says NO
      convo.addMessage(THREADS.cheese.thread_bad_message.message, THREADS.cheese.thread_bad_message.name); // default

      // Chocolate sub-threads
      convo.addMessage(THREADS.chocolate.thread_yes.message, THREADS.chocolate.thread_yes.name); // user says YES
      convo.addMessage(THREADS.chocolate.thread_no.message, THREADS.chocolate.thread_no.name); // user says NO
      convo.addMessage(THREADS.chocolate.thread_bad_message.message, THREADS.chocolate.thread_bad_message.name); // default

      // Birds sub-threads
      convo.addMessage(THREADS.birds.thread_yes.message, THREADS.birds.thread_yes.name); // user says YES
      convo.addMessage(THREADS.birds.thread_no.message, THREADS.birds.thread_no.name); // user says NO
      convo.addMessage(THREADS.birds.thread_bad_message.message, THREADS.birds.thread_bad_message.name); // default


      convo.addMessage({
        text: 'Entering now the cheese thread.'
      }, THREADS.cheese.name);
      convo.addMessage({
        text: 'And a second message on the cheese thread.'
      }, THREADS.cheese.name);

      convo.addMessage({
        text: 'Entering now the chocolate thread.'
      }, THREADS.chocolate.name);
      convo.addMessage({
        text: 'And a second message on the chocolate thread.'
      }, THREADS.chocolate.name);

      convo.addMessage({
        text: 'Entering now the birds thread.'
      }, THREADS.birds.name);
      convo.addMessage({
        text: 'And a second message on the birds thread.'
      }, THREADS.birds.name);


      questions.map(function (ask) {
        ask(convo, bot);
      });

      convo.activate();

      // capture the results of the conversation and see what happened...
      convo.on('end', function (convo) {

        if (convo.successful()) {
          // this still works to send individual replies...
          bot.reply(message, 'Success. Bye!');

          // and now deliver cheese via tcp/ip...
        } else {
          bot.reply(message, 'No success. Bye!');
        }

      });
    });

  });

}
;
