'use strict';

var _extends = Object.assign || function (target) {
    for (var i = 1; i < arguments.length; i++) {
        var source = arguments[i];for (var key in source) {
            if (Object.prototype.hasOwnProperty.call(source, key)) {
                target[key] = source[key];
            }
        }
    }return target;
};

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

var _config = require('config');

var _config2 = _interopRequireDefault(_config);

var _request = require('request');

var _request2 = _interopRequireDefault(_request);

var _hashmap = require('hashmap');

var _hashmap2 = _interopRequireDefault(_hashmap);

var _objectAssign = require('object-assign');

var _objectAssign2 = _interopRequireDefault(_objectAssign);

var _fb = require('fb');

var _fb2 = _interopRequireDefault(_fb);

var _reduxThunk = require('redux-thunk');

var _reduxThunk2 = _interopRequireDefault(_reduxThunk);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

function _interopRequireWildcard(obj) {
    if (obj && obj.__esModule) {
        return obj;
    } else {
        var newObj = {};if (obj != null) {
            for (var key in obj) {
                if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key];
            }
        }newObj.default = obj;return newObj;
    }
}

var APP_SECRET = process.env.MESSENGER_APP_SECRET ? process.env.MESSENGER_APP_SECRET : _config2.default.get('APP_SECRET');

var PAGE_ACCESS_TOKEN = process.env.MESSENGER_PAGE_ACCESS_TOKEN ? process.env.MESSENGER_PAGE_ACCESS_TOKEN : _config2.default.get('PAGE_ACCESS_TOKEN');

var PARSE_APP_ID = process.env.PARSE_APP_ID ? process.env.PARSE_APP_ID : _config2.default.get('PARSE_APP_ID');

var PARSE_SERVER_URL = process.env.PARSE_SERVER_URL ? process.env.PARSE_SERVER_URL : _config2.default.get('PARSE_SERVER_URL');

var PARSE_CLIENT_KEY = process.env.PARSE_CLIENT_KEY ? process.env.PARSE_CLIENT_KEY : _config2.default.get('PARSE_CLIENT_KEY');

var FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID ? process.env.FACEBOOK_APP_ID : _config2.default.get('FACEBOOK_APP_ID');

var REDIRECT_URI = process.env.REDIRECT_URI ? process.env.REDIRECT_URI : _config2.default.get('REDIRECT_URI');

var BUSINESS_ID = process.env.BUSINESS_ID ? process.env.BUSINESS_ID : _config2.default.get('BUSINESS_ID');

_fb2.default.options({
    appId: FACEBOOK_APP_ID,
    appSecret: APP_SECRET,
    redirectUri: REDIRECT_URI
});

bot.rules.set('hola', sendMenu);
bot.rules.set('buenos dias', sendMenu);
bot.rules.set('buenos tardes', sendMenu);
bot.rules.set('pedir domicilio', sendAddressMenu);
bot.rules.set('cuenta', sendShoppingCart);

bot.payloadRules.set('Greeting', sendMenu);
bot.payloadRules.set('SendAddressMenu', sendAddressMenu);
bot.payloadRules.set('SetAddress', setAddress);
bot.payloadRules.set('NewAddress', setLocation);
bot.payloadRules.set('SendCategories', sendCategories);
bot.payloadRules.set('SendProducts', sendProducts);
bot.payloadRules.set('AddProduct', addProduct);
bot.payloadRules.set('SendShoppingCart', sendShoppingCart);
bot.payloadRules.set('SendPurchaseOptions', sendPurchaseOptions);
bot.payloadRules.set('Checkout', checkout);
bot.payloadRules.set('CreditCard', checkCreditCard);
bot.payloadRules.set('RegisterCreditCard', registerCreditCard);
bot.payloadRules.set('ConfirmRegisterCreditCard', confirmRegisterCreditCard);
bot.payloadRules.set('CancelRegisterCreditCard', cancelRegisterCreditCard);
bot.payloadRules.set('PayWithCreditCard', payWithCreditCard);
bot.payloadRules.set('SetRating', setRating);

