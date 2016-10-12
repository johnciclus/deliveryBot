'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _underscore = require('underscore');

var _ = _interopRequireWildcard(_underscore);

var _bot = require('./bot');

var bot = _interopRequireWildcard(_bot);

var _actionTypes = require('./constants/actionTypes');

var types = _interopRequireWildcard(_actionTypes);

var _index = require('./actions/index');

var Actions = _interopRequireWildcard(_index);

var _ParseModels = require('./ParseModels');

var ParseModels = _interopRequireWildcard(_ParseModels);

var _ParseUtils = require('./ParseUtils');

var _redux = require('redux');

var _utils = require('./utils');

var _utils2 = _interopRequireDefault(_utils);

var _config = require('config');

var _config2 = _interopRequireDefault(_config);

var _request = require('request');

var _request2 = _interopRequireDefault(_request);

var _hashmap = require('hashmap');

var _hashmap2 = _interopRequireDefault(_hashmap);

var _objectAssign = require('object-assign');

var _objectAssign2 = _interopRequireDefault(_objectAssign);

var _reduxThunk = require('redux-thunk');

var _reduxThunk2 = _interopRequireDefault(_reduxThunk);

var _fb = require('fb');

var _fb2 = _interopRequireDefault(_fb);

var _geocoder = require('geocoder');

var _geocoder2 = _interopRequireDefault(_geocoder);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

var APP_SECRET = process.env.MESSENGER_APP_SECRET ? process.env.MESSENGER_APP_SECRET : _config2.default.get('APP_SECRET');

var PAGE_ACCESS_TOKEN = process.env.MESSENGER_PAGE_ACCESS_TOKEN ? process.env.MESSENGER_PAGE_ACCESS_TOKEN : _config2.default.get('PAGE_ACCESS_TOKEN');

var SERVER_URL = process.env.SERVER_URL ? process.env.SERVER_URL : _config2.default.get('SERVER_URL');

var PARSE_APP_ID = process.env.PARSE_APP_ID ? process.env.PARSE_APP_ID : _config2.default.get('PARSE_APP_ID');

var PARSE_SERVER_URL = process.env.PARSE_SERVER_URL ? process.env.PARSE_SERVER_URL : _config2.default.get('PARSE_SERVER_URL');

var PARSE_CLIENT_KEY = process.env.PARSE_CLIENT_KEY ? process.env.PARSE_CLIENT_KEY : _config2.default.get('PARSE_CLIENT_KEY');

var FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID ? process.env.FACEBOOK_APP_ID : _config2.default.get('FACEBOOK_APP_ID');

var REDIRECT_URI = process.env.REDIRECT_URI ? process.env.REDIRECT_URI : _config2.default.get('REDIRECT_URI');

var BUSINESS_ID = process.env.BUSINESS_ID ? process.env.BUSINESS_ID : _config2.default.get('BUSINESS_ID');

var GOOGLE_MAPS_URL = process.env.GOOGLE_MAPS_URL ? process.env.GOOGLE_MAPS_URL : _config2.default.get('GOOGLE_MAPS_URL');

var GOOGLE_MAPS_KEY = process.env.GOOGLE_MAPS_KEY ? process.env.GOOGLE_MAPS_KEY : _config2.default.get('GOOGLE_MAPS_KEY');

