import {app, Parse} from './server'
import bodyParser from 'body-parser'
import config from 'config';
import crypto from 'crypto';
import * as _ from 'underscore';
import rp from 'request-promise';
//import parseExpressHttpsRedirect from 'parse-express-https-redirect'
//import parseExpressCookieSession from './src/parse-express-cookie-session/index'

// App Secret can be retrieved from the App Dashboard
const APP_SECRET = (process.env.MESSENGER_APP_SECRET) ? process.env.MESSENGER_APP_SECRET : config.get('APP_SECRET');

// Arbitrary value used to validate a webhook
const VALIDATION_TOKEN = (process.env.MESSENGER_VALIDATION_TOKEN) ? (process.env.MESSENGER_VALIDATION_TOKEN) : config.get('VALIDATION_TOKEN');

// Generate a page access token for your page from the App Dashboard
const PAGE_ACCESS_TOKEN = (process.env.MESSENGER_PAGE_ACCESS_TOKEN) ? (process.env.MESSENGER_PAGE_ACCESS_TOKEN) : config.get('PAGE_ACCESS_TOKEN');

// URL where the app is running (include protocol). Used to point to scripts and
// assets located at this address.
const SERVER_URL = (process.env.SERVER_URL) ? (process.env.SERVER_URL) : config.get('SERVER_URL');

const FACEBOOK_APP_ID = (process.env.FACEBOOK_APP_ID) ? (process.env.FACEBOOK_APP_ID) : config.get('FACEBOOK_APP_ID');

const FACEBOOK_GRAPH = (process.env.FACEBOOK_GRAPH) ? (process.env.FACEBOOK_GRAPH) : config.get('FACEBOOK_GRAPH');

const REDIRECT_URI = (process.env.REDIRECT_URI) ? (process.env.REDIRECT_URI) : config.get('REDIRECT_URI');

const limit = 9;

if (!(APP_SECRET && VALIDATION_TOKEN && PAGE_ACCESS_TOKEN && SERVER_URL)) {
    console.error("Missing config values");
    process.exit(1);
}

app.use(bodyParser.json({ verify: verifyRequestSignature }));
//app.use(parseExpressHttpsRedirect());
//app.use(parseExpressCookieSession({ fetchUser: true }));

let listener = {};
let buffer = {};
let rules = new Map();
let payloadRules = new Map();

/*
 * Verify that the callback came from Facebook. Using the App Secret from
 * the App Dashboard, we can verify the signature that is sent with each
 * callback in the x-hub-signature field, located in the header.
 *
 * https://developers.facebook.com/docs/graph-api/webhooks#setup
 *
 */
function verifyRequestSignature(req, res, buf) {
    let signature = req.headers["x-hub-signature"];

    if (!signature) {
        // For testing, let's log an error. In production, you should throw an
        // error.
        console.error("Couldn't validate the signature.");
    } else {
        let elements = signature.split('=');
        let method = elements[0];
        let signatureHash = elements[1];

        //console.log(signature);

        let expectedHash = crypto.createHmac('sha1', APP_SECRET)
            .update(buf)
            .digest('hex');

        if (signatureHash != expectedHash) {
            throw new Error("Couldn't validate the request signature.");
        }
    }
}

/*
 * Authorization Event
 *
 * The value for 'optin.ref' is defined in the entry point. For the "Send to
 * Messenger" plugin, it is the 'data-ref' field. Read more at
 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/authentication
 *
 */
function receivedAuthentication(event) {
    let senderID = event.sender.id;
    let recipientID = event.recipient.id;
    let timeOfAuth = event.timestamp;

    // The 'ref' field is set in the 'Send to Messenger' plugin, in the 'data-ref'
    // The developer can set this to an arbitrary value to associate the
    // authentication callback with the 'Send to Messenger' click event. This is
    // a way to do account linking when the user clicks the 'Send to Messenger'
    // plugin.

    senderID = parseInt(senderID);
    let passThroughParam = event.optin.ref;

    console.log("Received authentication for user %d and page %d with pass " +
        "through param '%s' at %d", senderID, recipientID, passThroughParam,
        timeOfAuth);

    // When an authentication is received, we'll send a message back to the sender
    // to let them know it was successful.
    sendTextMessage(senderID, "Authentication successful");
}

