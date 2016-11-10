'use strict';Object.defineProperty(exports,"__esModule",{value:true});var _index=require('../actions/index');var Consumer=Parse.Object.extend('Consumer',{initialize:function initialize(attrs,options){/*let user = attrs.user;
        console.log('Consumer user param');
        console.log(user);
        this.set('name', user.get('first_name')+" "+user.get('last_name'));
        this.set('user', {
            __type: "Pointer",
            className: "User",
            objectId: user.id
        });
        console.log(this.get('user'))*/},setUser:function setUser(user){this.set('name',user.get('first_name')+" "+user.get('last_name'));this.set('email',user.get('email'));this.set('user',{__type:"Pointer",className:"_User",objectId:user.id});},setEmail:function setEmail(email){this.set('email',email);this.save();},setPhone:function setPhone(phone){this.set('phone',phone);this.save();},saveInStore:function saveInStore(store,recipientId){return store.dispatch((0,_index.setConsumer)(recipientId,this)).fail(function(error){console.log('Error code: '+error.message);});}},{loadInStore:function loadInStore(store,recipientId,BUSINESS_ID){return store.dispatch((0,_index.loadConsumer)(recipientId,BUSINESS_ID));}});exports.default=Consumer;