_fb2.default.options({
    appId: FACEBOOK_APP_ID,
    appSecret: APP_SECRET,
    redirectUri: REDIRECT_URI
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
bot.payloadRules.set('NewAddress', newAddress);
bot.payloadRules.set('SetAddressComplement', setAddressComplement);
bot.payloadRules.set('ConfirmAddress', confirmAddress);
bot.payloadRules.set('SetAddress', setAddress);

bot.payloadRules.set('SendCategories', sendCategories);
bot.payloadRules.set('SendProducts', sendProducts);
bot.payloadRules.set('AddProduct', addProduct);

bot.payloadRules.set('Search', searchProducts);
bot.payloadRules.set('SendShoppingCart', sendShoppingCart);
bot.payloadRules.set('SendPurchaseOptions', sendPurchaseOptions);

bot.payloadRules.set('Checkout', checkout);
bot.payloadRules.set('CheckPayment', checkPayment);
bot.payloadRules.set('CheckAddress', checkAddress);
bot.payloadRules.set('CheckOrder', checkOrder);
bot.payloadRules.set('RegisterCreditCard', registerCreditCard);
bot.payloadRules.set('SendRegisteredCreditCards', sendRegisteredCreditCards);
bot.payloadRules.set('CancelRegisterCreditCard', cancelRegisterCreditCard);
bot.payloadRules.set('PayWithCreditCard', payWithCreditCard);
bot.payloadRules.set('SetRating', setRating);

bot.defaultSearch = searchProducts;

var initialState = {
    userData: {},

    geocodedLocation: { lat: -1, lng: -1 },
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
        consumerAddress: {},
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

var reducer = function reducer() {
    var state = arguments.length <= 0 || arguments[0] === undefined ? initialState : arguments[0];
    var action = arguments[1];

    console.log('ACTION');
    console.log(action);
    var data = action.data;

    if (data && data.hasOwnProperty('recipientId')) {
        if (_typeof(state.userData[data.recipientId]) != 'object') {
            state.userData[data.recipientId] = {};
        }
    }

    switch (action.type) {
        case types.APP_LOADED:
            console.log('Application is running on port', bot.app.get('port'));
            return _extends({}, state);

        case types.CUSTOMER_LOADED:
            var customer = (0, _ParseUtils.extractParseAttributes)(data.customer);

            if (_typeof(state.userData[data.recipientId]) != 'object') {
                state.userData[data.recipientId] = {};
            }
            (0, _objectAssign2.default)(state.userData[data.recipientId], { customer: customer });
            return _extends({}, state);

        case types.CONSUMER_LOADED:
            //if (state.consumerNotFound) delete state.consumerNotFound;
            var consumer = (0, _ParseUtils.extractParseAttributes)(data.consumer);
            (0, _objectAssign2.default)(state.userData[data.recipientId], { consumer: consumer });
            return _extends({}, state);

        case types.CONSUMER_ADDRESSES_LOADED:
            var addresses = data.addresses.map(function (a) {
                return (0, _ParseUtils.extractParseAttributes)(a);
            });
            (0, _objectAssign2.default)(state.userData[data.recipientId], { addresses: addresses });
            return _extends({}, state);

        case types.SET_CURRENT_ADDRESS:
            var address = (0, _ParseUtils.extractParseAttributes)(data.address);
            (0, _objectAssign2.default)(state.userData[data.recipientId], { address: address });
            return _extends({}, state);

        case types.PAYMENT_METHODS_LOADED:
            var paymentMethods = data.paymentMethods.map(function (p) {
                return (0, _ParseUtils.extractParseAttributes)(p);
            });
            (0, _objectAssign2.default)(state.userData[data.recipientId], { paymentMethods: paymentMethods });
            return _extends({}, state);

        case types.SET_PAYMENT_METHOD:
            var paymentMethod = (0, _ParseUtils.extractParseAttributes)(data.paymentMethod);
            (0, _objectAssign2.default)(state.userData[data.recipientId], { paymentMethod: paymentMethod });
            return _extends({}, state);

        case types.CONSUMER_UPDATED:
            return _extends({}, state);

        case types.CONSUMER_NOT_FOUND:
            (0, _objectAssign2.default)(state, {
                consumerNotFound: true,
                currentUser: action.data.user
            });
            return _extends({}, state);

        case types.CONSUMER_ORDERS_LOADED:
            var orders = action.data;
            var ongoing = orders['ongoing'].map(function (o) {
                return (0, _ParseUtils.extractParseAttributes)(o);
            });
            var delivered = orders['delivered'].map(function (o) {
                return (0, _ParseUtils.extractParseAttributes)(o);
            });
            var orderToRate = delivered[0];
            (0, _objectAssign2.default)(state, {
                orders: { ongoing: ongoing, delivered: delivered },
                orderToRate: orderToRate
            });
            return _extends({}, state);

        case types.USER_CREDITCARDS_LOADED:
            var creditCards = data.creditCards.map(function (a) {
                return (0, _ParseUtils.extractParseAttributes)(a);
            });
            (0, _objectAssign2.default)(state.userData[data.recipientId], { creditCards: creditCards });
            return _extends({}, state);

        case types.SET_CUSTOMER_POINT_SALE:
            var pointSale = (0, _ParseUtils.extractParseAttributes)(data.pointSale);
            (0, _objectAssign2.default)(state.userData[data.recipientId], { pointSale: pointSale });
            return _extends({}, state);

        case types.RENDER_MENU:
            /*
            console.log('Store');
            console.log('Consumer');
            console.log(consumer);*/
            renderMenu();

            /*request({
             uri: 'https://graph.facebook.com/v2.6/' + '1100195690052041',
             qs: {access_token: PAGE_ACCESS_TOKEN, fields: 'first_name,last_name,locale,timezone,gender'},
             method: 'GET'
             }, renderMenuMessage);*/

            return state;
        case types.RENDER_ADDRESS_MENU:

            renderAddressMenu();

            return state;

        default:
            return state;
    }
};

var store = (0, _redux.createStore)(reducer, (0, _redux.applyMiddleware)(_reduxThunk2.default));

store.subscribe(function () {
    return console.log('\n');
});

//global.FB = FB;

function getData(recipientId, property) {
    if (recipientId !== undefined) {
        var data = store.getState().userData;
        var userData = data[recipientId];

        if (userData == undefined) {
            data[recipientId] = {};
            userData = data[recipientId];
        }

        if (property == undefined) return userData;else {
            if (userData.hasOwnProperty(property)) {
                return userData[property];
            } else return undefined;
        }
    }
}

function authentication(recipientId, callback) {
    //console.log(recipientId);

    new Parse.Query(ParseModels.User).equalTo('facebookId', recipientId).first().then(function (user) {
        if (user) {
            if (callback) {
                callback(user);
            }
        } else {
            bot.getFacebookUser(recipientId, function (userData) {
                signUp(recipientId, userData, callback);
            });
        }
    }, function (object, error) {
        console.log(error);
    });
}

function signUp(facebookId, userData, callback) {
    //1100195690052041
    if (userData) {
        var facebookUser = new ParseModels.User();

        facebookUser.signUp(Object.assign(userData, { username: facebookId.toString(), password: facebookId.toString(), facebookId: facebookId }), {
            success: function success(user) {
                console.log('success sign up of User');
                var consumer = new ParseModels.Consumer();
                consumer.set('name', user.get('first_name') + " " + user.get('last_name'));
                consumer.set('user', {
                    __type: "Pointer",
                    className: "_User",
                    objectId: user.id
                });
                consumer.save(undefined, {
                    success: function success(consumer) {
                        //sendRegisterFacebookUser(facebookId);
                        callback(user);
                    },
                    error: function error(user, _error) {
                        // Execute any logic that should take place if the save fails.
                        // error is a Parse.Error with an error code and message.
                        console.log('Failed to create new object, with error code: ' + _error.message);
                    }
                });
            },
            error: function error(user, _error2) {
                // Execute any logic that should take place if the save fails.
                // error is a Parse.Error with an error code and message.
                console.log('Failed to create new object, with error code: ' + _error2.message);
            }
        });
    }
}

function sendRegisterFacebookUser(recipientId) {
    bot.sendTypingOn(recipientId);
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            "text": "Registro exitoso."

        }
    };
    bot.sendTypingOff(recipientId);
    bot.callSendAPI(messageData);
}

function sendMenu(recipientId) {
    bot.sendTypingOn(recipientId);

    authentication(recipientId, function (user) {
        if (user) {
            store.dispatch(Actions.loadCustomer(recipientId, BUSINESS_ID)).then(function () {
                store.dispatch(Actions.loadConsumer(recipientId, user)).then(function () {
                    renderMenu(recipientId);
                });
            });
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
                        "title": "Hola " + consumer.name + ", Bienvenido a " + customer.name,
                        "subtitle": "Aquí puedes pedir un domicilio, escribe o selecciona alguna de las opciones:",
                        "image_url": image_url,
                        "buttons": [{
                            "type": "postback",
                            "title": "Pedir domicilio",
                            "payload": "SendAddressMenu"
                        }, {
                            "type": "postback",
                            "title": "Pedir para recoger",
                            "payload": "TakeOut"
                        }, {
                            "type": "postback",
                            "title": "Servicio al cliente",
                            "payload": "CustomerService"
                        }]
                    }]
                }
            }
        }
    };

    bot.sendTypingOff(recipientId);
    bot.callSendAPI(messageData);
}

