import * as bot from './bot';
import * as types from './constants/actionTypes';
import * as Actions from './actions/index';
import { extractParseAttributes } from './parseUtils';
import {createLocalStore, getData} from './localStore'
import {Customer, User, Consumer, ConsumerAddress, Category, Product, Cart, Order, OrderItem, OrderState, Modifier, ModifierItem, OrderItemModifier, PaymentMethod, CreditCard} from './models/ParseModels';

import config from 'config';
import rp from 'request-promise';
import Promise from 'promise';
import objectAssign from 'object-assign';
import geocoder from 'geocoder';
import path from 'path';
import DateTime from 'datetime-converter-nodejs';
import dateFormat from 'dateformat'

const APP_SECRET = (process.env.MESSENGER_APP_SECRET) ? process.env.MESSENGER_APP_SECRET : config.get('APP_SECRET');

const PAGE_ACCESS_TOKEN = (process.env.MESSENGER_PAGE_ACCESS_TOKEN) ? (process.env.MESSENGER_PAGE_ACCESS_TOKEN) : config.get('PAGE_ACCESS_TOKEN');

const SERVER_URL = (process.env.SERVER_URL) ? (process.env.SERVER_URL) : config.get('SERVER_URL');

const PARSE_APP_ID = (process.env.PARSE_APP_ID) ? (process.env.PARSE_APP_ID) : config.get('PARSE_APP_ID');

const PARSE_SERVER_URL = (process.env.PARSE_SERVER_URL) ? (process.env.PARSE_SERVER_URL) : config.get('PARSE_SERVER_URL');

const PARSE_CLIENT_KEY = (process.env.PARSE_CLIENT_KEY) ? (process.env.PARSE_CLIENT_KEY) : config.get('PARSE_CLIENT_KEY');

const FACEBOOK_APP_ID = (process.env.FACEBOOK_APP_ID) ? (process.env.FACEBOOK_APP_ID) : config.get('FACEBOOK_APP_ID');

const REDIRECT_URI = (process.env.REDIRECT_URI) ? (process.env.REDIRECT_URI) : config.get('REDIRECT_URI');

const BUSINESS_ID = (process.env.BUSINESS_ID) ? (process.env.BUSINESS_ID) : config.get('BUSINESS_ID');

const GOOGLE_MAPS_URL = (process.env.GOOGLE_MAPS_URL) ? (process.env.GOOGLE_MAPS_URL) : config.get('GOOGLE_MAPS_URL');

const GOOGLE_MAPS_KEY = (process.env.GOOGLE_MAPS_KEY) ? (process.env.GOOGLE_MAPS_KEY) : config.get('GOOGLE_MAPS_KEY');

bot.rules.set('hola', sendMenu);
bot.rules.set('iniciar', sendMenu);
bot.rules.set('empezar', sendMenu);
bot.rules.set('comenzar', sendMenu);
bot.rules.set('buenos dias', sendMenu);
bot.rules.set('buenas tardes', sendMenu);
bot.rules.set('menú', sendMenu);
bot.rules.set('pedir domicilio', sendAddressesWithTitle);
bot.rules.set('carrito', sendCart);
bot.rules.set('cuenta', sendCart);
bot.rules.set('mi orden', sendOrders);
bot.rules.set('mis órdenes', sendOrders);
bot.rules.set('mi dirección', sendAddresses);
bot.rules.set('mis direcciones', sendAddresses);
bot.rules.set('nueva dirección', newAddress);
bot.rules.set('agregar dirección', newAddress);
bot.rules.set('mi cuenta', sendAccount);
bot.rules.set('mi tarjeta', sendCreditCards);
bot.rules.set('mis tarjetas', sendCreditCards);
bot.rules.set('nueva tarjeta', registerCreditCard);
bot.rules.set('agregar tarjeta', registerCreditCard);

bot.rules.set('ayuda', sendHelp);
bot.rules.set('help', sendHelp);
bot.rules.set('gracias', sendYouAreWelcome);

bot.payloadRules.set('Greeting', sendMenu);

bot.payloadRules.set('SendAddressesWithTitle', sendAddressesWithTitle);
bot.payloadRules.set('SendAddresses', sendAddresses);
bot.payloadRules.set('NewAddress', newAddress);
bot.payloadRules.set('SetAddressComplement', setAddressComplement);
bot.payloadRules.set('ConfirmAddress', confirmAddress);
bot.payloadRules.set('SetAddress', setAddress);
bot.payloadRules.set('EditAddress', editAddress);
bot.payloadRules.set('RemoveAddress', removeAddress);

bot.payloadRules.set('SendCategories', sendCategories);
bot.payloadRules.set('SendProducts', sendProducts);
bot.payloadRules.set('AddProduct', addProduct);
bot.payloadRules.set('AddModifier', addModifier);
bot.payloadRules.set('RemoveProduct', removeProduct);
bot.payloadRules.set('IncreaseOneProduct', increaseOneProduct);
bot.payloadRules.set('DecreaseOneProduct', decreaseOneProduct);
bot.payloadRules.set('SendProductDescription', sendProductDescription);
bot.payloadRules.set('SendContinueOrder', sendContinueOrder);

bot.payloadRules.set('Search', searchProducts);
bot.payloadRules.set('SendCart', sendCart);
bot.payloadRules.set('SendCartDetails', sendCartDetails);
bot.payloadRules.set('EditCart', editCart);
bot.payloadRules.set('ClearCart', clearCart);
bot.payloadRules.set('ClearAndSendCart', clearAndSendCart);
bot.payloadRules.set('SendPurchaseOptions', sendPurchaseOptions);

bot.payloadRules.set('Checkout', checkout);
bot.payloadRules.set('CheckPayment', checkPayment);
bot.payloadRules.set('CheckAddress', checkAddress);
bot.payloadRules.set('CheckOrder', checkOrder);
bot.payloadRules.set('RegisterCreditCard', registerCreditCard);
bot.payloadRules.set('RegisterCreditCardAndPay', registerCreditCardAndPay);

bot.payloadRules.set('SendRegisteredCreditCards', sendRegisteredCreditCards);
bot.payloadRules.set('CancelRegisterCreditCard', cancelRegisterCreditCard);
bot.payloadRules.set('PayWithCreditCard', payWithCreditCard);
bot.payloadRules.set('SendOrders', sendOrders);
bot.payloadRules.set('SendOrder', sendOrder);
bot.payloadRules.set('NewOrder', newOrder);
bot.payloadRules.set('CancelOrder', cancelOrder);
bot.payloadRules.set('SendCreditCards', sendCreditCards);
bot.payloadRules.set('RemoveCreditCard', removeCreditCard);
bot.payloadRules.set('SetScore', setScore);
bot.payloadRules.set('SendAccount', sendAccount);
bot.payloadRules.set('SendHelp', sendHelp);
bot.payloadRules.set('CustomerService', sendHelp);

bot.defaultSearch = searchProducts;

const initialState = {
    userData: {},
    paymentTypes: {
        'Nn0joKC5VK': sendCash,
        'UdK0Ifc4IF': sendCash,
        'CHzoYrEtiY': sendRegisteredCreditCards
    },
    creditCardImages: {
        'VISA': 'assets/images/visaCard.jpg',
        'MASTERCARD': 'assets/images/masterCard.jpg',
        'AMERICAN': 'assets/images/americanCard.jpg',
        'DEFAULT': 'assets/images/creditCards.jpg'
    }
};

const reducer = (state = initialState, action) => {
    console.log('ACTION');
    console.log(action);
    let data = action.data;

    if(data && data.hasOwnProperty('recipientId')){
        if(typeof state.userData[data.recipientId] == 'undefined'){
            state.userData[data.recipientId] = {};
        }
    }

    switch (action.type) {
        case types.APP_LOADED: {
            console.log('Application is running on port', bot.app.get('port'));
            return {...state};
        }
        case types.CUSTOMER_LOADED: {
            let customer = extractParseAttributes(data.customer);
            objectAssign(state.userData[data.recipientId], {customer});
            return {...state};
        }
        case types.CONSUMER_LOADED: {
            let consumer = extractParseAttributes(data.consumer);
            objectAssign(state.userData[data.recipientId], {consumer});
            return {...state};
        }
        case types.USER_LOADED: {
            let user = extractParseAttributes(data.user);
            objectAssign(state.userData[data.recipientId], {user});
            return {...state};
        }
        case types.CONSUMER_ADDRESSES_LOADED: {
            let addresses = data.addresses.map(a => extractParseAttributes(a));
            objectAssign(state.userData[data.recipientId], {addresses});
            return {...state};
        }
        case types.SET_CURRENT_ADDRESS: {
            let address = extractParseAttributes(data.address);
            objectAssign(state.userData[data.recipientId], {address});
            return {...state};
        }
        case types.PAYMENT_METHODS_LOADED: {
            let paymentMethods = data.paymentMethods.map(p => extractParseAttributes(p))
            objectAssign(state.userData[data.recipientId], {paymentMethods})
            return {...state};
        }
        case types.SET_PAYMENT_METHOD: {
            let paymentMethod = extractParseAttributes(data.paymentMethod);
            objectAssign(state.userData[data.recipientId], {paymentMethod});
            return {...state};
        }
        case types.SET_ORDERS: {
            let ongoing = data.orders.ongoing.map(a => extractParseAttributes(a));
            let delivered = data.orders.delivered.map(a => extractParseAttributes(a));
            objectAssign(state.userData[data.recipientId], {orders: {ongoing: ongoing, delivered: delivered}});
            return {...state};
        }
        case types.CONSUMER_UPDATED: {
            return {...state};
        }
        case types.CONSUMER_NOT_FOUND: {
            return {...state};
        }
        case types.CONSUMER_ORDERS_LOADED: {
            let orders = data.orders.map(a => extractParseAttributes(a));
            objectAssign(state.userData[data.recipientId], {orders});
            return {...state};
        }
        case types.USER_CREDITCARDS_LOADED: {
            let creditCards = data.creditCards.map(a => extractParseAttributes(a));
            objectAssign(state.userData[data.recipientId], {creditCards});
            return {...state};
        }
        case types.SET_CUSTOMER_POINT_SALE: {
            let pointSale = extractParseAttributes(data.pointSale);
            objectAssign(state.userData[data.recipientId], {pointSale});
            return {...state};
        }
        case types.SET_ORDER: {
            let order = extractParseAttributes(data.order);
            objectAssign(state.userData[data.recipientId], {order});
            return {...state};
        }
        case types.SET_USER: {
            let user = extractParseAttributes(data.user);
            objectAssign(state.userData[data.recipientId], {user});
            return {...state};
        }
        case types.SET_CONSUMER: {
            let consumer = extractParseAttributes(data.consumer);
            objectAssign(state.userData[data.recipientId], {consumer});
            return {...state};
        }
        case types.SET_CUSTOMER:{
            let customer = extractParseAttributes(data.customer);
            objectAssign(state.userData[data.recipientId], {customer});
            return {...state};
        }
        case types.SET_ORDER_STATE: {
            let orderState = extractParseAttributes(data.orderState);
            objectAssign(state.userData[data.recipientId], {orderState});
            return {...state};
        }
        default:
            return state;
    }
}

