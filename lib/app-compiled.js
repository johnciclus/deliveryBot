'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.facebookLogin = facebookLogin;
exports.logout = logout;
exports.emailLogin = emailLogin;
exports.loadConsumer = loadConsumer;
exports.consumerAddressesLoaded = consumerAddressesLoaded;

var _actionTypes = require('./actionTypes');

var types = _interopRequireWildcard(_actionTypes);

var _node = require('parse/node');

var _node2 = _interopRequireDefault(_node);

var _server = require('./server.js');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

var _ = require('underscore'),
    config = require('config'),
    https = require('https'),
    request = require('request'),

//requestThen = require('then-request'),
HashMap = require("hashmap"),
    FB = require('fb');
//GetProductsParams = require('./models/GetProductsParams')

var ParseModels = require('./ParseModels');
var Consumer = require('./ParseModels').Consumer;
var User = require('./ParseModels').User;
var ConsumerAddress = require('./ParseModels').ConsumerAddress;

var APP_SECRET = process.env.MESSENGER_APP_SECRET ? process.env.MESSENGER_APP_SECRET : config.get('APP_SECRET');

var PAGE_ACCESS_TOKEN = process.env.MESSENGER_PAGE_ACCESS_TOKEN ? process.env.MESSENGER_PAGE_ACCESS_TOKEN : config.get('PAGE_ACCESS_TOKEN');

var PARSE_APP_ID = process.env.PARSE_APP_ID ? process.env.PARSE_APP_ID : config.get('PARSE_APP_ID');

var PARSE_SERVER_URL = process.env.PARSE_SERVER_URL ? process.env.PARSE_SERVER_URL : config.get('PARSE_SERVER_URL');

var FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID ? process.env.FACEBOOK_APP_ID : config.get('FACEBOOK_APP_ID');

var REDIRECT_URI = process.env.REDIRECT_URI ? process.env.REDIRECT_URI : config.get('REDIRECT_URI');

var BUSINESSID = process.env.BUSINESSID ? process.env.BUSINESSID : config.get('BUSINESSID');

var limit = 9;

_node2.default.initialize(PARSE_APP_ID);
_node2.default.serverURL = PARSE_SERVER_URL;

FB.options({
    appId: FACEBOOK_APP_ID,
    appSecret: APP_SECRET,
    redirectUri: REDIRECT_URI
});

//console.log(FB.getLoginUrl({ scope: 'user_about_me' }));
/*
 Parse.FacebookUtils.init({ // this line replaces FB.init({
 appId      : FACEBOOK_APP_ID, // Facebook App ID
 cookie     : true,  // enable cookies to allow Parse to access the session
 xfbml      : true,  // initialize Facebook social plugins on the page
 version    : 'v2.4' // point to the latest Facebook Graph API version
 });
 */

_server.rules.set('hola', sendMenuMessage);
_server.rules.set('cuenta', sendBillMessage);

var order = new HashMap();

function sendMenuMessage(recipientId) {
    console.log('Typing ON');
    (0, _server.sendTypingOn)(recipientId);

    new _node2.default.Query(User).get('DH6JIZFrGW').then(function (user) {
        new _node2.default.Query(Consumer).equalTo('user', user).first().then(function (consumer) {
            if (consumer) {
                console.log('consumer');
                console.log(consumer);
                var loadAddress = loadConsumerAddresses(consumer);
                loadAddress();

                request({
                    uri: 'https://graph.facebook.com/v2.6/' + recipientId,
                    qs: { access_token: PAGE_ACCESS_TOKEN, fields: 'first_name,last_name,locale,timezone,gender' },
                    method: 'GET'
                }, renderMenuMessage);
            }
        }).fail(function (error) {
            console.log(error);
        });
    }, function (object, error) {
        console.log(error);
        // error is an instance of Parse.Error.
    });
};

function loadConsumerAddresses(consumer) {
    if (consumer == null) return;
    return function (dispatch) {
        var query = new _node2.default.Query(ConsumerAddress).equalTo('consumer', consumer);
        query.find().then(function (addresses) {
            console.log('addresses');
            console.log(addresses);
            dispatch(consumerAddressesLoaded(addresses));
        }).fail(function (e) {
            //TODO dispatch action with error
        });
    };
}

/**
 * Facebook Login Success
 */
