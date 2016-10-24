import * as _ from 'underscore';
import * as bot from './bot';
import * as types from './constants/actionTypes';
import * as Actions from './actions/index';
import * as ParseModels from './models/ParseModels';
import { extractParseAttributes } from './ParseUtils';
import { createStore, applyMiddleware } from 'redux';

import utils from './utils';
import config from 'config';
import request from 'request';
import HashMap  from 'hashmap';
import objectAssign from 'object-assign';
import thunk from 'redux-thunk';
import FB from 'fb';
import geocoder from 'geocoder';
import path from 'path';

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

const FIREBASE_URL = (process.env.FIREBASE_URL) ? (process.env.FIREBASE_URL) : config.get('FIREBASE_URL');

FB.options({
    appId:          FACEBOOK_APP_ID,
    appSecret:      APP_SECRET,
    redirectUri:    REDIRECT_URI
});

bot.rules.set('hola', sendMenu);
bot.rules.set('iniciar', sendMenu);
bot.rules.set('empezar', sendMenu);
bot.rules.set('comenzar', sendMenu);
bot.rules.set('buenos dias', sendMenu);
bot.rules.set('buenas tardes', sendMenu);
bot.rules.set('pedir domicilio', sendAddresses);
bot.rules.set('carrito', sendCart);
bot.rules.set('cuenta', sendCart);

bot.payloadRules.set('Greeting', sendMenu);

bot.payloadRules.set('SendAddresses', sendAddresses);
bot.payloadRules.set('NewAddress', newAddress);
bot.payloadRules.set('SetAddressComplement', setAddressComplement);
bot.payloadRules.set('ConfirmAddress', confirmAddress);
bot.payloadRules.set('SetAddress', setAddress);

bot.payloadRules.set('SendCategories', sendCategories);
bot.payloadRules.set('SendProducts', sendProducts);
bot.payloadRules.set('AddProduct', addProduct);
bot.payloadRules.set('RemoveProduct', removeProduct);
bot.payloadRules.set('IncreaseOneProduct', increaseOneProduct);
bot.payloadRules.set('DecreaseOneProduct', decreaseOneProduct);

bot.payloadRules.set('Search', searchProducts);
bot.payloadRules.set('SendCart', sendCart);
bot.payloadRules.set('SendCartDetails', sendCartDetails);
bot.payloadRules.set('EditCart', editCart);
bot.payloadRules.set('ClearCart', clearCart);
bot.payloadRules.set('SendPurchaseOptions', sendPurchaseOptions);

bot.payloadRules.set('Checkout', checkout);
bot.payloadRules.set('CheckPayment', checkPayment);
bot.payloadRules.set('CheckAddress', checkAddress);
bot.payloadRules.set('CheckOrder', checkOrder);
bot.payloadRules.set('RegisterCreditCard', registerCreditCard);
bot.payloadRules.set('SendRegisteredCreditCards', sendRegisteredCreditCards);
bot.payloadRules.set('CancelRegisterCreditCard', cancelRegisterCreditCard);
bot.payloadRules.set('PayWithCreditCard', payWithCreditCard);
bot.payloadRules.set('SendOrders', sendOrders)
bot.payloadRules.set('NewOrder', newOrder);
bot.payloadRules.set('SetScore', setScore);
bot.payloadRules.set('Help', sendHelp);

bot.defaultSearch = searchProducts;

const initialState = {
    userData: {},


    geocodedLocation: {lat: -1, lng: -1},
    addresses: [],
    mapBounds: {},
    mapAddress: '',
    useSubCategories: false,
    products: [],
    pointOfSales: [],
    categories: [],
    paymentMethods: [],
    consumer: {},
    customer: {},
    orders: { ongoing: [], delivered: [] },
    orderToRate: null,
    currentOrder: {
        consumerAddress:{},
        items: []
    },
    locationZoom: 3,
    profileIsOpen: false,
    mapAddressIsOpen: false,
    addressFormIsOpen: false,
    addressListIsOpen: false,
    savingAddress: false,
    creatingOrder: false,
    paymentMethodNotSelected: false,
    cartTotalIsBelowMinimumPrice: false,
    currentCategory: {},
    consumerNotFound: false,
    updatingConsumer: false,
    currentUser: {},
    pendingOrder: false
};

const reducer = (state = initialState, action) => {
    console.log('ACTION');
    console.log(action);
    var data = action.data;

    if(data && data.hasOwnProperty('recipientId')){
        if(typeof state.userData[data.recipientId] != 'object'){
            state.userData[data.recipientId] = {};
        }
    }

    switch (action.type) {
        case types.APP_LOADED:
            console.log('Application is running on port', bot.app.get('port'));
            return {...state};

        case types.CUSTOMER_LOADED:
            let customer = extractParseAttributes(data.customer);

            if(typeof state.userData[data.recipientId] != 'object'){
                state.userData[data.recipientId] = {};
            }
            objectAssign(state.userData[data.recipientId], {customer});
            return {...state};

        case types.CONSUMER_LOADED:
            //if (state.consumerNotFound) delete state.consumerNotFound;
            var consumer = extractParseAttributes(data.consumer);
            objectAssign(state.userData[data.recipientId], {consumer});
            return {...state};

        case types.USER_LOADED:
            var user = extractParseAttributes(data.user);
            objectAssign(state.userData[data.recipientId], {user});
            return {...state};

        case types.CONSUMER_ADDRESSES_LOADED:
            let addresses = data.addresses.map(a => extractParseAttributes(a));
            objectAssign(state.userData[data.recipientId], {addresses});
            return {...state};

        case types.SET_CURRENT_ADDRESS:
            let address = extractParseAttributes(data.address);
            objectAssign(state.userData[data.recipientId], {address});
            return {...state};

        case types.PAYMENT_METHODS_LOADED:
            console.log('PAYMENT_METHODS_LOADED');
            console.log(data.paymentMethods);
            let paymentMethods = data.paymentMethods.map(p => extractParseAttributes(p))
            objectAssign(state.userData[data.recipientId], {paymentMethods})
            return {...state};
        
        case types.SET_PAYMENT_METHOD:
            let paymentMethod = extractParseAttributes(data.paymentMethod);
            objectAssign(state.userData[data.recipientId], {paymentMethod});
            return {...state};
            
        case types.CONSUMER_UPDATED:
            return {...state};

        case types.CONSUMER_NOT_FOUND:
            objectAssign(state, {
                consumerNotFound: true,
                currentUser: action.data.user
            })
            return {...state};

        case types.CONSUMER_ORDERS_LOADED:
            let orders = data.orders.map(a => extractParseAttributes(a));
            objectAssign(state.userData[data.recipientId], {orders});
            return {...state};
            /*let ongoing = orders['ongoing'].map(o => extractParseAttributes(o))
            let delivered = orders['delivered'].map(o => extractParseAttributes(o))
            let orderToRate = delivered[0]
            objectAssign(state, {
                orders: {ongoing, delivered},
                orderToRate
            })*/
            return {...state};

        case types.USER_CREDITCARDS_LOADED:
            let creditCards = data.creditCards.map(a => extractParseAttributes(a));
            objectAssign(state.userData[data.recipientId], {creditCards});
            return {...state};

        case types.SET_CUSTOMER_POINT_SALE:
            let pointSale = extractParseAttributes(data.pointSale);
            objectAssign(state.userData[data.recipientId], {pointSale});
            return {...state};

        case types.SET_ORDER:
            let order = extractParseAttributes(data.order);
            objectAssign(state.userData[data.recipientId], {order});
            return {...state};

        case types.SET_USER:
            let user = extractParseAttributes(data.user);
            objectAssign(state.userData[data.recipientId], {user});
            return {...state};

        case types.SET_CONSUMER:
            let consumer = extractParseAttributes(data.consumer);
            objectAssign(state.userData[data.recipientId], {consumer});
            return {...state};

        case types.SET_ORDER_STATE:
            let orderState = extractParseAttributes(data.orderState);
            objectAssign(state.userData[data.recipientId], {orderState});
            return {...state};

        case types.RENDER_MENU:
            /*
            console.log('Store');
            console.log('Consumer');
            console.log(consumer);*/
            renderMenu()

            /*request({
             uri: 'https://graph.facebook.com/v2.6/' + '1100195690052041',
             qs: {access_token: PAGE_ACCESS_TOKEN, fields: 'first_name,last_name,locale,timezone,gender'},
             method: 'GET'
             }, renderMenuMessage);*/
            return state;

        case  types.RENDER_ADDRESS_MENU:
            renderAddress();
            return state;

        default:
            return state;
    }
}

