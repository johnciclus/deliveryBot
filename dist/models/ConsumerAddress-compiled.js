'use strict';Object.defineProperty(exports,"__esModule",{value:true});var _index=require('../actions/index');var _LatLng=require('./LatLng');var _LatLng2=_interopRequireDefault(_LatLng);function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj};}var ConsumerAddress=Parse.Object.extend('ConsumerAddress',{initialize:function initialize(attrs,options){/*
         id = '';
         location = new LatLng(0, 0);
         address = '';
         description = '';
         name = '';
         consumer = {};

         set location(value) {
         this._location = new LatLng(value.lat, value.lng)
         }

         get location () { return this._location }

         super('ConsumerAddress', attributes, options);
         if (attributes && attributes.location)  {
         this.location = new LatLng(attributes.location.lat, attributes.location.lat)
         }
        * */}},{loadInStore:function loadInStore(store,recipientId,consumer){return store.dispatch((0,_index.loadConsumerAddresses)(recipientId,consumer.rawParseObject));}});exports.default=ConsumerAddress;//# sourceMappingURL=ConsumerAddress-compiled.js.map