import { setCustomer, loadCustomer } from '../actions/index';

const Customer = Parse.Object.extend('Customer', {
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
    saveInStore: function(store, recipientId){
        return store.dispatch(setCustomer(recipientId, this)).fail(error => {
            console.log('Error code: ' + error.message);
        });
    }
},  {
    loadInStore: function(store, recipientId, BUSINESS_ID){
        return store.dispatch(loadCustomer(recipientId, BUSINESS_ID))
    }
});

export default Customer