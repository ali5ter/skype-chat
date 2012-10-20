#!/usr/bin/env python

import sys, subprocess, sched, os, json, time

sys.path.append(os.path.join(os.path.dirname(__file__),
    '../support/skypekit/sdk/ipc/python'))
sys.path.append(os.path.join(os.path.dirname(__file__),
    '../support/skypekit/sdk/interfaces/skype/python'))

try:
    import Skype
except ImportError:
    raise SystemExit('Unable to find Skypekit.')

def log(msg):
    sys.stdout.write('[skypekit-test] '+ str(msg) +'\n')
    sys.stdout.flush()

class SkypekitAdapter:

    def __init__(self,account,onMessage):
        log('Initialzing Skypekit adapter.')
        self.isAuthenticated = False
        self.user = account['user']
        self.password = account['password']
        self.onMessage = onMessage
        self._startRuntime()
        self._getSkypeInstance()
        self._authenticate()
        while self.isAuthenticated == False: 
            time.sleep(1)
        log('Skypekit adpater ready.')
        Skype.Skype.OnMessage = self.onMessage

    def _startRuntime(self):
        self.rt = subprocess.Popen(
            os.path.join(os.path.dirname(__file__),
                '../support/skypekit/runtime'),
            stdin = subprocess.PIPE,
            stdout = subprocess.PIPE,
            stderr = subprocess.PIPE,
            close_fds = True)
        time.sleep(2) # TODO: Pending a callback

    def _getSkypeInstance(self):
        try:
            self.MySkype = Skype.GetSkype(
                    os.path.join(os.path.dirname(__file__),
                        '../support/skypekit/key.pem'))
        except Exception:
            log("Unable to create Skypekit instance")
            raise
        self.MySkype.Start()

    def _authenticate(self):
        this = self
        def _onActChange(self, propertyName):
            if propertyName == 'status':
                if self.status == 'LOGGED_IN':
                    this.isAuthenticated = True
                    log('Logged into Skype account')
        Skype.Account.OnPropertyChange = _onActChange
        try:
            self.account = self.MySkype.GetAccount(self.user)
        except:
            log('Unable to get Skype account for: ' + self.user)
            raise
        try:
            self.account.LoginWithPassword(self.password, False, False)
        except:
            log('Unable to log into Skype account for: ' + self.user)

    def send(self,message,recipient):
        Skype.Skype.GetConversationByIdentity(self.MySkype, recipient).PostText(message)

    def stop(self):
        self.MySkype.stop()

config_file = open('config.json')
config = json.load(config_file)
config_file.close()

def onMessage(self, message, changesInboxTimestamp, supersedesHistoryMessage, conversation):
    if message.author != config['account']['user']:
        msg = str(message.body_xml)
        log('Received: '+ msg)
        adapter.send('Got your message: '+ msg,conversation.identity)

adapter = SkypekitAdapter(config['account'], onMessage)
log('Press ENTER to quit.')
raw_input('')
log('Exiting.')
adapter.stop()
