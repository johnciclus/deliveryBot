import { loadUserCreditCards } from '../actions/index';

const CreditCard = Parse.Object.extend('CreditCard', {
    initialize: function (attrs, options) {
    }
}, {
    loadInStore: function(store, recipientId, user){
        return store.dispatch(loadUserCreditCards(recipientId, user.rawParseObject)).fail(error => {
            console.log('Error code: ' + error.message);
        });
    }
});

export default CreditCard
