'use strict';

var _User = require('./User');

var _User2 = _interopRequireDefault(_User);

var _Consumer = require('./Consumer');

var _Consumer2 = _interopRequireDefault(_Consumer);

var _Cart = require('./Cart');

var _Cart2 = _interopRequireDefault(_Cart);

var _Order = require('./Order');

var _Order2 = _interopRequireDefault(_Order);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

//import Parse from 'parse'
//import ConsumerAddress from './models/ConsumerAddress'

//Parse.Object.registerSubclass('ConsumerAddress', ConsumerAddress);
var Category = Parse.Object.extend('Category');
var Customer = Parse.Object.extend('Customer');
var ConsumerAddress = Parse.Object.extend('ConsumerAddress');
var CustomerPointSale = Parse.Object.extend('CustomerPointSale');
var CreditCard = Parse.Object.extend('CreditCard');
var Modifier = Parse.Object.extend('Modifier');
var ModifierGroup = Parse.Object.extend('ModifierGroup');
var ModifierItem = Parse.Object.extend('ModifierItem');
var OrderItem = Parse.Object.extend('OrderItem');
var OrderItemModifier = Parse.Object.extend('OrderItemModifier');
var OrderItemModifierGroup = Parse.Object.extend('OrderItemModifierGroup');
var OrderState = Parse.Object.extend('OrderState');
var Product = Parse.Object.extend('Product');
var PaymentMethod = Parse.Object.extend('PaymentMethod');
var PaymentMethodLanguage = Parse.Object.extend('PaymentMethodLanguage');

module.exports = {
    User: _User2.default,
    Consumer: _Consumer2.default,
    Order: _Order2.default,
    Cart: _Cart2.default,

    Category: Category,
    ConsumerAddress: ConsumerAddress,
    Customer: Customer,
    CustomerPointSale: CustomerPointSale,
    CreditCard: CreditCard,
    Modifier: Modifier,
    ModifierGroup: ModifierGroup,
    ModifierItem: ModifierItem,
    OrderItem: OrderItem,
    OrderItemModifier: OrderItemModifier,
    OrderItemModifierGroup: OrderItemModifierGroup,
    OrderState: OrderState,
    PaymentMethod: PaymentMethod,
    PaymentMethodLanguage: PaymentMethodLanguage,
    Product: Product
};

//# sourceMappingURL=ParseModels-compiled.js.map

//# sourceMappingURL=ParseModels-compiled-compiled.js.map