const store = createStore(reducer, applyMiddleware(thunk));

store.subscribe(() =>
    console.log('\n')
);

//global.FB = FB;

function getData(recipientId, property){
    if(recipientId !== undefined){
        var data = store.getState().userData;
        var userData = data[recipientId];

        if(userData == undefined){
            data[recipientId] = {};
            userData = data[recipientId];
        }

        if(property == undefined)
            return userData;
        else{
            if(userData.hasOwnProperty(property)){
                return userData[property];
            }
            else
                return undefined;
        }
    }
}

function login(username, password){
    return Parse.User.logIn(username, password, {
        success : user => {
            /*console.log(Parse.User.current());
             console.log(user);
             console.log(user.authenticated());
             console.log(user.getSessionToken());*/
            var val = JSON.stringify({sessionToken: user.getSessionToken()});
            //console.log(val);

            /*Parse.User.become(_user.getSessionToken()).then(__user => {
             console.log(Parse.User.current());
             console.log(__user);
             console.log(__user.authenticated());
             console.log(__user.getSessionToken());
             });

             _;*/
        },
        error: function(user, error) {
            // An error occurred.
        }});
}

function authentication(recipientId, callback){
    var user = getData(recipientId, 'user');
    var consumer = getData(recipientId, 'consumer');
    var username = recipientId.toString();

    if(typeof user == 'undefined'){
        user = new ParseModels.User({recipientId});
    }
    else{
        user = user.rawParseObject
    }

    user.registered().then(_user => {
        if (typeof _user == 'undefined') {
            bot.getFacebookUser(recipientId).then(data => {
                user.signUpWithFacebook(data).then(() => {
                    username = user.get('username');
                    login(username, username).then(()=> {
                        user.saveInStore(store).then(() => {
                            if (typeof consumer == 'undefined') {
                                createConsumer(user).then(_consumer => {
                                    _consumer.saveInStore(store).then(()=> {
                                        if(callback){
                                            callback(user)
                                        }
                                    });
                                });
                            }
                            else {
                                if(callback){
                                    callback(user)
                                }
                            }
                        });
                    });
                });
            });
        }
        else {
            username = _user.get('username');
            login(username, username).then(()=> {
                _user.saveInStore(store).then(() => {
                    if (typeof consumer == 'undefined') {
                        createConsumer(user).then(_consumer => {
                            _consumer.saveInStore(store).then(()=> {
                                if(callback){
                                    callback(user)
                                }
                            });
                        });
                    }
                    else {
                        if(callback){
                            callback(user)
                        }
                    }
                });
            });
        }
    });

}

function createConsumer(user){
    var consumer = new ParseModels.Consumer();
    consumer.setUser(user);
    return consumer.save().fail(error => {
        console.log('Error code: ' + error.message);
    });
}

function loadUser(recipientId){
    return store.dispatch(Actions.loadUser(recipientId))
}

function loadCustomer(recipientId){
    return store.dispatch(Actions.loadCustomer(recipientId, BUSINESS_ID))
}

function loadConsumer(recipientId, user){
    return store.dispatch(Actions.loadConsumer(recipientId, user.rawParseObject))
}

function loadConsumerAddresses(recipientId, consumer){
    return store.dispatch(Actions.loadConsumerAddresses(recipientId, consumer.rawParseObject))
}

function sendMenu(recipientId) {
    bot.sendTypingOn(recipientId);

    authentication(recipientId, () =>{
        var user = getData(recipientId, 'user');

        loadCustomer(recipientId).then(() => {
            loadConsumer(recipientId, user).then(() => {
                renderMenu(recipientId);
            });
        });
    });
}

function renderMenu(recipientId) {
    var customer = getData(recipientId, 'customer');
    var consumer = getData(recipientId, 'consumer');

    var image_url = customer.image.url;
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            attachment: {
                type: "template",
                payload: {
                    template_type: "generic",
                    //text: "Buenos dias, para conocer nuestros menus del dia, por favor escoja una opción:",
                    elements: [{
                        "title":     "Hola "+consumer.name+", Bienvenido a "+customer.name,
                        "subtitle":  "Aquí puedes pedir un domicilio, escribe o selecciona alguna de las opciones:",
                        "image_url": image_url,
                        "buttons":[
                            {
                                "type":"postback",
                                "title":"Pedir domicilio",
                                "payload": "SendAddresses"
                            },
                            {
                                "type":"postback",
                                "title":"Pedir para recoger",
                                "payload": "TakeOut"
                            },
                            {
                                "type":"postback",
                                "title":"Servicio al cliente",
                                "payload": "CustomerService"
                            }
                        ]
                    }]
                }
            }
        }
    };

    bot.sendTypingOff(recipientId);
    bot.callSendAPI(messageData);
}

function sendAddresses(recipientId){
    bot.sendTypingOn(recipientId);

    authentication(recipientId, () =>{
        var user = getData(recipientId, 'user');
        var consumer = getData(recipientId, 'consumer');

        loadCustomer(recipientId).then(() => {
            loadConsumer(recipientId, user).then(() => {
                loadConsumerAddresses(recipientId, consumer).then(() => {
                    renderAddress(recipientId);
                });
            });
        });
    });
}

function renderAddress(recipientId){

    var addresses = getData(recipientId, 'addresses');
    var elements = [];

    //"title": "A cual dirección vas hacer tu pedido?",
    //"subtitle": "Puedes escoger entre tus direcciones guardadas o agregar una nueva dirección",
    renderAddressTitle(recipientId, () => {
        elements.push({
            "title": "Nueva dirección",
            "subtitle": "Puedes agregar una nueva dirección",
            "image_url": SERVER_URL+"assets/new_address_blue.jpg",
            "buttons": [
                {
                    "type": "postback",
                    "title": "Nueva dirección",
                    "payload": "NewAddress"
                }
            ]
        });

        for(var address of addresses) {
            if (elements.length < bot.limit){
                elements.push({
                    "title": address.name.capitalizeFirstLetter(),
                    "subtitle": address.address +", "+address.description+", "+address.city+", "+address.state,
                    "image_url": GOOGLE_MAPS_URL+ "?center="+address.location.lat+","+address.location.lng+"&zoom=16&size=400x400&markers=color:red%7C"+address.location.lat+","+address.location.lng+"&key="+GOOGLE_MAPS_KEY,
                    "buttons": [
                        {
                            "type": "postback",
                            "title": address.name.capitalizeFirstLetter(),
                            "payload": "SetAddress-"+address.objectId
                        }
                    ]
                });
            }
        }

        var messageData = {
            recipient: {
                id: recipientId
            },
            message: {
                "attachment":{
                    "type": "template",
                    "payload":{
                        "template_type": "generic",
                        "elements": elements
                    }
                }
            }
        };

        bot.sendTypingOff(recipientId);
        bot.callSendAPI(messageData);
    });
}











function renderAddressTitle(recipientId, callback){
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            "text": "A cual dirección vas hacer tu pedido?\n\nPuedes escoger entre agregar una nueva dirección o seleccionar una de tus direcciones guardadas"
        }
    };
    bot.sendTypingOff(recipientId);
    bot.callSendAPI(messageData, callback);
}

function newAddress(recipientId){
    bot.sendTypingOff(recipientId);
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            "text": "Puedes escribir o compartir tu ubicación actual?\n\nEjemplo: Calle 67 #52-20, Medellín",
            "quick_replies":[
                {
                    "content_type": "location"
                }
            ]
        }
    };

    bot.setListener(recipientId, 'address', 'text', addressCheck);
    bot.setListener(recipientId, 'location', 'attachment', setLocationCheck);

    bot.callSendAPI(messageData);
}

