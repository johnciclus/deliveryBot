import * as _ from 'underscore';
import * as bot from './bot';
import * as types from './constants/actionTypes';
import * as Actions from './actions/index';
import * as ParseModels from './ParseModels';
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

const APP_SECRET = (process.env.MESSENGER_APP_SECRET) ? process.env.MESSENGER_APP_SECRET : config.get('APP_SECRET');

const PAGE_ACCESS_TOKEN = (process.env.MESSENGER_PAGE_ACCESS_TOKEN) ? (process.env.MESSENGER_PAGE_ACCESS_TOKEN) : config.get('PAGE_ACCESS_TOKEN');

const SERVER_URL = (process.env.SERVER_URL) ? (process.env.SERVER_URL) : config.get('SERVER_URL');

const PARSE_APP_ID = (process.env.PARSE_APP_ID) ? (process.env.PARSE_APP_ID) : config.get('PARSE_APP_ID');

const PARSE_SERVER_URL = (process.env.PARSE_SERVER_URL) ? (process.env.PARSE_SERVER_URL) : config.get('PARSE_SERVER_URL');

const PARSE_CLIENT_KEY = (process.env.PARSE_CLIENT_KEY) ? (process.env.PARSE_CLIENT_KEY) : config.get('PARSE_CLIENT_KEY');

const FACEBOOK_APP_ID = (process.env.FACEBOOK_APP_ID) ? (process.env.FACEBOOK_APP_ID) : config.get('FACEBOOK_APP_ID');

const REDIRECT_URI = (process.env.REDIRECT_URI) ? (process.env.REDIRECT_URI) : config.get('REDIRECT_URI');

const BUSINESS_ID = (process.env.BUSINESS_ID) ? (process.env.BUSINESS_ID) : config.get('BUSINESS_ID');

const GOOGLE_MAPS_KEY = (process.env.GOOGLE_MAPS_KEY) ? (process.env.GOOGLE_MAPS_KEY) : config.get('GOOGLE_MAPS_KEY');

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
bot.rules.set('pedir domicilio', sendAddressMenu);
bot.rules.set('carrito', sendShoppingCart);
bot.rules.set('cuenta', sendShoppingCart);

bot.payloadRules.set('Greeting', sendMenu);
bot.payloadRules.set('SendAddressMenu', sendAddressMenu);
bot.payloadRules.set('SetAddress', setAddress);
bot.payloadRules.set('NewAddress', newAddress);
bot.payloadRules.set('SetLocation', setLocation);
bot.payloadRules.set('ConfirmAddress', confirmAddress);
bot.payloadRules.set('SendCategories', sendCategories);
bot.payloadRules.set('SendProducts', sendProducts);
bot.payloadRules.set('AddProduct', addProduct);
bot.payloadRules.set('Search', searchProducts);
bot.payloadRules.set('SendShoppingCart', sendShoppingCart);
bot.payloadRules.set('SendPurchaseOptions', sendPurchaseOptions);
bot.payloadRules.set('Checkout', checkout);
bot.payloadRules.set('CheckPayment', checkPayment);
bot.payloadRules.set('RegisterCreditCard', registerCreditCard);
bot.payloadRules.set('SendRegisteredCreditCards', sendRegisteredCreditCards);
bot.payloadRules.set('CancelRegisterCreditCard', cancelRegisterCreditCard);
bot.payloadRules.set('PayWithCreditCard', payWithCreditCard);
bot.payloadRules.set('SetRating', setRating);
//bot.payloadRules.set('WriteAddress', writeAddress);

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
            let consumer = extractParseAttributes(data.consumer);
            objectAssign(state.userData[data.recipientId], {consumer});
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
            const orders = action.data
            let ongoing = orders['ongoing'].map(o => extractParseAttributes(o))
            let delivered = orders['delivered'].map(o => extractParseAttributes(o))
            let orderToRate = delivered[0]
            objectAssign(state, {
                orders: {ongoing, delivered},
                orderToRate
            })
            return {...state};

        case types.USER_CREDITCARDS_LOADED:
            let creditCards = data.creditCards.map(a => extractParseAttributes(a));
            objectAssign(state.userData[data.recipientId], {creditCards});
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

            renderAddressMenu()

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