/*
 * Message Event
 *
 * This event is called when a message is sent to your page. The 'message'
 * object format can lety depending on the kind of message that was received.
 * Read more at https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-received
 *
 * For this example, we're going to echo any text that we get. If we get some
 * special keywords ('button', 'generic', 'receipt'), then we'll send back
 * examples of those bubbles to illustrate the special message bubbles we've
 * created. If we receive a message with an attachment (image, video, audio),
 * then we'll simply confirm that we've received the attachment.
 *
 */
function receivedMessage(event) {
    let senderID = event.sender.id;
    let recipientID = event.recipient.id;
    let timeOfMessage = event.timestamp;
    let message = event.message;

    //console.log("Received message for user %d and page %d at %d with message:", senderID, recipientID, timeOfMessage);
    //console.log(JSON.stringify(message));

    let isEcho = message.is_echo;
    let messageId = message.mid;
    let appId = message.app_id;
    let metadata = message.metadata;

    // You may get a text or attachment but not both
    let messageText = message.text;
    let messageAttachments = message.attachments;
    let quickReply = message.quick_reply;

    senderID = parseInt(senderID);

    if (isEcho) {
        // Just logging message echoes to console
        console.log("Received echo for message %s and app %d with metadata %s",
            messageId, appId, metadata);
        return;
    }
    else if (quickReply) {
        let quickReplyPayload = quickReply.payload;
        //console.log("Quick reply for message %s with payload %s", messageId, quickReplyPayload);
        let payloadFunction;

        if(quickReplyPayload.includes('-')){
            let params = quickReplyPayload.split('-');
            payloadFunction = payloadRules.get(params[0]);
            //console.log(senderID);
            //console.log(typeof senderID);
            if(payloadFunction){
                payloadFunction(senderID, params[1]);
            }
        }else{
            payloadFunction = payloadRules.get(quickReplyPayload)

            if(payloadFunction){
                payloadFunction(senderID);
            }
            /*
             payloadFunction = findKeyStartsWith(payloadRules, quickReplyPayload);
             if(payloadFunction){
             payloadFunction(senderID);
             }*/
        }
        //sendTextMessage(senderID, "Quick reply tapped");

        return;
    }
    else if (messageText) {
        // If we receive a text message, check to see if it matches any special
        // keywords and send back the corresponding example. Otherwise, just echo
        // the text we received.

        //Object.keys(listener);
        let userListeners = listener[senderID];
        let existRule = false;
        //console.log(senderID);
        //console.log(typeof senderID);

        if(!_.isEmpty(userListeners)){
            if(!buffer[senderID]){
                buffer[senderID] = {}
            }
            let keys = Object.keys(userListeners);
            let key = keys.shift();

            //console.log('User Listeners');

            while(key){
                //console.log(key);
                if(userListeners[key].type == 'text'){
                    buffer[senderID][key] = messageText;
                    userListeners[key].callback(senderID);
                    existRule = true;
                }
                delete userListeners[key];
                key = keys.shift();
            }
        }
        else{
            messageText = messageText.toLowerCase()

            rules.forEach(function (value, key){
                if(messageText.includes(key)){
                    value(senderID);
                    existRule = true;
                }
            });
        }

        if(!existRule){
            //console.log(messageText);
            //console.log(defaultSearch);
            defaultSearch(senderID, messageText);
        }
        /*


         switch (messageText) {
         case 'image':
         sendImageMessage(senderID);
         break;

         case 'gif':
         sendGifMessage(senderID);
         break;

         case 'audio':
         sendAudioMessage(senderID);
         break;

         case 'video':
         sendVideoMessage(senderID);
         break;

         case 'file':
         sendFileMessage(senderID);
         break;

         case 'button':
         sendButtonMessage(senderID);
         break;

         case 'generic':
         sendGenericMessage(senderID);
         break;

         case 'receipt':
         sendReceiptMessage(senderID);
         break;

         case 'quick reply':
         sendQuickReply(senderID);
         break;

         case 'read receipt':
         sendReadReceipt(senderID);
         break;

         case 'typing on':
         sendTypingOn(senderID);
         break;

         case 'typing off':
         sendTypingOff(senderID);
         break;

         case 'account linking':
         sendAccountLinking(senderID);
         break;

         default:
         sendTextMessage(senderID, messageText);
         }
         /*
         if (messageText.indexOf("hola") > -1){
         sendMenuMessage(senderID);
         }
         else if (messageText.indexOf("buenos dias") > -1){
         sendMenuMessage(senderID);
         }
         else if (messageText.indexOf("menu del dia") > -1){
         sendMenuMessage(senderID);
         }
         else if (messageText.indexOf("cuenta") > -1){
         sendBillMessage(senderID);
         }
         */
    }
    else if (messageAttachments) {
        if(messageAttachments[0].type == 'location'){
            let location = messageAttachments[0].payload.coordinates;
            let userListeners = listener[senderID];
            //console.log(senderID);
            //console.log(typeof senderID);
            if(!_.isEmpty(userListeners)){
                if(!buffer[senderID]){
                    buffer[senderID] = {}
                }
                let keys = Object.keys(userListeners);
                let key = keys.shift();

                while(key){
                    console.log(key);
                    if(userListeners[key].type == 'attachment'){
                        buffer[senderID][key] = {lat: location.lat, lng: location.long};
                        userListeners[key].callback(senderID);
                    }
                    delete userListeners[key]
                    key = keys.shift();
                }
            }
        }
        //sendTextMessage(senderID, "Message with attachment received");
    }

}

