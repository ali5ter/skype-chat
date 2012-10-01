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
            log('An error occured:' + err);
        });

        session.on('message', function (msg) {
            var _msg = JSON.parse(msg),
                _response = {
                    'chat': {'id': _msg.chat.id},
                    'body': 'Got your message: '+ _msg.body
                };
            log('Message ('+ count + ' of '+ maxMsgs + ') received: ' + msg);
            if (_msg.date < now) return;
            if (count < maxMsgs) {
                log('Response sent: ' + JSON.stringify(_response));
                skype.send(_response);
                count++;
            } else {
                skype.stop();
                process.exit(0);
            }
        });
    });

}());
