/* @flow */
import Parse from 'parse'
import LatLng from './LatLng'

class ConsumerAddress extends Parse.Object {
  constructor(attributes, options) {
    super('ConsumerAddress', attributes, options);
    if (attributes && attributes.location)  {
      this.location = new LatLng(attributes.location.lat, attributes.location.lat)
    }
  }

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

}

export default ConsumerAddress
