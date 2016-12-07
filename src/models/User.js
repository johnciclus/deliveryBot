import { setUser, loadUser } from '../actions/index';
import Consumer from '../models/Consumer';
import rp from 'request-promise';
import config from 'config';

const FACEBOOK_GRAPH = config.get('FACEBOOK_GRAPH');

const User = Parse.Object.extend('User', {
    initialize: function (attrs, options) {
        //console.log('new user');
        //console.log();
        //console.log(options);
    },
    signUpWithFacebookData: function(data){
        let facebookId = this.get('facebookId');
        return this.signUp(Object.assign(data, {
            username: facebookId.toString(),
            password: facebookId.toString()
        })).fail(error => {
            console.log('Error code: ' + error.message);
        });
    },
    registered: function () {
        return new Parse.Query('User').equalTo('facebookId', this.get('facebookId')).first().fail(error => {
            console.log('Error code: ' + error.message);
        });
    },
    createConsumer: function(store, recipientId, senderId, conversationToken){
        let consumer = new Consumer({recipientId: parseInt(recipientId), senderId: parseInt(senderId), conversationToken: conversationToken});
        consumer.setUser(this);
        return consumer.save().then(()=>{
            return consumer.saveInStore(store, recipientId)
        });
    },
    saveInStore: function(store, recipientId){
        return store.dispatch(setUser(recipientId, this)).fail(error => {
            console.log('Error code: ' + error.message);
        });
    }
},  {
    loadInStore: function(store, recipientId){
        return store.dispatch(loadUser(recipientId)).fail(error => {
            console.log('Error code: ' + error.message);
        });
    },
    getFacebookUserData: function(facebookId, conversationToken){
        return rp({
            uri: FACEBOOK_GRAPH + facebookId,
            qs: {access_token: conversationToken, fields: 'first_name,last_name,locale,timezone,gender'},
            method: 'GET'
        }).then( body => {
            return JSON.parse(body);
        }).catch(error =>{
            console.log('error');
            console.log(error);
        });
    },
    createUser: function(store, recipientId, facebookId, conversationToken){
        let user = new User({facebookId: parseInt(facebookId)});
        return User.getFacebookUserData(facebookId, conversationToken).then(data => {
            delete data.id;
            return user.signUpWithFacebookData(data).then(() => {
                return user.saveInStore(store, recipientId)
            });
        });
    }
});

export default User