function sendAddressMenu(recipientId) {
    bot.sendTypingOn(recipientId);
    var consumer = getData(recipientId, 'consumer');

    if (!_.isEmpty(consumer)) {
        store.dispatch(Actions.loadConsumerAddresses(recipientId, consumer.rawParseObject)).then(function () {
            renderAddressMenu(recipientId);
        });
    } else {
        store.dispatch(Actions.loadCustomer(recipientId, BUSINESS_ID)).then(function () {
            authentication(recipientId, function (user) {
                if (user) {
                    store.dispatch(Actions.loadConsumer(recipientId, user)).then(function () {
                        consumer = getData(recipientId, 'consumer');
                        store.dispatch(Actions.loadConsumerAddresses(recipientId, consumer.rawParseObject)).then(function () {
                            renderAddressMenu(recipientId);
                        });
                    });
                }
            });
        });
    }
}

function renderAddressMenu(recipientId) {
    var addresses = getData(recipientId, 'addresses');
    var elements = [];

    //"title": "A cual dirección vas hacer tu pedido?",
    //"subtitle": "Puedes escoger entre tus direcciones guardadas o agregar una nueva dirección",
    renderAddressMenuTitle(recipientId, function () {
        elements.push({
            "title": "Nueva dirección",
            "subtitle": "Puedes agregar una nueva dirección",
            "image_url": SERVER_URL + "assets/new_address_blue.jpg",
            "buttons": [{
                "type": "postback",
                "title": "Nueva dirección",
                "payload": "NewAddress"
            }]
        });

        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
            for (var _iterator = addresses[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var address = _step.value;

                if (elements.length < bot.limit) {
                    elements.push({
                        "title": address.name.capitalizeFirstLetter(),
                        "subtitle": address.address + ", " + address.description + ", " + address.city + ", " + address.state,
                        "image_url": GOOGLE_MAPS_URL + "?center=" + address.location.lat + "," + address.location.lng + "&zoom=16&size=400x400&markers=color:red%7C" + address.location.lat + "," + address.location.lng + "&key=" + GOOGLE_MAPS_KEY,
                        "buttons": [{
                            "type": "postback",
                            "title": address.name.capitalizeFirstLetter(),
                            "payload": "SetAddress-" + address.objectId
                        }]
                    });
                }
            }
        } catch (err) {
            _didIteratorError = true;
            _iteratorError = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion && _iterator.return) {
                    _iterator.return();
                }
            } finally {
                if (_didIteratorError) {
                    throw _iteratorError;
                }
            }
        }

        var messageData = {
            recipient: {
                id: recipientId
            },
            message: {
                "attachment": {
                    "type": "template",
                    "payload": {
                        "template_type": "generic",
                        "elements": elements
                    }
                }
            }
        };

        bot.callSendAPI(messageData);
    });
}

function renderAddressMenuTitle(recipientId, callback) {
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

function newAddress(recipientId) {
    bot.sendTypingOff(recipientId);
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            "text": "Puedes escribir o compartir tu ubicación actual?\n\nEjemplo: Calle 67 #52-20, Medellín",
            "quick_replies": [{
                "content_type": "location"
            }]
        }
    };

    bot.setListener(recipientId, 'address', 'text', addressCheck);
    bot.setListener(recipientId, 'location', 'attachment', setLocationCheck);
    bot.callSendAPI(messageData);
}

