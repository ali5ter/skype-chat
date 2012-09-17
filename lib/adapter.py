#!/usr/bin/env python

import websocket
import json
import sys
import os

def log(message):
    sys.stdout.write(str(message) + '\n');
    sys.stdout.flush();

sys.path.append(os.path.join(os.path.dirname(__file__),
            '../support/skypekit'))
sys.path.append(os.path.join(os.path.dirname(__file__),
            '../support/skypekit/sdk/ipc/python'))
sys.path.append(os.path.join(os.path.dirname(__file__),
            '../support/skypekit/sdk/interfaces/skype/python'))

try:
    import Skype
except ImportError:
    raise SystemExit("Adapter requires Skypekit SDK library")

user = sys.argv[1]
password = sys.argv[2]
port = sys.argv[3]

class SkypekitAdapter:

    # ------------------------------------------------------------------------
    # Start a websocket connection with the websocket server

    def __init__(self):
        log('Initializing Skypekit adapter')
        #websocket.enableTrace(True)
        try:
            ws = websocket.WebSocketApp(
                'ws://localhost:' + port + '/',
                on_message = self.onAdapterMessage,
                on_error = self.onError,
                on_close = self.onClose)
        except:
            log("Unable to make websocket connection to Skype bridge")
            raise
        self.ws = ws
        ws.on_open = self.onOpen
        ws.run_forever()

    def onError(self, ws, error):
        log(error)

    def onClose(self, ws):
        log("Adapter connection closed")

    # ------------------------------------------------------------------------
    # One websocket connected, authenticate to Skype via the runtime

    def onOpen(self, ws):

        log("Adapter connected")

        self.user = user;
        self.password = password;

        try:
            self.MySkype = Skype.GetSkype(
                    os.path.join(os.path.dirname(__file__),
                        '../support/skypekit/key.pem'))
        except Exception:
            log("Unable to create Skypekit instance")
            raise
        self.MySkype.Start();

        def accountChange(self, propertyName):
            if propertyName == 'status':
                if self.status == 'LOGGED_IN':
                    log('Logged into Skype account');

        Skype.Account.OnPropertyChange = accountChange

        try:
            self.account = self.MySkype.GetAccount(self.user)
        except:
            log('Unable to get Skype account for: ' + self.user)
            raise

        try:
            self.account.LoginWithPassword(self.password, False, False)
        except:
            log('Unable to log into Skype account for: ' + self.user)

        Skype.Skype.OnMessage = self.onSkypeMessage

    # ------------------------------------------------------------------------
    # Map a message from the Skype runtime to the websocket server

    def onSkypeMessage(self, message, changesInboxTimestamp, supersedesHistoryMessage, conversation):
        if message.author != self.user:
            userCount = len(conversation.GetParticipants())
            self.sendAdapterMessage({
                        "body": message.body_xml,
                        "date": message.timestamp,
                        "chat": {
                            "id": conversation.identity,
                            "userCount": userCount,
                            "private" :userCount <= 1
                            },
                        "sender": {
                            "id": message.author,
                            "name": message.author_displayname
                            }
                        })

    def sendAdapterMessage(self, message):
        self.ws.send(json.dumps(message))

    # ------------------------------------------------------------------------
    # Map a message from the websocket server to the Skype runtime

    def onAdapterMessage(self, ws, message):
        log("Adapter recieved message: " + message)
        try:
            data = json.loads(message)
            self.sendSkypeMessage(data['chat']['id'], data['body'])
        except Exception as err:
            log("Failed to parse data received from node: " + err.__str__())

    def sendSkypeMessage(self, chatName, message):
        log("Sending message to chat with ID " + chatName)
        Skype.Skype.GetConversationByIdentity(self.MySkype, chatName).PostText(message)

adapter = SkypekitAdapter()
