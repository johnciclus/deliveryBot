'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

var GetProductsParams = function GetProductsParams(businessId) {
  _classCallCheck(this, GetProductsParams);

  this.businessId = 0;
  this.lat = 0;
  this.lng = 0;
  this.category = '';
  this.pointSale = '';

  this.businessId = businessId;
};

exports.default = GetProductsParams;

//# sourceMappingURL=GetProductsParams-compiled.js.map