function setAddressComplement(recipientId){
    bot.sendTypingOff(recipientId);
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            "text": "Por favor escribe el complemento de tu dirección actual. \n\nEjemplo: Oficina 1068"
        }
    };
    bot.setListener(recipientId, 'complement', 'text', confirmAddress);
    bot.callSendAPI(messageData);
}

function renderMapMessage(recipientId, callback){
    var userBuffer = bot.buffer[recipientId];
    var messageData = {
        recipient: {
            id: recipientId
        },
        "message": {
            "text": "Encontré esta dirección en Google Maps:\n\n"+userBuffer.address+""
        }
    };

    bot.sendTypingOff(recipientId);
    bot.callSendAPI(messageData, callback);
}

function renderMap(recipientId, callback){
    bot.sendTypingOff(recipientId);
    var userBuffer = bot.buffer[recipientId];
    var messageData = {
        recipient: {
            id: recipientId
        },
        "message": {
            "attachment": {
                "type": "image",
                "payload": {
                    "url": GOOGLE_MAPS_URL+"?center="+userBuffer.location.lat+","+userBuffer.location.lng+"&zoom=16&size=400x400&markers=color:red%7C"+userBuffer.location.lat+","+userBuffer.location.lng+"&key="+GOOGLE_MAPS_KEY
                }
            }
        }
    };

    bot.callSendAPI(messageData, callback);
}

function addressCheck(recipientId){
    let userBuffer = bot.buffer[recipientId];
    
    geocoder.geocode(userBuffer.address, (error, data) =>{
        if(!error && data.status == 'OK'){
            let result = data.results[0];

            userBuffer.address = result.formatted_address;
            userBuffer.location = result.geometry.location;

            for(var component of result.address_components){
                if(component.types.includes('route')){
                    userBuffer.route = component.long_name;
                }
                else if(component.types.includes('street_number')){
                    userBuffer.street_number = component.short_name;
                }
                else if(component.types.includes('locality')){
                    userBuffer.locality = component.short_name;
                }
                else if(component.types.includes('administrative_area_level_1')){
                    userBuffer.state = component.short_name;
                }
                else if(component.types.includes('administrative_area_level_2')){
                    userBuffer.administrative_area = component.short_name;
                }
                else if(component.types.includes('country')){
                    userBuffer.country = component.long_name;
                    userBuffer.country_code = component.short_name
                }
                else if(component.types.includes('postal_code')){
                    userBuffer.postal_code = component.short_name;
                }
            }

            renderMapMessage(recipientId, () => {
                renderMap(recipientId, () => {
                    var messageData = {
                        recipient: {
                            id: recipientId
                        },
                        message: {
                            "text": "Es correcta?",
                            "quick_replies":[
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
                            ]
                        }
                    };
                    bot.sendTypingOff(recipientId);
                    bot.callSendAPI(messageData);
                });
            });
        }
        else{
            console.log('Geocode not found');
            console.log(error);
        }

    });
}

function writeAddressComplete(recipientId){
    let consumer = getData(recipientId, 'consumer');
    let userBuffer = bot.buffer[recipientId];

    console.log(userBuffer);

    var location = new Parse.GeoPoint({latitude: parseFloat(userBuffer.location.lat), longitude: parseFloat(userBuffer.location.lng)});

    var consumerAddress = new ParseModels.ConsumerAddress();
    consumerAddress.set('name', userBuffer['address-name']);
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
            delete userBuffer['address-name'];

            var messageData = {
                recipient: {
                    id: recipientId
                },
                message: {
                    "text": "La dirección ha sido almacenada."
                }
            };

            bot.sendTypingOff(recipientId);
            bot.callSendAPI(messageData, () => {
                setAddress(recipientId, result.id)
            });
        },
        error: function(user, error) {
            // Execute any logic that should take place if the save fails.
            // error is a Parse.Error with an error code and message.
            console.log('Failed to create new object, with error code: ' + error.message);
        }
    });
}

function confirmAddress(recipientId){
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            "text": "Por favor coloca un nombre a esta dirección para guardarla. \n\nEjemplo: casa, apartamento o oficina"
        }
    };
    bot.setListener(recipientId, 'address-name', 'text', writeAddressComplete);
    bot.sendTypingOff(recipientId);
    bot.callSendAPI(messageData);
}

function setEmail(recipientId){
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            "text": "Por favor escribe tu email:"
        }
    };
    bot.setListener(recipientId, 'email', 'text', setEmailCheck);
    bot.sendTypingOff(recipientId);
    bot.callSendAPI(messageData);
}

function setEmailCheck(recipientId){

}

function setTelephone(recipientId){
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            "text": "Por favor escribe tu número telefónico:"
        }
    };
    bot.setListener(recipientId, 'telephone', 'text', setTelephoneCheck);
    bot.sendTypingOff(recipientId);
    bot.callSendAPI(messageData);
}

function setTelephoneCheck(recipientId){

}

function setLocationCheck(recipientId){
    let userBuffer = bot.buffer[recipientId];

    geocoder.reverseGeocode( userBuffer.location.lat, userBuffer.location.lng, (error, data) =>{
        if(!error && data.status == 'OK'){
            let result = data.results[0];

            userBuffer.address = result.formatted_address;
            userBuffer.location = result.geometry.location;

            for(var component of result.address_components){
                //console.log(component);
                if(component.types.includes('locality')){
                    userBuffer.locality = component.short_name;
                }
                else if(component.types.includes('administrative_area_level_1')){
                    userBuffer.state = component.short_name;
                }
                else if(component.types.includes('administrative_area_level_2')){
                    userBuffer.administrative_area = component.short_name;
                }
                else if(component.types.includes('country')){
                    userBuffer.country = component.short_name;
                }
                else if(component.types.includes('postal_code')){
                    userBuffer.postal_code = component.short_name;
                }
            }

            renderMapMessage(recipientId, () => {
                renderMap(recipientId, () => {
                    var messageData = {
                        recipient: {
                            id: recipientId
                        },
                        message: {
                            "text": "Es correcta?",
                            "quick_replies":[
                                {
                                    "content_type": "text",
                                    "title": "Si",
                                    "payload": "ConfirmAddress"
                                },
                                {
                                    "content_type": "text",
                                    "title": "No",
                                    "payload": "newAddress"
                                }
                            ]
                        }
                    };
                    bot.sendTypingOff(recipientId);
                    bot.callSendAPI(messageData);
                });
            });
        }
        else{
            console.log('Geocode not found');
        }
    });
}

function setAddress(recipientId, id){
    bot.sendTypingOn(recipientId);

    store.dispatch(Actions.setAddress(recipientId, id)).then(() => {
            let address = getData(recipientId, 'address');

            Parse.Cloud.run('getProducts', { businessId: BUSINESS_ID, lat: address.location.lat, lng: address.location.lng}).then(
                function(result){
                    var pointSale = result.pointSale;

                    store.dispatch(Actions.setCustomerPointSale(recipientId, pointSale.id)).then(
                        () => {
                            renderAddressConfirmation(recipientId)
                        });
                },
                function(error) {
                    if(error.code == '141'){
                        renderAddressOutOfCoverage(recipientId);
                    }
                    else{
                        console.log('error');
                        console.log(error);
                    }
                });
            /*
            Parse.Cloud.run('getProducts', { businessId: BUSINESS_ID }).then(
                function(result){
                    var pointSale = result.pointSale
                    console.log('\nPoint Sale');
                    console.log(pointSale);

                    Parse.Cloud.run('isInsideCoverage', {lat: address.location.lat, lng: address.location.lng, pointSale: pointSale.id } ).then(
                        function(result){
                            console.log(result);
                        },
                        function(error) {
                            console.log('error');
                            console.log(error);
                        });
                },
                function(error) {
                    console.log('error');
                    console.log(error);
                });
                */
        }
    );
}

function renderAddressOutOfCoverage(recipientId){
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            "text": "La dirección seleccionada no está dentro de la cobertura de nuestras sedes, por favor intenta con otra dirección"
        }
    };
    bot.sendTypingOff(recipientId);
    bot.callSendAPI(messageData, sendAddresses);
}

function renderAddressConfirmation(recipientId){
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            "text": "Perfecto, ya seleccioné tu dirección para este pedido" //Perfecto, ya guardé tu dirección para próximos pedidos
        }
    };
    bot.sendTypingOff(recipientId);
    bot.callSendAPI(messageData, sendCategories);
}

