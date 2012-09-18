var bridge = require('ws').Server,
    events = require('events'),
    adapter = require('./adapter');

function SkypeChatSession (account) {

    this.account = account;
    this.connection = {port: 8180};
    this.emitter = new events.EventEmitter();
    this.server = null;
    this.client = null;
    this.log = function (msg) {
        console.log('[skype_chat] %s', msg.toString().replace(/\n$/, ''));
    };
}

module.exports = SkypeChatSession;

SkypeChatSession.prototype.start = function (onStart) {

    var self = this;

    this.server = new bridge(this.connection);

    this.server.on('connection', function(con) {

        self.log('Connected to Skype adapter.');

        con.on('error', function (err) {
            self.emitter.emit('error', err);
        });

        con.on('close', function () {
            self.stop();
        });

        con.on('message', function (msg) {
            self.emitter.emit('message', msg);
        });
    });

    self.client = new adapter(self.account, self.connection);
    self.client.start(onStart);

    return this.emitter;
}

SkypeChatSession.prototype.send = function () {
    // TODO: Send message to skype adapter
}

SkypeChatSession.prototype.stop = function () {
    this.client.stop();
    this.server.close();
    this.emitter.emit('exit');
}
