import { setUser } from '../actions/index';

const User = Parse.Object.extend('User', {
    initialize: function (attrs, options) {
        //console.log('new user');
        //console.log();
        //console.log(options);
    },
    signUpWithFacebook: function(data){
        let facebookId = this.get('facebookId');
        return this.signUp(Object.assign(data, {
            username: facebookId.toString(),
            password: facebookId.toString()
        })).fail(error => {
            console.log('Error code: ' + error.message);
        });
    },
    registered: function () {
        return new Parse.Query('User').equalTo('facebookId', this.get('facebookId')).first()
        .fail(error => {
            console.log('Error code: ' + error.message);
        });
    },
    saveInStore: function(store, recipientId){
        return store.dispatch(setUser(recipientId, this)).fail(error => {
            console.log('Error code: ' + error.message);
        });
    }
});

export default User