createLocalStore(reducer);

bot.app.get('/login', function(req, res) {
    res.sendFile(path.join(__dirname+'/views/login.html'));
});

bot.app.post('/registerUser', function (req, res) {
    let data = req.body;

    signUp(data.psid, data.uid, data.accessToken).then(user =>{
        sendMenu(data.psid);
    });

    res.status(200).end();
});

bot.app.get('/creditCard', function(req, res) {
    console.log('creditCard');
    res.sendFile(path.join(__dirname+'/views/cardForm.html'));
});

bot.app.post('/registerCreditCard', function (req, res) {
    console.log('registerCreditCard');
    let data = req.body;
    let consumerID = data['consumerID'];

    new Parse.Query(Consumer).get(consumerID).then(consumer => {
            if(consumer){
                new Parse.Query(User).get(consumer.get('user').id).then(user => {
                    let username = user.get('username');
                    let recipientId = consumer.get('conversationId');

                    Parse.User.logIn(username, username, {
                        success: function(userData) {
                            addCreditCard(recipientId, userData.getSessionToken(), data)
                        },
                        error: function(user, error) {
                            console.log('error');
                            console.log(error);
                        }
                    });
                });

                res.sendFile(path.join(__dirname+'/views/cardRegistered.html'));
            }
        },
        (object, error) => {
            console.log(error);
        });
});

bot.app.post('/creditCardRegistered', function (req, res) {
    console.log('creditCardRegistered');
    let data = req.body;
    let userBuffer = bot.buffer[data.recipientId];

    if (typeof userBuffer != 'undefined') {
        if (userBuffer.creditCardPayload == 'SendCreditCards') {
            sendRegisteredCreditCards(data.recipientId);
            delete userBuffer.creditCardPayload
        }
        else {
            sendCreditCards(data.recipientId)
        }
    }
    else {
        sendCreditCards(data.recipientId)
    }
})

bot.app.post('/changeOrderState', function (req, res) {
    let data = req.body;

    new Parse.Query(Consumer).get(data['consumerID']).then(consumer => {
            if(consumer){
                new Parse.Query(User).get(consumer.get('user').id).then(user => {
                    let username = user.get('username');
                    let recipientId = consumer.get('conversationId');

                    new Parse.Query(OrderState).get(data['stateID']).then(orderState => {

                        store.dispatch(Actions.setOrderState(recipientId, orderState)).then(() => {
                            sendOrderState(recipientId);
                        })
                    })
                    .fail(error => {
                        console.log('Error code: ' + error.message);
                    });
                });
            }
        },
        (object, error) => {
            console.log(error);
        });

    res.json({result: 'OK'});
});

function signUp(recipientId, facebookId, conversationToken){
    return User.createUser(store, recipientId, facebookId, conversationToken).then(()=>{
        let userObject = getData(recipientId, 'user');
        let user = userObject.rawParseObject;

        return user.createConsumer(store, recipientId, conversationToken).then(consumer => {
            return new Promise((resolve, reject) => {
                resolve(userObject)
            });
        });
    });
}

function login(username, password){
    return Parse.User.logIn(username, password, {
        success : user => {
            //let val = JSON.stringify({sessionToken: user.getSessionToken()});
            //console.log(val);
            return user;
        },
        error: function(user, error) {
            console.log('Failed to create new object, with error code: ' + error.message);
        }});
}

function authentication(recipientId){
    return getCustomer(recipientId).then(customer => {
        return getUser(recipientId).then(user => {
            if(typeof user == 'undefined'){
                //sendSignUp(recipientId)
                return User.createUser(store, recipientId, recipientId, PAGE_ACCESS_TOKEN).then(()=>{
                    let userObject = getData(recipientId, 'user');
                    let user = userObject.rawParseObject;

                    return user.createConsumer(store, recipientId, PAGE_ACCESS_TOKEN).then(consumer => {
                        return new Promise((resolve, reject) => {
                            resolve(userObject)
                        });
                    });
                })
            }
            else{
                return getConsumer(recipientId, user.rawParseObject).then(consumer => {
                    return new Promise((resolve, reject) => {
                        resolve(user)
                    });

                    /*Parse.Promise.as().then(() => {
                        return user;
                    });*/
                });
            }
            //return login(user.username, user.username).then(()=>{

            //});
        });
    });
}

function getCustomer(recipientId){
    let customer = getData(recipientId, 'customer');
    if(typeof customer == 'undefined'){
        return Customer.loadInStore(store, recipientId, BUSINESS_ID).then(()=>{
            return getData(recipientId, 'customer');
        });
    }
    else{
        return new Promise((resolve, reject) => {
            resolve(customer)
        });
    }
}

function getUser(recipientId){
    let userObj = getData(recipientId, 'user');
    if(typeof userObj == 'undefined'){
        return User.loadInStore(store, recipientId).then(()=>{
            return getData(recipientId, 'user');
        });
    }
    else{
        return new Promise((resolve, reject) => {
            resolve(userObj)
        });
    }
}

function getConsumer(recipientId, user){
    let consumerObj = getData(recipientId, 'consumer');

    if(typeof consumerObj == 'undefined'){
        return Consumer.loadInStore(store, recipientId, user).then(()=>{
            consumerObj = getData(recipientId, 'consumer');

            if(typeof consumerObj != 'undefined'){
                return new Promise((resolve, reject) => {
                    resolve(consumerObj)
                });
            }else{
                console.log('create consumer');
                /*return createConsumer(recipientId, user).then( () => {
                    return getData(recipientId, 'consumer');
                });*/
            }
        });
    }
    else{
        return new Promise((resolve, reject) => {
            resolve(consumerObj)
        });
    }
}

function sendSignUp(recipientId, senderId) {
    let image_url = SERVER_URL+"assets/images/love.jpg";
    return bot.sendTypingOn(recipientId, senderId).then(()=> {
        return bot.sendTypingOff(recipientId, senderId).then(() => {
            return bot.sendGenericMessage(recipientId, senderId, [{
                "title": "Hola, soy un Bot",
                "subtitle": "Soy tu asistente virtual. Quieres registrarte en nuestro sistema?",
                "image_url": image_url,
                "buttons": [
                    {
                        "type": "web_url",
                        "url": SERVER_URL + "login?psid=" + recipientId,
                        "title": "Registrarme",
                        "webview_height_ratio": "full",
                        "messenger_extensions": true
                    }
                ]
            }]);
        });
    });
};

function sendMenu(recipientId, senderId) {
    return bot.sendTypingOn(recipientId, senderId).then(()=>{
        authentication(recipientId).then(() =>{
            let customer = getData(recipientId, 'customer');
            let user = getData(recipientId, 'user');
            let image_url = customer.image.url;
            return bot.sendTypingOff(recipientId, senderId).then(()=>{
                return bot.sendGenericMessage(recipientId, senderId, [{
                    "title":     "Hola "+user.first_name+", Bienvenido a "+customer.name,
                    "subtitle":  "Aquí puedes pedir un domicilio, escribe o selecciona alguna de las opciones:",
                    "image_url": image_url,
                    "buttons":[
                        {
                            "type":"postback",
                            "title":"Pedir domicilio",
                            "payload": "SendAddressesWithTitle"
                        },
                        {
                            "type":"postback",
                            "title":"Servicio al cliente",
                            "payload": "CustomerService"
                        }
                    ]
                }]);
            });
        });
    });
}

function sendAddressesWithTitle(recipientId, senderId){
    return bot.sendTypingOn(recipientId, senderId).then(()=> {
        return bot.sendTypingOff(recipientId, senderId).then(()=>{
            return bot.sendTextMessage(recipientId, senderId, "A cual dirección vas hacer tu pedido?\n\nPuedes escoger entre agregar una nueva dirección o seleccionar una de tus direcciones guardadas").then(() => {
                sendAddresses(recipientId, senderId);
            });
        });
    });
}

function sendAddresses(recipientId, senderId){
    return bot.sendTypingOn(recipientId, senderId).then(()=> {
        authentication(recipientId).then(() => {
            let consumer = getData(recipientId, 'consumer');

            ConsumerAddress.loadInStore(store, recipientId, consumer).then(() => {
                let addresses = getData(recipientId, 'addresses');
                let elements = [];

                elements.push({
                    "title": "Nueva dirección",
                    "subtitle": "Puedes agregar una nueva dirección",
                    "image_url": SERVER_URL+"assets/images/addAddress.jpg",
                    "buttons": [
                        {
                            "type": "postback",
                            "title": "Nueva dirección",
                            "payload": "NewAddress"
                        }
                    ]
                });

                for(let address of addresses) {
                    if (elements.length < bot.limit){
                        elements.push({
                            "title": address.name,
                            "subtitle": address.address +", "+address.description+", "+address.city+", "+address.state,
                            "image_url": GOOGLE_MAPS_URL+ "?center="+address.location.lat+","+address.location.lng+"&zoom=16&size=400x400&markers=color:red%7C"+address.location.lat+","+address.location.lng+"&key="+GOOGLE_MAPS_KEY,
                            "buttons": [
                                {
                                    "type": "postback",
                                    "title": "Seleccionar",
                                    "payload": "SetAddress-"+address.objectId
                                },
                                {
                                    "type": "postback",
                                    "title": "Modificar",
                                    "payload": "EditAddress-"+address.objectId
                                },
                                {
                                    "type": "postback",
                                    "title": "Quitar",
                                    "payload": "RemoveAddress-"+address.objectId
                                }
                            ]
                        });
                    }
                }

                return bot.sendTypingOff(recipientId, senderId).then(()=>{
                    return bot.sendGenericMessage(recipientId, senderId, elements);
                });
            });
        });
    });
}