/*
 * Delivery Confirmation Event
 *
 * This event is sent to confirm the delivery of a message. Read more about
 * these fields at https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-delivered
 *
 */
function receivedDeliveryConfirmation(event) {
    let senderID = event.sender.id;
    let recipientID = event.recipient.id;
    let delivery = event.delivery;
    let messageIDs = delivery.mids;
    let watermark = delivery.watermark;
    let sequenceNumber = delivery.seq;

    senderID = parseInt(senderID);

    if (messageIDs) {
        messageIDs.forEach(function(messageID) {
            //console.log("Received delivery confirmation for message ID: %s", messageID);
        });
    }

    //console.log("All message before %d were delivered.", watermark);
}

/*
 * Postback Event
 *
 * This event is called when a postback is tapped on a Structured Message.
 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/postback-received
 *
 */
function receivedPostback(event) {
    let senderID = event.sender.id;
    let recipientID = event.recipient.id;
    let timeOfPostback = event.timestamp;

    // The 'payload' param is a developer-defined field which is set in a postback
    // button for Structured Messages.
    let payload = event.postback.payload;

    //console.log("Received postback for user %d and page %d with payload '%s' " + "at %d", senderID, recipientID, payload, timeOfPostback);

    // When a postback is called, we'll send a message back to the sender to
    // let them know it was successful

    let payloadFunction;

    let params = payload.split('-');

    payloadFunction = payloadRules.get(params[0]);
    senderID = parseInt(senderID);

    //console.log(senderID);
    //console.log(typeof senderID);

    if(payloadFunction){
        switch (params.length){
            case 1:
                payloadFunction(senderID);
                break;
            case 2:
                payloadFunction(senderID, params[1]);
                break;
            case 3:
                payloadFunction(senderID, params[1], params[2]);
                break;
            default:
                console.log('Payload not found: '+params)
        }
    }

    /*
    if(payload == 'Greeting'){
        sendMenuMessage(senderID);
    }
    else if(payload == 'Delivery'){
        sendMenuMessage(senderID);
    }
    else if(payload.startsWith("ListCategories")){
        let params = payload.split("-");
        console.log("List Categories");
        console.log(params);
        listCategories(senderID, parseInt(params[1]));
    }
    else if(payload.startsWith("ListProducts")){
        let params = payload.split("-");
        listProducts(senderID, params[1], parseInt(params[2]));
    }
    else if(payload.startsWith("Add")){
        let params = payload.split("-");
        addProduct(params[1]);
    }
    else if(payload.startsWith("ShoppingCart")){
        sendBillMessage(senderID);
    }
    else{
        sendTextMessage(senderID, "Postback called "+payload);
    }
    */
}

/*
 * Message Read Event
 *
 * This event is called when a previously-sent message has been read.
 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-read
 *
 */
function receivedMessageRead(event) {
    let senderID = event.sender.id;
    let recipientID = event.recipient.id;

    // All messages before watermark (a timestamp) or sequence have been seen.
    let watermark = event.read.watermark;
    let sequenceNumber = event.read.seq;

    senderID = parseInt(senderID);

    console.log("Received message read event for watermark %d and sequence " +
        "number %d", watermark, sequenceNumber);
}

