'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.consumerAddressesLoaded = consumerAddressesLoaded;

var _actionTypes = require('./constants/actionTypes');

var types = _interopRequireWildcard(_actionTypes);

var _index = require('./actions/index');

var Actions = _interopRequireWildcard(_index);

var _config = require('config');

var _config2 = _interopRequireDefault(_config);

var _request = require('request');

var _request2 = _interopRequireDefault(_request);

var _hashmap = require('hashmap');

var _hashmap2 = _interopRequireDefault(_hashmap);

var _fb = require('fb');

var _fb2 = _interopRequireDefault(_fb);

var _https = require('https');

var _https2 = _interopRequireDefault(_https);

var _underscore = require('underscore');

var _ = _interopRequireWildcard(_underscore);

var _node = require('parse/node');

var _node2 = _interopRequireDefault(_node);

var _bot = require('./bot');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

//GetProductsParams = require('./models/GetProductsParams')

//import * as redux from 'redux'

var ParseModels = require('./ParseModels');
var Consumer = require('./ParseModels').Consumer;
var User = require('./ParseModels').User;
var ConsumerAddress = require('./ParseModels').ConsumerAddress;

var APP_SECRET = process.env.MESSENGER_APP_SECRET ? process.env.MESSENGER_APP_SECRET : _config2.default.get('APP_SECRET');

var PAGE_ACCESS_TOKEN = process.env.MESSENGER_PAGE_ACCESS_TOKEN ? process.env.MESSENGER_PAGE_ACCESS_TOKEN : _config2.default.get('PAGE_ACCESS_TOKEN');

var PARSE_APP_ID = process.env.PARSE_APP_ID ? process.env.PARSE_APP_ID : _config2.default.get('PARSE_APP_ID');

var PARSE_SERVER_URL = process.env.PARSE_SERVER_URL ? process.env.PARSE_SERVER_URL : _config2.default.get('PARSE_SERVER_URL');

var FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID ? process.env.FACEBOOK_APP_ID : _config2.default.get('FACEBOOK_APP_ID');

var REDIRECT_URI = process.env.REDIRECT_URI ? process.env.REDIRECT_URI : _config2.default.get('REDIRECT_URI');

var BUSINESS_ID = process.env.BUSINESS_ID ? process.env.BUSINESS_ID : _config2.default.get('BUSINESS_ID');

var limit = 9;

_node2.default.initialize(PARSE_APP_ID);
_node2.default.serverURL = PARSE_SERVER_URL;

_fb2.default.options({
    appId: FACEBOOK_APP_ID,
    appSecret: APP_SECRET,
    redirectUri: REDIRECT_URI
});

console.log(_fb2.default);

global.Parse = _node2.default;
global.FB = _fb2.default;

//console.log(FB.getLoginUrl({ scope: 'user_about_me' }));

/*
 Parse.FacebookUtils.init({ // this line replaces FB.init({
 appId      : FACEBOOK_APP_ID, // Facebook App ID
 cookie     : true,  // enable cookies to allow Parse to access the session
 xfbml      : true,  // initialize Facebook social plugins on the page
 version    : 'v2.4' // point to the latest Facebook Graph API version
 });
*/

_bot.rules.set('hola', sendMenuMessage);
_bot.rules.set('cuenta', sendBillMessage);

var order = new _hashmap2.default();

function sendMenuMessage(recipientId) {
    console.log('Typing ON');
    (0, _bot.sendTypingOn)(recipientId);

    new _node2.default.Query(User).get('DH6JIZFrGW').then(function (user) {
        var login = Actions.loadConsumer(user, {});
        console.log('user');
        console.log(user);
        console.log('login');
        console.log(login());

        new _node2.default.Query(Consumer).equalTo('user', user).first().then(function (consumer) {
            if (consumer) {
                (0, _request2.default)({
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

function listCategories(recipientId, catIdx) {
    console.log('Typing ON');
    (0, _bot.sendTypingOn)(recipientId);

    _node2.default.Cloud.run('getProducts', { businessId: BUSINESS_ID }).then(function (result) {
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
        (0, _bot.sendTypingOff)(recipientId);
        (0, _bot.callSendAPI)(messageData);
    }, function (error) {});
}

function listProducts(recipientId, category, proIdx) {
    (0, _bot.sendTypingOn)(recipientId);

    _node2.default.Cloud.run('getProducts', { businessId: BUSINESS_ID, category: category }).then(function (result) {

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

        (0, _bot.sendTypingOff)(recipientId);
        (0, _bot.callSendAPI)(messageData);
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
    (0, _bot.sendTypingOn)(recipientId);

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

                    (0, _request2.default)({
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
                            order = new _hashmap2.default();
                            console.log("callSendAPI(messageData)");
                            (0, _bot.sendTypingOff)(recipientId);
                            (0, _bot.callSendAPI)(messageData);
                        }
                    });
                }
            },
            error: function error(_error) {
                alert("Error: " + _error.code + " " + _error.message);
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

        commerce.contains('businessId', BUSINESS_ID);

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

            (0, _bot.sendTypingOff)(recipientId);
            (0, _bot.callSendAPI)(messageData);
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