function renderCategoriesInitialMessage(recipientId){
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            "text": "A continuación te presentamos las categorías de productos disponibles."
        }
    };
    bot.sendTypingOff(recipientId);
    bot.callSendAPI(messageData);
}

function sendCategories(recipientId, index){
    bot.sendTypingOn(recipientId);

    if(index == undefined)
        index = 0;
    else if( typeof index == 'string')
        index = parseInt(index);

    if(index == 0){
        renderCategoriesInitialMessage(recipientId)
        bot.sendTypingOn(recipientId);
    }

    Parse.Cloud.run('getProducts', { businessId: BUSINESS_ID }).then(
        function(result){
            var elements = splitCategories(recipientId, result.categories, index);
            var idx = Object.keys(result.categories).length;
            var buttons = [];
            var catIni = (index+1)*bot.limit;
            var catFin =  (idx > catIni+bot.limit) ? catIni+bot.limit : idx;
            /*
            console.log('length: '+idx);
            console.log('catIni: '+catIni);
            console.log('catFin: '+catFin);
            console.log('limitsearchProducts: '+(index+1)*bot.limit);
            */
            if(idx > (index+1)*bot.limit){
                buttons.push({
                    type: "postback",
                    title: "Categorías "+(catIni+1)+"-"+catFin,
                    payload: "SendCategories-"+(index+1),
                });

                elements.push({
                    title: "Ver más categorias ",
                    subtitle: "Categorías disponibles",
                    buttons: buttons
                });
            }

            var messageData = {
                recipient: {
                    id: recipientId
                },
                message: {
                    attachment: {
                        type: "template",
                        payload: {
                            template_type: "generic",
                            elements: elements
                        }
                    }
                }
            };

            bot.sendTypingOff(recipientId);
            bot.callSendAPI(messageData);
        },
        function(error) {
            console.log('error');
            console.log(error);
        });
}

function splitCategories(recipientId, categories, index){
    var customer = getData(recipientId, 'customer');
    var image_url = customer.image.url;

    var idx = 0;
    var elements = [];

    categories.forEach(function(item){
        if(item && item.get('name')){
            if(idx >= (index)*bot.limit && idx < (index+1)*bot.limit){
                var image = item.get('image');
                if(image){
                    image_url = image.url();
                }
                elements.push({
                    title: item.get('name'),
                    //subtitle: item.get('name'),
                    //item_url: "http://www.mycolombianrecipes.com/fruit-cocktail-salpicon-de-frutas",
                    image_url: image_url,
                    buttons: [{
                        type: "postback",
                        title: item.get('name'),
                        payload: "SendProducts-"+item.id+"-"+index,
                    }]
                })
            }
            idx = idx+1;
        }
    });
    return elements;
}

function renderProductsInitialMessage(recipientId, categoryId){
    return new Parse.Query(ParseModels.Category).get(categoryId).then(
        category => {
            var messageData = {
                recipient: {
                    id: recipientId
                },
                message: {
                    text: category.get('name')+":"
                }
            };
            bot.sendTypingOff(recipientId);
            bot.callSendAPI(messageData);
        },
        (object, error) => {
            console.log(error);
            // error is an instance of Parse.Error.
        }
    )
}

function sendProducts(recipientId, category, proIdx){
    bot.sendTypingOn(recipientId);
    proIdx = parseInt(proIdx);
    if(proIdx == 0){
        renderProductsInitialMessage(recipientId, category);
        bot.sendTypingOn(recipientId);
    }

    Parse.Cloud.run('getProducts', { businessId: BUSINESS_ID, category: category }).then(result => {
        var elements = splitProducts(recipientId, result.products, proIdx);
        var idx = Object.keys(result.products).length;
        var buttons = [];
        var catIni = (proIdx+1)*bot.limit;
        var catFin =  (idx > catIni+bot.limit) ? catIni+bot.limit : idx;
        /*
        console.log('length: '+idx);
        console.log('catIni: '+catIni);
        console.log('catFin: '+catFin);
        console.log('limit: '+(proIdx+1)*bot.limit);
        */
        if( idx > (proIdx+1)*bot.limit ){
            buttons.push({
                type: "postback",
                title: "Productos "+(catIni+1)+"-"+catFin,
                payload: "SendProducts-"+category+"-"+(proIdx+1),
            });

            elements.push({
                title: "Ver más productos ",
                subtitle: "Productos disponibles",
                buttons: buttons
            });
        }

        var messageData = {
            recipient: {
                id: recipientId
            },
            message: {
                attachment: {
                    type: "template",
                    payload: {
                        template_type: "generic",
                        elements: elements
                    }
                }
            }
        };

        bot.sendTypingOff(recipientId);
        bot.callSendAPI(messageData);
    },
    function(error) {
        console.log('error');
        console.log(error);
    })
}

function splitProducts(recipientId, products, proIdx){
    var customer = getData(recipientId, 'customer');
    var image_url = customer.image.url;

    if(typeof customer != 'undefined'){
        image_url = customer.image.url;
    }

    var idx = 0;
    var elements = [];

    products.forEach(function(item){
        if(item && item.get('name')){
            if(idx >= (proIdx)*bot.limit && idx < (proIdx+1)*bot.limit){
                var image = item.get('image');
                if(image){
                    image_url = image.url();
                }
                elements.push({
                    title: item.get('name') +": $"+ item.get('priceDefault'),
                    subtitle: item.get('description'),
                    //item_url: "http://www.mycolombianrecipes.com/fruit-cocktail-salpicon-de-frutas",
                    image_url: image_url,
                    buttons: [{
                        type: "postback",
                        title: "Agregar",
                        payload: "AddProduct-"+item.id,
                    }]
                })
            }
            idx = idx+1;
        }
    });
    return elements;
}

function createCart(recipientId){
    var userData = getData(recipientId);
    Object.assign(userData, {'cart': {items: new Map()}});
    return userData.cart;
}

function createOrder(recipientId){
    var userData = getData(recipientId);
    Object.assign(userData, {'order': new Map()});
    return getData(recipientId, 'order')
}

function addProduct(recipientId, productId){
    //console.log("Add product: "+productId);
    //console.log("Order.count: "+order.count());
    var product = new ParseModels.Product();
    var cart = getData(recipientId, 'cart');

    if(cart == undefined){
        cart = createCart(recipientId);
    }

    var items = cart.items;

    new Parse.Query(product).get(productId).then(
        product => {
            if(!items.get(productId)){
                items.set(productId, {quantity: 1, price: product.get('priceDefault')});
            }
            else{
                items.get(productId).quantity += 1;
            }

            saveCart(recipientId);

            renderAddProductConfirmation(recipientId, productId);
        },
        (object, error) => {
            console.log(error);
            // error is an instance of Parse.Error.
        }
    );
}