var initialState = {
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
    var item = void 0;
    switch (action.type) {
        case types.APP_LOADED:
            console.log('Application is running on port', bot.app.get('port'));
            return _extends({}, state);
        case types.CONSUMER_UPDATED:
            return _extends({}, state);
        case types.CONSUMER_LOADED:
            if (state.consumerNotFound) delete state.consumerNotFound;
            var consumer = (0, _ParseUtils.extractParseAttributes)(action.data.consumer);
            //objectAssign(state.consumerAddress, {consumer})
            (0, _objectAssign2.default)(state, { consumer: consumer, currentUser: action.data.user });
            return _extends({}, state);
        case types.CONSUMER_NOT_FOUND:
            (0, _objectAssign2.default)(state, {
                consumerNotFound: true,
                currentUser: action.data.user
            });
            return _extends({}, state);
        case types.CONSUMER_ADDRESSES_LOADED:
            var addresses = action.data.map(function (a) {
                return (0, _ParseUtils.extractParseAttributes)(a);
            });
            (0, _objectAssign2.default)(state, { addresses: addresses });
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
        case types.CUSTOMER_LOADED:
            var customer = (0, _ParseUtils.extractParseAttributes)(action.data.customer);
            (0, _objectAssign2.default)(state, { customer: customer });
            return _extends({}, state);
        case types.RENDER_MENU:
            /*
            console.log('Store');
            console.log(store.getState())
            console.log('Consumer');
            console.log(consumer);*/
            renderMenuMessage();

            /*request({
             uri: 'https://graph.facebook.com/v2.6/' + '1100195690052041',
             qs: {access_token: PAGE_ACCESS_TOKEN, fields: 'first_name,last_name,locale,timezone,gender'},
             method: 'GET'
             }, renderMenuMessage);*/

            return state;
        case types.RENDER_ADDRESS_MENU:

            renderAddressMenuMessage();

            return state;
        default:
            return state;
    }
};

var store = (0, _redux.createStore)(reducer, (0, _redux.applyMiddleware)(_reduxThunk2.default));

store.subscribe(function () {
    return console.log('\n');
} //store.getState())
);

//global.FB = FB;

function authentication(recipientId, callback) {
    var user = undefined;
    new Parse.Query(ParseModels.FacebookUser).equalTo('facebookId', recipientId).first().then(function (facebookUser) {
        if (facebookUser) {
            user = facebookUser;
            if (callback) {
                callback(user);
            }
        } else {
            bot.getFacebookUser(recipientId, function (userData) {
                signup(recipientId, userData, callback);
            });
        }
    }, function (object, error) {
        console.log(error);
    });
}

