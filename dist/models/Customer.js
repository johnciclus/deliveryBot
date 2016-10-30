'use strict';Object.defineProperty(exports,"__esModule",{value:true});var _index=require('../actions/index');var Customer=Parse.Object.extend('Customer',{initialize:function initialize(attrs,options){/*let user = attrs.user;
        console.log('Consumer user param');
        console.log(user);
        this.set('name', user.get('first_name')+" "+user.get('last_name'));
        this.set('user', {
            __type: "Pointer",
            className: "User",
            objectId: user.id
        });
        console.log(this.get('user'))*/},saveInStore:function saveInStore(store,recipientId){return store.dispatch((0,_index.setCustomer)(recipientId,this)).fail(function(error){console.log('Error code: '+error.message);});}});exports.default=Consumer;