function removeProduct(recipientId, productId){
    var cart = getData(recipientId, 'cart');
    console.log('Remove product '+productId);
    if(cart == undefined){
        cart = createCart(recipientId);
    }

    var items = cart.items;
    var item = items.get(productId);

    new Parse.Query(ParseModels.OrderItem).get(item.id, {
        success: (orderItem) => {
            orderItem.destroy({});
            items.delete(productId);
            var itemsPointers = [];

            for(var [key, value] of items) {
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

function increaseOneProduct(recipientId, productId){
    var cart = getData(recipientId, 'cart');

    if(cart == undefined){
        cart = createCart(recipientId);
    }

    var items = cart.items;
    var item = items.get(productId);

    item.quantity++;

    new Parse.Query(ParseModels.OrderItem).get(item.id, {
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

function decreaseOneProduct(recipientId, productId){
    var cart = getData(recipientId, 'cart');

    if(cart == undefined){
        cart = createCart(recipientId);
    }

    var items = cart.items;
    var item = items.get(productId);

    item.quantity--;
    console.log('Order Item');
    console.log(item);

    if(item.quantity > 0){
        new Parse.Query(ParseModels.OrderItem).get(item.id, {
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
        console.log('remove');
        console.log(item);
        removeProduct(recipientId, productId)
    }
}

function saveCart(recipientId){
    var consumerCart = new ParseModels.Cart();
    var consumer = getData(recipientId, 'consumer');
    var address = getData(recipientId, 'address');
    var cart = getData(recipientId, 'cart');
    var paymentMethod = getData(recipientId, 'paymentMethod');
    var items = [];
    var item;

    for(var [id, properties] of cart.items){
        //console.log('\n'+id);
        //console.log(properties);

        item = new ParseModels.OrderItem();

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
        item.set('modifiersGroups', []);
        items.push(item);

        /*
        item.save(undefined, {
            success: function(result) {
                //console.log('\nItem save');
                //console.log(result);
                //console.log(result.get('product'));
                var itemId = result.get('product').objectId;
                //console.log(cart.items.get(itemId));
                cart.items.get(itemId).id = result.id;
                //console.log(cart.items.get(itemId));
            },
            error: function(user, error) {
                // Execute any logic that should take place if the save fails.
                // error is a Parse.Error with an error code and message.
                console.log('Failed to create new object, with error code: ' + error.message);
            }
        });
        */
    }

    Parse.Object.saveAll(items, {
        success: function(result) {
            var itemsPointers = [];
            for(var item of result){
                var itemId = item.get('product').objectId;
                cart.items.get(itemId).id = item.id;

                itemsPointers.push({"__type":"Pointer", "className": "OrderItem", "objectId": item.id})
            }

            //console.log(cart.items);
            //console.log(itemsPointers);

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
                    /*delete userBuffer.address;
                     delete userBuffer.location;
                     delete userBuffer['address-name'];

                     console.log(userBuffer);
                     console.log('\nConsumer kart');
                     console.log(result);
                    */
                    cart['id'] = result.id;
                    cart['rawParseObject'] = result;
                    cart['itemsPointers'] = itemsPointers;
                },
                error: function(user, error) {
                    // Execute any logic that should take place if the save fails.
                    // error is a Parse.Error with an error code and message.
                    console.log('Failed to create new object, with error code: ' + error.message);
                }
            });


        },
        error: function(user, error) {
            // Execute any logic that should take place if the save fails.
            // error is a Parse.Error with an error code and message.
            console.log('Failed to create new object, with error code: ' + error.message);
        }
    });
}

function saveOrder(recipientId){
    var order = new ParseModels.Order();
    var consumer = getData(recipientId, 'consumer');
    var customer = getData(recipientId, 'customer');
    var cart = getData(recipientId, 'cart');
    var address = getData(recipientId, 'address');
    var paymentMethod = getData(recipientId, 'paymentMethod');
    let pointSale = getData(recipientId, 'pointSale');
    var state0 = orderStates.get(0);
    var total = 0 ;

    /*console.log(consumer);
    console.log(consumer.name);
    console.log(customer);
    console.log(paymentMethod.method);
    console.log(address);
    console.log(state0);
    console.log(cart);
    console.log(pointSale);*/

    cart.items.forEach(function(value, key){
        //console.log(value);
        total += value.quantity * value.price;
    });

    order.set('consumer', { __type: 'Pointer', className: 'Consumer', objectId: consumer.objectId });
    order.set('consumerAddress', { __type: 'Pointer', className: 'ConsumerAddress', objectId: address.objectId });
    order.set('pointSale', { __type: 'Pointer', className: 'CustomerPointSale', objectId: pointSale.objectId });
    order.set('state', { __type: 'Pointer', className: 'OrderState', objectId: state0.objectId });
    //order.set('dateSchedule')
    order.set('items', cart.itemsPointers);
    order.set('deliveryCost', pointSale.deliveryCost);
    order.set('total', total);
    order.set('paymentMethod', paymentMethod.method);
    order.set('name', consumer.name);
    //order.set('comment', "Orden");

    console.log('Setting Order');

    order.save(undefined, {
        success: function(order) {

            store.dispatch(Actions.setOrder(recipientId, order)).then(() => {
                console.log('Save Order');
                console.log(order);
            });

            console.log('Save Order');
            console.log(order);
        },
        error: function(user, error) {
            // Execute any logic that should take place if the save fails.
            // error is a Parse.Error with an error code and message.
            console.log('Failed to create new object, with error code: ' + error.message);
            console.log(error);
        }
    });
}

function renderAddProductConfirmation(recipientId, productId){
    return new Parse.Query(ParseModels.Product).get(productId).then(
        product => {
            var messageData = {
                recipient: {
                    id: recipientId
                },
                message: {
                    "text": "El producto "+product.get('name')+" ha sido agregado.\n\nDeseas agregar otro producto o terminar tu pedido?",
                    "quick_replies":[
                        {
                            "content_type":"text",
                            "title":"Seguir pidiendo",
                            "payload":"SendCategories-0"
                        },
                        {
                            "content_type":"text",
                            "title":"Ver carrito",
                            "payload":"SendCart"
                        }
                    ]
                }
            };
            bot.sendTypingOff(recipientId);
            bot.callSendAPI(messageData);
        },
        (object, error) => {
            console.log(error);
            // error is an instance of Parse.Error.
        }
    )
}

function sendPurchaseOptions(recipientId){
    bot.sendTypingOn(recipientId);
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            "text": "Tenemos las siguientes opciones disponibles:",
            "quick_replies":[
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
            ]
        }
    };
    bot.sendTypingOff(recipientId);
    bot.callSendAPI(messageData);
}

function sendCart(recipientId){
    authentication(recipientId, () =>{
        // Generate a random receipt ID as the API requires a unique ID

        var user = getData(recipientId, 'user');
        var customer = getData(recipientId, 'customer');
        var consumer = getData(recipientId, 'consumer');
        var cart = getData(recipientId, 'cart');
        var address = getData(recipientId, 'address');
        var customer_image_url;
        /*
        console.log('sendCart');
        console.log(user);
        console.log('customer');
        console.log(customer);
        console.log('consumer');
        console.log(consumer);
        console.log('cart');
        console.log(cart);
        console.log('address');
        console.log(address);
        */

        if(typeof customer != 'undefined'){
            customer_image_url = customer.image.url;
        }

        if(cart == undefined){
            cart = createCart(recipientId);
        }

        var items = cart.items;

        bot.sendTypingOn(recipientId);

        var elements = [];
        var element = {};
        var total = 0;
        var orderLimit = items.size;
        var ind = 0;
        var image;
        var image_url;

        //console.log('Shopping Cart');
        //console.log(orderLimit);
        if(orderLimit == 0){
            renderCartEmpty(recipientId)
        }
        else{
            items.forEach(function(value, key){
                var product = new Parse.Query(ParseModels.Product);

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
                            renderCart(recipientId, cart.id, elements, total)
                        }
                    },
                    error: function (error) {
                        alert("Error: " + error.code + " " + error.message);
                    }
                })
            });
        }
    });
}

function renderCart(recipientId, cartId, elements, total){
    var user = getData(recipientId, 'user');
    var consumer = getData(recipientId, 'consumer');
    var address = getData(recipientId, 'address');
    var pointSale = getData(recipientId, 'pointSale');
    var payment_method = getData(recipientId, 'payment_method');
    var addressData = undefined;

    if(typeof payment_method == 'undefined'){
        payment_method = {name: 'Sin definir'}
    }

    if(typeof address != 'undefined'){
        addressData = {
            street_1: address.address,
            street_2: "",
            city: address.city,
            postal_code: address.postalCode,
            state: address.state,
            country: address.countryCode
        }
    }

    var messageData = {
        recipient: {
            id: recipientId
        },
        message:{
            attachment: {
                type: "template",
                payload: {
                    template_type: "receipt",
                    recipient_name: user.first_name+" "+user.last_name,
                    order_number: cartId,
                    currency: "COP",
                    payment_method: payment_method.name,
                    order_url: "http://petersapparel.parseapp.com/order?order_id=123456",
                    timestamp: Math.trunc(Date.now()/1000).toString(),
                    elements: elements,
                    address: addressData,
                    summary: {
                        subtotal: total,
                        shipping_cost: pointSale.deliveryCost,
                        //total_tax: 0,
                        total_cost: total+pointSale.deliveryCost
                    }
                    //adjustments: [{
                    //  name: "New Customer Discount",
                    //  amount: -1000
                    //}, {
                    //    name: "$1000 Off Coupon",
                    //    amount: -1000
                    //}]
                }
            },
            "quick_replies":[
                {
                    "content_type":"text",
                    "title":"Finalizar pedido",
                    "payload":"CheckOrder"
                },
                {
                    "content_type":"text",
                    "title":"Seguir Pidiendo",
                    "payload":"SendCategories-0"
                },
                {
                    "content_type":"text",
                    "title":"Modificar carrito",
                    "payload":"SendCartDetails"
                },
                {
                    "content_type":"text",
                    "title":"Borrar carrito",
                    "payload": "ClearCart"
                }
            ]
        }
    };

    bot.sendTypingOff(recipientId);
    bot.callSendAPI(messageData);

}

function sendCartDetails(recipientId){
    bot.sendTypingOn(recipientId);
    renderCartDetails(recipientId)
}

function renderCartDetails(recipientId){
    var cart = getData(recipientId, 'cart');
    var customer = getData(recipientId, 'customer');
    var consumer = getData(recipientId, 'consumer');
    var image_url = customer.image.url;
    var items = cart.items;
    var elements = [];

    items.forEach(function(value, key) {
        if (elements.length <= bot.limit) {
            new Parse.Query(ParseModels.Product).get(key).then(
            product => {
                var image = product.get('image');
                if(image){
                    image_url = image.url();
                }

                elements.push({
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
                });

                if(elements.length == bot.limit || elements.length == items.size){
                    var messageData = {
                        recipient: {
                            id: recipientId
                        },
                        message: {
                            "attachment":{
                                "type": "template",
                                "payload":{
                                    "template_type": "generic",
                                    "elements": elements
                                }
                            }
                        }
                    };
                    bot.sendTypingOff(recipientId);
                    bot.callSendAPI(messageData, renderEditCartOptions);
                }
            })
        }
    });
}

function renderEditCartOptions(recipientId){

    var messageData = {
        "recipient": {
            "id": recipientId
        },
        "message": {
            "text": "Opciones del carrito:",
            "quick_replies":[
                {
                    "content_type":"text",
                    "title":"Finalizar pedido",
                    "payload":"CheckOrder"
                },
                {
                    "content_type":"text",
                    "title":"Seguir Pidiendo",
                    "payload":"SendCategories-0"
                }
            ]
        }
    };

    bot.callSendAPI(messageData);
}



function renderCartEmpty(recipientId){
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            "text": "Tu carrito de compras está vacío."
        }
    };
    bot.sendTypingOff(recipientId);
    bot.callSendAPI(messageData, sendPurchaseOptions);
}

