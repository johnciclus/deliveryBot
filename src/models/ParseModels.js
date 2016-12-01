//import Parse from 'parse'
//import ConsumerAddress from './models/ConsumerAddress'

//Parse.Object.registerSubclass('ConsumerAddress', ConsumerAddress);
import Customer from './Customer'
import CustomerPointSale from './CustomerPointSale'
import User from './User'
import Consumer from './Consumer'
import ConsumerAddress from './ConsumerAddress'
import Cart from './Cart'
import Order from './Order'
import CreditCard from './CreditCard'
import Category from './Category'
import Product from './Product'
import Modifier from './Modifier'
import ModifierGroup from './ModifierGroup'
import ModifierItem from './ModifierItem'
import OrderItem from './OrderItem'
import OrderItemModifier from './OrderItemModifier'
import OrderItemModifierGroup from './OrderItemModifierGroup'
import OrderState from './OrderState'
import PaymentMethod from './PaymentMethod'
import PaymentMethodLanguage from './PaymentMethodLanguage'

module.exports = {
    Customer,
    CustomerPointSale,
    User,
    Consumer,
    ConsumerAddress,
    Cart,
    Order,
    CreditCard,
    Category,
    Product,
    Modifier,
    ModifierGroup,
    ModifierItem,
    OrderItem,
    OrderItemModifier,
    OrderItemModifierGroup,
    OrderState,
    PaymentMethod,
    PaymentMethodLanguage,
}