"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
    }
  }return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
  };
}();

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

/* @flow */
var LatLng = function () {
  function LatLng(lat, lng) {
    _classCallCheck(this, LatLng);

    this.lat = 0;
    this.lng = 0;

    this.lat = lat;
    this.lng = lng;
  }

  _createClass(LatLng, [{
    key: "isValid",
    value: function isValid() {
      return this.lat != null && this.lat !== 0 && this.lng != null && this.lng !== 0;
    }
  }]);

  return LatLng;
}();

exports.default = LatLng;

//# sourceMappingURL=LatLng-compiled.js.map