function editCart(recipientId){
    var cart = getData(recipientId, 'cart');

    bot.sendTypingOn(recipientId);
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            "attachment": {
                "type": "template",
                "payload": {
                    "template_type": "generic",
                    "elements": [
                        {
                            "title": "Opciones",
                            //"item_url": "https://petersfancyapparel.com/classic_white_tshirt",
                            "image_url": SERVER_URL+"assets/thinking.jpg",
                            //"subtitle": "Soft white cotton t-shirt is back in style",
                            "buttons": [
                                {
                                    "type": "web_url",
                                    "url": SERVER_URL+"cart?"+cart.id,
                                    "title": "Remover producto",
                                    "webview_height_ratio": "tall"
                                }
                            ]
                        }
                    ]
                }
            }
        }
    };
    bot.sendTypingOff(recipientId);
    bot.callSendAPI(messageData);

}

function clearCart(recipientId){
    var cart = getData(recipientId, 'cart');

    if(typeof cart == 'undefined'){

    }
    else{
        var items = cart.items;
        cart.itemsPointers = [];

        items.forEach(function(value, key){
            new Parse.Query(ParseModels.OrderItem).get(value.id, {
                success: (orderItem) => {
                    orderItem.destroy({});
                    items.delete(key);
                    if(items.size == 0){
                        sendCart(recipientId);
                    }
                },
                error: (orderItem, error) => {
                    console.log('error');
                    console.log(error);
                }
            });
        });
    }
}

function checkOrder(recipientId){
    checkPayment(recipientId);
}

function checkPayment(recipientId){
    bot.sendTypingOn(recipientId);
    store.dispatch(Actions.loadPaymentMethods(recipientId)).then(() => {
        renderCheckPayment(recipientId)
    });
}

function checkAddress(recipientId){

}

function renderCheckPayment(recipientId){
    var paymentMethods = getData(recipientId, 'paymentMethods');
    var quick_replies = [];

    console.log(paymentMethods);

    for(var i in paymentMethods){

        quick_replies.push({
            "content_type": "text",
            "title": paymentMethods[i].name.substring(0,20),
            "payload": "Checkout-"+paymentMethods[i].objectId
        });
    }
    //console.log(quick_replies);

    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            "text": "Como vas a pagar tu pedido? (Tu pedido se cobra cuando lo recibes)",
            "quick_replies": quick_replies
        }
    };
    bot.sendTypingOff(recipientId);
    bot.callSendAPI(messageData);
}

function checkout(recipientId, id){
    bot.sendTypingOn(recipientId);
    console.log('checkout');
    console.log(id);

    store.dispatch(Actions.setPaymentMethod(recipientId, id)).then(
        () => {

            let paymentMethod = getData(recipientId, 'paymentMethod');
            console.log(paymentMethod);
            var paymentFunction = paymentTypes.get(paymentMethod.method.objectId);
            console.log(paymentFunction);

            paymentFunction(recipientId);
            /*
            var cart = new ParseModels.Order();
            cart.set('name', userBuffer['address-name']);
            cart.set('address', userBuffer.address);
            cart.set('consumer', {
                __type: "Pointer",
                className: "Consumer",
                objectId: consumer.objectId
            });


            cart.save(undefined, {
                success: function(result) {

                    delete userBuffer.address;
                    delete userBuffer.location;
                    delete userBuffer['address-name'];

                    console.log(userBuffer);

                    console.log('Consumer Address');

                },
                error: function(user, error) {
                    // Execute any logic that should take place if the save fails.
                    // error is a Parse.Error with an error code and message.
                    console.log('Failed to create new object, with error code: ' + error.message);
                }
            });
            */
        }
    );
}

function setPayment(recipientId, id){

}

function renderCash(recipientId){
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            "text": "Se ha registrado el pago en efectivo"
        }
    };

    saveCart(recipientId);

    bot.sendTypingOff(recipientId);
    bot.callSendAPI(messageData, orderConfirmation);
}

function renderCreditCard(recipientId){
    var creditCards = getData(recipientId, 'creditCards');
    var consumer = getData(recipientId, 'consumer');

    if(!_.isEmpty(consumer.user)) {
        store.dispatch(Actions.loadUserCreditCards(recipientId, consumer.user)).then(
            () => {
                sendRegisteredCreditCards(recipientId);
            }
        );
    }
}

function registerCreditCard(recipientId){
    bot.sendTypingOn(recipientId);
    var consumer = getData(recipientId, 'consumer');

    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            "attachment":{
                "type":"template",
                "payload": {
                    "template_type": "generic",
                    "elements": [{
                        "title": "Registro de tarjeta de credito y finalización de tu pedido.\n\nEstas de acuerdo?",
                        "image_url": SERVER_URL + "assets/money.jpg",
                        "subtitle": "Por razones de seguridad te redireccionaremos a una página web segura.",
                        "buttons": [
                            {
                                "type": "web_url",
                                "title": "Si",
                                "url": SERVER_URL + "creditcard?id=" + consumer.objectId,
                                "webview_height_ratio": "tall"
                            },
                            {
                                "type": "postback",
                                "title": "No",
                                "payload": "CancelRegisterCreditCard"
                        }]
                    }]
                }
            }
        }
    };
    bot.sendTypingOff(recipientId);
    bot.callSendAPI(messageData);
}

function cancelRegisterCreditCard(recipientId){
    bot.sendTypingOn(recipientId);
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            "text": "Si no ingresas los datos de tu tarjeta en nuestro sitio seguro, no podras comprar con tarjeta online"
        }
    };
    bot.sendTypingOff(recipientId);
    bot.callSendAPI(messageData, checkPayment);
}

