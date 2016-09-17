import * as types from './actionTypes'
import Parse from 'parse/node'
import {app, rules, callSendAPI, sendTypingOn, sendTypingOff} from './server.js';


const
    _ = require('underscore'),
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

const APP_SECRET = (process.env.MESSENGER_APP_SECRET) ? process.env.MESSENGER_APP_SECRET : config.get('APP_SECRET');

const PAGE_ACCESS_TOKEN = (process.env.MESSENGER_PAGE_ACCESS_TOKEN) ? (process.env.MESSENGER_PAGE_ACCESS_TOKEN) : config.get('PAGE_ACCESS_TOKEN');

const PARSE_APP_ID = (process.env.PARSE_APP_ID) ? (process.env.PARSE_APP_ID) : config.get('PARSE_APP_ID');

const PARSE_SERVER_URL = (process.env.PARSE_SERVER_URL) ? (process.env.PARSE_SERVER_URL) : config.get('PARSE_SERVER_URL');

const FACEBOOK_APP_ID = (process.env.FACEBOOK_APP_ID) ? (process.env.FACEBOOK_APP_ID) : config.get('FACEBOOK_APP_ID');

const REDIRECT_URI = (process.env.REDIRECT_URI) ? (process.env.REDIRECT_URI) : config.get('REDIRECT_URI');

const BUSINESSID = (process.env.BUSINESSID) ? (process.env.BUSINESSID) : config.get('BUSINESSID');

const limit = 9;

Parse.initialize(PARSE_APP_ID);
Parse.serverURL = PARSE_SERVER_URL;