/*
 * Account Link Event
 *
 * This event is called when the Link Account or UnLink Account action has been
 * tapped.
 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/account-linking
 *
 */
function receivedAccountLink(event) {
    let senderID = event.sender.id;
    let recipientID = event.recipient.id;

    let status = event.account_linking.status;
    let authCode = event.account_linking.authorization_code;

    senderID = parseInt(senderID);

    console.log("Received account link event with for user %d with status %s " +
        "and auth code %s ", senderID, status, authCode);
}

/*
 * Call the Send API. The message data goes in the body. If successful, we'll
 * get the message id in a response
 *
 */
function callSendAPI(messageData, callback) {
    return rp({
        uri: FACEBOOK_GRAPH+'me/messages',
        qs: { access_token: PAGE_ACCESS_TOKEN },
        method: 'POST',
        json: messageData
    }).catch(error =>{
        console.log('error');
        console.log(error);
    });
}

function testAPI(){
    return rp({
        uri: FACEBOOK_GRAPH+'me?fields=name,email,age_range,birthday,is_verified,location',
        qs: { access_token: PAGE_ACCESS_TOKEN },
        method: 'GET'
    }).then( response => {
        console.log('Successful login for: ' + response.name);
        console.log('Thanks for logging in, ' + response.email + '!');
        console.log(response);
    }).catch(error =>{
        console.log('error');
        console.log(error);
    });
}

/*
 * Turn typing indicator on
 *
 */
function sendTypingOn(recipientId) {
    //console.log("Turning typing indicator on");

    let messageData = {
        recipient: {
            id: recipientId
        },
        sender_action: "typing_on"
    };

    callSendAPI(messageData);
}

/*
 * Turn typing indicator off
 *
 */
function sendTypingOff(recipientId) {
    //console.log("Turning typing indicator off");

    let messageData = {
        recipient: {
            id: recipientId
        },
        sender_action: "typing_off"
    };

    callSendAPI(messageData);
}

/*
 * Send a text message using the Send API.
 *
 */
function sendTextMessage(recipientId, messageText) {
    let messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            text: messageText,
            metadata: "DEVELOPER_DEFINED_METADATA"
        }
    };

    callSendAPI(messageData);
}

/*
 * Send an image using the Send API.
 *
 */
function sendImageMessage(recipientId) {
    let messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            attachment: {
                type: "image",
                payload: {
                    url: SERVER_URL + "/assets/rift.png"
                }
            }
        }
    };

    callSendAPI(messageData);
}

/*
 * Send a Gif using the Send API.
 *
 */
function sendGifMessage(recipientId) {
    let messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            attachment: {
                type: "image",
                payload: {
                    url: SERVER_URL + "/assets/instagram_logo.gif"
                }
            }
        }
    };

    callSendAPI(messageData);
}

/*
 * Send audio using the Send API.
 *
 */
function sendAudioMessage(recipientId) {
    let messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            attachment: {
                type: "audio",
                payload: {
                    url: SERVER_URL + "/assets/sample.mp3"
                }
            }
        }
    };

    callSendAPI(messageData);
}

/*
 * Send a video using the Send API.
 *
 */
function sendVideoMessage(recipientId) {
    let messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            attachment: {
                type: "video",
                payload: {
                    url: SERVER_URL + "/assets/allofus480.mov"
                }
            }
        }
    };

    callSendAPI(messageData);
}

/*
 * Send a video using the Send API.
 *
 */
function sendFileMessage(recipientId) {
    let messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            attachment: {
                type: "file",
                payload: {
                    url: SERVER_URL + "/assets/test.txt"
                }
            }
        }
    };

    callSendAPI(messageData);
}

/*
 * Send a button message using the Send API.
 *
 */
function sendButtonMessage(recipientId) {
    let messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            attachment: {
                type: "template",
                payload: {
                    template_type: "button",
                    text: "This is test text",
                    buttons:[{
                        type: "web_url",
                        url: "https://www.oculus.com/en-us/rift/",
                        title: "Open Web URL"
                    }, {
                        type: "postback",
                        title: "Trigger Postback",
                        payload: "DEVELOPED_DEFINED_PAYLOAD"
                    }, {
                        type: "phone_number",
                        title: "Call Phone Number",
                        payload: "+16505551234"
                    }]
                }
            }
        }
    };

    callSendAPI(messageData);
}