function sendRegisteredCreditCards(recipientId){
    bot.sendTypingOn(recipientId);
    var consumer = getData(recipientId, 'consumer');

    store.dispatch(Actions.loadUserCreditCards(recipientId, consumer.user)).then(
    () => {
        var creditCards = getData(recipientId, 'creditCards');
        if (creditCards.length == 0) {
            //saveCart(recipientId);
            renderNoRegisteredCreditCards(recipientId);
        }
        else {
            renderRegisteredCreditCards(recipientId);
        }
    });
}

function renderNoRegisteredCreditCards(recipientId){
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            "text": "Aun no tienes tarjetas registradas, deseas registrar una tarjeta?",
            "quick_replies": [
                {
                    "content_type":"text",
                    "title":"Si",
                    "payload":"RegisterCreditCard"
                },
                {
                    "content_type":"text",
                    "title":"No",
                    "payload":"CheckPayment"
                }
            ]
        }
    };

    bot.sendTypingOff(recipientId);
    bot.callSendAPI(messageData);
}

function renderRegisteredCreditCards(recipientId){
    var creditCards = getData(recipientId, 'creditCards');
    var quick_replies = [];

    quick_replies.push({
        "content_type": "text",
        "title": "Agregar tarjeta",
        "payload": "RegisterCreditCard"
    });

    for(var card of creditCards){
        if (quick_replies.length < bot.limit) {
            quick_replies.push({
                "content_type": "text",
                "title": card.type+" "+card.lastFour,
                "payload": "PayWithCreditCard-" + card.lastFour
            });
        }
    }

    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            "text": "Con cual tarjeta quieres pagar?",
            "quick_replies": quick_replies
        }
    };
    bot.sendTypingOff(recipientId);
    bot.callSendAPI(messageData);
}

function payWithCreditCard(recipientId, creditCardId){
    bot.sendTypingOn(recipientId);
    console.log(creditCardId);



    orderConfirmation(recipientId)
}

function orderConfirmation(recipientId){
    bot.sendTypingOn(recipientId);
    var state0 = orderStates.get(0);

    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            "text": state0.messagePush+"\n\nEn un momento te estaremos dando información en tiempo real sobre tu pedido"
        }
    };

    saveOrder(recipientId);

    bot.sendTypingOff(recipientId);
    bot.callSendAPI(messageData);
}

function orderState(recipientId){
    bot.sendTypingOn(recipientId);
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            "text": "Tu pedido ha sido Aceptado. \n\nLo estan preparando en nuestra sede y te lo enviaremos en aproximadamente 10 minutos"
        }
    };
    bot.sendTypingOff(recipientId);
    bot.callSendAPI(messageData, orderSent);
}

function orderSent(recipientId){
    bot.sendTypingOn(recipientId);
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            "text": "Buenas noticias, Tu pedido ha sido Enviado. \n\nHaz click en el mapa para vel tu pedido"
        }
    };
    bot.sendTypingOff(recipientId);
    bot.callSendAPI(messageData, serviceRating);
}

function renderOrderState(recipientId){
    bot.sendTypingOn(recipientId);
    var orderState = getData(recipientId, 'orderState');



    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            "text": orderState.messagePush
        }
    };
    bot.sendTypingOff(recipientId);
    if(orderState.order == 5){
        bot.callSendAPI(messageData, serviceRating);
    }
    else if(orderState.order == 6){

    }
    else{
        bot.callSendAPI(messageData)
    }
}

function serviceRating(recipientId){
    bot.sendTypingOn(recipientId);
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            "text": "Califica tu experiencia para ayudarnos a mejorar. \n\nDe 1 a 5 cuantas extrellas merece nuestro servicio?",
            "quick_replies":[
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
            ]
        }
    };
    bot.sendTypingOff(recipientId);
    bot.callSendAPI(messageData);
}

function setScore(recipientId, score){
    var order = getData(recipientId, 'order');

    bot.sendTypingOn(recipientId);

    Parse.Cloud.run('rateOrder', { orderId: order.objectId, score: Number(score), comment: ''}).then(
        function(result){
            thank(recipientId)
        },
        function(error) {
            console.log('error');
            console.log(error);
        });
}

function thank(recipientId){
    bot.sendTypingOn(recipientId);
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            "text": "Gracias, esperamos tener el gusto de atenderle nuevamente"
        }
    };
    bot.sendTypingOff(recipientId);
    bot.callSendAPI(messageData);
}

function searchProducts(recipientId, query, index){
    bot.sendTypingOn(recipientId);

    Parse.Cloud.run('search', { businessId: BUSINESS_ID, q: query }).then(
        function(result){
            if(result.length == 0){
                renderSearchEmpty(recipientId);
            }
            else if(result.length == 1 && result[0].type == 'Category'){
                sendProducts(recipientId, result[0].id, 0)
            }
            else{
                if(index == undefined)
                    index = 0;
                else if( typeof index == 'string')
                    index = parseInt(index);

                if(index == 0){
                    renderSearchInitial(recipientId);
                    bot.sendTypingOn(recipientId);
                }

                var elements = splitSearchResult(recipientId, result, index);
                var idx = Object.keys(result).length;
                var buttons = [];
                var catIni = (index+1)*bot.limit;
                var catFin =  (idx > catIni+bot.limit) ? catIni+bot.limit : idx;

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

                var messageData = {
                    recipient: {
                        id: recipientId
                    },
                    message: {
                        attachment: {
                            type: "template",
                            payload: {
                                template_type: "generic",
                                elements: elements
                            }
                        }
                    }
                };

                bot.sendTypingOff(recipientId);
                bot.callSendAPI(messageData);
            }
        },
        function(error) {
            console.log('error');
            console.log(error);
        }
    );
}

function renderSearchInitial(recipientId){
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            "text": "Se han encontrado los siguientes productos:"
        }
    };
    bot.sendTypingOff(recipientId);
    bot.callSendAPI(messageData);
}

function renderSearchEmpty(recipientId){
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            "text": "No se han encontrado productos que coincidan"
        }
    };
    bot.sendTypingOff(recipientId);
    bot.callSendAPI(messageData);
}

function splitSearchResult(recipientId, products, index){
    var customer = getData(recipientId, 'customer');
    var image_url = customer.image.url;
    var idx = 0;
    var elements = [];

    products.forEach(function(item){
        if(item && item.name && item.type == 'Product'){
            //item.id get Product information
            if(idx >= (index)*bot.limit && idx < (index+1)*bot.limit){
                var image = item.image;
                if(image){
                    image_url = image.url();
                }
                elements.push({
                    title: item.name,
                    //subtitle: item.get('name'),
                    //item_url: "http://www.mycolombianrecipes.com/fruit-cocktail-salpicon-de-frutas",
                    image_url: image_url,
                    buttons: [{
                        type: "postback",
                        title: 'Agregar',
                        payload: "AddProduct-"+item.id,
                    }]
                });
                idx = idx+1;
            }
        }
    });
    return elements;
}

function sendHelp(recipientId){
    bot.sendTypingOn(recipientId);
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            "text": "InOut Bot.\n\nTe permite visualizar las opciones de productos, agregarlos al carrito y realizar tu compra por medio del chat de facebook.\n\nFuncionalidades disponibles: \n\n'Hola', para iniciar la conversación\n'Pedir Domicilio', si quieres realizar un domicilio\n'Carrito', para ver el estado actual de tu carrito"
        }
    };
    bot.sendTypingOff(recipientId);
    bot.callSendAPI(messageData, sendContactUs);
}

function sendContactUs(recipientId){
    bot.sendTypingOn(recipientId);
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            "text": " Para mayor información puedes contactarnos en:\n\n Web: http://www.inoutdelivery.com/\n\n Email: john.garavito@inoutdelivery.com"
        }
    };
    bot.sendTypingOff(recipientId);
    bot.callSendAPI(messageData);
}

function sendRegisterFacebookUser(recipientId){
    bot.sendTypingOn(recipientId);
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            "text": "Registro exitoso.",

        }
    };
    bot.sendTypingOff(recipientId);
    bot.callSendAPI(messageData);
}