function setAddressComplement(recipientId) {
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

function sendMapMessage(recipientId, callback) {
    var userBuffer = bot.buffer[recipientId];
    var messageData = {
        recipient: {
            id: recipientId
        },
        "message": {
            "text": "Encontré esta dirección en Google Maps:\n\n" + userBuffer.address + ""
        }
    };

    bot.callSendAPI(messageData, callback);
}

function sendMap(recipientId, callback) {
    var userBuffer = bot.buffer[recipientId];
    var messageData = {
        recipient: {
            id: recipientId
        },
        "message": {
            "attachment": {
                "type": "image",
                "payload": {
                    "url": GOOGLE_MAPS_URL + "?center=" + userBuffer.location.lat + "," + userBuffer.location.lng + "&zoom=16&size=400x400&markers=color:red%7C" + userBuffer.location.lat + "," + userBuffer.location.lng + "&key=" + GOOGLE_MAPS_KEY
                }
            }
        }
    };

    bot.callSendAPI(messageData, callback);
}

function addressCheck(recipientId) {
    bot.sendTypingOff(recipientId);
    var userBuffer = bot.buffer[recipientId];

    _geocoder2.default.geocode(userBuffer.address, function (error, data) {
        if (!error && data.status == 'OK') {
            var result = data.results[0];

            userBuffer.address = result.formatted_address;
            userBuffer.location = result.geometry.location;

            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
                for (var _iterator2 = result.address_components[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                    var component = _step2.value;

                    if (component.types.includes('route')) {
                        userBuffer.route = component.long_name;
                    } else if (component.types.includes('street_number')) {
                        userBuffer.street_number = component.short_name;
                    } else if (component.types.includes('locality')) {
                        userBuffer.locality = component.short_name;
                    } else if (component.types.includes('administrative_area_level_1')) {
                        userBuffer.state = component.short_name;
                    } else if (component.types.includes('administrative_area_level_2')) {
                        userBuffer.administrative_area = component.short_name;
                    } else if (component.types.includes('country')) {
                        userBuffer.country = component.long_name;
                        userBuffer.country_code = component.short_name;
                    } else if (component.types.includes('postal_code')) {
                        userBuffer.postal_code = component.short_name;
                    }
                }
            } catch (err) {
                _didIteratorError2 = true;
                _iteratorError2 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion2 && _iterator2.return) {
                        _iterator2.return();
                    }
                } finally {
                    if (_didIteratorError2) {
                        throw _iteratorError2;
                    }
                }
            }

            sendMapMessage(recipientId, function () {
                sendMap(recipientId, function () {
                    var messageData = {
                        recipient: {
                            id: recipientId
                        },
                        message: {
                            "text": "Es correcta?",
                            "quick_replies": [{
                                "content_type": "text",
                                "title": "Si",
                                "payload": "SetAddressComplement"
                            }, {
                                "content_type": "text",
                                "title": "No",
                                "payload": "NewAddress"
                            }]
                        }
                    };
                    bot.callSendAPI(messageData);
                });
            });
        } else {
            console.log('Geocode not found');
            console.log(error);
        }
    });
}

function writeAddressComplete(recipientId) {
    var consumer = getData(recipientId, 'consumer');
    var userBuffer = bot.buffer[recipientId];

    console.log(userBuffer);

    var location = new Parse.GeoPoint({ latitude: parseFloat(userBuffer.location.lat), longitude: parseFloat(userBuffer.location.lng) });

    var consumerAddress = new ParseModels.ConsumerAddress();
    consumerAddress.set('name', userBuffer['address-name']);
    consumerAddress.set('address', userBuffer.route + " # " + userBuffer.street_number);
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
        success: function success(result) {

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

            bot.callSendAPI(messageData, function () {
                setAddress(recipientId, result.id);
            });
        },
        error: function error(user, _error3) {
            // Execute any logic that should take place if the save fails.
            // error is a Parse.Error with an error code and message.
            console.log('Failed to create new object, with error code: ' + _error3.message);
        }
    });
}

function confirmAddress(recipientId) {
    bot.sendTypingOff(recipientId);

    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            "text": "Por favor coloca un nombre a esta dirección para guardarla. \n\nEjemplo: casa, apartamento o oficina"
        }
    };
    bot.setListener(recipientId, 'address-name', 'text', writeAddressComplete);
    bot.callSendAPI(messageData);
}

function setEmail(recipientId) {
    bot.sendTypingOff(recipientId);
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            "text": "Por favor escribe tu email:"
        }
    };
    bot.setListener(recipientId, 'email', 'text', setEmailCheck);
    bot.callSendAPI(messageData);
}

function setEmailCheck(recipientId) {}

function setTelephone(recipientId) {
    bot.sendTypingOff(recipientId);
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            "text": "Por favor escribe tu número telefónico:"
        }
    };
    bot.setListener(recipientId, 'telephone', 'text', setTelephoneCheck);
    bot.callSendAPI(messageData);
}

function setTelephoneCheck(recipientId) {}

function setLocationCheck(recipientId) {
    bot.sendTypingOff(recipientId);
    var userBuffer = bot.buffer[recipientId];

    _geocoder2.default.reverseGeocode(userBuffer.location.lat, userBuffer.location.lng, function (error, data) {
        if (!error && data.status == 'OK') {
            var result = data.results[0];

            userBuffer.address = result.formatted_address;
            userBuffer.location = result.geometry.location;

            var _iteratorNormalCompletion3 = true;
            var _didIteratorError3 = false;
            var _iteratorError3 = undefined;

            try {
                for (var _iterator3 = result.address_components[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                    var component = _step3.value;

                    //console.log(component);
                    if (component.types.includes('locality')) {
                        userBuffer.locality = component.short_name;
                    } else if (component.types.includes('administrative_area_level_1')) {
                        userBuffer.state = component.short_name;
                    } else if (component.types.includes('administrative_area_level_2')) {
                        userBuffer.administrative_area = component.short_name;
                    } else if (component.types.includes('country')) {
                        userBuffer.country = component.short_name;
                    } else if (component.types.includes('postal_code')) {
                        userBuffer.postal_code = component.short_name;
                    }
                }
            } catch (err) {
                _didIteratorError3 = true;
                _iteratorError3 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion3 && _iterator3.return) {
                        _iterator3.return();
                    }
                } finally {
                    if (_didIteratorError3) {
                        throw _iteratorError3;
                    }
                }
            }

            sendMapMessage(recipientId, function () {
                sendMap(recipientId, function () {
                    var messageData = {
                        recipient: {
                            id: recipientId
                        },
                        message: {
                            "text": "Es correcta?",
                            "quick_replies": [{
                                "content_type": "text",
                                "title": "Si",
                                "payload": "ConfirmAddress"
                            }, {
                                "content_type": "text",
                                "title": "No",
                                "payload": "newAddress"
                            }]
                        }
                    };
                    bot.callSendAPI(messageData);
                });
            });
        } else {
            console.log('Geocode not found');
        }
    });
}

