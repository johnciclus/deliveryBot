'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _parse = require('parse');

var _parse2 = _interopRequireDefault(_parse);

var _LatLng = require('./LatLng');

var _LatLng2 = _interopRequireDefault(_LatLng);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /* @flow */


var ConsumerAddress = function (_Parse$Object) {
  _inherits(ConsumerAddress, _Parse$Object);

  function ConsumerAddress(attributes, options) {
    _classCallCheck(this, ConsumerAddress);

    var _this = _possibleConstructorReturn(this, (ConsumerAddress.__proto__ || Object.getPrototypeOf(ConsumerAddress)).call(this, 'ConsumerAddress', attributes, options));

    _this.id = '';
    _this.location = new _LatLng2.default(0, 0);
    _this.address = '';
    _this.description = '';
    _this.name = '';
    _this.consumer = {};

    if (attributes && attributes.location) {
      _this.location = new _LatLng2.default(attributes.location.lat, attributes.location.lat);
    }
    return _this;
  }

  _createClass(ConsumerAddress, [{
    key: 'location',
    set: function set(value) {
      this._location = new _LatLng2.default(value.lat, value.lng);
    },
    get: function get() {
      return this._location;
    }
  }]);

  return ConsumerAddress;
}(_parse2.default.Object);

exports.default = ConsumerAddress;