function sendCreditCards(recipientId, senderId){
    return bot.sendTypingOn(recipientId, senderId).then(()=>{
        authentication(recipientId).then(() =>{
            let state = store.getState();
            let user = getData(recipientId, 'user');
            let creditCardsImages = state['creditCardImages'];

            CreditCard.loadInStore(store, recipientId, user).then(() => {
                let creditCards = getData(recipientId, 'creditCards');
                let userBuffer = bot.buffer[recipientId];
                let creditCardImage;
                let elements = [];

                if(typeof userBuffer != 'undefined' && userBuffer.hasOwnProperty('creditCardPayload')){
                    delete userBuffer.creditCardPayload;
                }

                elements.push({
                    "title": "Registro de tarjeta",
                    "subtitle": "Puedes agregar una tarjeta",
                    "image_url": SERVER_URL+"assets/images/creditCards.jpg",
                    "buttons": [
                        {
                            "type": "postback",
                            "title": "Nueva tarjeta",
                            "payload": "RegisterCreditCard"
                        }
                    ]
                });

                for(let creditCard of creditCards) {
                    if (elements.length < bot.limit){

                        creditCardImage = creditCardsImages.hasOwnProperty(creditCard.type) ? creditCardsImages[creditCard.type] : creditCardsImages['DEFAULT']
                        elements.push({
                            "title": creditCard.type+' '+creditCard.lastFour,
                            "subtitle": creditCard.cardHolderName,
                            "image_url": SERVER_URL+creditCardImage,
                            "buttons": [
                                {
                                    "type": "postback",
                                    "title": "Quitar",
                                    "payload": "RemoveCreditCard-"+creditCard.objectId
                                }
                            ]
                        });
                    }
                }

                return bot.sendTypingOff(recipientId, senderId).then(()=>{
                    return bot.sendGenericMessage(recipientId, senderId, elements);
                });
            });
        });
    });
}

function newAddress(recipientId, senderId){
    return bot.sendTypingOn(recipientId, senderId).then(()=> {
        return bot.sendTypingOff(recipientId, senderId).then(() => {
            bot.setDataBuffer(recipientId, 'addressPayload', 'NewAddress');
            writeAddress(recipientId, senderId);
        });
    });
}

function writeAddress(recipientId, senderId){
    bot.setListener(recipientId, 'address', 'text', addressCheck);
    bot.setListener(recipientId, 'location', 'attachment', setLocationCheck);

    return bot.sendQuickReplyMessage(
        recipientId,
        senderId,
        "Puedes escribir o compartir tu ubicación actual?\n\nEjemplo: Calle 67 #52-20, Medellín.\n\nNo olvides escribir la ciudad al final de la dirección.",
        [{
            "content_type": "location",
            "title": "Enviar ubicación"
        }]
    );
}

function sendNullMapMessage(recipientId, senderId){
    return bot.sendTypingOn(recipientId, senderId).then(()=> {
        return bot.sendTypingOff(recipientId, senderId).then(() => {
            return bot.sendTextMessage(recipientId, senderId, "La dirección no ha sido encontrada en Google Maps, por favor intenta de nuevo")
        });
    });
}

function sendMap(recipientId, senderId){
    return bot.sendTypingOn(recipientId, senderId).then(()=>{
        let userBuffer = bot.buffer[recipientId];
        return bot.sendTypingOff(recipientId, senderId).then(()=>{
            return bot.sendImageMessage(recipientId, senderId, GOOGLE_MAPS_URL+"?center="+userBuffer.location.lat+","+userBuffer.location.lng+"&zoom=16&size=400x400&markers=color:red%7C"+userBuffer.location.lat+","+userBuffer.location.lng+"&key="+GOOGLE_MAPS_KEY).then(()=>{
                sendMapConfirmation(recipientId, senderId);
            });
        });
    });
}

function sendMapConfirmation(recipientId, senderId){
    return bot.sendTypingOff(recipientId, senderId).then(()=>{
        return bot.sendQuickReplyMessage(recipientId, senderId, "Es correcta?", [
            {
                "content_type": "text",
                "title": "Si",
                "payload": "SetAddressComplement"
            },
            {
                "content_type": "text",
                "title": "No",
                "payload": "NewAddress"
            }
        ]);
    });
}

function addressCheck(recipientId, senderId){
    console.log(recipientId +' ' +senderId);
    let userBuffer = bot.buffer[recipientId];

    geocoder.geocode(userBuffer.address, (error, data) =>{
        if(!error && data.status == 'OK'){
            setAddressComponetsInBuffer(recipientId, senderId, data.results[0]);
        }
        else{
            console.log('Geocode not found');
            console.log(error);
            sendNullMapMessage(recipientId, senderId).then(()=>{
                newAddress(recipientId)
            });
        }
    });
}

function setAddressComponetsInBuffer(recipientId, senderId, data){
    return bot.sendTypingOn(recipientId, senderId).then(()=> {
        let userBuffer = bot.buffer[recipientId];
        userBuffer.address = data.formatted_address;
        userBuffer.location = data.geometry.location;

        for (let component of data.address_components) {
            if (component.types.includes('route')) {
                userBuffer.route = component.long_name;
            }
            else if (component.types.includes('street_number')) {
                userBuffer.street_number = component.short_name;
            }
            else if (component.types.includes('locality')) {
                userBuffer.locality = component.short_name;
            }
            else if (component.types.includes('administrative_area_level_1')) {
                userBuffer.state = component.short_name;
            }
            else if (component.types.includes('administrative_area_level_2')) {
                userBuffer.administrative_area = component.short_name;
            }
            else if (component.types.includes('country')) {
                userBuffer.country = component.long_name;
                userBuffer.country_code = component.short_name
            }
            else if (component.types.includes('postal_code')) {
                userBuffer.postal_code = component.short_name;
            }
        }

        return bot.sendTypingOff(recipientId, senderId).then(() => {
            return bot.sendTextMessage(recipientId, senderId, "Encontré esta dirección en Google Maps:\n\n" + userBuffer.address).then(() => {
                sendMap(recipientId, senderId);
            });
        });
    });
}

function setAddressComplement(recipientId, senderId){
    return bot.sendTypingOn(recipientId, senderId).then(()=> {
        bot.setListener(recipientId, 'complement', 'text', confirmAddress);

        return bot.sendTypingOff(recipientId, senderId).then(() => {
            return bot.sendTextMessage(recipientId, senderId, "Por favor escribe el complemento de tu dirección actual.\n\nEjemplo: Apto 303, edificio el palmar.\n\nNo olvides colocar el nombre del edificio o del barrio");
        });
    });
}

function confirmAddress(recipientId, senderId){
    let userBuffer = bot.buffer[recipientId];
    let addressPayload = userBuffer['addressPayload'];

    if(addressPayload == 'NewAddress'){
        return bot.sendTypingOn(recipientId, senderId).then(()=>{
            bot.setListener(recipientId, 'address_name', 'text', saveAddress);
            return bot.sendTypingOff(recipientId, senderId).then(()=>{
                return bot.sendTextMessage(recipientId, senderId, "Por favor coloca un nombre a esta dirección para guardarla. \n\nEjemplo: casa, apartamento o oficina");
            });
        });
    }
    else if(addressPayload.startsWith('EditAddress')){
        return bot.sendTypingOn(recipientId, senderId).then(()=>{
            let data = addressPayload.split('-');
            let location = new Parse.GeoPoint({latitude: parseFloat(userBuffer.location.lat), longitude: parseFloat(userBuffer.location.lng)});

            new Parse.Query(ConsumerAddress).get(data[1]).then((consumerAddress) => {

                consumerAddress.set('address', userBuffer.route+" # "+userBuffer.street_number);
                consumerAddress.set('location', location);
                consumerAddress.set('country', userBuffer.country);
                consumerAddress.set('countryCode', userBuffer.country_code);
                consumerAddress.set('postalCode', userBuffer.postal_code);
                consumerAddress.set('state', userBuffer.state);
                consumerAddress.set('description', userBuffer.complement);

                consumerAddress.save(undefined, {
                    success: function(address) {
                        delete userBuffer.address;
                        delete userBuffer.location;
                        delete userBuffer.complement;

                        return bot.sendTypingOff(recipientId, senderId).then(()=>{
                            return bot.sendTextMessage(recipientId, senderId, "La dirección ha sido actualizada.").then(()=>{
                                setAddress(recipientId, senderId, address.id);
                            })
                        });
                    },
                    error: function(user, error) {
                       console.log('Failed to create new object, with error code: ' + error.message);
                    }
                });
            });
        });
    }
}

function saveAddress(recipientId, senderId){
    return bot.sendTypingOn(recipientId, senderId).then(()=>{
        let consumer = getData(recipientId, 'consumer');
        let userBuffer = bot.buffer[recipientId];
        let location = new Parse.GeoPoint({latitude: parseFloat(userBuffer.location.lat), longitude: parseFloat(userBuffer.location.lng)});

        let consumerAddress = new ConsumerAddress();
        consumerAddress.set('name', userBuffer.address_name);
        consumerAddress.set('address', userBuffer.route+" # "+userBuffer.street_number);
        consumerAddress.set('consumer', {
            __type: "Pointer",
            className: "Consumer",
            objectId: consumer.objectId
        });
        consumerAddress.set('location', location);
        consumerAddress.set('city', userBuffer.locality);
        consumerAddress.set('country', userBuffer.country);
        consumerAddress.set('countryCode', userBuffer.country_code);
        consumerAddress.set('postalCode', userBuffer.postal_code);
        consumerAddress.set('state', userBuffer.state);
        consumerAddress.set('description', userBuffer.complement);

        consumerAddress.save(undefined, {
            success: function(result) {

                delete userBuffer.address;
                delete userBuffer.location;
                delete userBuffer.complement;
                delete userBuffer['address_name'];

                return bot.sendTypingOff(recipientId, senderId).then(()=>{
                    return bot.sendTextMessage(recipientId, senderId, "La dirección ha sido almacenada.").then(()=>{
                        setAddress(recipientId, senderId, result.id)
                    })
                });
            },
            error: function(user, error) {
                console.log('Failed to create new object, with error code: ' + error.message);
            }
        });
    });
}

function setEmail(recipientId, senderId){
    bot.setListener(recipientId, 'email', 'text', setEmailCheck);

    return bot.sendTypingOff(recipientId, senderId).then(()=>{
        return bot.sendTextMessage(recipientId, senderId, "Por favor escribe tu email:")
    });
}

function setEmailCheck(recipientId, senderId, value){
    let userBuffer = bot.buffer[recipientId];
    let consumer = getData(recipientId, 'consumer').rawParseObject;

    consumer.setEmail(userBuffer.email);
    consumer.saveInStore(store, recipientId).then(()=>{
        delete userBuffer.email;
        checkOrder(recipientId)
    });
}

function setTelephone(recipientId, senderId){
    bot.setListener(recipientId, 'telephone', 'text', setTelephoneCheck);
    return bot.sendTypingOff(recipientId, senderId).then(()=>{
        return bot.sendTextMessage(recipientId, senderId, "Por favor escribe tu número telefónico:")
    });
}