function facebookLogin(mainDispatch) {
    return function (dispatch) {
        _node2.default.FacebookUtils.logIn(null, {
            success: function success(user) {
                if (!user.existed()) {
                    dispatch({ type: types.FACEBOOK_REGISTER_SUCCESS });
                } else {
                    dispatch({ type: types.FACEBOOK_LOGIN_SUCCESS, data: user });
                }
                mainDispatch(push('/'));
                dispatch(loadConsumer(user, mainDispatch));
            },
            error: function error(user, _error) {
                alert("Login cancelado.");
            }
        });
    };
}

/**
 * Logout
 */
function logout(mainDispatch) {
    return function (dispatch) {

        if (_node2.default.User.current()) {
            _node2.default.User.logOut();
        }

        mainDispatch(push('/'));
        window.location = "/";
        dispatch({ type: types.LOGOUT });
    };
}

/**
 * Email Login Action
 */
function emailLogin(userData, mainDispatch) {
    mainDispatch({ type: types.EMAIL_LOGIN });
    return function (dispatch) {
        _node2.default.User.logIn(userData.email + BUSINESS_ID, userData.password).then(function (user) {
            dispatch({
                type: types.EMAIL_LOGIN_SUCCESS,
                data: user
            });
            mainDispatch(push('/'));
            dispatch(loadConsumer(user, mainDispatch));
        }).fail(function (e) {
            dispatch({
                type: types.EMAIL_LOGIN_ERROR,
                data: e
            });
        });
    };
}

/**
 * Load Consumer of given user
 */
function loadConsumer(user, mainDispatch) {
    return function (dispatch) {
        new _node2.default.Query(Consumer).equalTo('user', user).first().then(function (consumer) {
            if (consumer) {
                dispatch({ type: types.CONSUMER_LOADED, data: { consumer: consumer } });
                dispatch(loadConsumerAddresses(consumer));
                dispatch(loadConsumerOrders());
                //mainDispatch(push('/'))
            } else {
                var authData = user.get('authData');
                if (authData && authData.hasOwnProperty('facebook')) {
                    if (FB) {
                        loadFacebookUserData(authData.facebook.access_token, dispatch);
                    }
                }
                dispatch({ type: types.CONSUMER_NOT_FOUND, data: { user: user } });
            }
        }).fail(function (e) {
            dispatch({ type: types.CONSUMER_NOT_FOUND, data: { user: user } });
        });
    };
}

function listCategories(recipientId, catIdx) {
    console.log('Typing ON');
    (0, _server.sendTypingOn)(recipientId);

    _node2.default.Cloud.run('getProducts', { businessId: BUSINESSID }).then(function (result) {
        var elements = splitCategories(result.categories, catIdx);
        var idx = Object.keys(result.categories).length;
        var buttons = [];
        var catIni = (catIdx + 1) * limit;
        var catFin = idx > catIni + limit ? catIni + limit : idx;

        console.log('length: ' + idx);
        console.log('limit: ' + (catIdx + 1) * limit);

        if (idx > (catIdx + 1) * limit) {
            buttons.push({
                type: "postback",
                title: "Categorias " + (catIni + 1) + "-" + catFin,
                payload: "ListCategories-" + (catIdx + 1)
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

        console.log('Typing OFF');
        (0, _server.sendTypingOff)(recipientId);
        (0, _server.callSendAPI)(messageData);
    }, function (error) {});
}

function listProducts(recipientId, category, proIdx) {
    (0, _server.sendTypingOn)(recipientId);

    _node2.default.Cloud.run('getProducts', { businessId: BUSINESSID, category: category }).then(function (result) {

        var elements = splitProducts(result.products, proIdx);
        var idx = Object.keys(result.products).length;
        var buttons = [];

        if (idx > (proIdx + 1) * limit) {
            buttons.push({
                type: "postback",
                title: "Más productos ",
                payload: "ListProducts-" + category + "-" + (proIdx + 1)
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

        (0, _server.sendTypingOff)(recipientId);
        (0, _server.callSendAPI)(messageData);
    }, function (error) {});
};

function addProduct(id) {
    if (!order.get(id)) {
        order.set(id, 1);
    } else {
        order.set(id, order.get(id) + 1);
    }
    console.log("add product: " + id);
    console.log("order.count");
    console.log(order.count());
}

function sendBillMessage(recipientId) {
    // Generate a random receipt ID as the API requires a unique ID
    (0, _server.sendTypingOn)(recipientId);

    var receiptId = "order" + Math.floor(Math.random() * 1000);
    var elements = [];
    var element = {};
    var total = 0;
    var orderLimit = order.count();
    var ind = 0;
    var image;
    var image_url;

    order.forEach(function (value, key) {
        var Product = _node2.default.Object.extend("Product");
        var product = new _node2.default.Query(Product);
        console.log(key);

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

                    request({
                        uri: 'https://graph.facebook.com/v2.6/' + recipientId,
                        qs: { access_token: PAGE_ACCESS_TOKEN, fields: 'first_name,last_name,locale,timezone,gender' },
                        method: 'GET'

                    }, function (error, response, body) {
                        if (!error && response.statusCode == 200) {
                            var userData = JSON.parse(body);
                            console.log(userData);

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
                                                city: "Bucaramanga",
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
                            order = new HashMap();
                            console.log("callSendAPI(messageData)");
                            (0, _server.sendTypingOff)(recipientId);
                            (0, _server.callSendAPI)(messageData);
                        }
                    });
                }
            },
            error: function error(_error2) {
                alert("Error: " + _error2.code + " " + _error2.message);
            }
        });
    });
}

function splitCategories(categories, catIdx) {
    var idx = 0;
    var elements = [];

    categories.forEach(function (item) {
        //console.log(item.get('name'));
        if (item && item.get('name')) {
            //console.log(elements.length);
            if (idx >= catIdx * limit && idx < (catIdx + 1) * limit) {
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
                        payload: "ListProducts-" + item.id + "-" + catIdx
                    }]
                });
            }
            idx = idx + 1;
        }
    });
    return elements;
}

