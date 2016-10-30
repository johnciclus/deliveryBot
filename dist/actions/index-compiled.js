'use strict';Object.defineProperty(exports,"__esModule",{value:true});exports.loadCustomer=loadCustomer;exports.setCustomer=setCustomer;exports.loadUser=loadUser;exports.loadConsumer=loadConsumer;exports.loadConsumerAddresses=loadConsumerAddresses;exports.loadConsumerCreditCards=loadConsumerCreditCards;exports.loadOrders=loadOrders;exports.setAddress=setAddress;exports.loadPaymentMethods=loadPaymentMethods;exports.setPaymentMethod=setPaymentMethod;exports.getConsumerAndAddresses=getConsumerAndAddresses;exports.addressSaved=addressSaved;exports.hideAddressForm=hideAddressForm;exports.addressSaveError=addressSaveError;exports.loadUserCreditCards=loadUserCreditCards;exports.setCustomerPointSale=setCustomerPointSale;exports.setOrder=setOrder;exports.setUser=setUser;exports.setConsumer=setConsumer;exports.setOrderState=setOrderState;exports.setOrders=setOrders;exports.loadConsumerOrders=loadConsumerOrders;exports.loadProducts=loadProducts;exports.filterProductsByCategory=filterProductsByCategory;exports.addProductToCart=addProductToCart;exports.emptyCart=emptyCart;exports.facebookDataLoaded=facebookDataLoaded;exports.createConsumer=createConsumer;exports.updateConsumer=updateConsumer;exports.facebookLogin=facebookLogin;exports.logout=logout;exports.emailLogin=emailLogin;exports.emailRegister=emailRegister;exports.geolocationPositionAcquired=geolocationPositionAcquired;exports.mapAddressChanged=mapAddressChanged;exports.mapBoundsChanged=mapBoundsChanged;exports.addressTextChanged=addressTextChanged;exports.showMapAddress=showMapAddress;exports.hideMapAddress=hideMapAddress;exports.showAddressForm=showAddressForm;exports.consumerAddressChanged=consumerAddressChanged;exports.consumerAddressesLoaded=consumerAddressesLoaded;exports.showAddressList=showAddressList;exports.hideAddressList=hideAddressList;exports.selectPaymentMethod=selectPaymentMethod;exports.createNewAddress=createNewAddress;exports.getGeoLocation=getGeoLocation;exports.createOrder=createOrder;exports.changeCartComment=changeCartComment;exports.showPaymentNotSelectedModal=showPaymentNotSelectedModal;exports.showEmptyCartModal=showEmptyCartModal;exports.closeCartIsEmptyModal=closeCartIsEmptyModal;exports.hidePaymentNotSelectedModal=hidePaymentNotSelectedModal;exports.cartTotalIsBelowMinimumPrice=cartTotalIsBelowMinimumPrice;exports.hideOrderMinimumPriceModal=hideOrderMinimumPriceModal;exports.orderCreated=orderCreated;exports.unsetCurrentOrder=unsetCurrentOrder;exports.setCurrentOrder=setCurrentOrder;exports.loadCart=loadCart;exports.hidePointSaleClosedModal=hidePointSaleClosedModal;exports.showPointSaleClosedModal=showPointSaleClosedModal;exports.hideProfile=hideProfile;exports.showProfile=showProfile;exports.closeOutOfCoverageModal=closeOutOfCoverageModal;exports.showOufOfCoverageModal=showOufOfCoverageModal;exports.removeItem=removeItem;exports.increaseItem=increaseItem;exports.decreaseItem=decreaseItem;exports.toggleCart=toggleCart;exports.rateOrder=rateOrder;exports.showSiteMap=showSiteMap;exports.hideSiteMap=hideSiteMap;exports.hideOutOfCoverageModal=hideOutOfCoverageModal;exports.loadPointSales=loadPointSales;exports.geolocationError=geolocationError;exports.hideAddressSearchModal=hideAddressSearchModal;exports.showAddressSearchModal=showAddressSearchModal;var _actionTypes=require('../constants/actionTypes');var types=_interopRequireWildcard(_actionTypes);var _config=require('config');var _config2=_interopRequireDefault(_config);var _GetProductsParams=require('../models/GetProductsParams');var _GetProductsParams2=_interopRequireDefault(_GetProductsParams);var _ParseModels=require('../models/ParseModels');function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj};}function _interopRequireWildcard(obj){if(obj&&obj.__esModule){return obj;}else{var newObj={};if(obj!=null){for(var key in obj){if(Object.prototype.hasOwnProperty.call(obj,key))newObj[key]=obj[key];}}newObj.default=obj;return newObj;}}var BUSINESS_ID=process.env.BUSINESS_ID?process.env.BUSINESS_ID:_config2.default.get('BUSINESS_ID');//const geocoder = new google.maps.Geocoder()
/**
 * Load Consumer of given user
 *///import Parse from 'parse'