function setTelephoneCheck(recipientId, senderId){
    let userBuffer = bot.buffer[recipientId];
    let consumer = getData(recipientId, 'consumer').rawParseObject;

    consumer.setPhone(userBuffer.telephone);
    consumer.saveInStore(store, recipientId).then(()=>{
        delete userBuffer.telephone;
        checkOrder(recipientId)
    });
}

function setLocationCheck(recipientId, senderId){
    let userBuffer = bot.buffer[recipientId];

    geocoder.reverseGeocode( userBuffer.location.lat, userBuffer.location.lng, (error, data) =>{
        if(!error && data.status == 'OK'){
            setAddressComponetsInBuffer(recipientId, data.results[0])
        }
        else{
            console.log('Geocode not found');
            console.log(error);
            sendNullMapMessage(recipientId).then(()=>{
                newAddress(recipientId)
            });
        }
    });
}

function setAddress(recipientId, senderId, id){
    return bot.sendTypingOn(recipientId, senderId).then(()=>{
        store.dispatch(Actions.setAddress(recipientId, id)).then(() => {
            let address = getData(recipientId, 'address');

            Parse.Cloud.run('getProducts', { businessId: BUSINESS_ID, lat: address.location.lat, lng: address.location.lng}).then(
                function(result){
                    let pointSale = result.pointSale;

                    store.dispatch(Actions.setCustomerPointSale(recipientId, pointSale.id)).then(() => {
                        return bot.sendTypingOff(recipientId, senderId).then(()=>{
                            return bot.sendTextMessage(recipientId, senderId, "Perfecto, ya seleccioné tu dirección para este pedido").then(()=>{
                                sendCategories(recipientId, senderId, 0);
                            })
                        });
                    });
                },
                function(error) {
                    if(error.code == '141'){
                        return bot.sendTypingOff(recipientId, senderId).then(()=>{
                            return bot.sendTextMessage(recipientId, senderId, "La dirección seleccionada no está dentro de la cobertura de nuestras sedes, por favor intenta con otra dirección").then(()=>{
                                sendAddressesWithTitle(recipientId)
                            });
                        });
                    }
                    else{
                        console.log('error');
                        console.log(error);
                    }
                });
            }
        );
    });
}

function editAddress(recipientId, senderId, id){
    return bot.sendTypingOn(recipientId, senderId).then(()=> {
        return bot.sendTypingOff(recipientId, senderId).then(()=>{
            bot.setDataBuffer(recipientId, 'addressPayload', 'EditAddress-'+id);
            writeAddress(recipientId);
        });
    });
}

function removeAddress(recipientId, senderId, id){
    return bot.sendTypingOn(recipientId, senderId).then(()=> {
        new Parse.Query(ConsumerAddress).get(id).then((consumerAddress) => {
            consumerAddress.destroy().then(()=>{
                return bot.sendTypingOff(recipientId, senderId).then(()=>{
                    return bot.sendTextMessage(recipientId, senderId, "La dirección ha sido eliminada.").then(()=>{
                        sendAddresses(recipientId);
                    })
                });
            });
        });
    });
}

function removeCreditCard(recipientId, senderId, id){
    return bot.sendTypingOn(recipientId, senderId).then(()=> {
        new Parse.Query(CreditCard).get(id).then((creditCard) => {
            creditCard.destroy().then(() => {

                return bot.sendTypingOff(recipientId, senderId).then(() => {
                    return bot.sendTextMessage(recipientId, senderId, "La tarjeta de credito ha sido eliminada.").then(() => {
                        sendCreditCards(recipientId);
                    });
                });
            });
        });
    });
}

function sendCategories(recipientId, senderId, index){
    return bot.sendTypingOn(recipientId, senderId).then(()=>{
        authentication(recipientId).then(()=>{
            Parse.Cloud.run('getProducts', { businessId: BUSINESS_ID }).then(function(result){
                if(result.pointSaleIsOpen) {
                    if(typeof index == 'undefined')
                        index = 0;
                    else if( typeof index == 'string')
                        index = parseInt(index);

                    if(index == 0){
                        bot.sendTypingOff(recipientId, senderId).then(()=>{
                            bot.sendTextMessage(recipientId, senderId, "A continuación te presentamos las categorías de productos disponibles.")
                        });
                    }

                    sendCategoriesDetail(recipientId, senderId, result.categories, index);

                }else{
                    sendScheduleRestriction(recipientId, result.pointSaleSchedules);
                }
            },
            function(error) {
                console.log('error');
                console.log(error);
            });
        });
    });
}

function splitCategories(recipientId, categories, index){
    let customer = getData(recipientId, 'customer');
    let image_url;

    let idx = 0;
    let elements = [];

    categories.forEach(function(item){
        if(item && item.get('name')){
            if(idx >= (index)*bot.limit && idx < (index+1)*bot.limit){
                let image = item.get('image');
                image_url = (typeof image != 'undefined') ? image.url() : customer.image.url;
                elements.push({
                    title: item.get('name'),
                    image_url: image_url,
                    buttons: [{
                        type: "postback",
                        title: 'Ver categoría',
                        payload: "SendProducts-"+item.id+"-0",
                    }]
                })
            }
            idx = idx+1;
        }
    });
    return elements;
}

function sendCategoriesDetail(recipientId, senderId, categories, index){
    let elements = splitCategories(recipientId, categories, index);
    let idx = Object.keys(categories).length;
    let buttons = [];
    let catIni = (index + 1) * bot.limit;
    let catFin = (idx > catIni + bot.limit) ? catIni + bot.limit : idx;

    if (idx > (index + 1) * bot.limit) {
        buttons.push({
            type: "postback",
            title: "Categorías " + (catIni + 1) + "-" + catFin,
            payload: "SendCategories-" + (index + 1),
        });

        elements.push({
            title: "Ver más categorias ",
            subtitle: "Categorías disponibles",
            buttons: buttons
        });
    }

    return bot.sendTypingOff(recipientId, senderId).then(()=>{
        return bot.sendGenericMessage(recipientId, senderId, elements)
    });
}

function sendProducts(recipientId, senderId, categoryId, proIdx){
    return bot.sendTypingOn(recipientId, senderId).then(()=>{
        proIdx = parseInt(proIdx);
        if(proIdx == 0){
            new Parse.Query(Category).get(categoryId).then(category => {
                return bot.sendTypingOff(recipientId, senderId).then(()=>{
                    return bot.sendTextMessage(recipientId, senderId, "Selecciona "+category.get('name')+":");
                });
            },
            (object, error) => {
                console.log(error);
            });
        }
        Parse.Cloud.run('getProducts', { businessId: BUSINESS_ID, category: categoryId }).then(result => {
            if(result.hasOwnProperty('categories')){
                sendCategoriesDetail(recipientId, senderId, result.categories, 0);
            }else{
                if(result.products.length == 0){
                    bot.sendTypingOff(recipientId, senderId).then(()=>{
                        bot.sendQuickReplyMessage(recipientId, senderId,
                            "No existen productos en esta categoría",
                            [{
                                "content_type": "text",
                                "title": "Seguir pidiendo",
                                "payload": "SendContinueOrder"
                            },
                            {
                                "content_type": "text",
                                "title": "Ver carrito",
                                "payload": "SendCart"
                            }]);
                    });
                }
                else{
                    sendProductsDetail(recipientId, categoryId, result.products, proIdx);
                }
            }
        },
        function(error) {
            console.log('error');
            console.log(error);
        })
    });
}

function splitProducts(recipientId, products, proIdx){
    let customer = getData(recipientId, 'customer');
    let image_url;

    let idx = 0;
    let elements = [];

    products.forEach(function(product){
        if(product && product.get('name')){
            if(idx >= (proIdx)*bot.limit && idx < (proIdx+1)*bot.limit){
                let image = product.get('image');
                image_url = (typeof image != 'undefined') ? image.url() : customer.image.url;

                elements.push({
                    title: product.get('name') +": $"+ product.get('priceDefault'),
                    subtitle: product.get('description'),
                    image_url: image_url,
                    buttons: [{
                        type: "postback",
                        title: "Agregar",
                        payload: "AddProduct-"+product.id,
                    },
                    {
                        type: "postback",
                        title: 'Ver descripción',
                        payload: "SendProductDescription-"+product.id,
                    }]
                })
            }
            idx = idx+1;
        }
    });
    return elements;
}

function sendProductsDetail(recipientId, senderId, categoryId, products, index){
    let elements = splitProducts(recipientId, products, index);
    let idx = Object.keys(products).length;
    let buttons = [];
    let catIni = (index+1)*bot.limit;
    let catFin =  (idx > catIni+bot.limit) ? catIni+bot.limit : idx;

    if(idx > (index+1)*bot.limit){
        buttons.push({
            type: "postback",
            title: "Productos "+(catIni+1)+"-"+catFin,
            payload: "SendProducts-"+categoryId+"-"+(index+1),
        });

        elements.push({
            title: "Ver más productos ",
            subtitle: "Productos disponibles",
            buttons: buttons
        });
    }

    return bot.sendTypingOff(recipientId, senderId).then(()=>{
        return bot.sendGenericMessage(recipientId, senderId, elements)
    });
}

function createCart(recipientId, senderId){
    let userData = getData(recipientId);
    Object.assign(userData, {'cart': {items: new Map()}});
    return userData.cart;
}

function addProduct(recipientId, senderId, productId){
    let cart = getData(recipientId, 'cart');

    if(typeof cart == 'undefined'){
        cart = createCart(recipientId);
    }

    let items = cart.items;

    new Parse.Query(Product).get(productId).then(product => {
        let productObject = extractParseAttributes(product);
        let item = items.get(productId);
        let promises = [];

        if(typeof item == 'undefined'){
            items.set(productId, {quantity: 1, price: productObject.priceDefault});
            item = items.get(productId);
        }
        else{
            item.quantity += 1;
        }

        if(typeof item.modifiers == 'undefined'){
            item.modifiers = [];
        }

        if(typeof productObject.modifiers != 'undefined'){
            productObject.modifiers.forEach(function(obj, index, array){
                promises.push(new Parse.Query(Modifier).get(obj.objectId).then(modifier => {
                    return extractParseAttributes(modifier);
                }));
            });
        }

        Parse.Promise.when(promises).then(function(modifiers) {
            let undefinedModifiers = checkModifiers(recipientId, productId, modifiers);

            console.log(undefinedModifiers);

            //checkModifiersComplete(recipientId, productId, modifiers).then(result =>{
            //    console.log('result: '+result);
            //});
            if(undefinedModifiers.length > 0){
                //Show multiples modifiers
                promises = [];

                undefinedModifiers[0].items.forEach(function (modifierItem) {
                    promises.push(new Parse.Query(ModifierItem).get(modifierItem.objectId).then(modifierItem => {
                        return extractParseAttributes(modifierItem);
                    }));
                });

                Parse.Promise.when(promises).then(function (modifierItems) {
                    sendModifierMenu(recipientId, productId, undefinedModifiers[0], modifierItems);
                })
            }
            else{
                saveCart(recipientId);
                sendAddProductNenu(recipientId, productId);
            }
        });
    },
    (object, error) => {
        console.log(error);
    });
}

