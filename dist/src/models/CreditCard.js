'use strict';Object.defineProperty(exports,"__esModule",{value:true});var _index=require('../actions/index');var CreditCard=Parse.Object.extend('CreditCard',{initialize:function initialize(attrs,options){}},{loadInStore:function loadInStore(store,recipientId,user){return store.dispatch((0,_index.loadUserCreditCards)(recipientId,user.rawParseObject)).fail(function(error){console.log('Error code: '+error.message);});}});exports.default=CreditCard;
//# sourceMappingURL=CreditCard.js.map