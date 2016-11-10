import { setConsumer, loadConsumer } from '../actions/index';

const Consumer = Parse.Object.extend('Consumer', {
    initialize: function (attrs, options) {

        console.log('attrs');
        console.log(attrs);
        console.log('options');
        console.log(options);
        /*let user = attrs.user;
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
    setUser: function(user){
        this.set('name', user.get('first_name')+" "+user.get('last_name'));
        this.set('email', user.get('email'));
        this.set('user', {
            __type: "Pointer",
            className: "_User",
            objectId: user.id
        });
    },
    setEmail: function(email){
        this.set('email', email);
        this.save()
    },
    setPhone: function(phone){
        this.set('phone', phone);
        this.save()
    },
    saveInStore: function(store, recipientId){
        return store.dispatch(setConsumer(recipientId, this)).fail(error => {
            console.log('Error code: ' + error.message);
        });
    }
},  {
    loadInStore: function(store, recipientId, user){
        return store.dispatch(loadConsumer(recipientId, user)).fail(error => {
            console.log('Error code: ' + error.message);
        });
    }
});

export default Consumer