function sendAddProductNenu(recipientId, senderId, productId){
    return new Parse.Query(Product).get(productId).then(product => {
        return bot.sendTypingOff(recipientId, senderId).then(()=>{
            return bot.sendQuickReplyMessage(recipientId, senderId, "El producto " + product.get('name') + " ha sido agregado.\n\nDeseas seguir pidiendo o ver tu carrito?", [
                {
                    "content_type": "text",
                    "title": "Seguir pidiendo",
                    "payload": "SendContinueOrder"
                },
                {
                    "content_type": "text",
                    "title": "Ver carrito",
                    "payload": "SendCart"
                }
            ])
        });
    },
    (object, error) => {
        console.log(error);
    })
}

function sendContinueOrder(recipientId, senderId){
    return bot.sendTypingOff(recipientId, senderId).then(()=>{
        bot.sendTextMessage(recipientId, senderId, "Puedes escribir el nombre de un producto, ej: Ensalada mediterranea, o seleccionarlo en el siguiente menú:").then(()=>{
            sendCategories(recipientId, senderId, 0);
        })
    });
}

function sendModifierMenu(recipientId, senderId, productId, modifier, items){
    let quick_replies = [];

    items.forEach(function (item){
        if(quick_replies.length <= bot.limit){
            quick_replies.push({
                "content_type": "text",
                "title": item.name,
                "payload": "AddModifier-"+productId+"-"+modifier.objectId+"-"+item.objectId
            });
        }
    });

    return bot.sendTypingOff(recipientId, senderId).then(()=>{
        return bot.sendQuickReplyMessage(recipientId, senderId, "Escoge " + modifier.name + ":", quick_replies)
    })
}

function addModifier(recipientId, senderId, productId, modifierId, itemId){
    let cart = getData(recipientId, 'cart');
    let items = cart.items;
    let item = items.get(productId);
    let orderItemModifier = new OrderItemModifier();

    orderItemModifier.set('modifier', {
        __type: "Pointer",
        className: "Modifier",
        objectId: modifierId
    });

    orderItemModifier.set('modifierItem', {
        __type: "Pointer",
        className: "ModifierItem",
        objectId: itemId
    });

    //orderItemModifier.set('price', itemId.price)

    orderItemModifier.save(undefined, {
        success: function(result) {
            item.modifiers.push({
                __type: "Pointer",
                className: "OrderItemModifier",
                objectId: result.id
            });

            saveCart(recipientId);
            sendAddProductNenu(recipientId, productId)
        },
        error: function(user, error) {
            console.log('Failed to create new object, with error code: ' + error.message);
        }
    });

}

function checkModifiers(recipientId, senderId, productId, modifiers){
    let cart = getData(recipientId, 'cart');
    let items = cart.items;
    let item = items.get(productId);
    let exist = false;
    let result = [];

    modifiers.forEach(function (modifier) {
        exist = false;

        item.modifiers.forEach(function (itemModifier){
            console.log(itemModifier.objectId)
            //exist true
        });

        if(!exist){
            result.push(modifier);
        }
    });

    return result;
}

function checkModifiersComplete(recipientId, senderId, productId, modifiers){
    let cart = getData(recipientId, 'cart');
    let items = cart.items;
    let item = items.get(productId);
    let promises = [];

    console.log(modifiers);
    console.log(modifiers.length)
    console.log(cart.items);
    console.log(item);
    console.log(item.modifiers.length);

    if(modifiers.length != item.modifiers.length){
        promises = [];
        modifiers.forEach(function (modifier) {
            modifier.items.forEach(function (modifierItem) {
                promises.push(new Parse.Query(ModifierItem).get(modifierItem.objectId).then(modifierItem => {
                    return extractParseAttributes(modifierItem);
                }));
            });

            return Parse.Promise.when(promises).then(function (elements) {
                sendModifierMenu(recipientId, productId, modifier, elements);
                return true;
            });
        });
    }

}

function removeProduct(recipientId, senderId, productId){
    let cart = getData(recipientId, 'cart');
    if(cart == undefined){
        cart = createCart(recipientId);
    }

    let items = cart.items;
    let item = items.get(productId);

    new Parse.Query(OrderItem).get(item.id, {
        success: (orderItem) => {
            orderItem.destroy({});
            items.delete(productId);
            let itemsPointers = [];

            for(let [key, value] of items) {
                itemsPointers.push({"__type": "Pointer", "className": "OrderItem", "objectId": value.id})
            }

            cart.itemsPointers = itemsPointers;
            if(items.size == 0){
                sendCart(recipientId);
            }
            else{
                sendCartDetails(recipientId)
            }
        },
        error: (orderItem, error) => {
            console.log('error');
            console.log(error);
        }
    });
}

function increaseOneProduct(recipientId, senderId, productId){
    let cart = getData(recipientId, 'cart');

    if(cart == undefined){
        cart = createCart(recipientId);
    }

    let items = cart.items;
    let item = items.get(productId);

    item.quantity++;

    new Parse.Query(OrderItem).get(item.id, {
        success: (orderItem) => {
            orderItem.set('amount', item.quantity);
            orderItem.save();
            sendCartDetails(recipientId)
        },
        error: (orderItem, error) => {
            console.log('error');
            console.log(error);
        }
    });
}

function decreaseOneProduct(recipientId, senderId, productId){
    let cart = getData(recipientId, 'cart');

    if(cart == undefined){
        cart = createCart(recipientId);
    }

    let items = cart.items;
    let item = items.get(productId);

    item.quantity--;

    if(item.quantity > 0){
        new Parse.Query(OrderItem).get(item.id, {
            success: (orderItem) => {
                orderItem.set('amount', item.quantity);
                orderItem.save();
                sendCartDetails(recipientId)
            },
            error: (orderItem, error) => {
                console.log('error');
                console.log(error);
            }
        });
    }
    else{
        removeProduct(recipientId, productId)
    }
}

function sendProductDescription(recipientId, senderId, productId){
    let product = new Product();

    new Parse.Query(product).get(productId).then(
        product => {
            return bot.sendTypingOff(recipientId, senderId).then(()=>{
                return bot.sendQuickReplyMessage(recipientId, senderId, product.get('name')+": "+product.get('description'), [
                    {
                        "content_type":"text",
                        "title":"Agregar",
                        "payload":"AddProduct-"+productId
                    },
                    {
                        "content_type":"text",
                        "title":"Seguir pidiendo",
                        "payload":"SendContinueOrder"
                    },
                    {
                        "content_type":"text",
                        "title":"Ver carrito",
                        "payload":"SendCart"
                    }
                ])
            });
        },
        (object, error) => {
            console.log(error);
        }
    );
}

function saveCart(recipientId, senderId){
    let consumerCart = new Cart();
    let consumer = getData(recipientId, 'consumer');
    let address = getData(recipientId, 'address');
    let cart = getData(recipientId, 'cart');
    let paymentMethod = getData(recipientId, 'paymentMethod');
    let items = [];
    let item;

    for(let [id, properties] of cart.items){

        item = new OrderItem();

        if(properties.hasOwnProperty('id')){
            item.set('id', properties.id);
        }

        item.set('product', {
            __type: "Pointer",
            className: "Product",
            objectId: id
        });
        item.set('price', properties.price);
        item.set('amount', properties.quantity);
        item.set('modifiers', properties.modifiers);
        item.set('modifiersGroups', []);
        items.push(item);
    }

    Parse.Object.saveAll(items, {
        success: function(result) {
            let itemsPointers = [];
            for(let item of result){
                let itemId = item.get('product').objectId;
                cart.items.get(itemId).id = item.id;

                itemsPointers.push({"__type":"Pointer", "className": "OrderItem", "objectId": item.id})
            }

            if(cart.hasOwnProperty('id')){
                consumerCart.set('id', cart.id);
            }

            if(typeof paymentMethod != 'undefined'){
                consumerCart.set('paymentMethod', paymentMethod.method)
            }

            consumerCart.set('consumerAddress', {
                __type: "Pointer",
                className: "ConsumerAddress",
                objectId: address.objectId
            });
            consumerCart.set('consumer', {
                __type: "Pointer",
                className: "Consumer",
                objectId: consumer.objectId
            });
            consumerCart.set('items', itemsPointers);

            consumerCart.save(undefined, {
                success: function(result) {
                    cart['id'] = result.id;
                    cart['rawParseObject'] = result;
                    cart['itemsPointers'] = itemsPointers;
                },
                error: function(user, error) {
                    console.log('Failed to create new object, with error code: ' + error.message);
                }
            });
        },
        error: function(user, error) {
            console.log('Failed to create new object, with error code: ' + error.message);
        }
    });
}

function saveOrder(recipientId, senderId){
    getOrderState(0).then(state=>{
        let order = new Order();
        let consumer = getData(recipientId, 'consumer');
        let customer = getData(recipientId, 'customer');
        let cart = getData(recipientId, 'cart');
        let address = getData(recipientId, 'address');
        let paymentMethod = getData(recipientId, 'paymentMethod');
        let pointSale = getData(recipientId, 'pointSale');
        let total = 0 ;

        cart.items.forEach(function(value, key){
            total += value.quantity * value.price;
        });

        order.set('consumer', { __type: 'Pointer', className: 'Consumer', objectId: consumer.objectId });
        order.set('consumerAddress', { __type: 'Pointer', className: 'ConsumerAddress', objectId: address.objectId });
        order.set('pointSale', { __type: 'Pointer', className: 'CustomerPointSale', objectId: pointSale.objectId });
        order.set('state', { __type: 'Pointer', className: 'OrderState', objectId: state.objectId });
        order.set('items', cart.itemsPointers);
        order.set('deliveryCost', pointSale.deliveryCost);
        order.set('total', total);
        order.set('paymentMethod', paymentMethod.method);
        order.set('name', consumer.name);
        order.set('email', consumer.email);
        order.set('phone', consumer.phone);
        order.set('platform', 'Bot');

        order.save(undefined, {
            success: function(order) {

                store.dispatch(Actions.setOrder(recipientId, order)).then(() => {
                    clearCart(recipientId);
                });
            },
            error: function(user, error) {
                console.log('Failed to create new object, with error code: ' + error.message);
                console.log(error);
            }
        });
    });
}

