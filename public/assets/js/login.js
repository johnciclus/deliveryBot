const request = require('browser-request')
const queryString = require('query-string');

function statusChangeCallback(response) {
    console.log('statusChangeCallback');
    console.log(response);
    // The response object is returned with a status field that lets the
    // app know the current login status of the person.
    // Full docs on the response object can be found in the documentation
    // for FB.getLoginStatus().
    if (response.status === 'connected') {
        // Logged into your app and Facebook.

        var uid = response.authResponse.userID;
        var accessToken = response.authResponse.accessToken;

        MessengerExtensions.getUserID(function success(uids) {
            var psid = uids.psid;

            sendUserData(uid, psid, accessToken, function(){
                MessengerExtensions.requestCloseBrowser(function success() {

                }, function error(err) {

                })
            });
        }, function error(err) {
            var parameters = queryString.parse(location.search);

            sendUserData(uid, parameters.psid, accessToken, function(){
                window.close();
            });
        });

    } else if (response.status === 'not_authorized') {
        // The person is logged into Facebook, but not your app.
        document.getElementById('status').innerHTML = 'Please log ' +
            'into this app.';
    } else {
        // The person is not logged into Facebook, so we're not sure if
        // they are logged into this app or not.
        document.getElementById('status').innerHTML = 'Please log ' +
            'into Facebook.';
    }
}

function sendUserData(uid, psid, accessToken, callback) {

    request({method:'POST', url:'/registerUser', json:{ uid: uid, psid: psid, accessToken: accessToken }}, callback);
}

function checkLoginState() {
    FB.getLoginStatus(function(response) {
        statusChangeCallback(response);
    });
}

window.fbAsyncInit = function() {
    FB.init({
        appId: '351144745234713',
        cookie: true,
        xfbml: true,
        version: 'v2.7'
    });

    FB.getLoginStatus(function(response) {
        statusChangeCallback(response);
    });

};

window.extAsyncInit = function() {

};

(function(d, s, id) {
    var js, fjs = d.getElementsByTagName(s)[0];
    if (d.getElementById(id)) return;
    js = d.createElement(s); js.id = id;
    js.src = "//connect.facebook.net/es_LA/sdk.js#xfbml=1&version=v2.8&appId=351144745234713";
    fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'facebook-jssdk'));

(function(d, s, id){
    var js, fjs = d.getElementsByTagName(s)[0];
    if (d.getElementById(id)) {return;}
    js = d.createElement(s); js.id = id;
    js.src = "//connect.facebook.com/en_US/messenger.Extensions.js";
    fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'Messenger'));

global.checkLoginState = checkLoginState