var bridge = require('ws').Server,
    events = require('events'),
    adapter = require('./adapter');

function SkypeChatSession (account) {
    'use strict';

    this.account = account;
    this.connection = {port: 8180};
    this.emitter = new events.EventEmitter();
    this.server = null;
    this.client = null;
    this.websocket =null;
    this.log = function (msg) {
        console.log('[skype_chat] %s', msg.toString().replace(/\n$/, ''));
    };
    this.onStart = function() {
        this.log('Session started and listening for messages.');
    };
}

module.exports = SkypeChatSession;

(function () {
    'use strict';

    SkypeChatSession.prototype.start = function (callback) {

        if (typeof callback === 'function') {
            this.onStart = callback;
        }

        var self = this;

        this.server = new bridge(this.connection);

        this.server.on('connection', function(con) {

            self.log('Connected to Skype adapter.');

            self.websocket = con;

            con.on('error', function (err) {
                self.emitter.emit('error', err);
            });

            con.on('message', function (msg) {
                self.emitter.emit('message', msg);
            });

            self.onStart();
        });

        self.client = new adapter(self.account, self.connection);
        self.client.start();

        return this.emitter;
    };

    SkypeChatSession.prototype.send = function (msg) {
        this.websocket.send(JSON.stringify(msg));
    };

    SkypeChatSession.prototype.stop = function () {
        this.client.stop();
        this.server.close();
        this.emitter.emit('stopped');
    };
})();