function sendPurchaseOptions(recipientId, senderId){
    return bot.sendTypingOn(recipientId, senderId).then(()=>{
        return bot.sendTypingOff(recipientId, senderId).then(()=>{
            return bot.sendQuickReplyMessage(recipientId, senderId, "Tenemos las siguientes opciones disponibles:", [
                {
                    "content_type":"text",
                    "title":"Ver categorias",
                    "payload":"SendCategories-0"
                },
                {
                    "content_type":"text",
                    "title":"Ver carrito",
                    "payload":"SendCart"
                }
            ])
        });
    });
}

function sendEmptyCartOptions(recipientId, senderId){
    return bot.sendTypingOn(recipientId, senderId).then(()=>{
        return bot.sendTypingOff(recipientId, senderId).then(()=>{
            return bot.sendQuickReplyMessage(recipientId, senderId, "Tenemos las siguientes opciones disponibles:", [
                {
                    "content_type":"text",
                    "title":"Ver categorias",
                    "payload":"SendCategories-0"
                },
                {
                    "content_type":"text",
                    "title":"Mis órdenes",
                    "payload":"SendOrders"
                }
            ])
        });
    });
}

function sendCart(recipientId, senderId){
    bot.sendTypingOn(recipientId, senderId).then(()=>{
        authentication(recipientId).then( () =>{
            let user = getData(recipientId, 'user');
            let customer = getData(recipientId, 'customer');
            let consumer = getData(recipientId, 'consumer');
            let cart = getData(recipientId, 'cart');
            let address = getData(recipientId, 'address');
            let customer_image_url;

            if(typeof customer != 'undefined'){
                customer_image_url = customer.image.url;
            }

            if(cart == undefined){
                cart = createCart(recipientId);
            }

            let items = cart.items;
            let elements = [];
            let element = {};
            let total = 0;
            let orderLimit = items.size;
            let ind = 0;
            let image;
            let image_url;

            if(orderLimit == 0){
                bot.sendTypingOff(recipientId, senderId).then(()=>{
                    return bot.sendTextMessage(recipientId, senderId, "Tu carrito de compras está vacío.").then(()=>{
                        sendEmptyCartOptions(recipientId);
                    })
                });
            }
            else{
                items.forEach(function(value, key){
                    let product = new Parse.Query(Product);

                    product.get(key, {
                        success: function (item) {
                            image = item.get('image');
                            image_url = customer_image_url
                            if(image){
                                image_url = image.url();
                            }

                            element = {};
                            element['title'] = item.get('name');
                            element['subtitle'] = item.get('description');
                            element['quantity'] = value.quantity;
                            element['price'] = parseInt(item.get('priceDefault'));
                            element['currency'] = "COP";
                            element['image_url'] = image_url;

                            elements.push(element);
                            total += element['quantity']*element['price'];

                            ind++;

                            if(ind == orderLimit){
                                sendCartReceipt(recipientId, cart.id, elements, total)
                            }
                        },
                        error: function (error) {
                            alert("Error: " + error.code + " " + error.message);
                        }
                    })
                });
            }
        });
    });
}

function sendCartReceipt(recipientId, senderId, cartId, elements, total){
    let user = getData(recipientId, 'user');
    let consumer = getData(recipientId, 'consumer');
    let address = getData(recipientId, 'address');
    let pointSale = getData(recipientId, 'pointSale');
    let payment_method = getData(recipientId, 'payment_method');
    let addressData = undefined;

    if(typeof payment_method == 'undefined'){
        payment_method = {name: 'Sin definir'}
    }

    if(typeof address != 'undefined'){
        addressData = {
            street_1: address.address ? address.address : 'Dirección no definida',
            street_2: address.description ? address.description : 'Sin complemento',
            city: address.city ? address.city : 'No definida',
            postal_code: address.postalCode ? address.postalCode : 'No definido',
            state: address.state ? address.state : 'No definido',
            country: address.countryCode ? address.countryCode : 'No definido'
        }
    }

    return bot.sendTypingOff(recipientId, senderId).then(()=>{
        return bot.sendReceiptMessage(recipientId, {
            template_type: "receipt",
            recipient_name: user.first_name+" "+user.last_name,
            order_number: cartId,
            currency: "COP",
            payment_method: payment_method.name,
            timestamp: Math.trunc(Date.now()/1000).toString(),
            elements: elements,
            address: addressData,
            summary: {
                subtotal: total,
                shipping_cost: pointSale.deliveryCost,
                total_cost: total+pointSale.deliveryCost
            }
        },
        [
            {
                "content_type":"text",
                "title":"Finalizar pedido",
                "payload":"CheckOrder"
            },
            {
                "content_type":"text",
                "title":"Seguir Pidiendo",
                "payload":"SendContinueOrder"
            },
            {
                "content_type":"text",
                "title":"Modificar carrito",
                "payload":"SendCartDetails"
            },
            {
                "content_type":"text",
                "title":"Borrar carrito",
                "payload": "ClearAndSendCart"
            }
        ])
    });

}

function sendCartDetails(recipientId, senderId){
    return bot.sendTypingOn(recipientId, senderId).then(()=>{
        let cart = getData(recipientId, 'cart');
        let customer = getData(recipientId, 'customer');
        let consumer = getData(recipientId, 'consumer');
        let image_url = customer.image.url;
        let items = cart.items;
        let promises = [];

        items.forEach(function(value, key) {
            if (promises.length <= bot.limit) {
                promises.push(new Parse.Query(Product).get(key).then(product => {
                    let image = product.get('image');
                    if(image){
                        image_url = image.url();
                    }

                    return {
                        "title": product.get('name')+": $"+value.price,
                        "subtitle": "Cantidad solicitada: "+value.quantity,
                        "image_url": image_url,
                        "buttons": [
                            {
                                "type": "postback",
                                "title": "Quitar",
                                "payload": "RemoveProduct-" + key
                            },
                            {
                                "type": "postback",
                                "title": "Aumentar 1",
                                "payload": "IncreaseOneProduct-" + key
                            },
                            {
                                "type": "postback",
                                "title": "Disminuir 1",
                                "payload": "DecreaseOneProduct-" + key
                            }
                        ]
                    };
                }));
            }
        });

        return Parse.Promise.when(promises).then(function(elements) {
            return bot.sendTypingOff(recipientId, senderId).then(()=>{
                return bot.sendGenericMessage(recipientId, senderId, elements).then(()=>{
                    sendEditCartOptions(recipientId)
                });
            });
        });
    });
}

function sendEditCartOptions(recipientId, senderId){
    return bot.sendQuickReplyMessage(recipientId, senderId, "Opciones del carrito:", [
        {
            "content_type":"text",
            "title":"Finalizar pedido",
            "payload":"CheckOrder"
        },
        {
            "content_type":"text",
            "title":"Seguir pidiendo",
            "payload":"SendContinueOrder"
        }
    ]);
}

function editCart(recipientId, senderId){
    let cart = getData(recipientId, 'cart');

    bot.sendTypingOn(recipientId, senderId);
    return bot.sendTypingOff(recipientId, senderId).then(()=>{
        return bot.sendGenericMessage(recipientId, senderId, [
            {
                "title": "Opciones",
                "image_url": SERVER_URL+"assets/thinking.jpg",
                "buttons": [
                    {
                        "type": "web_url",
                        "url": SERVER_URL+"cart?"+cart.id,
                        "title": "Remover producto",
                        "webview_height_ratio": "full",
                        "messenger_extensions": true
                    }
                ]
            }
        ])
    });

}

function clearCart(recipientId, senderId){
    let cart = getData(recipientId, 'cart');

    if(typeof cart != 'undefined'){
        let items = cart.items;
        cart.itemsPointers = [];

        items.forEach(function(value, key){
            items.delete(key);
        });
    }
    return new Promise((resolve, reject) => {
        resolve()
    });
}

function clearAndSendCart(recipientId, senderId){
    clearCart(recipientId).then(()=>{
        sendCart(recipientId)
    });
}

function checkOrder(recipientId, senderId){
    let cart = getData(recipientId, 'cart');
    let consumer = getData(recipientId, 'consumer');
    let pointSale = getData(recipientId, 'pointSale');
    let total = 0;

    cart.items.forEach(function(value, key){
        total += value.quantity * value.price;
    });

    if(pointSale.minOrderPrice && pointSale.minOrderPrice > total ){
        sendMinOrderPriceRestriction(recipientId);
    }
    else if(typeof consumer.phone == 'undefined' || consumer.phone == ''){
        setTelephone(recipientId)
    }
    else if(typeof consumer.email == 'undefined' || consumer.email == ''){
        setEmail(recipientId)
    }
    else{
        checkPayment(recipientId);
    }

}

function checkAddress(recipientId, senderId){

}

function checkPayment(recipientId, senderId){
    return bot.sendTypingOn(recipientId, senderId).then(()=>{
        store.dispatch(Actions.loadPaymentMethods(recipientId)).then(() => {
            let paymentMethods = getData(recipientId, 'paymentMethods');
            let quick_replies = [];

            for(let i in paymentMethods){

                quick_replies.push({
                    "content_type": "text",
                    "title": paymentMethods[i].name.substring(0,20),
                    "payload": "Checkout-"+paymentMethods[i].objectId
                });
            }

            return bot.sendTypingOff(recipientId, senderId).then(()=>{
                return bot.sendQuickReplyMessage(recipientId, senderId, "Como vas a pagar tu pedido? (Tu pedido se cobra cuando lo recibes)", quick_replies)
            });
        });
    });
}

function checkout(recipientId, senderId, id){
    bot.sendTypingOn(recipientId, senderId);

    store.dispatch(Actions.setPaymentMethod(recipientId, id)).then(() => {
        let state = store.getState();
        let paymentTypes = state['paymentTypes'];
        let paymentMethod = getData(recipientId, 'paymentMethod');
        let paymentFunction = paymentTypes[paymentMethod.method.objectId];

        paymentFunction(recipientId);
    });
}

function sendMinOrderPriceRestriction(recipientId, senderId){
    let pointSale = getData(recipientId, 'pointSale');

    return bot.sendTypingOff(recipientId, senderId).then(()=>{
        return bot.sendTextMessage(recipientId, senderId, "El valor minimo de una orden con domicilio es "+pointSale.minOrderPrice+", \npor favor modifica tu pedido para cumplir este requisito").then(()=>{
            sendPurchaseOptions(recipientId);
        })
    });
}

