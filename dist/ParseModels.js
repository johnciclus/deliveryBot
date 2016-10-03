'use strict';

//import Parse from 'parse'
//import ConsumerAddress from './models/ConsumerAddress'

//Parse.Object.registerSubclass('ConsumerAddress', ConsumerAddress);

var User = Parse.Object.extend('User');
var FacebookUser = Parse.Object.extend('FacebookUser');
var Category = Parse.Object.extend('Category');
var Customer = Parse.Object.extend('Customer');
var Cart = Parse.Object.extend('Cart');
var Consumer = Parse.Object.extend('Consumer');
var ConsumerAddress = Parse.Object.extend('ConsumerAddress');
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
var PaymentMethodLanguage = Parse.Object.extend('PaymentMethodLanguage');

module.exports = {
    User: User,
    FacebookUser: FacebookUser,
    Cart: Cart,
    Category: Category,
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
    PaymentMethod: PaymentMethod,
    PaymentMethodLanguage: PaymentMethodLanguage,
    Product: Product
};