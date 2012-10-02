(function () {
    'use strict';

    var config = require('./config.json'),
        SkypeChat = require('../index'),
        skype = new SkypeChat(config.account),
        session = null,
        count = 1,
        maxMsgs = 3,
        now = Math.round(new Date().getTime() / 1000);

    function log(msg) {
        console.log('[skype_chat test] %s', msg);
    }

    log('Start a Skype chat session...');

    session = skype.start(function () {
        log ('Session started and listening for messages.');

        session.on('stopped', function () {
            log('The chat session closed.');
        });

        session.on('error', function (err) {
            log('An error occured:'+ err);
        });

        session.on('message', function (msg) {
            // TODO: Abstract message object:
            // * parse JSON object before passing back
            // * method to create msg object as response
            // * automatically filter out own messages
            // * option to filter out old messages
            var _msg = JSON.parse(msg),
                _response = {
                    'body': 'Got your message... '+ _msg.body,
                    'chat': {'id': config.account.user}
                };
            log('Message received: '+ msg);
            //if (_msg.date < now && _msg.chat.id != config.account.user) return;
            if (_msg.date < now) return;
            log('Response ('+ count +' of '+ maxMsgs +') sent: '+
                JSON.stringify(_response));
            skype.send(_response);
            count++;
            if (count > maxMsgs) {
                skype.stop();
                process.exit(0);
            }
        });
    });

}());
