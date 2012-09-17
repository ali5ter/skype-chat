!function () {

    var config = require('./config.json'),
        skypeChat = require('../index'),
        skype = new skypeChat(config.account),
        session = null,
        count = 0;

    skype.onStart = function () {
        log ('Session started and listening for messages.');

        session.on('stopped', function () {
            log('The chat session closed.');
        });

        session.on('error', function (err) {
            log('An error occured:' + err);
        });

        session.on('message', function (msg) {
            log('Message received: ' + msg);
            if (count < 3) {
                skype.send('Got your message.');
                count++;
            } else {
                skype.stop();
            }
        });
    }

    function log(msg) {
        console.log('[skype_chat test] %s', msg);
    }

    log('Start a Skype chat session...');
    session = skype.start();

}();