/*
 * Send a Structured Message (Generic Message type) using the Send API.
 *
 */
function sendGenericMessage(recipientId) {
    let messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            attachment: {
                type: "template",
                payload: {
                    template_type: "generic",
                    elements: [{
                        title: "rift",
                        subtitle: "Next-generation virtual reality",
                        item_url: "https://www.oculus.com/en-us/rift/",
                        image_url: SERVER_URL + "/assets/rift.png",
                        buttons: [{
                            type: "web_url",
                            url: "https://www.oculus.com/en-us/rift/",
                            title: "Open Web URL"
                        }, {
                            type: "postback",
                            title: "Call Postback",
                            payload: "Payload for first bubble",
                        }],
                    }, {
                        title: "touch",
                        subtitle: "Your Hands, Now in VR",
                        item_url: "https://www.oculus.com/en-us/touch/",
                        image_url: SERVER_URL + "/assets/touch.png",
                        buttons: [{
                            type: "web_url",
                            url: "https://www.oculus.com/en-us/touch/",
                            title: "Open Web URL"
                        }, {
                            type: "postback",
                            title: "Call Postback",
                            payload: "Payload for second bubble",
                        }]
                    }]
                }
            }
        }
    };

    callSendAPI(messageData);
}

/*
 * Send a receipt message using the Send API.
 *
 */
function sendReceiptMessage(recipientId) {
    // Generate a random receipt ID as the API requires a unique ID
    let receiptId = "order" + Math.floor(Math.random()*1000);

    let messageData = {
        recipient: {
            id: recipientId
        },
        message:{
            attachment: {
                type: "template",
                payload: {
                    template_type: "receipt",
                    recipient_name: "Peter Chang",
                    order_number: receiptId,
                    currency: "COP",
                    payment_method: "Visa 1234",
                    timestamp: "1428444852",
                    elements: [{
                        title: "Oculus Rift",
                        subtitle: "Includes: headset, sensor, remote",
                        quantity: 1,
                        price: 599.00,
                        currency: "USD",
                        image_url: SERVER_URL + "/assets/riftsq.png"
                    }, {
                        title: "Samsung Gear VR",
                        subtitle: "Frost White",
                        quantity: 1,
                        price: 99.99,
                        currency: "USD",
                        image_url: SERVER_URL + "/assets/gearvrsq.png"
                    }],
                    address: {
                        street_1: "1 Hacker Way",
                        street_2: "",
                        city: "Menlo Park",
                        postal_code: "94025",
                        state: "CA",
                        country: "US"
                    },
                    summary: {
                        subtotal: 698.99,
                        shipping_cost: 20.00,
                        total_tax: 57.67,
                        total_cost: 626.66
                    },
                    adjustments: [{
                        name: "New Customer Discount",
                        amount: -50
                    }, {
                        name: "$100 Off Coupon",
                        amount: -100
                    }]
                }
            }
        }
    };

    callSendAPI(messageData);
}

/*
 * Send a message with Quick Reply buttons.
 *
 */
function sendQuickReply(recipientId) {
    let messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            text: "What's your favorite movie genre?",
            metadata: "DEVELOPER_DEFINED_METADATA",
            quick_replies: [
                {
                    "content_type":"text",
                    "title":"Action",
                    "payload":"DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_ACTION"
                },
                {
                    "content_type":"text",
                    "title":"Comedy",
                    "payload":"DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_COMEDY"
                },
                {
                    "content_type":"text",
                    "title":"Drama",
                    "payload":"DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_DRAMA"
                }
            ]
        }
    };

    callSendAPI(messageData);
}

/*
 * Send a read receipt to indicate the message has been read
 *
 */
function sendReadReceipt(recipientId) {
    console.log("Sending a read receipt to mark message as seen");

    let messageData = {
        recipient: {
            id: recipientId
        },
        sender_action: "mark_seen"
    };

    callSendAPI(messageData);
}

/*
 * Send a message with the account linking call-to-action
 *
 */
function sendAccountLinking(recipientId) {
    let messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            attachment: {
                type: "template",
                payload: {
                    template_type: "button",
                    text: "Welcome. Link your account.",
                    buttons:[{
                        type: "account_link",
                        url: SERVER_URL + "/authorize"
                    }]
                }
            }
        }
    };

    callSendAPI(messageData);
}