FB.options({
    appId:          FACEBOOK_APP_ID,
    appSecret:      APP_SECRET,
    redirectUri:    REDIRECT_URI
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

rules.set('hola', sendMenuMessage);
rules.set('cuenta', sendBillMessage);

var order = new HashMap();

function sendMenuMessage(recipientId) {
    console.log('Typing ON');
    sendTypingOn(recipientId);

    new Parse.Query(User).get('DH6JIZFrGW').then(
        function (user) {
            new Parse.Query(Consumer).equalTo('user', user).first().then(consumer => {
                if (consumer) {
                    console.log('consumer');
                    console.log(consumer);
                    var loadAddress = loadConsumerAddresses(consumer)
                    loadAddress()

                    request({
                        uri: 'https://graph.facebook.com/v2.6/' + recipientId,
                        qs: {access_token: PAGE_ACCESS_TOKEN, fields: 'first_name,last_name,locale,timezone,gender'},
                        method: 'GET'
                    }, renderMenuMessage);
                }
            }).fail(error => {
                console.log(error);
            })
        },
        function (object, error) {
            console.log(error);
            // error is an instance of Parse.Error.
        });
};

function loadConsumerAddresses(consumer){
    if (consumer == null) return
    return dispatch => {
        const query = new Parse.Query(ConsumerAddress).equalTo('consumer', consumer)
        query.find().then(addresses => {
            console.log('addresses');
            console.log(addresses);
            dispatch(consumerAddressesLoaded(addresses))
        }).fail(e => {
            //TODO dispatch action with error
        })
    }
}

/**
 * Facebook Login Success
 */
export function facebookLogin (mainDispatch) {
    return dispatch => {
        Parse.FacebookUtils.logIn(null, {
            success: function(user) {
                if (!user.existed()) {
                    dispatch({type: types.FACEBOOK_REGISTER_SUCCESS})
                } else {
                    dispatch({type: types.FACEBOOK_LOGIN_SUCCESS, data: user})
                }
                mainDispatch(push('/'))
                dispatch(loadConsumer(user, mainDispatch))
            },
            error: function(user, error) {
                alert("Login cancelado.")
            }
        })
    }
}

/**
 * Logout
 */
export function logout(mainDispatch) {
    return dispatch =>{

        if(Parse.User.current()) {
            Parse.User.logOut()
        }

        mainDispatch(push('/'))
        window.location = "/"
        dispatch({type: types.LOGOUT})
    }
}

/**
 * Email Login Action
 */
export function emailLogin(userData, mainDispatch) {
    mainDispatch({type: types.EMAIL_LOGIN})
    return dispatch => {
        Parse.User.logIn(userData.email + BUSINESS_ID, userData.password).then(user => {
            dispatch({
                type: types.EMAIL_LOGIN_SUCCESS,
                data: user
            })
            mainDispatch(push('/'))
            dispatch(loadConsumer(user, mainDispatch))
        }).fail(e => {
            dispatch({
                type: types.EMAIL_LOGIN_ERROR,
                data: e
            })
        })
    }
}

/**
 * Load Consumer of given user
 */
export function loadConsumer(user, mainDispatch) {
    return dispatch => {
        new Parse.Query(Consumer).equalTo('user', user).first().then(consumer => {
            if (consumer) {
                dispatch({type: types.CONSUMER_LOADED, data: {consumer}})
                dispatch(loadConsumerAddresses(consumer))
                dispatch(loadConsumerOrders())
                //mainDispatch(push('/'))
            } else {
                const authData = user.get('authData')
                if (authData && authData.hasOwnProperty('facebook')) {
                    if (FB) {
                        loadFacebookUserData(authData.facebook.access_token, dispatch)
                    }
                }
                dispatch({type: types.CONSUMER_NOT_FOUND, data: {user}})
            }
        }).fail(e => {
            dispatch({type: types.CONSUMER_NOT_FOUND, data: {user}})
        })
    }
}


function listCategories(recipientId, catIdx){
    console.log('Typing ON');
    sendTypingOn(recipientId);

    Parse.Cloud.run('getProducts', { businessId: BUSINESSID }).then(function(result){
            var elements = splitCategories(result.categories, catIdx);
            var idx = Object.keys(result.categories).length;
            var buttons = [];
            var catIni = (catIdx+1)*limit;
            var catFin =  (idx > catIni+limit) ? catIni+limit : idx;

            console.log('length: '+idx);
            console.log('limit: '+(catIdx+1)*limit);

            if(idx > (catIdx+1)*limit){
                buttons.push({
                    type: "postback",
                    title: "Categorias "+(catIni+1)+"-"+catFin,
                    payload: "ListCategories-"+(catIdx+1),
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
            sendTypingOff(recipientId);
            callSendAPI(messageData);

        },
        function(error) {

        });
}

function listProducts(recipientId, category, proIdx){
    sendTypingOn(recipientId);

    Parse.Cloud.run('getProducts', { businessId: BUSINESSID, category: category }).then(function(result) {

            var elements = splitProducts(result.products, proIdx);
            var idx = Object.keys(result.products).length;
            var buttons = [];

            if( idx > (proIdx+1)*limit ){
                buttons.push({
                    type: "postback",
                    title: "Más productos ",
                    payload: "ListProducts-"+category+"-"+(proIdx+1),
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

            sendTypingOff(recipientId);
            callSendAPI(messageData);
        },
        function(error) {

        })
};

function addProduct(id){
    if(!order.get(id)){
        order.set(id, 1);
    }
    else{
        order.set(id, order.get(id)+1);
    }
    console.log("add product: "+id);
    console.log("order.count");
    console.log(order.count());
}

function sendBillMessage(recipientId){
    // Generate a random receipt ID as the API requires a unique ID
    sendTypingOn(recipientId);

    var receiptId = "order" + Math.floor(Math.random()*1000);
    var elements = [];
    var element = {};
    var total = 0;
    var orderLimit = order.count();
    var ind = 0;
    var image;
    var image_url;

    order.forEach(function(value, key){
        var Product = Parse.Object.extend("Product");
        var product = new Parse.Query(Product);
        console.log(key);

        product.get(key, {
            success: function (item) {
                image = item.get('image');
                image_url = "http://pro.parse.inoutdelivery.com/parse/files/hSMaiK7EXqDqRVYyY2fjIp4lBweiZnjpEmhH4LpJ/2671158f9c1cb43cac1423101b6e451b_image.txt"
                if(image){
                    image_url = image.url();
                }

                element = {}
                element['title'] = item.get('name');
                element['subtitle'] = item.get('description');
                element['quantity'] = order.get(key);
                element['price'] = parseInt(item.get('priceDefault'));
                element['currency'] = "COP";
                element['image_url'] = image_url;

                elements.push(element);
                total += element['quantity']*element['price'];

                ind++;

                if(ind == orderLimit){

                    request({
                        uri: 'https://graph.facebook.com/v2.6/'+recipientId,
                        qs: { access_token: PAGE_ACCESS_TOKEN, fields: 'first_name,last_name,locale,timezone,gender' },
                        method: 'GET'

                    }, function (error, response, body) {
                        if (!error && response.statusCode == 200) {
                            var userData = JSON.parse(body);
                            console.log(userData)

                            var messageData = {
                                recipient: {
                                    id: recipientId
                                },
                                message:{
                                    attachment: {
                                        type: "template",
                                        payload: {
                                            template_type: "receipt",
                                            recipient_name: userData.first_name+" "+userData.last_name,
                                            order_number: receiptId,
                                            currency: "COP",
                                            payment_method: "Visa 1234",
                                            timestamp: Math.trunc(Date.now()/1000).toString(),
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
                            order = new HashMap();
                            console.log("callSendAPI(messageData)");
                            sendTypingOff(recipientId);
                            callSendAPI(messageData);

                        }
                    });
                }
            },
            error: function (error) {
                alert("Error: " + error.code + " " + error.message);
            }
        })
    });
}

function splitCategories(categories, catIdx){
    var idx = 0;
    var elements = [];

    categories.forEach(function(item){
        //console.log(item.get('name'));
        if(item && item.get('name')){
            //console.log(elements.length);
            if(idx >= (catIdx)*limit && idx < (catIdx+1)*limit){
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
                        payload: "ListProducts-"+item.id+"-"+catIdx,
                    }]
                })
            }
            idx = idx+1;
        }
    });
    return elements;
}

function splitProducts(products, proIdx){
    var idx = 0;
    var elements = [];

    products.forEach(function(item){
        if(item && item.get('name')){
            if(idx >= (proIdx)*limit && idx < (proIdx+1)*limit){
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
                        payload: "Add-"+item.id,
                    }]
                })
            }
            idx = idx+1;
        }
    });
    return elements;
}

function renderMenuMessage(error, response, body) {
    if (!error && response.statusCode == 200) {
        var pathname = response.request.uri.pathname;
        var recipientId = pathname.split('/').pop();
        var userData = JSON.parse(body);
        var commerce = new Parse.Query(ParseModels.Customer);

        //user.equalTo('authData', {"facebook":        {"access_token":"EAAPK2ME0gLkBAE6HMBKLP2RfquPvCIyaXNuItGYRdBpJNArGCZC9UzITl9ZBB7EKnmuukylXS93yhHOZAUiHjPwGyNBmnb11VPB7kf0Km9o2Gm2hFSJhDmjpZA1bfZCITRQ45OCMVAIWSR3jHIjkg3cze6tSvZBQjKdGkalGA1V7E0npkZAcMPn51z2yLAPJVRzRpbTqNCTtNPIhxpBr7H2","expiration_date":"2016-10-02T15:16:42.000Z","id":"10210218101474882"}})

        commerce.contains('businessId', BUSINESSID);

        commerce.find().then(function(results){
                var currentUser = Parse.User.current();
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
                                    "title":     "Hola "+userData.first_name+", Bienvenido a OXXO. ",
                                    "subtitle":  "Aquí puedes pedir un domicilio, escribe o selecciona alguna de las opciones:",
                                    "image_url": image_url,
                                    "buttons":[
                                        {
                                            "type":"postback",
                                            "title":"Pedir a domicilio",
                                            "payload":"ListCategories-0"
                                        },
                                        {
                                            "type":"postback",
                                            "title":"Pedir para recoger",
                                            "payload":"ListCategories-0"
                                        },
                                        {
                                            "type":"postback",
                                            "title":"Servicio al cliente",
                                            "payload":"ListCategories-0"
                                        }
                                    ]
                                }]
                            }
                        }
                    }
                };

                sendTypingOff(recipientId);
                callSendAPI(messageData);
            },
            function(error) {
                console.log("Lookup failed");
            });
    } else {
        console.error(response.error);
    }
}

/**
 * CONSUMER ADDRESS LOADED action
 */
export function consumerAddressesLoaded(consumerAddresses) {
    return {
        type: types.CONSUMER_ADDRESSES_LOADED,
        data: consumerAddresses
    }
}