function setAddress(recipientId, id) {
    bot.sendTypingOn(recipientId);

    store.dispatch(Actions.setAddress(recipientId, id)).then(function () {
        var address = getData(recipientId, 'address');

        Parse.Cloud.run('getProducts', { businessId: BUSINESS_ID, lat: address.location.lat, lng: address.location.lng }).then(function (result) {
            var pointSale = result.pointSale;

            store.dispatch(Actions.setCustomerPointSale(recipientId, pointSale.id)).then(function () {
                renderAddressConfirmation(recipientId);
            });
        }, function (error) {
            if (error.code == '141') {
                renderAddressOutOfCoverage(recipientId);
            } else {
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
    });
}

function renderAddressOutOfCoverage(recipientId) {
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            "text": "La dirección seleccionada no está dentro de la cobertura de nuestras sedes, por favor intenta con otra dirección"
        }
    };
    bot.sendTypingOff(recipientId);
    bot.callSendAPI(messageData, sendAddressMenu);
}

function renderAddressConfirmation(recipientId) {
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

function renderCategoriesInitialMessage(recipientId) {
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

function sendCategories(recipientId, index) {
    bot.sendTypingOn(recipientId);

    if (index == undefined) index = 0;else if (typeof index == 'string') index = parseInt(index);

    if (index == 0) {
        renderCategoriesInitialMessage(recipientId);
        bot.sendTypingOn(recipientId);
    }

    Parse.Cloud.run('getProducts', { businessId: BUSINESS_ID }).then(function (result) {
        var elements = splitCategories(result.categories, index);
        var idx = Object.keys(result.categories).length;
        var buttons = [];
        var catIni = (index + 1) * bot.limit;
        var catFin = idx > catIni + bot.limit ? catIni + bot.limit : idx;
        /*
        console.log('length: '+idx);
        console.log('catIni: '+catIni);
        console.log('catFin: '+catFin);
        console.log('limitsearchProducts: '+(index+1)*bot.limit);
        */
        if (idx > (index + 1) * bot.limit) {
            buttons.push({
                type: "postback",
                title: "Categorías " + (catIni + 1) + "-" + catFin,
                payload: "SendCategories-" + (index + 1)
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
    }, function (error) {
        console.log('error');
        console.log(error);
    });
}

function splitCategories(categories, index) {
    var idx = 0;
    var elements = [];

    categories.forEach(function (item) {
        //console.log(item.get('name'));
        if (item && item.get('name')) {
            //console.log(elements.length);
            if (idx >= index * bot.limit && idx < (index + 1) * bot.limit) {
                var image = item.get('image');
                var image_url = "http://pro.parse.inoutdelivery.com/parse/files/hSMaiK7EXqDqRVYyY2fjIp4lBweiZnjpEmhH4LpJ/2671158f9c1cb43cac1423101b6e451b_image.txt";
                if (image) {
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
                        payload: "SendProducts-" + item.id + "-" + index
                    }]
                });
            }
            idx = idx + 1;
        }
    });
    return elements;
}

function renderProductsInitialMessage(recipientId, categoryId) {
    return new Parse.Query(ParseModels.Category).get(categoryId).then(function (category) {
        var messageData = {
            recipient: {
                id: recipientId
            },
            message: {
                text: "Tenemos los siguientes " + category.get('name') + ":"
            }
        };
        bot.sendTypingOff(recipientId);
        bot.callSendAPI(messageData);
    }, function (object, error) {
        console.log(error);
        // error is an instance of Parse.Error.
    });
}

function sendProducts(recipientId, category, proIdx) {
    bot.sendTypingOn(recipientId);
    proIdx = parseInt(proIdx);
    if (proIdx == 0) {
        renderProductsInitialMessage(recipientId, category);
        bot.sendTypingOn(recipientId);
    }

    Parse.Cloud.run('getProducts', { businessId: BUSINESS_ID, category: category }).then(function (result) {
        var elements = splitProducts(recipientId, result.products, proIdx);
        var idx = Object.keys(result.products).length;
        var buttons = [];
        var catIni = (proIdx + 1) * bot.limit;
        var catFin = idx > catIni + bot.limit ? catIni + bot.limit : idx;
        /*
        console.log('length: '+idx);
        console.log('catIni: '+catIni);
        console.log('catFin: '+catFin);
        console.log('limit: '+(proIdx+1)*bot.limit);
        */
        if (idx > (proIdx + 1) * bot.limit) {
            buttons.push({
                type: "postback",
                title: "Productos " + (catIni + 1) + "-" + catFin,
                payload: "SendProducts-" + category + "-" + (proIdx + 1)
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
    }, function (error) {
        console.log('error');
        console.log(error);
    });
}

function splitProducts(recipientId, products, proIdx) {
    var customer = getData(recipientId, 'customer');
    var customer_image_url;

    if (typeof customer != 'undefined') {
        customer_image_url = customer.image.url;
    }

    var idx = 0;
    var elements = [];

    products.forEach(function (item) {
        if (item && item.get('name')) {
            if (idx >= proIdx * bot.limit && idx < (proIdx + 1) * bot.limit) {
                var image = item.get('image');
                var image_url = customer_image_url;
                if (image) {
                    image_url = image.url();
                }
                elements.push({
                    title: item.get('name') + ": $" + item.get('priceDefault'),
                    subtitle: item.get('description'),
                    //item_url: "http://www.mycolombianrecipes.com/fruit-cocktail-salpicon-de-frutas",
                    image_url: image_url,
                    buttons: [{
                        type: "postback",
                        title: "Agregar",
                        payload: "AddProduct-" + item.id
                    }]
                });
            }
            idx = idx + 1;
        }
    });
    return elements;
}

function createCart(recipientId) {
    var userData = getData(recipientId);
    Object.assign(userData, { 'cart': { items: new Map() } });
    return userData.cart;
}

function createOrder(recipientId) {
    var userData = getData(recipientId);
    Object.assign(userData, { 'order': new Map() });
    return getData(recipientId, 'order');
}

function addProduct(recipientId, productId) {
    //console.log("Add product: "+productId);
    //console.log("Order.count: "+order.count());
    var product = new ParseModels.Product();
    var userData = getData(recipientId);
    var cart = getData(recipientId, 'cart');

    if (cart == undefined) {
        cart = createCart(recipientId);
    }

    var items = cart.items;

    new Parse.Query(product).get(productId).then(function (product) {
        if (!items.get(productId)) {
            items.set(productId, { quantity: 1, price: product.get('priceDefault') });
        } else {
            items.get(productId).quantity += 1;
        }

        saveCart(recipientId);

        renderAddProductConfirmation(recipientId, productId);
    }, function (object, error) {
        console.log(error);
        // error is an instance of Parse.Error.
    });
}

function saveCart(recipientId) {
    var consumerCart = new ParseModels.Cart();
    var consumer = getData(recipientId, 'consumer');
    var address = getData(recipientId, 'address');
    var cart = getData(recipientId, 'cart');
    var paymentMethod = getData(recipientId, 'paymentMethod');
    var items = [];
    var item;

    var _iteratorNormalCompletion4 = true;
    var _didIteratorError4 = false;
    var _iteratorError4 = undefined;

    try {
        for (var _iterator4 = cart.items[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
            var _step4$value = _slicedToArray(_step4.value, 2);

            var id = _step4$value[0];
            var properties = _step4$value[1];

            //console.log('\n'+id);
            //console.log(properties);

            item = new ParseModels.OrderItem();

            if (properties.hasOwnProperty('id')) {
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
    } catch (err) {
        _didIteratorError4 = true;
        _iteratorError4 = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion4 && _iterator4.return) {
                _iterator4.return();
            }
        } finally {
            if (_didIteratorError4) {
                throw _iteratorError4;
            }
        }
    }

    Parse.Object.saveAll(items, {
        success: function success(result) {
            var itemsPointers = [];
            var _iteratorNormalCompletion5 = true;
            var _didIteratorError5 = false;
            var _iteratorError5 = undefined;

            try {
                for (var _iterator5 = result[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
                    var item = _step5.value;

                    var itemId = item.get('product').objectId;
                    cart.items.get(itemId).id = item.id;

                    itemsPointers.push({ "__type": "Pointer", "className": "OrderItem", "objectId": item.id });
                }

                //console.log(cart.items);
                //console.log(itemsPointers);
            } catch (err) {
                _didIteratorError5 = true;
                _iteratorError5 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion5 && _iterator5.return) {
                        _iterator5.return();
                    }
                } finally {
                    if (_didIteratorError5) {
                        throw _iteratorError5;
                    }
                }
            }

            if (cart.hasOwnProperty('id')) {
                consumerCart.set('id', cart.id);
            }

            if (typeof paymentMethod != 'undefined') {
                consumerCart.set('paymentMethod', paymentMethod.method);
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
                success: function success(result) {
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
                error: function error(user, _error4) {
                    // Execute any logic that should take place if the save fails.
                    // error is a Parse.Error with an error code and message.
                    console.log('Failed to create new object, with error code: ' + _error4.message);
                }
            });
        },
        error: function error(user, _error5) {
            // Execute any logic that should take place if the save fails.
            // error is a Parse.Error with an error code and message.
            console.log('Failed to create new object, with error code: ' + _error5.message);
        }
    });
}

function saveOrder(recipientId) {
    var order = new ParseModels.Order();
    var consumer = getData(recipientId, 'consumer');
    var customer = getData(recipientId, 'customer');
    var cart = getData(recipientId, 'cart');
    var address = getData(recipientId, 'address');
    var paymentMethod = getData(recipientId, 'paymentMethod');
    var pointSale = getData(recipientId, 'pointSale');
    var state0 = orderStates.get('HUIPd800xH');
    var total = 0;

    console.log(consumer);
    console.log(consumer.name);
    console.log(customer);
    console.log(paymentMethod.method);
    console.log(address);
    console.log(state0);
    console.log(cart);
    console.log(pointSale.objectId);

    cart.items.forEach(function (value, key) {
        console.log(value);
        total += value.quantity * value.price;
    });

    order.set('consumer', { __type: 'Pointer', className: 'Consumer', objectId: consumer.objectId });
    order.set('consumerAddress', { __type: 'Pointer', className: 'ConsumerAddress', objectId: address.objectId });
    order.set('pointSale', { __type: 'Pointer', className: 'CustomerPointSale', objectId: pointSale.objectId });
    order.set('state', state0);
    order.set('items', cart.itemsPointers);
    order.set('deliveryCost', 10000);
    order.set('total', total);
    order.set('paymentMethod', paymentMethod.method);
    order.set('name', consumer.name);
    order.set('comment', "Pedido de prueba");

    console.log('Setting Order');

    order.save(undefined, {
        success: function success(result) {
            console.log('Save Order');
            console.log(result);
        },
        error: function error(user, _error6) {
            // Execute any logic that should take place if the save fails.
            // error is a Parse.Error with an error code and message.
            console.log('Failed to create new object, with error code: ' + _error6.message);
            console.log(_error6);
        }
    });
}

function updateCart(recipientId) {
    var consumerCart = new ParseModels.Cart();
    var localCart = getData(recipientId, 'cart');

    new Parse.Query(consumerCart).get(localCart.id).then(function (cart) {
        //console.log('updateCart');
        console.log(cart);
    }, function (object, error) {
        console.log(error);
        // error is an instance of Parse.Error.
    });
}

function renderAddProductConfirmation(recipientId, productId) {
    return new Parse.Query(ParseModels.Product).get(productId).then(function (product) {
        var messageData = {
            recipient: {
                id: recipientId
            },
            message: {
                "text": "El producto " + product.get('name') + " ha sido agregado.\n\nDeseas agregar otro producto o terminar tu pedido?",
                "quick_replies": [{
                    "content_type": "text",
                    "title": "Seguir pidiendo",
                    "payload": "SendCategories-0"
                }, {
                    "content_type": "text",
                    "title": "Ver carrito",
                    "payload": "SendShoppingCart"
                }]
            }
        };
        bot.sendTypingOff(recipientId);
        bot.callSendAPI(messageData);
    }, function (object, error) {
        console.log(error);
        // error is an instance of Parse.Error.
    });
}

function sendPurchaseOptions(recipientId) {
    bot.sendTypingOn(recipientId);
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            "text": "Deseas agregar otro producto o terminar tu pedido?",
            "quick_replies": [{
                "content_type": "text",
                "title": "Seguir pidiendo",
                "payload": "SendCategories-0"
            }, {
                "content_type": "text",
                "title": "Ver carrito",
                "payload": "SendShoppingCart"
            }]
        }
    };
    bot.sendTypingOff(recipientId);
    bot.callSendAPI(messageData);
}

function sendShoppingCart(recipientId) {
    // Generate a random receipt ID as the API requires a unique ID
    var Product = Parse.Object.extend("Product");
    var consumer = getData(recipientId, 'consumer');
    var cart = getData(recipientId, 'cart');
    var address = getData(recipientId, 'address');
    var customer = getData(recipientId, 'customer');
    var customer_image_url;

    if (typeof customer != 'undefined') {
        customer_image_url = customer.image.url;
    }

    if (cart == undefined) {
        cart = createCart(recipientId);
    }

    console.log(cart);

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
    if (orderLimit == 0) {
        renderShoppingCartEmpty(recipientId);
    } else {
        items.forEach(function (value, key) {
            var product = new Parse.Query(Product);

            product.get(key, {
                success: function success(item) {
                    image = item.get('image');
                    image_url = customer_image_url;
                    if (image) {
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
                    total += element['quantity'] * element['price'];

                    ind++;

                    if (ind == orderLimit) {
                        renderShoppingCart(recipientId, cart.id, elements, total);
                    }
                },
                error: function error(_error7) {
                    alert("Error: " + _error7.code + " " + _error7.message);
                }
            });
        });
    }
}

function renderShoppingCartEmpty(recipientId) {
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

function renderShoppingCart(recipientId, cartId, elements, total) {
    //var receiptId = "Order" + Math.floor(Math.random()*1000);
    var address = getData(recipientId, 'address');
    var payment_method = getData(recipientId, 'payment_method');
    var addressData = undefined;

    if (payment_method == undefined) {
        payment_method = { name: 'Sin definir' };
    }

    if (address != undefined) {
        addressData = {
            street_1: address.address,
            street_2: "",
            city: address.city,
            postal_code: address.postalCode,
            state: address.state,
            country: address.countryCode
        };
    }

    authentication(recipientId, function (user) {
        if (user) {
            var messageData = {
                recipient: {
                    id: recipientId
                },
                message: {
                    attachment: {
                        type: "template",
                        payload: {
                            template_type: "receipt",
                            recipient_name: user.get('first_name') + " " + user.get('last_name'),
                            order_number: cartId,
                            currency: "COP",
                            payment_method: payment_method.name,
                            timestamp: Math.trunc(Date.now() / 1000).toString(),
                            elements: elements,
                            address: addressData,
                            summary: {
                                subtotal: total,
                                shipping_cost: 2000.00,
                                //total_tax: 0,
                                total_cost: total + 2000.00
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

function renderShoppingCartConfirmation(recipientId) {
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            "text": "Es correcto, deseas finalizar tu pedido?",
            "quick_replies": [{
                "content_type": "text",
                "title": "Si",
                "payload": "CheckOrder"
            }, {
                "content_type": "text",
                "title": "No",
                "payload": "SendPurchaseOptions"
            }]
        }
    };
    bot.sendTypingOff(recipientId);
    bot.callSendAPI(messageData);
}

function checkOrder(recipientId) {
    checkPayment(recipientId);
}

function checkPayment(recipientId) {
    bot.sendTypingOn(recipientId);
    //ParseModels.PaymentMethod
    store.dispatch(Actions.loadPaymentMethods(recipientId)).then(function () {

        renderCheckPayment(recipientId);
    });
}

function checkAddress(recipientId) {}

function renderCheckPayment(recipientId) {
    var paymentMethods = getData(recipientId, 'paymentMethods');
    var quick_replies = [];

    console.log(paymentMethods);

    for (var i in paymentMethods) {

        quick_replies.push({
            "content_type": "text",
            "title": paymentMethods[i].name.substring(0, 20),
            "payload": "Checkout-" + paymentMethods[i].objectId
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

function checkout(recipientId, id) {
    bot.sendTypingOn(recipientId);
    console.log('checkout');
    console.log(id);

    store.dispatch(Actions.setPaymentMethod(recipientId, id)).then(function () {

        var paymentMethod = getData(recipientId, 'paymentMethod');
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
    });
}

function setPayment(recipientId, id) {}

function renderCash(recipientId) {
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

function renderCreditCard(recipientId) {
    var creditCards = getData(recipientId, 'creditCards');
    var consumer = getData(recipientId, 'consumer');

    if (!_.isEmpty(consumer.user)) {
        store.dispatch(Actions.loadUserCreditCards(recipientId, consumer.user)).then(function () {
            sendRegisteredCreditCards(recipientId);
        });
    }
}

function registerCreditCard(recipientId) {
    bot.sendTypingOn(recipientId);
    var consumer = getData(recipientId, 'consumer');

    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            "attachment": {
                "type": "template",
                "payload": {
                    "template_type": "button",
                    "text": "Por razones de seguidad te vamos a redireccionar a una página web segura para que agregues tu tarjeta y finalizaremos tu pedido.\n\nEstas de acuerdo?",
                    "buttons": [{
                        "type": "web_url",
                        "url": SERVER_URL + "creditcard?id=" + consumer.objectId,
                        "title": "Si"
                    }, {
                        "type": "postback",
                        "title": "No",
                        "payload": "CancelRegisterCreditCard"
                    }]
                }
            }
        }
    };
    bot.sendTypingOff(recipientId);
    bot.callSendAPI(messageData);
}

function cancelRegisterCreditCard(recipientId) {
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

function sendRegisteredCreditCards(recipientId) {
    bot.sendTypingOn(recipientId);
    var consumer = getData(recipientId, 'consumer');

    store.dispatch(Actions.loadUserCreditCards(recipientId, consumer.user)).then(function () {
        var creditCards = getData(recipientId, 'creditCards');
        if (creditCards.length == 0) {
            //saveCart(recipientId);
            renderNoRegisteredCreditCards(recipientId);
        } else {
            renderRegisteredCreditCards(recipientId);
        }
    });
}

function renderNoRegisteredCreditCards(recipientId) {
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            "text": "Aun no tienes tarjetas registradas, deseas registrar una tarjeta?",
            "quick_replies": [{
                "content_type": "text",
                "title": "Si",
                "payload": "RegisterCreditCard"
            }, {
                "content_type": "text",
                "title": "No",
                "payload": "CheckPayment"
            }]
        }
    };

    bot.sendTypingOff(recipientId);
    bot.callSendAPI(messageData);
}

function renderRegisteredCreditCards(recipientId) {
    var creditCards = getData(recipientId, 'creditCards');
    var quick_replies = [];

    quick_replies.push({
        "content_type": "text",
        "title": "Agregar tarjeta",
        "payload": "RegisterCreditCard"
    });

    var _iteratorNormalCompletion6 = true;
    var _didIteratorError6 = false;
    var _iteratorError6 = undefined;

    try {
        for (var _iterator6 = creditCards[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
            var card = _step6.value;

            if (quick_replies.length < bot.limit) {
                quick_replies.push({
                    "content_type": "text",
                    "title": card.type + " xxxx-" + card.lastFour,
                    "payload": "PayWithCreditCard-" + card.lastFour
                });
            }
        }
    } catch (err) {
        _didIteratorError6 = true;
        _iteratorError6 = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion6 && _iterator6.return) {
                _iterator6.return();
            }
        } finally {
            if (_didIteratorError6) {
                throw _iteratorError6;
            }
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

function payWithCreditCard(recipientId, creditCardId) {
    bot.sendTypingOn(recipientId);
    console.log(creditCardId);

    orderConfirmation(recipientId);
}

function orderConfirmation(recipientId) {
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

function orderState(recipientId) {
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

function orderSent(recipientId) {
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

function serviceRating(recipientId) {
    bot.sendTypingOn(recipientId);
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            "text": "Califica tu experiencia para ayudarnos a mejorar. \n\n De 1 a 5 cuantas extrellas merece nuestro servicio?",
            "quick_replies": [{
                "content_type": "text",
                "title": "5 (Excelente)",
                "payload": "SetRating-5"
            }, {
                "content_type": "text",
                "title": "4 (Bien)",
                "payload": "SetRating-4"
            }, {
                "content_type": "text",
                "title": "3 (Regular)",
                "payload": "SetRating-3"
            }, {
                "content_type": "text",
                "title": "2 (Mal)",
                "payload": "SetRating-2"
            }, {
                "content_type": "text",
                "title": "2 (Muy mal)",
                "payload": "SetRating-1"
            }]
        }
    };
    bot.sendTypingOff(recipientId);
    bot.callSendAPI(messageData);
}

function setRating(recipientId, rating) {
    bot.sendTypingOn(recipientId);

    thank(recipientId);
}

function thank(recipientId) {
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

function searchProducts(recipientId, query, index) {
    bot.sendTypingOn(recipientId);

    Parse.Cloud.run('search', { businessId: BUSINESS_ID, q: query }).then(function (result) {
        if (result.length == 0) {
            renderSearchEmpty(recipientId);
        } else {
            if (index == undefined) index = 0;else if (typeof index == 'string') index = parseInt(index);

            if (index == 0) {
                renderSearchInitial(recipientId);
                bot.sendTypingOn(recipientId);
            }

            var elements = splitSearchResult(result, index);
            var idx = Object.keys(result).length;
            var buttons = [];
            var catIni = (index + 1) * bot.limit;
            var catFin = idx > catIni + bot.limit ? catIni + bot.limit : idx;

            if (idx > (index + 1) * bot.limit) {
                buttons.push({
                    type: "postback",
                    title: "Productos " + (catIni + 1) + "-" + catFin,
                    payload: "Search-" + (index + 1)
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
    }, function (error) {
        console.log('error');
        console.log(error);
    });
}

function renderSearchInitial(recipientId) {
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

function renderSearchEmpty(recipientId) {
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

function splitSearchResult(products, index) {
    var idx = 0;
    var elements = [];

    /*
    for(var key in products){
        console.log(products[key])
    }
    */

    products.forEach(function (item) {
        if (item && item.name && item.type == 'Product') {
            //item.id get Product information
            if (idx >= index * bot.limit && idx < (index + 1) * bot.limit) {
                var image = item.image;
                var image_url = "http://pro.parse.inoutdelivery.com/parse/files/hSMaiK7EXqDqRVYyY2fjIp4lBweiZnjpEmhH4LpJ/2671158f9c1cb43cac1423101b6e451b_image.txt";
                if (image) {
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
                        payload: "AddProduct-" + item.id
                    }]
                });
                idx = idx + 1;
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

store.dispatch({ type: types.APP_LOADED });

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

//# sourceMappingURL=app-compiled.js.map