//import { push } from 'react-router-redux'
function loadCustomer(recipientId,businessId){if(businessId==null)return;return function(dispatch){return new Parse.Query(_ParseModels.Customer).contains('businessId',businessId).limit(1).first().then(function(customer){dispatch({type:types.CUSTOMER_LOADED,data:{recipientId:recipientId,customer:customer}});}).fail(function(e){dispatch({type:types.CUSTOMER_NOT_FOUND,data:{recipientId:recipientId,businessId:businessId}});});};}function setCustomer(recipientId,customer){return function(dispatch){return Parse.Promise.as().then(function(){dispatch({type:types.SET_CUSTOMER,data:{recipientId:recipientId,customer:customer}});});};}/**
 * Load Consumer of given user
 */function loadUser(recipientId){return function(dispatch){return new Parse.Query(_ParseModels.User).equalTo('facebookId',recipientId).first().then(function(user){if(user){dispatch({type:types.USER_LOADED,data:{recipientId:recipientId,user:user}});}}).fail(function(e){dispatch({type:types.CONSUMER_NOT_FOUND,data:{user:user}});});};}/**
 * Load Consumer of given user
 */function loadConsumer(recipientId,user){if(user==null)return;return function(dispatch){return new Parse.Query(_ParseModels.Consumer).equalTo('user',user).first().then(function(consumer){if(consumer){dispatch({type:types.CONSUMER_LOADED,data:{recipientId:recipientId,consumer:consumer}});}else{dispatch({type:types.CONSUMER_NOT_FOUND,data:{user:user}});}}).fail(function(e){dispatch({type:types.CONSUMER_NOT_FOUND,data:{user:user}});});};}/**
 * Load Consumer Addresses and dispatch action with the results.
 */function loadConsumerAddresses(recipientId,consumer){if(consumer==null)return;return function(dispatch){return new Parse.Query(_ParseModels.ConsumerAddress).equalTo('consumer',consumer).find().then(function(addresses){dispatch({type:types.CONSUMER_ADDRESSES_LOADED,data:{recipientId:recipientId,addresses:addresses}});}).fail(function(error){console.log('Error '+error);//TODO dispatch action with error
});};}/**
 * Load Consumer Addresses and dispatch action with the results.
 */function loadConsumerCreditCards(recipientId,user){if(consumer==null)return;return function(dispatch){return new Parse.Query(_ParseModels.CreditCard).equalTo('consumer',user).find().then(function(creditCards){dispatch({type:types.CONSUMER_CREDITCARDS_LOADED,data:{recipientId:recipientId,creditCards:creditCards}});}).fail(function(error){console.log('Error '+error);//TODO dispatch action with error
});};}function loadOrders(recipientId,orders){if(orders==undefined)return;return function(dispatch){};}/**
 * SET_CURRENT_ADDRESS action
 */function setAddress(recipientId,id){return function(dispatch){return new Parse.Query(_ParseModels.ConsumerAddress).get(id).then(function(address){dispatch({type:types.SET_CURRENT_ADDRESS,data:{recipientId:recipientId,address:address}});}).fail(function(error){console.log('Error '+error);//TODO dispatch action with error
});};}/**
 * Load Payment Methods.
 */function loadPaymentMethods(recipientId){return function(dispatch){return new Parse.Cloud.run('paymentMethods',{languageCode:'es'//businessId: BUSINESS_ID
}).then(function(paymentMethods){dispatch({type:types.PAYMENT_METHODS_LOADED,data:{recipientId:recipientId,paymentMethods:paymentMethods}});});};}function setPaymentMethod(recipientId,id){return function(dispatch){return new Parse.Query(_ParseModels.PaymentMethodLanguage).get(id).then(function(paymentMethod){dispatch({type:types.SET_PAYMENT_METHOD,data:{recipientId:recipientId,paymentMethod:paymentMethod}});}).fail(function(error){console.log('Error '+error);//TODO dispatch action with error
});};}function getConsumerAndAddresses(user){return function(dispatch,getState){return dispatch(recipientId,loadConsumer(user)).then(function(){return dispatch(loadConsumerAddresses(getState().consumer.rawParseObject));});};}/**
 * Address Saved
 */function addressSaved(address){return{type:types.ADDRESS_SAVED,data:address};}/**
 * HIDE_ADDRESS_FORM action
 */function hideAddressForm(){return{type:types.HIDE_ADDRESS_FORM};}/**
 * Address Saved Error
 */function addressSaveError(){return{type:types.ADDRESS_SAVE_ERROR};}/**
 * Save ConsumerAddress on Parse.
 */function saveConsumerAddress(consumerAddress,dispatch,pendingOrder,cart){var ConsumerAddress=Parse.Object.extend('ConsumerAddress');var parseConsumerAddress=new ConsumerAddress();if(!consumerAddress.consumer){return;}if(consumerAddress.objectId){parseConsumerAddress.objectId=consumerAddress.objectId;}var consumer=consumerAddress.consumer.rawParseObject;var location=consumerAddress.location;var parseGeoPoint=new Parse.GeoPoint(location.lat,location.lng);parseConsumerAddress.set('location',parseGeoPoint);parseConsumerAddress.set('consumer',consumer);parseConsumerAddress.set('address',consumerAddress.address);parseConsumerAddress.set('name',consumerAddress.name);parseConsumerAddress.set('description',consumerAddress.description);parseConsumerAddress.save().then(function(consumerAddress){dispatch(addressSaved(consumerAddress));dispatch(loadConsumerAddresses(consumer,dispatch));dispatch(hideAddressForm());}).fail(function(e){dispatch(addressSaveError());});}function loadUserCreditCards(recipientId,user){if(user==null)return;return function(dispatch){return new Parse.Query(_ParseModels.CreditCard).equalTo('user',user).find().then(function(creditCards){dispatch({type:types.USER_CREDITCARDS_LOADED,data:{recipientId:recipientId,creditCards:creditCards}});}).fail(function(error){console.log('Error '+error);//TODO dispatch action with error
});};}function setCustomerPointSale(recipientId,id){return function(dispatch){return new Parse.Query(_ParseModels.CustomerPointSale).get(id).then(function(pointSale){dispatch({type:types.SET_CUSTOMER_POINT_SALE,data:{recipientId:recipientId,pointSale:pointSale}});}).fail(function(error){console.log('Error '+error);//TODO dispatch action with error
});};}function setOrder(recipientId,order){return function(dispatch){return Parse.Promise.as().then(function(){dispatch({type:types.SET_ORDER,data:{recipientId:recipientId,order:order}});});};}function setUser(recipientId,user){return function(dispatch){return Parse.Promise.as().then(function(){dispatch({type:types.SET_USER,data:{recipientId:recipientId,user:user}});});};}function setConsumer(recipientId,consumer){return function(dispatch){return Parse.Promise.as().then(function(){dispatch({type:types.SET_CONSUMER,data:{recipientId:recipientId,consumer:consumer}});});};}function setOrderState(recipientId,orderState){return function(dispatch){return Parse.Promise.as().then(function(){dispatch({type:types.SET_ORDER_STATE,data:{recipientId:recipientId,orderState:orderState}});});};}function setOrders(recipientId,orders){return function(dispatch){return Parse.Promise.as().then(function(){dispatch({type:types.SET_ORDERS,data:{recipientId:recipientId,orders:orders}});});};}/**
 * Load Orders from Parse calling 'orders' cloud function.
 * It will dispatch CONSUMER_ORDERS_LOADED with ongoing and delivered orders.
 */function loadConsumerOrders(recipientId,consumer){if(consumer==null)return;return function(dispatch){/*
        return Parse.Cloud.run('orders').then((orders) => {
            console.log(orders);
        })
        */return new Parse.Query(_ParseModels.Order).equalTo('consumer',consumer).find().then(function(orders){console.log(orders);dispatch({type:types.CONSUMER_ORDERS_LOADED,data:{recipientId:recipientId,orders:orders}});}).fail(function(error){console.log('Error '+error);});};/*return dispatch => {
    Parse.Cloud.run('orders', { businessId: BUSINESS_ID }).then(orders => {
      dispatch({
        type: types.CONSUMER_ORDERS_LOADED,
        data: orders
      })

       const ordersObjectId = orders.ongoing.map(o => o.id)
       const ordersQuery = new Parse.Query(Order)
       ordersQuery.containedIn('objectId', ordersObjectId)
       ordersQuery.find().then(function (o) { console.log(o) })
       const subscription = ordersQuery.subscribe()
       subscription.on('open', () => { console.log('Opened') })
       subscription.on('create', () => { console.log('created', arguments) })
       subscription.on('enter', () => { console.log('entered', arguments) })
       subscription.on('leave', () => { console.log('left', arguments) })
       subscription.on('update', (orders) => {
       console.log('Orders Updated', orders)
       dispatch({
       type: types.CONSUMER_ORDERS_LOADED,
       data: orders
       })
       })
    }).fail(e => {
    })
  }*/}/**
* Load products from Parse.
*/function loadProducts(lat,lng,category,pointSale){return function(dispatch,getState){var params=new _GetProductsParams2.default(BUSINESS_ID);if(lat&&lng){params.lat=lat;params.lng=lng;}var currentCategory=getState().routing.locationBeforeTransitions.query.category;if(category){params.category=category;}else if(currentCategory){params.category=currentCategory;}if(pointSale){params.pointSale=pointSale;}dispatch({type:types.LOADING_PRODUCTS});Parse.Cloud.run('getProducts',params).then(function(results){dispatch({type:types.PRODUCTS_LOADED,data:results});}).fail(function(e){dispatch({type:types.PRODUCTS_LOAD_ERROR});try{if(e.message.code===1001){dispatch({type:types.OUT_OF_COVERAGE,data:{lat:lat,lng:lng}});dispatch(loadPointSales());}}catch(e){}});};}/**
* Filter products by given category
*/function filterProductsByCategory(category){return{type:types.FILTER_PRODUCTS_BY_CATEGORY,data:category};}/**
* Add Product to cart action
*/function addProductToCart(cartItem){return function(dispatch,getState){var _getState=getState();var cart=_getState.cart;if(cart.consumerAddress.location.isValid()){dispatch({type:types.ADD_TO_CART,data:cartItem});}else{dispatch(showAddressSearchModal());}};}/**
* Empty cart action
*/function emptyCart(){return{type:types.EMPTY_CART};}/**
* Load User's Facebook data.
*/function loadFacebookUserData(accessToken,dispatch){FB.api('/me',{fields:'email, first_name, last_name',access_token:accessToken},function(res){if(!res.error){dispatch(facebookDataLoaded(res));}else{//TODO dispatch error event
}});}/**
* Facebook Data Loaded
*/function facebookDataLoaded(data){return{type:types.FACEBOOK_USER_DATA_LOADED,data:data};}/**
* Create Consumer
*/function createConsumer(consumerData,mainDispatch){return function(dispatch){var consumer=new _ParseModels.Consumer();consumer.save(consumerData).then(function(consumer){dispatch({type:types.CONSUMER_CREATED,data:{user:consumerData.user,consumer:consumer}});dispatch({type:types.CONSUMER_LOADED,data:{consumer:consumer}});mainDispatch(push('/'));}).fail(function(e){dispatch({type:types.CONSUMER_NOT_FOUND,data:{user:consumerData.user}});});};}/**
* Update Consumer.
* Update consumer's user in success callback.
* It only dispatches CONSUMER_UPDATED if Consumer and ParseUser were
* saved successfully.
*/function updateConsumer(consumerData){return function(dispatch){dispatch({type:types.UPDATE_CONSUMER,data:consumerData});var consumer=new _ParseModels.Consumer();consumer.objectId=consumerData.objectId;consumer.save(consumerData).then(function(consumer){var username=consumer.get('email')+BUSINESS_ID;consumer.get('user').save({username:username}).then(function(u){dispatch({type:types.CONSUMER_UPDATED,data:{consumer:consumer}});dispatch({type:types.HIDE_PROFILE});}).fail(function(e){dispatch({type:types.CONSUMER_UPDATE_ERROR,data:{consumer:consumer}});});}).fail(function(e){dispatch({type:types.CONSUMER_UPDATE_ERROR,data:{consumer:consumer}});});};}/**
* Facebook Login Success
*/function facebookLogin(mainDispatch){return function(dispatch){Parse.FacebookUtils.logIn(null,{success:function success(user){if(!user.existed()){dispatch({type:types.FACEBOOK_REGISTER_SUCCESS});}else{dispatch({type:types.FACEBOOK_LOGIN_SUCCESS,data:user});}mainDispatch(push('/'));dispatch(loadConsumer(user,mainDispatch));},error:function error(user,_error){alert("Login cancelado.");}});};}/**
* Logout
*/function logout(mainDispatch){return function(dispatch){if(Parse.User.current()){Parse.User.logOut();}mainDispatch(push('/'));window.location="/";dispatch({type:types.LOGOUT});};}/**
* Email Login Action
*/function emailLogin(userData,mainDispatch){mainDispatch({type:types.EMAIL_LOGIN});return function(dispatch){Parse.User.logIn(userData.email+BUSINESS_ID,userData.password).then(function(user){dispatch({type:types.EMAIL_LOGIN_SUCCESS,data:user});mainDispatch(push('/'));dispatch(loadConsumer(user,mainDispatch));}).fail(function(e){dispatch({type:types.EMAIL_LOGIN_ERROR,data:e});});};}/**
* Email Login Action
*/function emailRegister(userData,mainDispatch){mainDispatch({type:types.EMAIL_REGISTER});return function(dispatch){Parse.User.signUp(userData.email+BUSINESS_ID,userData.password).then(function(user){dispatch({type:types.EMAIL_REGISTER_SUCCESS,data:{user:user,userData:userData}});delete userData.password;delete userData.passwordConfirmation;userData.user=user;dispatch(createConsumer(userData,mainDispatch));}).fail(function(e){dispatch({type:types.EMAIL_REGISTER_ERROR,data:e});});};}/**
* Geolocation Position Acquired action.
*/function geolocationPositionAcquired(ll,mainDispatch){geocodeLocation(ll,mainDispatch,true);return{type:types.GEOLOCATION_POSITION_ACQUIRED,data:ll};}/**
* Map Address Changed
*/function mapAddressChanged(address){return{type:types.MAP_ADDRESS_CHANGED,data:address};}/**
* Geocode Given Location and dispatch MAP_ADDRESS_CHANGED action.
*/function geocodeLocation(location,mainDispatch,fromGeoLocation){geocoder.geocode({location:location},function(results,status){if(status==="OK"){var place=results[0];var address={};var isBetweenAddress=-1;isBetweenAddress=place.formatted_address.indexOf(" a ");if(isBetweenAddress===-1){address.address=place.formatted_address;}else{var street=place.formatted_address.substr(0,isBetweenAddress);var city="";place.address_components.forEach(function(component){if(component.types.indexOf("locality")!==-1)city=component.short_name;});address.address=street+", "+city;}address.location={lat:place.geometry.location.lat(),lng:place.geometry.location.lng()};address.fromGeoLocation=fromGeoLocation;mainDispatch(mapAddressChanged(address));}});}/**
* Map Location Changed, geocode and send MAP_ADDRESS_CHANGED with geocoded result
*/function mapBoundsChanged(mapBounds,mainDispatch){mainDispatch({type:types.MAP_BOUNDS_CHANGED,data:mapBounds.bounds});return function(dispatch){geocodeLocation(mapBounds.center,mainDispatch);};}/**
* Address Text Changed
*/function addressTextChanged(address){return{type:types.ADDRESS_TEXT_CHANGED,data:address};}/**
* SHOW_MAP_ADDRESS action
*/function showMapAddress(){return{type:types.SHOW_MAP_ADDRESS};}/**
* HIDE_MAP_ADDRESS action
*/function hideMapAddress(){return{type:types.HIDE_MAP_ADDRESS};}/**
* SHOW_ADDRESS_FORM action
*/function showAddressForm(){return{type:types.SHOW_ADDRESS_FORM};}/**
* CONSUMER_ADDRESS_CHANGED action
*/function consumerAddressChanged(consumerAddress,dispatch,pendingOrder,cart){saveConsumerAddress(consumerAddress,dispatch,pendingOrder,cart);return{type:types.CONSUMER_ADDRESS_CHANGED,data:consumerAddress};}/**
* CONSUMER ADDRESS LOADED action
*/function consumerAddressesLoaded(consumerAddresses){return{type:types.CONSUMER_ADDRESSES_LOADED,data:consumerAddresses};}/**
* SHOW_ADDRESS_LIST action
*/function showAddressList(){return{type:types.SHOW_ADDRESS_LIST};}/**
* HIDE_ADDRESS_LIST action
*/function hideAddressList(){return{type:types.HIDE_ADDRESS_LIST};}/**
* Select Payment Method action
*/function selectPaymentMethod(paymentMethod){return{type:types.SELECT_PAYMENT_METHOD,data:paymentMethod};}/**
* Create New Address action
*/function createNewAddress(){return{type:types.CREATE_NEW_ADDRESS};}/**
* Get Geolocation
*/function getGeoLocation(dispatch){if("geolocation"in navigator){navigator.geolocation.getCurrentPosition(function(position){var ll={lat:position.coords.latitude,lng:position.coords.longitude};dispatch(geolocationPositionAcquired(ll,dispatch));});}}/**
* Convert Cart to Order
*/function cartToOrder(cart,items){return{items:items,comment:cart.comment,consumer:cart.consumer.rawParseObject,pointSale:cart.pointSale.rawParseObject,paymentMethod:cart.paymentMethod,consumerAddress:cart.consumerAddress.rawParseObject,total:cart.total,deliveryCost:cart.pointSale.deliveryCost,email:cart.consumer.email,name:cart.consumer.name,phone:cart.consumer.phone};}/**
* Create Order Action
*/function createOrder(cart,mainDispatch){mainDispatch(push('/'));mainDispatch({type:types.CREATE_ORDER});var consumer=cart.consumerAddress.consumer;//Go to Login route if cart has no consumer
if(!consumer.objectId){mainDispatch({type:types.HIDE_CART});mainDispatch({type:types.CREATE_ORDER_ERROR});return mainDispatch(push('/login'));}//Check that cart has at least 1 item.
if(cart.items.length===0){mainDispatch({type:types.CREATE_ORDER_ERROR});return mainDispatch(showEmptyCartModal());}//If payment method isn't set, dispatch action to show payment method modal
if(!cart.paymentMethod){mainDispatch({type:types.CREATE_ORDER_ERROR});return mainDispatch(showPaymentNotSelectedModal());}//If cart total price is below point of sale minimum price dispatch action
//to show minimum price modal
if(cart.total<cart.pointSale.minOrderPrice){mainDispatch({type:types.CREATE_ORDER_ERROR});return mainDispatch(cartTotalIsBelowMinimumPrice());}//If cart hasn't consumer address show list of address.
if(!cart.consumerAddress.objectId){mainDispatch({type:types.CREATE_ORDER_ERROR});return mainDispatch(showAddressList());}//Check if Point of Sale is open
if(!cart.pointSaleIsOpen){mainDispatch({type:types.CREATE_ORDER_ERROR});return mainDispatch(showPointSaleClosedModal());}//Check if is inside coverage
if(cart.outOfCoverage){mainDispatch({type:types.CREATE_ORDER_ERROR});return mainDispatch(showOufOfCoverageModal());}var items=[];cart.items.forEach(function(item){var orderItem=new _ParseModels.OrderItem();orderItem.set('modifiers',[]);orderItem.set('modifiersGroups',[]);orderItem.set('product',item.product.rawParseObject);orderItem.set('amount',item.amount);orderItem.set('price',item.price);//Set OrderItemModifiers
item.modifiers.forEach(function(modifierItem){var m=new _ParseModels.Modifier();m.id=modifierItem.modifier.objectId;var i=new _ParseModels.ModifierItem();i.id=modifierItem.modifierItem.objectId;var orderItemModifier=new _ParseModels.OrderItemModifier({modifier:m,modifierItem:i,price:modifierItem.price});orderItem.add('modifiers',orderItemModifier);});//Set Modifiers Group
item.modifiersGroups.forEach(function(modifierGroupItem){var g=new _ParseModels.ModifierGroup();g.id=modifierGroupItem.group.objectId;var orderItemModifierGroup=new _ParseModels.OrderItemModifierGroup({group:g,items:[]});modifierGroupItem.items.forEach(function(modifierItem){var m=new _ParseModels.Modifier();m.id=modifierItem.modifier.objectId;var i=new _ParseModels.ModifierItem();i.id=modifierItem.modifierItem.objectId;orderItemModifierGroup.add('items',new _ParseModels.OrderItemModifier({modifier:m,modifierItem:i,price:modifierItem.price}));});orderItem.add('modifiersGroups',orderItemModifierGroup);});items.push(orderItem);});var newOrder=new _ParseModels.Order();newOrder.set(cartToOrder(cart,items));Parse.Object.saveAll(items).then(function(){return newOrder.save();}).then(function(order){mainDispatch({type:types.ORDER_CREATED,data:order});mainDispatch(emptyCart());mainDispatch(loadConsumerOrders());mainDispatch(toggleCart(false));}).fail(function(e){alert('Hubo un error al crear su pedido, por favor intenta nuevamente.');});}/**
* Change Cart Comment Action
*/function changeCartComment(comment){return{type:types.CHANGE_CART_COMMENT,data:comment};}/**
* Show Payment not selected Modal action
*/function showPaymentNotSelectedModal(){return{type:types.PAYMENT_NOT_SELECTED};}/**
* Show Cart is Empty Modal
*/function showEmptyCartModal(){return{type:types.SHOW_EMPTY_CART_MODAL};}/**
* Hide Cart is Empty Modal
*/function closeCartIsEmptyModal(){return{type:types.HIDE_EMPTY_CART_MODAL};}/**
* Hide Payment not selected Modal action
*/function hidePaymentNotSelectedModal(){return{type:types.PAYMENT_SELECTED};}/**
* Action to show cart minimum price modal
*/function cartTotalIsBelowMinimumPrice(){return{type:types.CART_TOTAL_IS_BELOW_MIN_PRICE};}/**
* Action to hide cart minimum price modal
*/function hideOrderMinimumPriceModal(){return{type:types.CART_TOTAL_IS_ABOVE_MIN_PRICE};}/**
* Order Created Action
*/function orderCreated(order){return{type:types.ORDER_CREATED,data:order};}function unsetCurrentOrder(){return{type:types.UNSET_CURRENT_ORDER};}/**
* Set current order action
*/function setCurrentOrder(order){return{type:types.SET_CURRENT_ORDER,data:order};}/**
* Load Cart by Id.
*/function loadCart(cartId){return{type:'NOTHING'};/* * /
  //Disabled due to malfunction.
  return dispatch => {
    new Parse.Query(Cart).include(["consumer", "pointSale",
        "consumerAddress.consumer", "items.product",
        "items.modifiers.modifier.items", "items.modifiers.modifierItem",
        "items.modifiersGroups.group.modifiers.items",
        "items.modifiersGroups.items.modifier.items",
        "items.modifiersGroups.items.modifierItem"
      ]).get(cartId).then(cart => {dispatch({
        type: types.CART_LOADED,
        data: cart
      })
    })
  }
  /* */}/**
* Close Point Sale Closed Modal
*/function hidePointSaleClosedModal(){return{type:types.HIDE_POINT_SALE_CLOSED_MODAL};}/**
* Open Point Sale Closed Modal
*/function showPointSaleClosedModal(){return{type:types.SHOW_POINT_SALE_CLOSED_MODAL};}function hideProfile(){return{type:types.HIDE_PROFILE};}function showProfile(){return{type:types.SHOW_PROFILE};}function closeOutOfCoverageModal(){return{type:types.HIDE_OUT_OF_COVERAGE_MODAL};}function showOufOfCoverageModal(){return{type:types.SHOW_OUT_OF_COVERAGE_MODAL};}function removeItem(item){return{type:types.CART_ITEM_REMOVE,data:item};}function increaseItem(item){return{type:types.CART_ITEM_INCREASE_AMOUNT,data:item};}function decreaseItem(item){return{type:types.CART_ITEM_DECREASE_AMOUNT,data:item};}function toggleCart(isOpen){return{type:types.TOGGLE_CART,data:isOpen};}function rateOrder(orderId,score,comment){return function(dispatch){dispatch({type:types.RATING_ORDER});Parse.Cloud.run('rateOrder',{orderId:orderId,score:score,comment:comment}).then(function(){dispatch({type:types.RATE_ORDER_SUCCESS});return dispatch(loadConsumerOrders());}).fail(function(e){return{type:types.RATE_ORDER_ERROR,data:e};});};}function showSiteMap(){return{type:types.SHOW_SITEMAP};}function hideSiteMap(){return{type:types.HIDE_SITEMAP};}function hideOutOfCoverageModal(){return{type:types.HIDE_OUT_OF_COVERAGE_MODAL};}/**
* Load Point of Sales of given businessId.
*/function loadPointSales(){var params={businessId:BUSINESS_ID};return function(dispatch){Parse.Cloud.run('getPointSales',params).then(function(results){dispatch({type:types.POINT_OF_SALES_LOADED,data:results});});};}/**
* Geolocation error.
*/function geolocationError(){return{type:types.GEOLOCATION_ERROR};}/**
* Hide Geolocation Error Modal.
*/function hideAddressSearchModal(){return{type:types.HIDE_GEOLOCATION_ERROR_MODAL};}/**
* Show Address Search Modal.
*/function showAddressSearchModal(){return{type:types.SHOW_ADDRESS_SEARCH_MODAL};}function renderMenu(){return{type:types.RENDER_MENU};}

//# sourceMappingURL=index-compiled.js.map