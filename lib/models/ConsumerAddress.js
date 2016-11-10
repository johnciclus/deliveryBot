import { loadConsumerAddresses } from '../actions/index';
import LatLng from './LatLng'

const ConsumerAddress = Parse.Object.extend('ConsumerAddress', {
    initialize: function (attrs, options) {
        /*
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
        * */
    }
}, {
    loadInStore: function(store, recipientId, consumer){
        return store.dispatch(loadConsumerAddresses(recipientId, consumer.rawParseObject))
    }
});

export default ConsumerAddress