function authentication(recipientId, callback){
    //console.log(recipientId);

    new Parse.Query(ParseModels.User).equalTo('facebookId', recipientId).first().then(user => {
        if(user){
            if(callback){
                callback(user)
            }
        }else{
            bot.getFacebookUser(recipientId, (userData) => {
                signUp(recipientId, userData, callback);
            });
        }
    },
    (object, error) => {
        console.log(error);
    })
}

function signUp(facebookId, userData, callback){    //1100195690052041
    if(userData){
        var facebookUser = new ParseModels.User();

        facebookUser.signUp(Object.assign(userData, {username: facebookId.toString(), password: facebookId.toString(), facebookId: facebookId}), {
            success: function(user) {
                console.log('success sign up of User');
                var consumer = new ParseModels.Consumer();
                consumer.set('name', user.get('first_name')+" "+user.get('last_name'));
                consumer.set('user', {
                    __type: "Pointer",
                    className: "_User",
                    objectId: user.id
                });
                consumer.save(undefined, {
                    success: function(consumer) {
                        sendRegisterFacebookUser(facebookId);
                        callback(user);
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

function sendMenu(recipientId) {
    bot.sendTypingOn(recipientId);

    authentication(recipientId, user => {
        if(user){
            store.dispatch(Actions.loadCustomer(recipientId, BUSINESS_ID)).then(
                () => {
                    store.dispatch(Actions.loadConsumer(recipientId, user)).then(
                        () => {
                            renderMenu(recipientId);
                        }
                    );
                }
            )
        }
        else{
            var messageData = {
                recipient: {
                    id: recipientId
                },
                message: {
                    "text": "Usuario no registrado en el sistema, informacion obtenida: first_name, last_name, locale, timezone, gender"
                }
            };

            bot.sendTypingOff(recipientId);
            bot.callSendAPI(messageData);

        }
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
                        "title":     "Hola "+consumer.name+", Bienvenido a OXXO. ",
                        "subtitle":  "Aquí puedes pedir un domicilio, escribe o selecciona alguna de las opciones:",
                        "image_url": image_url,
                        "buttons":[
                            {
                                "type":"postback",
                                "title":"Pedir domicilio",
                                "payload": "SendAddressMenu"
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

function sendAddressMenu(recipientId){
    bot.sendTypingOn(recipientId);
    var consumer = getData(recipientId, 'consumer');

    if(!_.isEmpty(consumer)){
        store.dispatch(Actions.loadConsumerAddresses(recipientId, consumer.rawParseObject)).then(
            () => {
                renderAddressMenu(recipientId);
            }
        );
    }
    else{
        store.dispatch(Actions.loadCustomer(recipientId, BUSINESS_ID)).then(
            () => {
                authentication(recipientId, user => {
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
                });
            }
        )
    }
}

function renderAddressMenu(recipientId){
    var addresses = getData(recipientId, 'addresses');
    var elements = [];

    //"title": "A cual dirección vas hacer tu pedido?",
    //"subtitle": "Puedes escoger entre tus direcciones guardadas o agregar una nueva dirección",

    renderAddressMenuTitle(recipientId, () => {
        elements.push({
            "title": "Nueva dirección",
            "subtitle": "Puedes agregar una nueva dirección",
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
                    "subtitle": address.address,
                    "image_url": "https://maps.googleapis.com/maps/api/staticmap?center="+address.location.lat+","+address.location.lng+"&zoom=16&size=400x400&markers=color:red%7C"+address.location.lat+","+address.location.lng+"&key="+GOOGLE_MAPS_KEY,
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

        bot.callSendAPI(messageData);
    });
}

function renderAddressMenuTitle(recipientId, callback){
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            "text": "A cual dirección vas hacer tu pedido?\n\nPuedes escoger entre tus direcciones guardadas o agregar una nueva dirección"
        }
    };

    bot.sendTypingOff(recipientId);
    bot.callSendAPI(messageData, callback);
}

function setAddress(recipientId, id){
    bot.sendTypingOn(recipientId);

    store.dispatch(Actions.setAddress(recipientId, id)).then(
        () => {
            renderAddressConfirmation(recipientId)
        }
    );
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
                /*{
                    "content_type": "text",
                    "title": "Escribir dirección",
                    "payload": "WriteAddress"
                },*/
                {
                    "content_type": "location"
                }
            ]
        }
    };
    /*
    {
        "content_type": "text",
        "title": "Compartir ubicación",
        "payload": "SetLocation"
    },*/

    bot.setListener(recipientId, 'address', 'text', writeAddressCheck);
    bot.setListener(recipientId, 'location', 'attachment', setLocationCheck);
    bot.callSendAPI(messageData);
}

function writeAddressComplement(recipientId){
    bot.sendTypingOff(recipientId);
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            "text": "Por favor escribe el complemento de tu dirección actual. \n\nEjemplo: Oficina 1068"
        }
    };

    bot.setListener(recipientId, 'complement', writeAddressComplete);
    bot.callSendAPI(messageData);
}

function sendMapMessage(recipientId, callback){
    var userBuffer = bot.buffer[recipientId];
    var messageData = {
        recipient: {
            id: recipientId
        },
        "message": {
            "text": "Encontré esta dirección en Google Maps:\n\n"+userBuffer.address+""
        }
    };

    bot.callSendAPI(messageData, callback);
}

function sendMap(recipientId, callback){
    var userBuffer = bot.buffer[recipientId];
    var messageData = {
        recipient: {
            id: recipientId
        },
        "message": {
            "attachment": {
                "type": "image",
                "payload": {
                    "url": "https://maps.googleapis.com/maps/api/staticmap?center="+userBuffer.location.lat+","+userBuffer.location.lng+"&zoom=16&size=400x400&markers=color:red%7C"+userBuffer.location.lat+","+userBuffer.location.lng+"&key="+GOOGLE_MAPS_KEY
                }
            }
        }
    };

    bot.callSendAPI(messageData, callback);
}

function writeAddressCheck(recipientId){
    bot.sendTypingOff(recipientId);
    let userBuffer = bot.buffer[recipientId];
    
    geocoder.geocode(userBuffer.address, (error, data) =>{
        if(!error && data.status == 'OK'){
            let result = data.results[0];

            userBuffer.address = result.formatted_address;
            userBuffer.location = result.geometry.location;

            for(var component of result.address_components){
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

            sendMapMessage(recipientId, () => {
                sendMap(recipientId, () => {
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
                                    "payload": "NewAddress"
                                }
                            ]
                        }
                    };
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

    var location = new Parse.GeoPoint({latitude: parseFloat(userBuffer.location.lat), longitude: parseFloat(userBuffer.location.lng)});

    var consumerAddress = new ParseModels.ConsumerAddress();
    consumerAddress.set('name', userBuffer['address-name']);
    consumerAddress.set('address', userBuffer.address);
    consumerAddress.set('consumer', {
        __type: "Pointer",
        className: "Consumer",
        objectId: consumer.objectId
    });
    consumerAddress.set('location', location);
    consumerAddress.set('city', userBuffer.locality);
    consumerAddress.set('countryCode', userBuffer.country);
    consumerAddress.set('postalCode', userBuffer.postal_code);
    consumerAddress.set('state', userBuffer.state);

    consumerAddress.save(undefined, {
        success: function(result) {

            delete userBuffer.address;
            delete userBuffer.location;
            delete userBuffer['address-name'];

            //console.log(userBuffer);


        },
        error: function(user, error) {
            // Execute any logic that should take place if the save fails.
            // error is a Parse.Error with an error code and message.
            console.log('Failed to create new object, with error code: ' + error.message);
        }
    });

    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            "text": "La dirección ha sido almacenada."
        }
    };

    bot.callSendAPI(messageData, sendAddressMenu );
}

function confirmAddress(recipientId){
    bot.sendTypingOff(recipientId);

    let userBuffer = bot.buffer[recipientId];

    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            "text": "Por favor coloca un nombre a esta dirección. \n\nEjemplo: casa, apartamento o oficina"
        }
    };
    bot.setListener(recipientId, 'address-name', 'text', writeAddressComplete);
    bot.callSendAPI(messageData);
}

function setLocation(recipientId){
    bot.sendTypingOff(recipientId);
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            "text": "Por favor confirma el envio de tu dirección actual",
            "quick_replies":[
                {
                    "content_type":"location"
                }
            ]
        }
    };
    bot.setListener(recipientId, 'location', 'text', setLocationCheck);
    bot.callSendAPI(messageData);
}

function setLocationCheck(recipientId){
    bot.sendTypingOff(recipientId);
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

            sendMapMessage(recipientId, () => {
                sendMap(recipientId, () => {
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
                    bot.callSendAPI(messageData);
                });
            });
        }
        else{
            console.log('Geocode not found');
        }
    })

    /*
    geocoder.geocode(userBuffer.address, (error, data) =>{
        if(!error && data.status == 'OK'){
            let result = data.results[0];

            userBuffer.address = result.formatted_address;
            userBuffer.location = result.geometry.location;

            console.log(userBuffer)

            sendMapMessage(recipientId, () => {
                sendMap(recipientId, () => {
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
                                    "payload": "WriteAddress"
                                }
                            ]
                        }
                    };
                    bot.callSendAPI(messageData);
                });
            });
        }
        else{
            console.log('Geocode not found');
            console.log(error);
        }

    });
    */
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
            var elements = splitCategories(result.categories, index);
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

        });
}

function splitCategories(categories, index){
    var idx = 0;
    var elements = [];

    categories.forEach(function(item){
        //console.log(item.get('name'));
        if(item && item.get('name')){
            //console.log(elements.length);
            if(idx >= (index)*bot.limit && idx < (index+1)*bot.limit){
                var image = item.get('image');
                var image_url = "http://pro.parse.inoutdelivery.com/parse/files/hSMaiK7EXqDqRVYyY2fjIp4lBweiZnjpEmhH4LpJ/2671158f9c1cb43cac1423101b6e451b_image.txt"
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
                    text: "Tenemos los siguientes "+category.get('name')+":"
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

    Parse.Cloud.run('getProducts', { businessId: BUSINESS_ID, category: category }).then(function(result) {
        var elements = splitProducts(result.products, proIdx);
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

    })
}

function splitProducts(products, proIdx){
    var idx = 0;
    var elements = [];

    products.forEach(function(item){
        if(item && item.get('name')){
            if(idx >= (proIdx)*bot.limit && idx < (proIdx+1)*bot.limit){
                var image = item.get('image');
                var image_url = "http://pro.parse.inoutdelivery.com/parse/files/hSMaiK7EXqDqRVYyY2fjIp4lBweiZnjpEmhH4LpJ/2671158f9c1cb43cac1423101b6e451b_image.txt"
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
    var userData = getData(recipientId);
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
                     */

                    console.log('\nConsumer kart');
                    console.log(result);

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
    var state0 = orderStates.get('HUIPd800xH');
    var total = 0 ;

    console.log(consumer);
    console.log(consumer.name);
    console.log(customer);
    console.log(paymentMethod.method);
    console.log(address);
    console.log(state0);
    console.log(cart);

    cart.items.forEach(function(value, key){
        console.log(value);
        total += value.quantity*value.price;
    });

    order.set('consumer', { __type: 'Pointer', className: 'Consumer', objectId: consumer.objectId });
    order.set('consumerAddress', { __type: 'Pointer', className: 'ConsumerAddress', objectId: address.objectId });
    order.set('pointSale', { __type: 'Pointer', className: 'CustomerPointSale', objectId: 'fAAa91nJw0' });
    order.set('state', state0);
    order.set('items', cart.itemsPointers);
    order.set('deliveryCost', 10000);
    order.set('total', total);
    order.set('paymentMethod', paymentMethod.method);
    order.set('name', consumer.name);
    order.set('comment', "Pedido de prueba");

    console.log('Setting Order');



    order.save(undefined, {
        success: function(result) {
            console.log('Save Order');
            console.log(result);
        },
        error: function(user, error) {
            // Execute any logic that should take place if the save fails.
            // error is a Parse.Error with an error code and message.
            console.log('Failed to create new object, with error code: ' + error.message);
            console.log(error);
        }
    });
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
                            "payload":"SendShoppingCart"
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
            "text": "Deseas agregar otro producto o terminar tu pedido?",
            "quick_replies":[
                {
                    "content_type":"text",
                    "title":"Seguir pidiendo",
                    "payload":"SendCategories-0"
                },
                {
                    "content_type":"text",
                    "title":"Ver carrito",
                    "payload":"SendShoppingCart"
                }
            ]
        }
    };
    bot.sendTypingOff(recipientId);
    bot.callSendAPI(messageData);
}

function sendShoppingCart(recipientId){
    // Generate a random receipt ID as the API requires a unique ID
    var Product = Parse.Object.extend("Product");
    var userData = getData(recipientId);
    var consumer = getData(recipientId, 'consumer');
    var cart = getData(recipientId, 'cart');
    var address = getData(recipientId, 'address');

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

    if(address == undefined){
        sendAddressMenu(recipientId)
    }
    else if(orderLimit == 0){
        renderShoppingCartEmpty(recipientId)
    }
    else{
        items.forEach(function(value, key){
            var product = new Parse.Query(Product);

            product.get(key, {
                success: function (item) {
                    image = item.get('image');
                    image_url = "http://pro.parse.inoutdelivery.com/parse/files/hSMaiK7EXqDqRVYyY2fjIp4lBweiZnjpEmhH4LpJ/2671158f9c1cb43cac1423101b6e451b_image.txt"
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
                        renderShoppingCart(recipientId, elements, total)
                    }
                },
                error: function (error) {
                    alert("Error: " + error.code + " " + error.message);
                }
            })
        });
    }

}

function renderShoppingCartEmpty(recipientId){
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

function renderShoppingCart(recipientId, elements, total){
    var receiptId = "rder" + Math.floor(Math.random()*1000);
    var address = getData(recipientId, 'address');
    var payment_method = getData(recipientId, 'payment_method')

    if(payment_method == undefined){
        payment_method = {name: 'Sin definir'}
    }

    authentication(recipientId, (user)=>{
        if(user){
            var messageData = {
                recipient: {
                    id: recipientId
                },
                message:{
                    attachment: {
                        type: "template",
                        payload: {
                            template_type: "receipt",
                            recipient_name: user.get('first_name')+" "+user.get('last_name'),
                            order_number: receiptId,
                            currency: "COP",
                            payment_method: payment_method.name,
                            timestamp: Math.trunc(Date.now()/1000).toString(),
                            elements: elements,
                            address: {
                                street_1: address.address,
                                street_2: "",
                                city: address.city,
                                postal_code: address.postalCode,
                                state: address.state,
                                country: address.countryCode
                            },
                            summary: {
                                subtotal: total,
                                shipping_cost: 2000.00,
                                total_tax: total*0.16,
                                total_cost: total*1.16+2000.00
                            }
                            //adjustments: [{
                            //  name: "New Customer Discount",
                            //  amount: -1000
                            //}, {
                            //    name: "$1000 Off Coupon",
                            //    amount: -1000
                            //}]
                        }
                    }
                }
            };
            //console.log("callSendAPI(messageData)");
            bot.sendTypingOff(recipientId);
            bot.callSendAPI(messageData, renderShoppingCartConfirmation);
        }
    });
}

function renderShoppingCartConfirmation(recipientId){
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            "text": "Es correcto, deseas finalizar tu pedido?",
            "quick_replies":[
                {
                    "content_type":"text",
                    "title":"Si",
                    "payload":"CheckPayment"
                },
                {
                    "content_type":"text",
                    "title":"No",
                    "payload":"SendPurchaseOptions"
                }
            ]
        }
    };
    bot.sendTypingOff(recipientId);
    bot.callSendAPI(messageData);
}

function checkPayment (recipientId){
    bot.sendTypingOn(recipientId);
    //ParseModels.PaymentMethod
    store.dispatch(Actions.loadPaymentMethods(recipientId)).then(() => {

        renderCheckPayment(recipientId)
    });
}

function renderCheckPayment(recipientId){
    var paymentMethods = getData(recipientId, 'paymentMethods');
    var quick_replies = [];

    //console.log(paymentMethods);

    for(var i in paymentMethods){

        quick_replies.push({
            "content_type": "text",
            "title": paymentMethods[i].name,
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
    //console.log('checkout');
    //console.log(id);
    store.dispatch(Actions.setPaymentMethod(recipientId, id)).then(
        () => {

            let paymentMethod = getData(recipientId, 'paymentMethod');
            //console.log(paymentMethod);
            var paymentFunction = paymentTypes.get(paymentMethod.method.objectId);
            //console.log(paymentFunction);

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
                "payload":{
                    "template_type": "button",
                    "text": "Por razones de seguidad te vamos a redireccionar a una página web segura para que agregues tu tarjeta y finalizaremos tu pedido.\n\nEstas de acuerdo?",
                    "buttons":[
                        {
                            "type":"web_url",
                            "url": SERVER_URL+ "creditcard?id="+consumer.objectId,
                            "title":"Si",
                        },
                        {
                            "type":"postback",
                            "title":"No",
                            "payload":"CancelRegisterCreditCard"
                        }
                    ]
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
                "title": card.type+" xxxx-" + card.lastFour,
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
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            "text": "Tu pedido ha sido registrado. \n\n En un momento te estaremos dando información en tiempo real sobre tu pedido"
        }
    };

    saveOrder(recipientId);

    bot.sendTypingOff(recipientId);
    bot.callSendAPI(messageData, orderState);
}

function orderState(recipientId){
    bot.sendTypingOn(recipientId);
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            "text": "Tu pedido ha sido Aceptado. \n\n Lo estan preparando en nuestra sede y te lo enviaremos en aproximadamente 10 minutos"
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
            "text": "Buenas noticias, Tu pedido ha sido Enviado. \n\n Haz click en el mapa para vel tu pedido"
        }
    };
    bot.sendTypingOff(recipientId);
    bot.callSendAPI(messageData, serviceRating);
}

function serviceRating(recipientId){
    bot.sendTypingOn(recipientId);
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            "text": "Califica tu experiencia para ayudarnos a mejorar. \n\n De 1 a 5 cuantas extrellas merece nuestro servicio?",
            "quick_replies":[
                {
                    "content_type":"text",
                    "title":"5 (Excelente)",
                    "payload":"SetRating-5"
                },
                {
                    "content_type":"text",
                    "title":"4 (Bien)",
                    "payload":"SetRating-4"
                },
                {
                    "content_type":"text",
                    "title":"3 (Regular)",
                    "payload":"SetRating-3"
                },
                {
                    "content_type":"text",
                    "title":"2 (Mal)",
                    "payload":"SetRating-2"
                },
                {
                    "content_type":"text",
                    "title":"2 (Muy mal)",
                    "payload":"SetRating-1"
                },
            ]
        }
    };
    bot.sendTypingOff(recipientId);
    bot.callSendAPI(messageData);
}

function setRating(recipientId, rating){
    bot.sendTypingOn(recipientId);

    thank(recipientId)
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
            else{
                if(index == undefined)
                    index = 0;
                else if( typeof index == 'string')
                    index = parseInt(index);

                if(index == 0){
                    renderSearchInitial(recipientId);
                    bot.sendTypingOn(recipientId);
                }

                var elements = splitSearchResult(result, index);
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

function splitSearchResult(products, index){
    var idx = 0;
    var elements = [];

    /*
    for(var key in products){
        console.log(products[key])
    }
    */

    products.forEach(function(item){
        if(item && item.name && item.type == 'Product'){
            //item.id get Product information
            if(idx >= (index)*bot.limit && idx < (index+1)*bot.limit){
                var image = item.image;
                var image_url = "http://pro.parse.inoutdelivery.com/parse/files/hSMaiK7EXqDqRVYyY2fjIp4lBweiZnjpEmhH4LpJ/2671158f9c1cb43cac1423101b6e451b_image.txt"
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

bot.app.post('/CreditCardRegistered', function (req, res) {
    var data = req.body;
    sendRegisteredCreditCards(data.recipientId);
});

var paymentTypes = new Map();

paymentTypes.set('Nn0joKC5VK', renderCash);

paymentTypes.set('UdK0Ifc4IF', renderCreditCard);

var orderStates = new Map();

orderStates.set('HUIPd800xH', { __type: 'Pointer', className: 'OrderState', objectId: 'HUIPd800xH' });

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