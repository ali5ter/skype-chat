var events = require('events'),
    child = require('child_process'),
    path = require('path');

function SkypeChatAdapter (account, connection) {
    'use strict';

    this.account = account;
    this.connection = connection;
    this.runtime = null;
    this.emitter = new events.EventEmitter();
    this.client = null;
    this.log = function(msg) {
        console.log('[skype_chat_adapter] %s',
            msg.toString().replace(/\n$/, ''));
    };
    this.watch = function(self, process) {
        process.stdout.on('data', function (data) { self.log(data); });
        process.stderr.on('data', function (data) { self.log(data); });
        process.on('exit', function () {
            self.log('Process has terminated.');
        });
    };
}

module.exports = SkypeChatAdapter;

(function () {
    'use strict';

    SkypeChatAdapter.prototype.start = function () {

        var self = this;

        try {
            this.runtime = child.spawn(
                path.resolve(__dirname, '../support/skypekit/runtime')
            );
        } catch (e) {
            this.log('Unable to launch Skypekit runtime');
            throw e;
        }

        this.watch(self, this.runtime);

        this.runtime.on('exit', function () {
            self.client.kill();
        });

        this.runtime.stderr.on('data', function () {
            if (self.client === null) {
                process.nextTick(function () {
                    try {
                        self.client = child.spawn('python', [
                                path.resolve(__dirname, './adapter.py'),
                                self.account.user,
                                self.account.password,
                                self.connection.port
                            ]);
                    } catch (e) {
                        self.log('Unable to launch the Skypekit adapter.');
                        throw e;
                    }

                    self.watch(self, self.client);
                });
            }
        });
    };

    SkypeChatAdapter.prototype.stop = function() {
        this.client.kill();
        this.runtime.kill();
    }
})();
