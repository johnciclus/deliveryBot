'use strict';

var _ConsumerAddress = require('./models/ConsumerAddress');

var _ConsumerAddress2 = _interopRequireDefault(_ConsumerAddress);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

Parse.Object.registerSubclass('ConsumerAddress', _ConsumerAddress2.default); //import Parse from 'parse'


var User = Parse.Object.extend('User');
var FacebookUser = Parse.Object.extend('FacebookUser');
var Category = Parse.Object.extend('Category');
var Customer = Parse.Object.extend('Customer');
var Cart = Parse.Object.extend('Cart');
var Consumer = Parse.Object.extend('Consumer');
var CustomerPointSale = Parse.Object.extend('CustomerPointSale');
var Modifier = Parse.Object.extend('Modifier');
var ModifierGroup = Parse.Object.extend('ModifierGroup');
var ModifierItem = Parse.Object.extend('ModifierItem');
var Order = Parse.Object.extend('Order');
var OrderItem = Parse.Object.extend('OrderItem');
var OrderItemModifier = Parse.Object.extend('OrderItemModifier');
var OrderItemModifierGroup = Parse.Object.extend('OrderItemModifierGroup');
var Product = Parse.Object.extend('Product');
var PaymentMethod = Parse.Object.extend('PaymentMethod');

module.exports = {
    User: User,
    FacebookUser: FacebookUser,
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