function signup(facebookId, userData, callback) {
    if (userData) {
        var facebookUser = new ParseModels.FacebookUser();
        facebookUser.save(Object.assign(userData, { facebookId: facebookId }), {
            success: function success(user) {
                sendRegisterFacebookUser(facebookId);
                callback(user);
            },
            error: function error(user, _error) {
                // Execute any logic that should take place if the save fails.
                // error is a Parse.Error with an error code and message.
                console.log('Failed to create new object, with error code: ' + _error.message);
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
    recipientId = parseInt(recipientId);

    authentication(recipientId, function (user) {
        if (user) {
            store.dispatch(Actions.loadConsumer(user)).then(function () {
                renderMenuMessage(recipientId);
            });
        } else {
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

    store.dispatch(Actions.loadCustomer(BUSINESS_ID)).then(function () {});
}

function renderMenuMessage(recipientId) {
    var consumer = store.getState().consumer;
    var customer = store.getState().customer;

    //var currentUser = Parse.User.current();

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
                        "title": "Hola " + consumer.name + ", Bienvenido a OXXO. ",
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
    var consumer = store.getState().consumer;
    if (!_.isEmpty(consumer)) {
        store.dispatch(Actions.loadConsumerAddresses(consumer.rawParseObject)).then(function () {
            renderAddressMenuMessage(recipientId);
        });
    } else {
        store.dispatch(Actions.loadCustomer(BUSINESS_ID)).then(function () {
            new Parse.Query(ParseModels.User).get('y2DqRylTEb').then(function (user) {
                store.dispatch(Actions.loadConsumer(user)).then(function () {
                    renderAddressMenuMessage(recipientId);
                });
            }, function (object, error) {
                console.log(error);
                // error is an instance of Parse.Error.
            });
        });
    }
}

function renderAddressMenuMessage(recipientId) {
    var addresses = store.getState().addresses;

    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            "text": "A cual dirección vas hacer tu pedido?\n\nPuedes escoger entre tus direcciones guardadas o agregar una nueva dirección", //puedes escoger entre tus direcciones almacenadas o registrar una nueva
            "quick_replies": [{
                "content_type": "text",
                "title": "Casa",
                "payload": "SetAddress-Home"
            }, {
                "content_type": "text",
                "title": "Oficina",
                "payload": "SetAddress-Office"
            }, {
                "content_type": "text",
                "title": "Nueva dirección",
                "payload": "NewAddress"
            }]
        }
    };

    bot.sendTypingOff(recipientId);
    bot.callSendAPI(messageData);
}

function setAddress(recipientId, args) {
    bot.sendTypingOn(recipientId);
    renderAddressConfirmation(recipientId);
}

function setLocation(recipientId) {
    bot.sendTypingOff(recipientId);
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            "text": "Por favor confirma el envio de tu dirección actual",
            "quick_replies": [{
                "content_type": "location"
            }]
        }
    };
    bot.callSendAPI(messageData);
}

function renderAddressConfirmation(recipientId) {
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            "text": "Perfecto, ya guardé tu dirección para próximos pedidos"
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

function sendCategories(recipientId, catIdx) {
    bot.sendTypingOn(recipientId);

    if (catIdx == undefined) catIdx = 0;else if (typeof catIdx == 'string') catIdx = parseInt(catIdx);

    if (catIdx == 0) {
        renderCategoriesInitialMessage(recipientId);
        bot.sendTypingOn(recipientId);
    }

    Parse.Cloud.run('getProducts', { businessId: BUSINESS_ID }).then(function (result) {

        var elements = splitCategories(result.categories, catIdx);
        var idx = Object.keys(result.categories).length;
        var buttons = [];
        var catIni = (catIdx + 1) * bot.limit;
        var catFin = idx > catIni + bot.limit ? catIni + bot.limit : idx;
        /*
        console.log('length: '+idx);
        console.log('catIni: '+catIni);
        console.log('catFin: '+catFin);
        console.log('limit: '+(catIdx+1)*bot.limit);
        */
        if (idx > (catIdx + 1) * bot.limit) {
            buttons.push({
                type: "postback",
                title: "Categorias " + (catIni + 1) + "-" + catFin,
                payload: "SendCategories-" + (catIdx + 1)
            });

            elements.push({
                title: "Más categorias ",
                subtitle: "Categorias disponibles",
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
    }, function (error) {});
}

function splitCategories(categories, catIdx) {
    var idx = 0;
    var elements = [];

    categories.forEach(function (item) {
        //console.log(item.get('name'));
        if (item && item.get('name')) {
            //console.log(elements.length);
            if (idx >= catIdx * bot.limit && idx < (catIdx + 1) * bot.limit) {
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
                        payload: "SendProducts-" + item.id + "-" + catIdx
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
        var elements = splitProducts(result.products, proIdx);
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
                title: "Más productos ",
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
    }, function (error) {});
}

function splitProducts(products, proIdx) {
    var idx = 0;
    var elements = [];

    products.forEach(function (item) {
        if (item && item.get('name')) {
            if (idx >= proIdx * bot.limit && idx < (proIdx + 1) * bot.limit) {
                var image = item.get('image');
                var image_url = "http://pro.parse.inoutdelivery.com/parse/files/hSMaiK7EXqDqRVYyY2fjIp4lBweiZnjpEmhH4LpJ/2671158f9c1cb43cac1423101b6e451b_image.txt";
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

function addProduct(recipientId, productId) {
    //console.log("Add product: "+productId);
    //console.log("Order.count: "+order.count());
    if (!order.get(productId)) {
        order.set(productId, 1);
    } else {
        order.set(productId, order.get(productId) + 1);
    }
    renderAddProductConfirmation(recipientId, productId);
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
    bot.sendTypingOn(recipientId);

    var elements = [];
    var element = {};
    var total = 0;
    var orderLimit = order.count();
    var ind = 0;
    var image;
    var image_url;

    console.log('Shopping Cart');

    if (orderLimit == 0) {
        renderShoppingCartEmpty(recipientId);
    } else {
        order.forEach(function (value, key) {
            var Product = Parse.Object.extend("Product");
            var product = new Parse.Query(Product);
            //console.log(key);

            product.get(key, {
                success: function success(item) {
                    image = item.get('image');
                    image_url = "http://pro.parse.inoutdelivery.com/parse/files/hSMaiK7EXqDqRVYyY2fjIp4lBweiZnjpEmhH4LpJ/2671158f9c1cb43cac1423101b6e451b_image.txt";
                    if (image) {
                        image_url = image.url();
                    }

                    element = {};
                    element['title'] = item.get('name');
                    element['subtitle'] = item.get('description');
                    element['quantity'] = order.get(key);
                    element['price'] = parseInt(item.get('priceDefault'));
                    element['currency'] = "COP";
                    element['image_url'] = image_url;

                    elements.push(element);
                    total += element['quantity'] * element['price'];

                    ind++;

                    if (ind == orderLimit) {
                        renderShoppingCart(recipientId, elements, total);
                    }
                },
                error: function error(_error2) {
                    alert("Error: " + _error2.code + " " + _error2.message);
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

function renderShoppingCart(recipientId, elements, total) {
    var receiptId = "order" + Math.floor(Math.random() * 1000);

    (0, _request2.default)({
        uri: 'https://graph.facebook.com/v2.6/' + recipientId,
        qs: { access_token: PAGE_ACCESS_TOKEN, fields: 'first_name,last_name,locale,timezone,gender' },
        method: 'GET'

    }, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var userData = JSON.parse(body);
            //console.log(userData)

            var messageData = {
                recipient: {
                    id: recipientId
                },
                message: {
                    attachment: {
                        type: "template",
                        payload: {
                            template_type: "receipt",
                            recipient_name: userData.first_name + " " + userData.last_name,
                            order_number: receiptId,
                            currency: "COP",
                            payment_method: "Visa 1234",
                            timestamp: Math.trunc(Date.now() / 1000).toString(),
                            elements: elements,
                            address: {
                                street_1: "Carrera x con calle x",
                                street_2: "",
                                city: "Medellin",
                                postal_code: "680001",
                                state: "SA",
                                country: "CO"
                            },
                            summary: {
                                subtotal: total,
                                shipping_cost: 2000.00,
                                total_tax: total * 0.16,
                                total_cost: total * 1.16 + 2000.00
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
            //order = new HashMap();
            //console.log("callSendAPI(messageData)");
            bot.sendTypingOff(recipientId);
            bot.callSendAPI(messageData, renderShoppingCartConfirmation);
            //bot.sendTypingOn(recipientId);
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
                "payload": "Checkout"
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

function checkout(recipientId) {
    bot.sendTypingOn(recipientId);

    renderCheckout(recipientId);
}

function renderCheckout(recipientId) {
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            "text": "Como vas a pagar tu pedido? (Tu pedido se cobra cuando lo recibes)",
            "quick_replies": [{
                "content_type": "text",
                "title": "Tarjeta Online",
                "payload": "CreditCard"
            }, {
                "content_type": "text",
                "title": "PSE",
                "payload": "PSE"
            }, {
                "content_type": "text",
                "title": "Efectivo",
                "payload": "Cash"
            }]
        }
    };
    bot.sendTypingOff(recipientId);
    bot.callSendAPI(messageData);
}

function checkCreditCard(recipientId) {
    bot.sendTypingOn(recipientId);

    renderCreditCard(recipientId);
}

function renderCreditCard(recipientId) {
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
                "payload": "Checkout"
            }]
        }
    };
    bot.sendTypingOff(recipientId);
    bot.callSendAPI(messageData);
}

function registerCreditCard(recipientId) {
    bot.sendTypingOn(recipientId);
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
                        "url": "https://bot.inoutdelivery.com/",
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
    bot.callSendAPI(messageData, confirmRegisterCreditCard);
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
    bot.callSendAPI(messageData, checkout);
}

function confirmRegisterCreditCard(recipientId) {
    bot.sendTypingOn(recipientId);
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            "text": "Con cual tarjeta quieres pagar?",
            "quick_replies": [{
                "content_type": "text",
                "title": "xxxx-xxxx-xxxx-9876",
                "payload": "PayWithCreditCard-9876"
            }, {
                "content_type": "text",
                "title": "Agregar tarjeta",
                "payload": "RegisterCreditCard"
            }]
        }
    };
    bot.sendTypingOff(recipientId);
    bot.callSendAPI(messageData);
}

function payWithCreditCard(recipientId, creditCardId) {
    bot.sendTypingOn(recipientId);

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

var order = new _hashmap2.default();

//# sourceMappingURL=app-compiled.js.map