function sendScheduleRestriction(recipientId, senderId, pointSaleSchedules){
    let pointSale = getData(recipientId, 'pointSale');

    let days = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'];
    let text ='En este momento nuestros puntos de venta estan cerrados, \npor favor solicita tu domicilio en los siguientes horarios:\n\n';

    for(let pointSaleSchedule of pointSaleSchedules) {
        let daysActive = pointSaleSchedule.get('daysActive');
        let allDay = pointSaleSchedule.get('allDay');

        for(let dayID in daysActive){
            if((daysActive.length-1) != dayID){
                text += days[daysActive[dayID]-1]+", "
            }
            else{
                text += "y "+days[daysActive[dayID]-1]+" "
            }
        }

        if(allDay){
            text += 'las 24 horas\n'
        }
        else{
            text += "desde las "+pointSaleSchedule.get('hourStart')+" ";
            text += "hasta las "+pointSaleSchedule.get('hourEnd');
        }
        text +="\n"
    }

    return bot.sendTypingOff(recipientId, senderId).then(()=>{
        return bot.sendTextMessage(recipientId, senderId, text).then(()=>{
            sendMenu(recipientId)
        });
    });
}

function sendCash(recipientId, senderId){
    return bot.sendTypingOn(recipientId, senderId).then(()=>{
        let paymentMethod = getData(recipientId, 'paymentMethod');
        saveCart(recipientId);

        return bot.sendTypingOff(recipientId, senderId).then(()=>{
            return bot.sendTextMessage(recipientId, senderId, "Se ha registrado el pago con "+paymentMethod.name ).then(()=>{
                orderConfirmation(recipientId);
            })
        });
    });
}

function registerCreditCard(recipientId, senderId){
    bot.sendTypingOn(recipientId, senderId);
    authentication(recipientId).then( () => {
        let consumer = getData(recipientId, 'consumer');

        return bot.sendTypingOff(recipientId, senderId).then(()=>{
            return bot.sendGenericMessage(recipientId, senderId, [{
                "title": "Registro de tarjeta de credito y finalización de tu pedido.\n\nEstas de acuerdo?",
                "image_url": SERVER_URL + "assets/images/creditCards.jpg",
                "subtitle": "Por razones de seguridad te redireccionaremos a una página web segura.",
                "buttons": [
                    {
                        "type": "web_url",
                        "title": "Si",
                        "url": SERVER_URL + "creditCard?id=" + consumer.objectId,
                        "webview_height_ratio": "full",
                        "messenger_extensions": true
                    },
                    {
                        "type": "postback",
                        "title": "No",
                        "payload": "CancelRegisterCreditCard"
                    }]
            }]);
        });
    });
}

function registerCreditCardAndPay(recipientId, senderId){
    bot.setDataBuffer(recipientId, 'creditCardPayload', 'SendCreditCards');

    registerCreditCard(recipientId)
}

function cancelRegisterCreditCard(recipientId, senderId){
    bot.sendTypingOn(recipientId, senderId).then(()=>{
        let userBuffer = bot.buffer[recipientId];

        return bot.sendTypingOff(recipientId, senderId).then(()=>{
            return bot.sendTextMessage(recipientId, senderId, "Si no ingresas los datos de tu tarjeta en nuestro sitio seguro, no podras comprar con tarjeta online").then(()=>{
                if (typeof userBuffer != 'undefined' && userBuffer.hasOwnProperty('creditCardPayload')) {
                    checkPayment(recipientId);
                }
                else{
                    sendAccount(recipientId);
                }
            });
        });
    });
}

function sendRegisteredCreditCards(recipientId, senderId){
    bot.sendTypingOn(recipientId, senderId).then(()=>{
        let user = getData(recipientId, 'user');
        let consumer = getData(recipientId, 'consumer');

        CreditCard.loadInStore(store, recipientId, user).then(() => {
            let creditCards = getData(recipientId, 'creditCards');
            if (creditCards.length == 0) {
                return bot.sendTypingOff(recipientId, senderId).then(()=>{
                    return bot.sendQuickReplyMessage(recipientId, senderId, "Aun no tienes tarjetas registradas, deseas registrar una tarjeta?", [
                        {
                            "content_type":"text",
                            "title":"Si",
                            "payload":"RegisterCreditCardAndPay"
                        },
                        {
                            "content_type":"text",
                            "title":"No",
                            "payload":"CheckPayment"
                        }
                    ])
                });
            }
            else {
                let creditCards = getData(recipientId, 'creditCards');
                let quick_replies = [];

                quick_replies.push({
                    "content_type": "text",
                    "title": "Agregar tarjeta",
                    "payload": "RegisterCreditCardAndPay"
                });

                for(let card of creditCards){
                    if (quick_replies.length < bot.limit) {
                        quick_replies.push({
                            "content_type": "text",
                            "title": card.type+" "+card.lastFour,
                            "payload": "PayWithCreditCard-" + card.lastFour
                        });
                    }
                }

                return bot.sendTypingOff(recipientId, senderId).then(()=>{
                    return bot.sendQuickReplyMessage(recipientId, senderId, "Con cual tarjeta quieres pagar?", quick_replies)
                });
            }
        });
    });
}

function payWithCreditCard(recipientId, senderId, creditCardId){
    bot.sendTypingOn(recipientId, senderId);

    orderConfirmation(recipientId)
}

function orderConfirmation(recipientId, senderId){
    return bot.sendTypingOn(recipientId, senderId).then(()=>{
        saveOrder(recipientId);
        getOrderState(0).then(state=> {
            return bot.sendTypingOff(recipientId, senderId).then(() => {
                return bot.sendTextMessage(recipientId, senderId, state.messagePush + "\n\nEn un momento te estaremos dando información en tiempo real sobre tu pedido")
            });
        });
    });
}

function orderState(recipientId, senderId){
    bot.sendTypingOn(recipientId, senderId);

    orderSent(recipientId)
}

function orderSent(recipientId, senderId){
    return bot.sendTypingOn(recipientId, senderId).then(()=>{
        return bot.sendTypingOff(recipientId, senderId).then(()=>{
            return bot.sendTextMessage(recipientId, senderId, "Buenas noticias, Tu pedido ha sido Enviado. \n\nHaz click en el mapa para vel tu pedido").then(()=>{
                sendserviceRating(recipientId);
            })
        });
    });
}

function sendOrderState(recipientId, senderId){
    return bot.sendTypingOn(recipientId, senderId).then(()=>{
        let orderState = getData(recipientId, 'orderState');
        let pointSale = getData(recipientId, 'pointSale');

        return bot.sendTypingOff(recipientId, senderId).then(()=>{
            if(orderState.order == 1){
                return bot.sendTextMessage(recipientId, senderId, "Tu pedido ha sido Aceptado. \n\nLo estan preparando en nuestra sede y te lo enviaremos en aproximadamente "+pointSale.deliveryTime+" minutos")
            }
            else if(orderState.order == 5){
                return bot.sendTextMessage(recipientId, senderId, orderState.messagePush).then(()=>{
                    sendserviceRating(recipientId);
                });
            }
            else if(orderState.order == 6){
                return new Promise((resolve, reject) => {
                    resolve()
                });
            }
            else{
                return bot.sendTypingOff(recipientId, senderId).then(()=>{
                    return bot.sendTextMessage(recipientId, senderId, orderState.messagePush)
                });
            }
        });
    });
}

function sendserviceRating(recipientId, senderId){
    return bot.sendTypingOn(recipientId, senderId).then(()=>{
        return bot.sendTypingOff(recipientId, senderId).then(()=>{
            return bot.sendQuickReplyMessage(recipientId, senderId, "Califica tu experiencia para ayudarnos a mejorar. \n\nDe 1 a 5 cuantas extrellas merece nuestro servicio?", [
                {
                    "content_type":"text",
                    "title":"5 (Excelente)",
                    "payload":"SetScore-5"
                },
                {
                    "content_type":"text",
                    "title":"4 (Bien)",
                    "payload":"SetScore-4"
                },
                {
                    "content_type":"text",
                    "title":"3 (Regular)",
                    "payload":"SetScore-3"
                },
                {
                    "content_type":"text",
                    "title":"2 (Mal)",
                    "payload":"SetScore-2"
                },
                {
                    "content_type":"text",
                    "title":"2 (Muy mal)",
                    "payload":"SetScore-1"
                },
            ]);
        });
    });
}

function setScore(recipientId, senderId, score){
    let order = getData(recipientId, 'order');
    return bot.sendTypingOn(recipientId, senderId).then(()=>{
        Parse.Cloud.run('rateOrder', { orderId: order.objectId, score: Number(score), comment: ''}).then(
            function(result){
                return bot.sendTypingOff(recipientId, senderId).then(()=>{
                    thank(recipientId)
                });
            },
            function(error) {
                console.log('error');
                console.log(error);
            });
    });


}

function thank(recipientId, senderId){
    return bot.sendTypingOn(recipientId, senderId).then(()=>{
        return bot.sendTypingOff(recipientId, senderId).then(()=>{
            return bot.sendTextMessage(recipientId, senderId, "Gracias, esperamos tener el gusto de atenderle nuevamente")
        });
    });
}

function searchProducts(recipientId, senderId, query, index){
    bot.sendTypingOn(recipientId, senderId);

    Parse.Cloud.run('search', { businessId: BUSINESS_ID, q: query }).then(
        function(result){
            if(result.length == 0){
                renderSearchEmpty(recipientId);
            }
            else if(result.length == 1 && result[0].type == 'Category'){
                sendProducts(recipientId, senderId, result[0].id, 0)
            }
            else{
                if(index == undefined)
                    index = 0;
                else if( typeof index == 'string')
                    index = parseInt(index);

                if(index == 0){
                    renderSearchInitial(recipientId);
                    bot.sendTypingOn(recipientId, senderId);
                }

                splitSearchResult(recipientId, result, index).then(elements => {
                    let idx = Object.keys(result).length;
                    let buttons = [];
                    let catIni = (index+1)*bot.limit;
                    let catFin =  (idx > catIni+bot.limit) ? catIni+bot.limit : idx;

                    if(idx > (index+1)*bot.limit){
                        buttons.push({
                            type: "postback",
                            title: "Productos "+(catIni+1)+"-"+catFin,
                            payload: "Search-"+(index+1),
                        });

                        elements.push({
                            title: "Ver más productos ",
                            subtitle: "Productos disponibles",
                            buttons: buttons
                        });
                    }

                    return bot.sendTypingOff(recipientId, senderId).then(()=>{
                        return bot.sendGenericMessage(recipientId, senderId, elements)
                    });
                });
            }
        },
        function(error) {
            console.log('error');
            console.log(error);
        }
    );
}

function renderSearchInitial(recipientId, senderId){
    return bot.sendTypingOff(recipientId, senderId).then(()=>{
        return bot.sendTextMessage(recipientId, senderId, "Se han encontrado los siguientes productos:")
    });
}

