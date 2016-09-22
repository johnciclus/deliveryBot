'use strict';

var _parse = require('parse');

var _parse2 = _interopRequireDefault(_parse);

var _ConsumerAddress = require('./models/ConsumerAddress');

var _ConsumerAddress2 = _interopRequireDefault(_ConsumerAddress);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_parse2.default.Object.registerSubclass('ConsumerAddress', _ConsumerAddress2.default);

var User = _parse2.default.Object.extend('User');
var Category = _parse2.default.Object.extend('Category');
var Customer = _parse2.default.Object.extend('Customer');
var Cart = _parse2.default.Object.extend('Cart');
var Consumer = _parse2.default.Object.extend('Consumer');
var CustomerPointSale = _parse2.default.Object.extend('CustomerPointSale');
var Modifier = _parse2.default.Object.extend('Modifier');
var ModifierGroup = _parse2.default.Object.extend('ModifierGroup');
var ModifierItem = _parse2.default.Object.extend('ModifierItem');
var Order = _parse2.default.Object.extend('Order');
var OrderItem = _parse2.default.Object.extend('OrderItem');
var OrderItemModifier = _parse2.default.Object.extend('OrderItemModifier');
var OrderItemModifierGroup = _parse2.default.Object.extend('OrderItemModifierGroup');
var Product = _parse2.default.Object.extend('Product');
var PaymentMethod = _parse2.default.Object.extend('PaymentMethod');

module.exports = {
    User: User,
    Cart: Cart,
    Category: Category,
    Consumer: Consumer,
    ConsumerAddress: _ConsumerAddress2.default,
    Customer: Customer,
    CustomerPointSale: CustomerPointSale,
    Modifier: Modifier,
    ModifierGroup: ModifierGroup,
    ModifierItem: ModifierItem,
    Order: Order,
    OrderItem: OrderItem,
    OrderItemModifier: OrderItemModifier,
    OrderItemModifierGroup: OrderItemModifierGroup,
    PaymentMethod: PaymentMethod,
    Product: Product
};