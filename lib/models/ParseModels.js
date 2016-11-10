//import Parse from 'parse'
//import ConsumerAddress from './models/ConsumerAddress'

//Parse.Object.registerSubclass('ConsumerAddress', ConsumerAddress);
import Customer from './Customer'
import User from './User'
import Consumer from './Consumer'
import ConsumerAddress from './ConsumerAddress'
import Cart from './Cart'
import Order from './Order'
import CreditCard from './CreditCard'

const Category = Parse.Object.extend('Category');
const CustomerPointSale = Parse.Object.extend('CustomerPointSale');
const Modifier = Parse.Object.extend('Modifier');
const ModifierGroup = Parse.Object.extend('ModifierGroup');
const ModifierItem = Parse.Object.extend('ModifierItem');
const OrderItem = Parse.Object.extend('OrderItem');
const OrderItemModifier = Parse.Object.extend('OrderItemModifier');
const OrderItemModifierGroup = Parse.Object.extend('OrderItemModifierGroup');
const OrderState = Parse.Object.extend('OrderState');
const Product = Parse.Object.extend('Product');
const PaymentMethod = Parse.Object.extend('PaymentMethod');
const PaymentMethodLanguage = Parse.Object.extend('PaymentMethodLanguage');

module.exports = {
    User,
    Consumer,
    Customer,
    Order,
    Cart,

    Category,
    ConsumerAddress,
    CustomerPointSale,
    CreditCard,
    Modifier,
    ModifierGroup,
    ModifierItem,
    OrderItem,
    OrderItemModifier,
    OrderItemModifierGroup,
    OrderState,
    PaymentMethod,
    PaymentMethodLanguage,
    Product
}