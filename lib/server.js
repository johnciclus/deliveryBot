import config from 'config';
import Parse from 'parse/node'
import express from 'express';
import path from 'path';
import bodyParser from 'body-parser';
import request from 'request';

const PARSE_APP_ID = (process.env.PARSE_APP_ID) ? (process.env.PARSE_APP_ID) : config.get('PARSE_APP_ID');

const PARSE_SERVER_URL = (process.env.PARSE_SERVER_URL) ? (process.env.PARSE_SERVER_URL) : config.get('PARSE_SERVER_URL');

const SERVER_URL = (process.env.SERVER_URL) ? (process.env.SERVER_URL) : config.get('SERVER_URL');

Parse.initialize(PARSE_APP_ID);
Parse.serverURL = PARSE_SERVER_URL;
global.Parse = Parse;

var app = express();
app.set('port', process.env.PORT || 8000);
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

app.get('/creditcard', function(req, res) {
    res.sendFile(path.join(__dirname+'/views/cardForm.html'));
});

app.post('/registerCreditCard', function (req, res) {
    const User = Parse.Object.extend('User');
    const Consumer = Parse.Object.extend('Consumer');
    var consumerID = req.body['consumerID'];
    var data = req.body;

    new Parse.Query(Consumer).get(consumerID).then(consumer => {
        if(consumer){
            new Parse.Query(User).get(consumer.get('user').id).then(user => {
                var username = user.get('username');
                var recipientId = user.get('facebookId');
                Parse.User.logIn(username, username, {
                    success: function(userData) {
                        var expiry = data['expiry'].replace(/\s+/g,"").split('/');

                        request.post({
                            url: 'https://pro.parse.inoutdelivery.com/parse/functions/addCreditCard',
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

module.exports = {app, Parse};
