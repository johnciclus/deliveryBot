import { setUser } from '../actions/index';

const User = Parse.Object.extend('User', {
    initialize: function (attrs, options) {
        //console.log('new user');
        //console.log();
        //console.log(options);
    },
    signUpWithFacebook: function(data){
        let recipientId = this.get('recipientId');
        return this.signUp(Object.assign(data, {
            username: recipientId.toString(),
            password: recipientId.toString(),
            facebookId: recipientId
        })).fail(error => {
            console.log('Error code: ' + error.message);
        });
    },
    registered: function () {
        return new Parse.Query('User').equalTo('facebookId', this.get('recipientId')).first()
        .fail(error => {
            console.log('Error code: ' + error.message);
        });
    },
    saveInStore: function(store){
        return store.dispatch(setUser(this.get('recipientId'), this)).fail(error => {
            console.log('Error code: ' + error.message);
        });
    }
});

export default User