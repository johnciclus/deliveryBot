'use strict';var _slicedToArray=function(){function sliceIterator(arr,i){var _arr=[];var _n=true;var _d=false;var _e=undefined;try{for(var _i=arr[Symbol.iterator](),_s;!(_n=(_s=_i.next()).done);_n=true){_arr.push(_s.value);if(i&&_arr.length===i)break;}}catch(err){_d=true;_e=err;}finally{try{if(!_n&&_i["return"])_i["return"]();}finally{if(_d)throw _e;}}return _arr;}return function(arr,i){if(Array.isArray(arr)){return arr;}else if(Symbol.iterator in Object(arr)){return sliceIterator(arr,i);}else{throw new TypeError("Invalid attempt to destructure non-iterable instance");}};}();var _server=require('./server');var _bodyParser=require('body-parser');var _bodyParser2=_interopRequireDefault(_bodyParser);var _config=require('config');var _config2=_interopRequireDefault(_config);var _crypto=require('crypto');var _crypto2=_interopRequireDefault(_crypto);var _underscore=require('underscore');var _=_interopRequireWildcard(_underscore);var _requestPromise=require('request-promise');var _requestPromise2=_interopRequireDefault(_requestPromise);function _interopRequireWildcard(obj){if(obj&&obj.__esModule){return obj;}else{var newObj={};if(obj!=null){for(var key in obj){if(Object.prototype.hasOwnProperty.call(obj,key))newObj[key]=obj[key];}}newObj.default=obj;return newObj;}}function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj};}var APP_SECRET=process.env.MESSENGER_APP_SECRET?process.env.MESSENGER_APP_SECRET:_config2.default.get('APP_SECRET');var VALIDATION_TOKEN=process.env.MESSENGER_VALIDATION_TOKEN?process.env.MESSENGER_VALIDATION_TOKEN:_config2.default.get('VALIDATION_TOKEN');var SERVER_URL=process.env.SERVER_URL?process.env.SERVER_URL:_config2.default.get('SERVER_URL');var FACEBOOK_GRAPH=process.env.FACEBOOK_GRAPH?process.env.FACEBOOK_GRAPH:_config2.default.get('FACEBOOK_GRAPH');var BUSINESS=_config2.default.get('BUSINESS');var limit=9;if(!(APP_SECRET&&VALIDATION_TOKEN&&BUSINESS&&SERVER_URL)){console.error("Missing config values");process.exit(1);}_server.app.use(_bodyParser2.default.json({verify:verifyRequestSignature}));//app.use(parseExpressHttpsRedirect());
//app.use(parseExpressCookieSession({ fetchUser: true }));
var listener={};var buffer={};var rules=new Map();var payloadRules=new Map();/*
 * Verify that the callback came from Facebook. Using the App Secret from
 * the App Dashboard, we can verify the signature that is sent with each
 * callback in the x-hub-signature field, located in the header.
 *
 * https://developers.facebook.com/docs/graph-api/webhooks#setup
 *
 */function verifyRequestSignature(req,res,buf){var signature=req.headers["x-hub-signature"];if(!signature){// For testing, let's log an error. In production, you should throw an
// error.
console.error("Couldn't validate the signature.");}else{var elements=signature.split('=');var method=elements[0];var signatureHash=elements[1];//console.log(signature);
var expectedHash=_crypto2.default.createHmac('sha1',APP_SECRET).update(buf).digest('hex');if(signatureHash!=expectedHash){throw new Error("Couldn't validate the request signature.");}}}/*
 * Authorization Event
 *
 * The value for 'optin.ref' is defined in the entry point. For the "Send to
 * Messenger" plugin, it is the 'data-ref' field. Read more at
 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/authentication
 *
 */function receivedAuthentication(event){var senderID=event.sender.id;var recipientID=event.recipient.id;var timeOfAuth=event.timestamp;// The 'ref' field is set in the 'Send to Messenger' plugin, in the 'data-ref'
// The developer can set this to an arbitrary value to associate the
// authentication callback with the 'Send to Messenger' click event. This is
// a way to do account linking when the user clicks the 'Send to Messenger'
// plugin.
senderID=parseInt(senderID);recipientID=parseInt(recipientID);var passThroughParam=event.optin.ref;console.log("Received authentication for user %d and page %d with pass "+"through param '%s' at %d",senderID,recipientID,passThroughParam,timeOfAuth);// When an authentication is received, we'll send a message back to the sender
// to let them know it was successful.
sendTextMessage(senderID,recipientID,"Authentication successful");}/*
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
 */function receivedMessage(event){var senderID=event.sender.id;var recipientID=event.recipient.id;var timeOfMessage=event.timestamp;var message=event.message;//console.log("Received message for user %d and page %d at %d with message:", senderID, recipientID, timeOfMessage);
//console.log(JSON.stringify(message));
var isEcho=message.is_echo;var messageId=message.mid;var appId=message.app_id;var metadata=message.metadata;// You may get a text or attachment but not both
var messageText=message.text;var messageAttachments=message.attachments;var quickReply=message.quick_reply;senderID=parseInt(senderID);recipientID=parseInt(recipientID);if(isEcho){// Just logging message echoes to console
console.log("Received echo for message %s and app %d with metadata %s",messageId,appId,metadata);return;}else if(quickReply){var quickReplyPayload=quickReply.payload;//console.log("Quick reply for message %s with payload %s", messageId, quickReplyPayload);
var payloadFunction=void 0;if(quickReplyPayload.includes('-')){var params=quickReplyPayload.split('-');payloadFunction=payloadRules.get(params[0]);//console.log(senderID);
//console.log(typeof senderID);
if(typeof payloadFunction=='function'){if(params.length==4){payloadFunction(senderID,recipientID,params[1],params[2],params[3]);}else if(params.length==3){payloadFunction(senderID,recipientID,params[1],params[2]);}else{payloadFunction(senderID,recipientID,params[1]);}}}else{payloadFunction=payloadRules.get(quickReplyPayload);if(payloadFunction){payloadFunction(senderID,recipientID);}}}else if(messageText){// If we receive a text message, check to see if it matches any special
// keywords and send back the corresponding example. Otherwise, just echo
// the text we received.
//Object.keys(listener);
var userListeners=listener[senderID];var existRule=false;if(!_.isEmpty(userListeners)){if(!buffer[senderID]){buffer[senderID]={};}var keys=Object.keys(userListeners);var key=keys.shift();//console.log('User Listeners');
while(key){//console.log(key);
if(userListeners[key].type=='text'){buffer[senderID][key]=messageText;userListeners[key].callback(senderID,recipientID);existRule=true;}delete userListeners[key];key=keys.shift();}}else{messageText=messageText.toLowerCase();rules.forEach(function(func,key){if(messageText.includes(key)){func(senderID,recipientID);existRule=true;}});}if(!existRule){//console.log(messageText);
//console.log(defaultSearch);
defaultSearch(senderID,recipientID,messageText);}}else if(messageAttachments){if(messageAttachments[0].type=='location'){var location=messageAttachments[0].payload.coordinates;var _userListeners=listener[senderID];//console.log(senderID);
//console.log(typeof senderID);
if(!_.isEmpty(_userListeners)){if(!buffer[senderID]){buffer[senderID]={};}var _keys=Object.keys(_userListeners);var _key=_keys.shift();while(_key){//console.log(key);
if(_userListeners[_key].type=='attachment'){buffer[senderID][_key]={lat:location.lat,lng:location.long};_userListeners[_key].callback(senderID,recipientID);}delete _userListeners[_key];_key=_keys.shift();}}}//sendTextMessage(senderID, "Message with attachment received");
}}/*
 * Delivery Confirmation Event
 *
 * This event is sent to confirm the delivery of a message. Read more about
 * these fields at https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-delivered
 *
 */function receivedDeliveryConfirmation(event){var senderID=event.sender.id;var recipientID=event.recipient.id;var delivery=event.delivery;var messageIDs=delivery.mids;var watermark=delivery.watermark;var sequenceNumber=delivery.seq;senderID=parseInt(senderID);recipientID=parseInt(recipientID);if(messageIDs){messageIDs.forEach(function(messageID){//console.log("Received delivery confirmation for message ID: %s", messageID);
});}//console.log("All message before %d were delivered.", watermark);
}/*
 * Postback Event
 *
 * This event is called when a postback is tapped on a Structured Message.
 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/postback-received
 *
 */function receivedPostback(event){var senderID=event.sender.id;var recipientID=event.recipient.id;var timeOfPostback=event.timestamp;// The 'payload' param is a developer-defined field which is set in a postback
// button for Structured Messages.
var payload=event.postback.payload;//console.log("Received postback for user %d and page %d with payload '%s' " + "at %d", senderID, recipientID, payload, timeOfPostback);
// When a postback is called, we'll send a message back to the sender to
// let them know it was successful
var payloadFunction=void 0;var params=payload.split('-');payloadFunction=payloadRules.get(params[0]);senderID=parseInt(senderID);recipientID=parseInt(recipientID);//console.log(senderID);
//console.log(typeof senderID);
if(payloadFunction){switch(params.length){case 1:payloadFunction(senderID,recipientID);break;case 2:payloadFunction(senderID,recipientID,params[1]);break;case 3:payloadFunction(senderID,recipientID,params[1],params[2]);break;default:console.log('Payload not found: '+params);}}/*
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
    */}/*
 * Message Read Event
 *
 * This event is called when a previously-sent message has been read.
 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-read
 *
 */function receivedMessageRead(event){var senderID=event.sender.id;var recipientID=event.recipient.id;// All messages before watermark (a timestamp) or sequence have been seen.
var watermark=event.read.watermark;var sequenceNumber=event.read.seq;senderID=parseInt(senderID);recipientID=parseInt(recipientID);console.log("Received message read event for watermark %d and sequence "+"number %d",watermark,sequenceNumber);}/*
 * Account Link Event
 *
 * This event is called when the Link Account or UnLink Account action has been
 * tapped.
 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/account-linking
 *
 */function receivedAccountLink(event){var senderID=event.sender.id;var recipientID=event.recipient.id;var status=event.account_linking.status;var authCode=event.account_linking.authorization_code;senderID=parseInt(senderID);recipientID=parseInt(recipientID);console.log("Received account link event with for user %d with status %s "+"and auth code %s ",senderID,status,authCode);}/*
 * Call the Send API. The message data goes in the body. If successful, we'll
 * get the message id in a response
 *
 */function callSendAPI(messageData,senderId){if(BUSINESS.hasOwnProperty(senderId)){return(0,_requestPromise2.default)({uri:FACEBOOK_GRAPH+'me/messages',qs:{access_token:BUSINESS[senderId].PAGE_ACCESS_TOKEN},method:'POST',json:messageData}).catch(function(error){console.log('error');console.log(error);});}else{console.log('Error: senderId not found: '+senderId);console.log(messageData);}}function testAPI(senderId){return(0,_requestPromise2.default)({uri:FACEBOOK_GRAPH+'me?fields=name,email,age_range,birthday,is_verified,location',qs:{access_token:BUSINESS[senderId].PAGE_ACCESS_TOKEN},method:'GET'}).then(function(response){console.log('Successful login for: '+response.name);console.log('Thanks for logging in, '+response.email+'!');console.log(response);}).catch(function(error){console.log('error');console.log(error);});}/*
 * Turn typing indicator on
 *
 */function sendTypingOn(recipientId,senderId){//console.log("Turning typing indicator on");
var messageData={recipient:{id:recipientId},sender_action:"typing_on"};return callSendAPI(messageData,senderId);}/*
 * Turn typing indicator off
 *
 */function sendTypingOff(recipientId,senderId){//console.log("Turning typing indicator off");
var messageData={recipient:{id:recipientId},sender_action:"typing_off"};return callSendAPI(messageData,senderId);}/*
 * Send a text message using the Send API.
 *
 */function sendTextMessage(recipientId,senderId,messageText){var messageData={recipient:{id:recipientId},message:{text:messageText//metadata: "DEVELOPER_DEFINED_METADATA"
}};return callSendAPI(messageData,senderId);}/*
 * Send an image using the Send API.
 *
 */function sendImageMessage(recipientId,senderId,imageUrl){var messageData={recipient:{id:recipientId},message:{attachment:{type:"image",payload:{url:imageUrl}}}};return callSendAPI(messageData,senderId);}/*
 * Send a Gif using the Send API.
 *
 */function sendGifMessage(recipientId,senderId,gifUrl){var messageData={recipient:{id:recipientId},message:{attachment:{type:"image",payload:{url:SERVER_URL+gifUrl}}}};return callSendAPI(messageData,senderId);}/*
 * Send audio using the Send API.
 *
 */function sendAudioMessage(recipientId,senderId,audioUrl){var messageData={recipient:{id:recipientId},message:{attachment:{type:"audio",payload:{url:SERVER_URL+audioUrl}}}};return callSendAPI(messageData,senderId);}/*
 * Send a video using the Send API.
 *
 */function sendVideoMessage(recipientId,senderId,videoUrl){var messageData={recipient:{id:recipientId},message:{attachment:{type:"video",payload:{url:SERVER_URL+videoUrl}}}};return callSendAPI(messageData,senderId);}/*
 * Send a video using the Send API.
 *
 */function sendFileMessage(recipientId,senderId,fileUrl){var messageData={recipient:{id:recipientId},message:{attachment:{type:"file",payload:{url:SERVER_URL+fileUrl}}}};return callSendAPI(messageData,senderId);}/*
 * Send a button message using the Send API.
 *
 */function sendButtonMessage(recipientId,senderId,text,buttons){var messageData={recipient:{id:recipientId},message:{attachment:{type:"template",payload:{template_type:"button",text:text,buttons:buttons}}}};/*
     {
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
     }

    * */return callSendAPI(messageData,senderId);}/*
 * Send a Structured Message (Generic Message type) using the Send API.
 *
 */function sendGenericMessage(recipientId,senderId,elements){var messageData={recipient:{id:recipientId},message:{attachment:{type:"template",payload:{template_type:"generic",elements:elements}}}};return callSendAPI(messageData,senderId);}/*
 * Send a receipt message using the Send API.
 *
 */function sendReceiptMessage(recipientId,senderId,payload,quick_replies){// Generate a random receipt ID as the API requires a unique ID
var receiptId="order"+Math.floor(Math.random()*1000);var messageData={recipient:{id:recipientId},message:{attachment:{type:"template",payload:payload},quick_replies:quick_replies}};/*
    * {
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
    *
    * */return callSendAPI(messageData,senderId);}/*
 * Send a message with Quick Reply buttons.
 *
 */function sendQuickReplyMessage(recipientId,senderId,text,quick_replies){var messageData={recipient:{id:recipientId},message:{text:text,//metadata: "DEVELOPER_DEFINED_METADATA",
quick_replies:quick_replies}};/*

     [
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

    * */return callSendAPI(messageData,senderId);}/*
 * Send a read receipt to indicate the message has been read
 *
 */function sendReadReceipt(recipientId,senderId){console.log("Sending a read receipt to mark message as seen");var messageData={recipient:{id:recipientId},sender_action:"mark_seen"};return callSendAPI(messageData,senderId);}/*
 * Send a message with the account linking call-to-action
 *
 */function sendAccountLinking(recipientId,senderId,payload){var messageData={recipient:{id:recipientId},message:{attachment:{type:"template",payload:payload}}};/*

     {
     template_type: "button",
     text: "Welcome. Link your account.",
     buttons:[{
     type: "account_link",
     url: SERVER_URL + "/authorize"
     }]
     }

    * */return callSendAPI(messageData,senderId);}function findKeyStartsWith(map,str){var _iteratorNormalCompletion=true;var _didIteratorError=false;var _iteratorError=undefined;try{for(var _iterator=map[Symbol.iterator](),_step;!(_iteratorNormalCompletion=(_step=_iterator.next()).done);_iteratorNormalCompletion=true){var _step$value=_slicedToArray(_step.value,2),key=_step$value[0],value=_step$value[1];if(key.startsWith(str))return value;}}catch(err){_didIteratorError=true;_iteratorError=err;}finally{try{if(!_iteratorNormalCompletion&&_iterator.return){_iterator.return();}}finally{if(_didIteratorError){throw _iteratorError;}}}return undefined;}function setListener(recipientId,dataId,type,callback){if(typeof listener[recipientId]=='undefined'){listener[recipientId]={};}listener[recipientId][dataId]={callback:callback,type:type};}function getListener(recipientId,dataId){if(typeof listener[recipientId]=='undefined'){return undefined;}return listener[recipientId][dataId];}function deleteListener(recipientId,dataId){if(!listener[recipientId]){return false;}delete listener[recipientId][dataId];return true;}function setDataBuffer(recipientId,key,value){if(!buffer[recipientId]){buffer[recipientId]={};}buffer[recipientId][key]=value;}function defaultSearch(recipientId,senderId,query){console.log('defaultSearch');//console.log(search);
var search=payloadRules.get('Search');if(search){search(recipientId,senderId,query);}};/*
 * Use your own validation token. Check that the token used in the Webhook
 * setup is the same token used here.
 *
 */_server.app.get('/webhook',function(req,res){if(req.query['hub.mode']==='subscribe'&&req.query['hub.verify_token']===VALIDATION_TOKEN){console.log("Validating webhook");res.status(200).send(req.query['hub.challenge']);}else{console.error("Failed validation. Make sure the validation tokens match.");res.sendStatus(403);}});/*
 * All callbacks for Messenger are POST-ed. They will be sent to the same
 * webhook. Be sure to subscribe your app to your page to receive callbacks
 * for your page.
 * https://developers.facebook.com/docs/messenger-platform/product-overview/setup#subscribe_app
 *
 */_server.app.post('/webhook',function(req,res){var data=req.body;// Make sure this is a page subscription
if(data.object=='page'){// Iterate over each entry
// There may be multiple if batched
data.entry.forEach(function(pageEntry){var pageID=pageEntry.id;var timeOfEvent=pageEntry.time;// Iterate over each messaging event
pageEntry.messaging.forEach(function(messagingEvent){//console.log(messagingEvent);
if(messagingEvent.optin){receivedAuthentication(messagingEvent);}else if(messagingEvent.message){receivedMessage(messagingEvent);}else if(messagingEvent.delivery){receivedDeliveryConfirmation(messagingEvent);}else if(messagingEvent.postback){receivedPostback(messagingEvent);}else if(messagingEvent.read){receivedMessageRead(messagingEvent);}else if(messagingEvent.account_linking){receivedAccountLink(messagingEvent);}else{console.log("Webhook received unknown messagingEvent: ",messagingEvent);}});});// Assume all went well.
//
// You must send back a 200, within 20 seconds, to let us know you've
// successfully received the callback. Otherwise, the request will time out.
res.sendStatus(200);}});/*
 * This path is used for account linking. The account linking call-to-action
 * (sendAccountLinking) is pointed to this URL.
 *
 */_server.app.get('/authorize',function(req,res){var accountLinkingToken=req.query['account_linking_token'];var redirectURI=req.query['redirect_uri'];// Authorization Code should be generated per user by the developer. This will
// be passed to the Account Linking callback.
var authCode="1234567890";// Redirect users to this URI on successful login
var redirectURISuccess=redirectURI+"&authorization_code="+authCode;res.render('authorize',{accountLinkingToken:accountLinkingToken,redirectURI:redirectURI,redirectURISuccess:redirectURISuccess});});// Start server
// Webhooks must be available via SSL with a certificate signed by a valid
// certificate authority.
_server.app.listen(_server.app.get('port'),function(){//console.log('Node app is running on port', app.get('port'));
});module.exports={app:_server.app,Parse:_server.Parse,rules:rules,payloadRules:payloadRules,buffer:buffer,listener:listener,limit:limit,defaultSearch:defaultSearch,callSendAPI:callSendAPI,sendTypingOn:sendTypingOn,sendTypingOff:sendTypingOff,sendTextMessage:sendTextMessage,sendQuickReplyMessage:sendQuickReplyMessage,sendImageMessage:sendImageMessage,sendGifMessage:sendGifMessage,sendAudioMessage:sendAudioMessage,sendVideoMessage:sendVideoMessage,sendFileMessage:sendFileMessage,sendButtonMessage:sendButtonMessage,sendGenericMessage:sendGenericMessage,sendReceiptMessage:sendReceiptMessage,setListener:setListener,getListener:getListener,deleteListener:deleteListener,setDataBuffer:setDataBuffer,testAPI:testAPI};