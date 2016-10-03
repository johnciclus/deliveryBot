'use strict';

// ParseModels.js

var Parse = require('parse/node');

var User = Parse.Object.extend('User');
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
var PaymentMethod = Parse.Object.extend('PaymentMethod');
var ConsumerAddress = Parse.Object.extend('ConsumerAddress');

module.exports = {
    User: User,
    Cart: Cart,
    Consumer: Consumer,
    ConsumerAddress: ConsumerAddress,
    Customer: Customer,
    CustomerPointSale: CustomerPointSale,
    Modifier: Modifier,
    ModifierGroup: ModifierGroup,
    ModifierItem: ModifierItem,
    Order: Order,
    OrderItem: OrderItem,
    OrderItemModifier: OrderItemModifier,
    OrderItemModifierGroup: OrderItemModifierGroup,
    PaymentMethod: PaymentMethod
};

//# sourceMappingURL=ParseModels-compiled.js.map