function findKeyStartsWith(map, str){
    for (let [key, value] of map) {
        if(key.startsWith(str))
            return value;
    }
    return undefined;
}

function setListener(recipientId, dataId, type, callback){
    if(typeof listener[recipientId] == 'undefined'){
        listener[recipientId] = {};
    }

    listener[recipientId][dataId] = {callback: callback, type: type};
}

function getListener(recipientId, dataId){
    if(typeof listener[recipientId] == 'undefined'){
        return undefined
    }

    return listener[recipientId][dataId];
}

function deleteListener(recipientId, dataId){
    if(!listener[recipientId]){
        return false
    }

    delete listener[recipientId][dataId]
    return true

}

function setDataBuffer(recipientId, key, value){
    if(!buffer[recipientId]){
        buffer[recipientId] = {}
    }
    buffer[recipientId][key] = value;
}

function defaultSearch(recipientId, query){
    //console.log('defaultSearch');
    //console.log(search);
    let search = payloadRules.get('Search');

    if(search){
        search(recipientId, query);
    }
};

/*
 * Use your own validation token. Check that the token used in the Webhook
 * setup is the same token used here.
 *
 */
app.get('/webhook', function (req, res) {
    if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === VALIDATION_TOKEN) {
        console.log("Validating webhook");
        res.status(200).send(req.query['hub.challenge']);
    } else {
        console.error("Failed validation. Make sure the validation tokens match.");
        res.sendStatus(403);
    }
});

/*
 * All callbacks for Messenger are POST-ed. They will be sent to the same
 * webhook. Be sure to subscribe your app to your page to receive callbacks
 * for your page.
 * https://developers.facebook.com/docs/messenger-platform/product-overview/setup#subscribe_app
 *
 */
app.post('/webhook', function (req, res) {
    let data = req.body;

    // Make sure this is a page subscription
    if (data.object == 'page') {
        // Iterate over each entry
        // There may be multiple if batched
        data.entry.forEach(function (pageEntry) {
            let pageID = pageEntry.id;
            let timeOfEvent = pageEntry.time;

            // Iterate over each messaging event
            pageEntry.messaging.forEach(function (messagingEvent) {
                //console.log(messagingEvent);
                if (messagingEvent.optin) {
                    receivedAuthentication(messagingEvent);
                } else if (messagingEvent.message) {
                    receivedMessage(messagingEvent);
                } else if (messagingEvent.delivery) {
                    receivedDeliveryConfirmation(messagingEvent);
                } else if (messagingEvent.postback) {
                    receivedPostback(messagingEvent);
                } else if (messagingEvent.read) {
                    receivedMessageRead(messagingEvent);
                } else if (messagingEvent.account_linking) {
                    receivedAccountLink(messagingEvent);
                } else {
                    console.log("Webhook received unknown messagingEvent: ", messagingEvent);
                }
            });
        });

        // Assume all went well.
        //
        // You must send back a 200, within 20 seconds, to let us know you've
        // successfully received the callback. Otherwise, the request will time out.
        res.sendStatus(200);
    }
});

/*
 * This path is used for account linking. The account linking call-to-action
 * (sendAccountLinking) is pointed to this URL.
 *
 */
app.get('/authorize', function (req, res) {
    let accountLinkingToken = req.query['account_linking_token'];
    let redirectURI = req.query['redirect_uri'];

    // Authorization Code should be generated per user by the developer. This will
    // be passed to the Account Linking callback.
    let authCode = "1234567890";

    // Redirect users to this URI on successful login
    let redirectURISuccess = redirectURI + "&authorization_code=" + authCode;

    res.render('authorize', {
        accountLinkingToken: accountLinkingToken,
        redirectURI: redirectURI,
        redirectURISuccess: redirectURISuccess
    });
});

// Start server
// Webhooks must be available via SSL with a certificate signed by a valid
// certificate authority.
app.listen(app.get('port'), function() {
    //console.log('Node app is running on port', app.get('port'));
});

module.exports = {app, Parse, rules, payloadRules, buffer, listener, limit, defaultSearch, callSendAPI, sendTypingOn, sendTypingOff, setListener, getListener, deleteListener, setDataBuffer, testAPI};