function renderSearchEmpty(recipientId, senderId){
    return bot.sendTypingOff(recipientId, senderId).then(()=>{
        return bot.sendTextMessage(recipientId, senderId, "No se han encontrado productos que coincidan")
    })
}

function splitSearchResult(recipientId, senderId, products, index){
    let customer = getData(recipientId, 'customer');
    let image_url;
    let idx = 0;
    let elements = [];
    let promises = [];

    products.forEach(function(item){
        if(item && item.name && item.type == 'Product'){
            if(idx >= (index)*bot.limit && idx < (index+1)*bot.limit){
                promises.push(new Parse.Query(Product).get(item.id).then(product => {
                    return extractParseAttributes(product);
                }));
                idx = idx+1;
            }
        }
    });

    return Parse.Promise.when(promises).then(function(productObjects) {
        productObjects.forEach(function(product) {
            let image = product.image;
            image_url = (typeof image != 'undefined') ? image.url : customer.image.url;
            elements.push({
                title: product.name +": $"+ product.priceDefault,
                subtitle: product.description,
                image_url: image_url,
                buttons: [{
                    type: "postback",
                    title: 'Agregar',
                    payload: "AddProduct-"+product.objectId,
                },
                    {
                        type: "postback",
                        title: 'Ver descripción',
                        payload: "SendProductDescription-"+product.objectId,
                    }]
            });
        })
        return elements;
    });

    //    subtitle: item.get('description'),
}

function sendHelp(recipientId, senderId){
    bot.sendTypingOn(recipientId, senderId);
    renderHelp(recipientId).then(()=>{
        sendContactUs(recipientId);
    });
}

function renderHelp(recipientId, senderId){
    return bot.sendTypingOff(recipientId, senderId).then(()=>{
        return bot.sendTextMessage(recipientId, senderId, "InOut Bot.\n\nTe permite visualizar las opciones de productos, agregarlos al carrito y realizar tu compra por medio del chat de facebook.\n\nFuncionalidades disponibles: \n\n'Hola', para iniciar la conversación\n'Pedir Domicilio', si quieres realizar un domicilio\n'Carrito', para ver el estado actual de tu carrito")
    });
}

function sendContactUs(recipientId, senderId){
    return bot.sendTypingOn(recipientId, senderId).then(()=>{
        return bot.sendTypingOff(recipientId, senderId).then(()=>{
            return bot.sendTextMessage(recipientId, senderId, " Para mayor información puedes contactarnos en:\n\n Web: http://www.inoutdelivery.com/\n\n Email: soporte@inoutdelivery.com")
        });
    });
}

function sendOrders(recipientId, senderId){
    bot.sendTypingOn(recipientId, senderId);

    authentication(recipientId).then( () =>{
        let consumer = getData(recipientId, 'consumer');
        Parse.Cloud.run('ordersBot', { businessId: BUSINESS_ID, consumerId: consumer.objectId}).then( orders => {
            store.dispatch(Actions.setOrders(recipientId, orders)).then(() => {
                renderOrders(recipientId);
            });
        }).fail(error => {
            console.log('error');
            console.log(error);
        });
    });
}

function renderOrders(recipientId, senderId){
    let customer = getData(recipientId, 'customer');
    let orders = getData(recipientId, 'orders');
    let elements = [];

    elements.push({
        "title": "Nueva orden",
        "subtitle": "Puedes realizar una orden",
        "image_url": SERVER_URL+"assets/images/newOrden.jpg",
        "buttons": [
            {
                "type": "postback",
                "title": "Nueva orden",
                "payload": "NewOrder"
            }
        ]
    });

    for(let order of orders.ongoing) {
        if (elements.length < bot.limit){
            let datetime = DateTime.dateString(order.createdAt);
            let image_url = customer.image.url;
            let title = (order.orderNumber)? 'Orden: '+order.orderNumber :  'Orden: '+dateFormat(datetime, "h:MM:ss TT dd/mm/yyyy")

            elements.push({
                "title": title,
                "subtitle": 'Estado: '+order.state.name+', Valor: $'+order.total,
                "image_url": image_url,
                "buttons": [
                    {
                        "type": "postback",
                        "title": "Ver orden",
                        "payload": "SendOrder-"+order.objectId
                    },
                    {
                        "type": "postback",
                        "title": "Cancelar orden",
                        "payload": "CancelOrder-"+order.objectId
                    }
                ]
            });
        }
    }

    return bot.sendTypingOff(recipientId, senderId).then(()=>{
        return bot.sendGenericMessage(recipientId, senderId, elements)
    });
}

function sendOrder(recipientId, senderId, id){
    bot.sendTypingOn(recipientId, senderId);
    authentication(recipientId).then( () =>{
        let orders = getData(recipientId, 'orders');
        let customer = getData(recipientId, 'customer');
        let customer_image_url = customer.image.url;
        let currentOrder;
        let elements = [];
        let element;
        let image_url;
        let product;

        for(let order of orders.ongoing){
            if(order.objectId == id){
                currentOrder = order;
            }
        }

        for(let item of currentOrder.items){
            product = item.product;
            image_url = customer_image_url;

            if(product.image){
                image_url = product.image.url;
            }

            element = {};
            element['title'] = product.name;
            element['quantity'] = item.amount;
            element['price'] = item.price;
            element['currency'] = "COP";
            element['image_url'] = image_url;

            elements.push(element);
        }

        renderOrder(recipientId, currentOrder, elements)
    });
}

function renderOrder(recipientId, senderId, order, elements){
    let user = getData(recipientId, 'user');
    let consumer = getData(recipientId, 'consumer');
    let address = order.consumerAddress;
    let pointSale = order.pointSale;
    let payment_method = order.paymentMethod;
    let addressData = undefined;

    if(typeof payment_method == 'undefined'){
        payment_method = {name: 'Sin definir'}
    }

    if(typeof address != 'undefined'){
        addressData = {
            street_1: address.address ? address.address : 'Dirección no definida',
            street_2: address.description ? address.description : 'Sin complemento',
            city: address.city ? address.city : 'No definida',
            postal_code: address.postalCode ? address.postalCode : 'No definido',
            state: address.state ? address.state : 'No definido',
            country: address.countryCode ? address.countryCode : 'No definido'
        }
    }

    return bot.sendTypingOff(recipientId, senderId).then(()=>{
        return bot.sendReceiptMessage(recipientId, {
            template_type: "receipt",
            recipient_name: user.first_name+" "+user.last_name,
            order_number: order.objectId,
            currency: "COP",
            payment_method: payment_method.name,
            timestamp: Math.trunc(Date.now()/1000).toString(),
            elements: elements,
            address: addressData,
            summary: {
                subtotal: order.total,
                shipping_cost: pointSale.deliveryCost,
                total_cost: order.total+pointSale.deliveryCost
            }
        },
        [
            {
                "content_type":"text",
                "title":"Nueva orden",
                "payload":"NewOrder"
            },
            {
                "content_type":"text",
                "title":"Ver órdenes",
                "payload":"SendOrders"
            },
            {
                "content_type":"text",
                "title":"Cancelar orden",
                "payload":"CancelOrder-"+order.objectId
            }
        ]);
    });
}

function newOrder(recipientId, senderId){
    clearCart(recipientId).then(()=>{
        sendCart(recipientId);
        sendAddressesWithTitle(recipientId);
    });

}

function cancelOrder(recipientId, senderId, id){
    Parse.Cloud.run('changeStatusOrder', { status: "canceledByUser", orderId: id}).then( () => {
        renderCancelOrder(recipientId).then(()=>{
            sendOrders(recipientId);
        });
    }).fail(error => {
        console.log('error');
        console.log(error);
    });
}

function renderCancelOrder(recipientId, senderId){
    return bot.sendTypingOff(recipientId, senderId).then(()=>{
        return bot.sendTextMessage(recipientId, senderId, "La orden ha sido cancelada.")
    });
}

function sendAccount(recipientId, senderId){
    bot.sendTypingOn(recipientId, senderId);

    authentication(recipientId).then( ()=> {
        renderAccount(recipientId)
    });
}

function renderAccount(recipientId, senderId){
    let user = getData(recipientId, 'user');
    let consumer = getData(recipientId, 'consumer');
    let elements = [{
        "title": 'Ver direcciones',
        "subtitle": 'Editar y eliminar direcciones',
        "image_url": SERVER_URL+"assets/images/addresses.jpg",
        "buttons": [
            {
                "type": "postback",
                "title": 'Ver direcciones',
                "payload": "SendAddresses"
            }
        ]
    },{
        "title": 'Ver tarjetas de credito',
        "subtitle": 'Editar y eliminar tarjetas de credito',
        "image_url": SERVER_URL+"assets/images/creditCards.jpg",
        "buttons": [
            {
                "type": "postback",
                "title": 'Ver tarjetas',
                "payload": "SendCreditCards"
            }
        ]
    }];

    return bot.sendTypingOff(recipientId, senderId).then(()=>{
        return bot.sendGenericMessage(recipientId, senderId, elements)
    });
}

function sendYouAreWelcome(recipientId, senderId){
    return bot.sendTypingOn(recipientId, senderId).then(()=>{
        return bot.sendTypingOff(recipientId, senderId).then(()=>{
            return bot.sendTextMessage(recipientId, senderId, "De nada, gracias por usar nuestros servicios")
        });
    });
}

function addCreditCard(recipientId, senderId, token, data){
    console.log('addCreditCard');
    let expiration = data['expiry'].replace(/\s+/g,"").split('/');

    return rp({
        uri: PARSE_SERVER_URL+'/functions/addCreditCard',
        headers: {
            'Content-Type': 'text/plain;charset=UTF-8',
            'X-Parse-Application-Id': PARSE_APP_ID,
            'X-Parse-Session-Token': token
        },
        method: 'POST',
        json: { "number": data['number'].replace(/\s+/g,""),
            "holderName": data['holderName'],
            "verificationNumber": data['cvc'],
            "expirationMonth": expiration[0],
            "expirationYear": expiration[1]
        }
    }).then( body => {
        rp({
            uri: SERVER_URL+'creditCardRegistered',
            method: 'POST',
            json: { "recipientId": recipientId}
        })
    }).catch(error =>{
        console.log('error');
        console.log(error);
    });
}

function getOrderState(orderStateNumber){
    return new Parse.Query(OrderState).equalTo('order', orderStateNumber).find().then( state => {
        return extractParseAttributes(state[0]);
    },
    (object, error) => {
        console.log(error);
    });
}

module.exports = {store, getData}

store.dispatch({type: types.APP_LOADED});
