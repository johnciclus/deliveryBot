'use strict';

var _config = require('config');

var _config2 = _interopRequireDefault(_config);

var _node = require('parse/node');

var _node2 = _interopRequireDefault(_node);

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _bodyParser = require('body-parser');

var _bodyParser2 = _interopRequireDefault(_bodyParser);

var _request = require('request');

var _request2 = _interopRequireDefault(_request);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var PARSE_APP_ID = process.env.PARSE_APP_ID ? process.env.PARSE_APP_ID : _config2.default.get('PARSE_APP_ID');

var PARSE_SERVER_URL = process.env.PARSE_SERVER_URL ? process.env.PARSE_SERVER_URL : _config2.default.get('PARSE_SERVER_URL');

var SERVER_URL = process.env.SERVER_URL ? process.env.SERVER_URL : _config2.default.get('SERVER_URL');

_node2.default.initialize(PARSE_APP_ID);
_node2.default.serverURL = PARSE_SERVER_URL;
global.Parse = _node2.default;

var app = (0, _express2.default)();
app.set('port', process.env.PORT || 8000);
app.set('view engine', 'ejs');
app.use(_bodyParser2.default.urlencoded({ extended: true }));
app.use(_express2.default.static('public'));

app.get('/creditcard', function (req, res) {
    res.sendFile(_path2.default.join(__dirname + '/views/cardForm.html'));
});

app.post('/registerCreditCard', function (req, res) {
    var User = _node2.default.Object.extend('User');
    var Consumer = _node2.default.Object.extend('Consumer');
    var consumerID = req.body['consumerID'];
    var data = req.body;

    new _node2.default.Query(Consumer).get(consumerID).then(function (consumer) {
        if (consumer) {
            new _node2.default.Query(User).get(consumer.get('user').id).then(function (user) {
                var username = user.get('username');
                var recipientId = user.get('facebookId');
                _node2.default.User.logIn(username, username, {
                    success: function success(userData) {
                        var expiry = data['expiry'].replace(/\s+/g, "").split('/');

                        _request2.default.post({
                            url: 'https://pro.parse.inoutdelivery.com/parse/functions/addCreditCard',
                            headers: {
                                'Content-Type': 'text/plain;charset=UTF-8',
                                'X-Parse-Application-Id': PARSE_APP_ID,
                                'X-Parse-Session-Token': userData.getSessionToken()
                            },
                            json: { "number": data['number'].replace(/\s+/g, ""),
                                "verificationNumber": data['CCV'],
                                "expirationMonth": expiry[0],
                                "expirationYear": expiry[1],
                                "holderName": data['first-name'] + ' ' + data['last-name']
                            }
                        }, function callback(error, response, body) {
                            if (!error && response.statusCode == 200) {

                                _request2.default.post({
                                    url: SERVER_URL + 'CreditCardRegistered',
                                    json: { "recipientId": recipientId }
                                });
                            } else {
                                console.log(response.statusCode);
                                console.log('error');
                                console.log(error);
                            }
                        });
                    },
                    error: function error(user, _error) {
                        console.log('error');
                        console.log(_error);
                    }
                });
            });

            res.sendFile(_path2.default.join(__dirname + '/views/cardRegistered.html'));
        }
    }, function (object, error) {
        console.log(error);
    });
});

module.exports = { app: app, Parse: _node2.default };