function sendOrders(recipientId){
    bot.sendTypingOn(recipientId);
    var user = getData(recipientId, 'user');
    var consumer = getData(recipientId, 'consumer');

    if(typeof consumer == 'undefined'){
        store.dispatch(Actions.loadCustomer(recipientId, BUSINESS_ID)).then(
            () => {
                /*authentication(recipientId, user => {
                    if(user){
                        store.dispatch(Actions.loadConsumer(recipientId, user)).then(
                            () => {
                                consumer = getData(recipientId, 'consumer');
                                store.dispatch(Actions.loadConsumerAddresses(recipientId, consumer.rawParseObject)).then(
                                    () => {
                                        renderAddressMenu(recipientId);
                                    }
                                );
                            }
                        );
                    }
                });*/
            }
        )
    }
    else{
        console.log('user')
        console.log(user.rawParseObject)
        console.log('consumer');
        console.log(consumer.rawParseObject);
        console.log(user.rawParseObject.getSessionToken());

        Parse.Cloud.run('orders', { businessId: BUSINESS_ID}).then(
            function(result){
                console.log(result)
            },
            function(error) {
                console.log('error');
                console.log(error);
            });

        /*
        request.post({
            url: PARSE_SERVER_URL+'/functions/orders',
            headers: {
                'Content-Type': 'text/plain;charset=UTF-8',
                'X-Parse-Application-Id': PARSE_APP_ID,
                'X-Parse-Session-Token': user.rawParseObject.getSessionToken()
            }
        }, function callback(error, response, body) {
            if (!error && response.statusCode == 200) {
                console.log(body);
            }
            else{
                console.log(response.statusCode);
                console.log('error');
                console.log(error);
            }
        });
         */

        store.dispatch(Actions.loadConsumerOrders(recipientId, consumer.rawParseObject)).then(
            () => {
                renderOrders(recipientId);
            }
        );
    }
}

function renderOrders(recipientId){
    var orders = getData(recipientId, 'orders');
    var elements = [];

    console.log(orders);

    elements.push({
        "title": "Nueva orden",
        "subtitle": "Puedes realizar una orden",
        "image_url": SERVER_URL+"assets/conversation.jpg",
        "buttons": [
            {
                "type": "postback",
                "title": "Nueva orden",
                "payload": "NewOrder"
            }
        ]
    });

    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            "attachment":{
                "type": "template",
                "payload":{
                    "template_type": "generic",
                    "elements": elements
                }
            }
        }
    };

    bot.sendTypingOff(recipientId);
    bot.callSendAPI(messageData);
}

function newOrder(recipientId){
    clearCart(recipientId);
    sendAddresses(recipientId);
}

function renderShoppingCartOptions(recipientId){
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            "text": "Opciones del carrito",
            "quick_replies":[
                {
                    "content_type":"text",
                    "title":"Finalizar pedido",
                    "payload":"CheckOrder"
                },
                {
                    "content_type":"text",
                    "title":"Seguir Pidiendo",
                    "payload":"SendCategories-0"
                },
                {
                    "content_type":"text",
                    "title":"Borrar carrito",
                    "payload": "ClearCart"
                }
            ]
        }
    };
    bot.sendTypingOff(recipientId);
    bot.callSendAPI(messageData);
}

function updateCart(recipientId){
    var consumerCart = new ParseModels.Cart();
    var localCart = getData(recipientId, 'cart');

    new Parse.Query(consumerCart).get(localCart.id).then(
        cart => {
            //console.log('updateCart');
            console.log(cart);
        },
        (object, error) => {
            console.log(error);
            // error is an instance of Parse.Error.
        }
    );
}

bot.app.post('/CreditCardRegistered', function (req, res) {
    var data = req.body;
    sendRegisteredCreditCards(data.recipientId);
});

bot.app.get('/creditcard', function(req, res) {
    res.sendFile(path.join(__dirname+'/views/cardForm.html'));
});

bot.app.post('/registerCreditCard', function (req, res) {
    const User = Parse.Object.extend('User');
    const Consumer = Parse.Object.extend('Consumer');
    var data = req.body;
    var consumerID = data['consumerID'];

    console.log('registerCreditCard');

    new Parse.Query(Consumer).get(consumerID).then(consumer => {
            if(consumer){
                new Parse.Query(User).get(consumer.get('user').id).then(user => {
                    var username = user.get('username');
                    var recipientId = user.get('facebookId');
                    Parse.User.logIn(username, username, {
                        success: function(userData) {
                            var expiry = data['expiry'].replace(/\s+/g,"").split('/');

                            request.post({
                                url: PARSE_SERVER_URL+'/functions/addCreditCard',
                                headers: {
                                    'Content-Type': 'text/plain;charset=UTF-8',
                                    'X-Parse-Application-Id': PARSE_APP_ID,
                                    'X-Parse-Session-Token': userData.getSessionToken()
                                },
                                json: { "number": data['number'].replace(/\s+/g,""),
                                    "verificationNumber": data['CCV'],
                                    "expirationMonth": expiry[0],
                                    "expirationYear": expiry[1],
                                    "holderName": data['first-name']+' '+data['last-name']
                                }
                            }, function callback(error, response, body) {
                                if (!error && response.statusCode == 200) {

                                    request.post({
                                        url: SERVER_URL+'CreditCardRegistered',
                                        json: { "recipientId": recipientId}
                                    })
                                }
                                else{
                                    console.log(response.statusCode);
                                    console.log('error');
                                    console.log(error);
                                }
                            });
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

bot.app.post('/changeOrderState', function (req, res) {

    var data = req.body;

    new Parse.Query(ParseModels.Consumer).get(data['consumerID']).then(consumer => {
            if(consumer){
                new Parse.Query(ParseModels.User).get(consumer.get('user').id).then(user => {
                    var username = user.get('username');
                    var recipientId = user.get('facebookId');

                    new Parse.Query(ParseModels.OrderState).get(data['stateID']).then(orderState => {
                        store.dispatch(Actions.setOrderState(recipientId, orderState)).then(() => {
                            renderOrderState(recipientId);
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

    /*

     Parse.Cloud.run('orders').then(
     function(result){
     console.log(result);
     },
     function(error) {
     console.log('error');
     console.log(error);
     });




    request.get({
        url: PARSE_SERVER_URL+'/classes/Order?where:{"objectId":"'+data['orderID']+'"}',
        headers: {
            'Content-Type': 'text/plain;charset=UTF-8',
            'X-Parse-Application-Id': PARSE_APP_ID,
        }
    }, function callback(error, response, body) {
        console.log('get order')
        console.log(body)
    });
    */
    res.json({result: 'OK'});
});

var paymentTypes = new Map();

new Parse.Query(ParseModels.PaymentMethod).find().then(
    methods => {
        for(var method of methods){
            var tmpMethod = extractParseAttributes(method);
            if(tmpMethod.objectId == 'Nn0joKC5VK'){
                paymentTypes.set('Nn0joKC5VK', renderCash);
            }
            else if(tmpMethod.objectId == 'UdK0Ifc4IF'){
                paymentTypes.set('UdK0Ifc4IF', renderCreditCard);
            }
            //orderStates.set(state.get('order'), extractParseAttributes(state));
        }
    },
    (object, error) => {
        console.log(error);
    });

var orderStates = new Map();

new Parse.Query(ParseModels.OrderState).find().then(
    states => {
        for(var state of states){
            orderStates.set(state.get('order'), extractParseAttributes(state));
        }
    },
    (object, error) => {
        console.log(error);
    });

//orderStates.set('HUIPd800xH', { __type: 'Pointer', className: 'OrderState', objectId: 'HUIPd800xH' });

store.dispatch({type: types.APP_LOADED})

/*
console.log('Exist FB.init: '+( typeof FB.init === 'function') );
console.log(FB.getLoginUrl({ scope: 'user_about_me' }));

 Parse.FacebookUtils.init({ // this line replaces FB.init({
 appId      : FACEBOOK_APP_ID, // Facebook App ID
 cookie     : true,  // enable cookies to allow Parse to access the session
 xfbml      : true,  // initialize Facebook social plugins on the page
 version    : 'v2.4' // point to the latest Facebook Graph API version
 });
 */