function splitProducts(products, proIdx) {
    var idx = 0;
    var elements = [];

    products.forEach(function (item) {
        if (item && item.get('name')) {
            if (idx >= proIdx * limit && idx < (proIdx + 1) * limit) {
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
                        payload: "Add-" + item.id
                    }]
                });
            }
            idx = idx + 1;
        }
    });
    return elements;
}

function renderMenuMessage(error, response, body) {
    if (!error && response.statusCode == 200) {
        var pathname = response.request.uri.pathname;
        var recipientId = pathname.split('/').pop();
        var userData = JSON.parse(body);
        var commerce = new _node2.default.Query(ParseModels.Customer);

        //user.equalTo('authData', {"facebook":        {"access_token":"EAAPK2ME0gLkBAE6HMBKLP2RfquPvCIyaXNuItGYRdBpJNArGCZC9UzITl9ZBB7EKnmuukylXS93yhHOZAUiHjPwGyNBmnb11VPB7kf0Km9o2Gm2hFSJhDmjpZA1bfZCITRQ45OCMVAIWSR3jHIjkg3cze6tSvZBQjKdGkalGA1V7E0npkZAcMPn51z2yLAPJVRzRpbTqNCTtNPIhxpBr7H2","expiration_date":"2016-10-02T15:16:42.000Z","id":"10210218101474882"}})

        commerce.contains('businessId', BUSINESSID);

        commerce.find().then(function (results) {
            var currentUser = _node2.default.User.current();
            var image_url = results[0].get('image').url();

            console.log('data');
            console.log(recipientId);
            console.log(results);
            console.log(image_url);

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
                                "title": "Hola " + userData.first_name + ", Bienvenido a OXXO. ",
                                "subtitle": "Aquí puedes pedir un domicilio, escribe o selecciona alguna de las opciones:",
                                "image_url": image_url,
                                "buttons": [{
                                    "type": "postback",
                                    "title": "Pedir a domicilio",
                                    "payload": "ListCategories-0"
                                }, {
                                    "type": "postback",
                                    "title": "Pedir para recoger",
                                    "payload": "ListCategories-0"
                                }, {
                                    "type": "postback",
                                    "title": "Servicio al cliente",
                                    "payload": "ListCategories-0"
                                }]
                            }]
                        }
                    }
                }
            };

            (0, _server.sendTypingOff)(recipientId);
            (0, _server.callSendAPI)(messageData);
        }, function (error) {
            console.log("Lookup failed");
        });
    } else {
        console.error(response.error);
    }
}

/**
 * CONSUMER ADDRESS LOADED action
 */
function consumerAddressesLoaded(consumerAddresses) {
    return {
        type: types.CONSUMER_ADDRESSES_LOADED,
        data: consumerAddresses
    };
}

//# sourceMappingURL=app-compiled.js.map