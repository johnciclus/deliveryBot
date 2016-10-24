'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _index = require('../actions/index');

var Consumer = Parse.Object.extend('Consumer', {
    initialize: function initialize(attrs, options) {
        /*var user = attrs.user;
        console.log('Consumer user param');
        console.log(user);
        this.set('name', user.get('first_name')+" "+user.get('last_name'));
        this.set('user', {
            __type: "Pointer",
            className: "User",
            objectId: user.id
        });
        console.log(this.get('user'))*/
    },
    setUser: function setUser(user) {
        this.set('name', user.get('first_name') + " " + user.get('last_name'));
        this.set('user', {
            __type: "Pointer",
            className: "_User",
            objectId: user.id
        });
    },
    saveInStore: function saveInStore(store) {
        return store.dispatch((0, _index.setConsumer)(this.get('recipientId'), this)).fail(function (error) {
            console.log('Error code: ' + error.message);
        });
    }
});

exports.default = Consumer;