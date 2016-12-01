/* @flow */
class LatLng {
  constructor(lat, lng) {
    this.lat = lat;
    this.lng = lng;
  }

  lat = 0;
  lng = 0;

  isValid() {
    return (this.lat != null && this.lat !== 0 && this.lng != null && this.lng !== 0)
  }

}

export default LatLng
