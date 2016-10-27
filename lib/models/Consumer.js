import { setConsumer } from '../actions/index';

const Consumer = Parse.Object.extend('Consumer', {
    initialize: function (attrs, options) {
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
});

export default Consumer