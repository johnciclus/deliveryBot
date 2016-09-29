/* @flow */
import * as types from '../constants/actionTypes'
//import Parse from 'parse'
//import { push } from 'react-router-redux'
import config from 'config'
import GetProductsParams from '../models/GetProductsParams'
import {
  Cart,
  Consumer,
  ConsumerAddress,
  Customer,
  CustomerPointSale,
  Modifier,
  ModifierGroup,
  ModifierItem,
  Order,
  OrderItem,
  OrderItemModifier,
  OrderItemModifierGroup,
  PaymentMethodLanguage
} from '../ParseModels'
const BUSINESS_ID = (process.env.BUSINESS_ID) ? (process.env.BUSINESS_ID) : config.get('BUSINESS_ID');
//const geocoder = new google.maps.Geocoder()

/**
 * Load Consumer of given user
 */
export function loadCustomer(recipientId, businessId) {
  if (businessId == null) return;
  return dispatch => {
    return new Parse.Query(Customer).contains('businessId', businessId).limit(1).first().then(
        customer => {
          dispatch({type: types.CUSTOMER_LOADED, data: {recipientId, customer}})
        }
    ).fail(e => {
      dispatch({type: types.CUSTOMER_NOT_FOUND, data: {recipientId, businessId}})
    })
  };
}

/**
 * Load Consumer of given user
 */
export function loadConsumer(recipientId, user) {
    if (user == null) return;
    return dispatch => {
        return new Parse.Query(Consumer).equalTo('user', user).first().then(
            consumer => {
              if (consumer) {

                dispatch({type: types.CONSUMER_LOADED, data: {recipientId, consumer}})

                //dispatch(loadConsumerAddresses(consumer))

                //dispatch(loadConsumerOrders());

                //mainDispatch(push('/'))
              }
              else {
                const authData = user.get('authData')
                if (authData && authData.hasOwnProperty('facebook')) {
                  if (FB) {
                    loadFacebookUserData(authData.facebook.access_token, dispatch)
                  }
                }
                dispatch({type: types.CONSUMER_NOT_FOUND, data: {user}})
              }
            }).fail(e => {
            dispatch({type: types.CONSUMER_NOT_FOUND, data: {user}})
        })
    }
}

/**
 * Load Consumer Addresses and dispatch action with the results.
 */
export function loadConsumerAddresses(recipientId, consumer) {
    if (consumer == null) return
    return dispatch => {
        return new Parse.Query(ConsumerAddress).equalTo('consumer', consumer).find().then(
            addresses => {
                dispatch({type: types.CONSUMER_ADDRESSES_LOADED, data: {recipientId, addresses}})
        }).fail(error => {
            console.log('Error '+error);
            //TODO dispatch action with error
        })
    }
}

/**
 * SET_CURRENT_ADDRESS action
 */
export function setAddress(recipientId, id) {
    return dispatch => {
        return new Parse.Query(ConsumerAddress).get(id).then(
            address => {
                console.log("Action: "+address);
                dispatch({ type: types.SET_CURRENT_ADDRESS, data: {recipientId, address}})
        }).fail(error => {
            console.log('Error '+error);
            //TODO dispatch action with error
        });
    }
}

/**
 * Load Payment Methods.
 */
export function loadPaymentMethods(recipientId) {
    return dispatch => {
        return new Parse.Cloud.run('paymentMethods',{
            languageCode: 'es'
            //businessId: BUSINESS_ID
        }).then((paymentMethods) => {
            dispatch({ type: types.PAYMENT_METHODS_LOADED, data: {recipientId, paymentMethods}})
        })
    }
}

export function setPaymentMethod(recipientId, id){
    return dispatch => {
        return new Parse.Query(PaymentMethodLanguage).get(id).then(
            paymentMethod => {
                dispatch({ type: types.SET_PAYMENT_METHOD, data: {recipientId, paymentMethod}})
            }).fail(error => {
                console.log('Error '+error);
            //TODO dispatch action with error
        });
    }
}




export function getConsumerAndAddresses(user){
    return (dispatch, getState) => {
        return dispatch(recipientId, loadConsumer(user)).then(() => {
            return dispatch(loadConsumerAddresses(getState().consumer.rawParseObject))
        })
    }
}


/**
 * Address Saved
 */
export function addressSaved(address) {
  return {
    type: types.ADDRESS_SAVED,
    data: address
  }
}

/**
 * HIDE_ADDRESS_FORM action
 */
export function hideAddressForm() {
    return { type: types.HIDE_ADDRESS_FORM }
}

/**
 * Address Saved Error
 */
export function addressSaveError() { return { type: types.ADDRESS_SAVE_ERROR } }

/**
 * Save ConsumerAddress on Parse.
 */
function saveConsumerAddress(consumerAddress, dispatch, pendingOrder, cart) {
  const ConsumerAddress = Parse.Object.extend('ConsumerAddress')
  const parseConsumerAddress = new ConsumerAddress()
  if (!consumerAddress.consumer) { return }
  if (consumerAddress.objectId) {
    parseConsumerAddress.objectId = consumerAddress.objectId
  }
  const consumer = consumerAddress.consumer.rawParseObject
  const location = consumerAddress.location
  const parseGeoPoint = new Parse.GeoPoint(location.lat, location.lng)
  parseConsumerAddress.set('location', parseGeoPoint)
  parseConsumerAddress.set('consumer', consumer)
  parseConsumerAddress.set('address', consumerAddress.address)
  parseConsumerAddress.set('name', consumerAddress.name)
  parseConsumerAddress.set('description', consumerAddress.description)
  parseConsumerAddress.save().then(consumerAddress => {
    dispatch(addressSaved(consumerAddress))
    dispatch(loadConsumerAddresses(consumer, dispatch))
    dispatch(hideAddressForm())
  }).fail(e => {
    dispatch(addressSaveError())
  })
}




/**
* Load products from Parse.
*/
export function loadProducts(
  lat, lng, category, pointSale
) {
  return (dispatch, getState) => {
    let params = new GetProductsParams(BUSINESS_ID)
    if (lat && lng) {
      params.lat = lat
      params.lng = lng
    }
    const currentCategory = getState().routing.locationBeforeTransitions.query.category
    if (category) {
      params.category = category
    } else if (currentCategory) {
      params.category = currentCategory
    }
    if (pointSale) {
      params.pointSale = pointSale
    }
    dispatch({type: types.LOADING_PRODUCTS})
    Parse.Cloud.run('getProducts', params).then((results) => {
      dispatch({
        type: types.PRODUCTS_LOADED,
        data: results
      })
    }).fail((e) => {
      dispatch({type: types.PRODUCTS_LOAD_ERROR})
      try {
        if (e.message.code === 1001) {
          dispatch({type: types.OUT_OF_COVERAGE, data: {lat, lng}})
          dispatch(loadPointSales())
        }
      } catch (e) {}
    })
  }
}

/**
* Filter products by given category
*/
export function filterProductsByCategory(category) {
  return {
    type: types.FILTER_PRODUCTS_BY_CATEGORY,
    data: category
  }
}

/**
* Add Product to cart action
*/
export function addProductToCart(cartItem) {
  return (dispatch, getState) => {
    const { cart } = getState()
    if (cart.consumerAddress.location.isValid()) {
      dispatch({
        type: types.ADD_TO_CART,
        data: cartItem
      })
    } else {
      dispatch(showAddressSearchModal())
    }
  }
}

/**
* Empty cart action
*/
export function emptyCart() {
  return { type: types.EMPTY_CART }
}

/**
* Load User's Facebook data.
*/
function loadFacebookUserData(accessToken, dispatch) {
  FB.api('/me', {
    fields: 'email, first_name, last_name',
    access_token: accessToken
  }, function (res) {
    if (!res.error) {
      dispatch(facebookDataLoaded(res))
    } else {
      //TODO dispatch error event
    }
  })
}

/**
* Facebook Data Loaded
*/
export function facebookDataLoaded(data) {
  return {type: types.FACEBOOK_USER_DATA_LOADED, data}
}





/**
* Create Consumer
*/
export function createConsumer(consumerData, mainDispatch) {
  return dispatch => {
    const consumer = new Consumer()
    consumer.save(consumerData).then( consumer => {
      dispatch({type: types.CONSUMER_CREATED, data: {
        user: consumerData.user, consumer
      }})
      dispatch({type: types.CONSUMER_LOADED, data: {consumer}})
      mainDispatch(push('/'))
    }).fail(e => {
      dispatch({type: types.CONSUMER_NOT_FOUND, data: {user: consumerData.user}})
    })
  }
}

/**
* Update Consumer.
* Update consumer's user in success callback.
* It only dispatches CONSUMER_UPDATED if Consumer and ParseUser were
* saved successfully.
*/
export function updateConsumer(consumerData) {
  return dispatch => {
    dispatch({type: types.UPDATE_CONSUMER, data: consumerData})
    const consumer = new Consumer()
    consumer.objectId = consumerData.objectId
    consumer.save(consumerData).then( consumer => {
      let username = consumer.get('email') + BUSINESS_ID
      consumer.get('user').save({username}).then(u => {
        dispatch({type: types.CONSUMER_UPDATED, data: {consumer}})
        dispatch({type: types.HIDE_PROFILE})
      }).fail(e => {
        dispatch({type: types.CONSUMER_UPDATE_ERROR, data: {consumer}})
      })
    }).fail(e => {
      dispatch({type: types.CONSUMER_UPDATE_ERROR, data: {consumer}})
    })
  }
}

/**
* Facebook Login Success
*/
export function facebookLogin (mainDispatch) {
  return dispatch => {
    Parse.FacebookUtils.logIn(null, {
      success: function(user) {
        if (!user.existed()) {
          dispatch({type: types.FACEBOOK_REGISTER_SUCCESS})
        } else {
          dispatch({type: types.FACEBOOK_LOGIN_SUCCESS, data: user})
        }
        mainDispatch(push('/'))
        dispatch(loadConsumer(user, mainDispatch))
      },
      error: function(user, error) {
        alert("Login cancelado.")
      }
    })
  }
}

/**
* Logout
*/
export function logout(mainDispatch) {
  return dispatch =>{

    if(Parse.User.current()) {
      Parse.User.logOut()
    }

    mainDispatch(push('/'))
    window.location = "/"
    dispatch({type: types.LOGOUT})
  }
}

/**
* Email Login Action
*/
export function emailLogin(userData, mainDispatch) {
  mainDispatch({type: types.EMAIL_LOGIN})
  return dispatch => {
    Parse.User.logIn(userData.email + BUSINESS_ID, userData.password).then(user => {
      dispatch({
        type: types.EMAIL_LOGIN_SUCCESS,
        data: user
      })
      mainDispatch(push('/'))
      dispatch(loadConsumer(user, mainDispatch))
    }).fail(e => {
      dispatch({
        type: types.EMAIL_LOGIN_ERROR,
        data: e
      })
    })
  }
}

/**
* Email Login Action
*/
export function emailRegister(userData, mainDispatch) {
  mainDispatch({type: types.EMAIL_REGISTER})
  return dispatch => {
    Parse.User.signUp(userData.email + BUSINESS_ID, userData.password).then(user => {
      dispatch({
        type: types.EMAIL_REGISTER_SUCCESS,
        data: {user, userData}
      })
      delete userData.password
      delete userData.passwordConfirmation
      userData.user = user
      dispatch(createConsumer(userData, mainDispatch))
    }).fail(e => {
      dispatch({
        type: types.EMAIL_REGISTER_ERROR,
        data: e
      })
    })
  }
}

/**
* Geolocation Position Acquired action.
*/
export function geolocationPositionAcquired(ll, mainDispatch) {
  geocodeLocation(ll, mainDispatch, true)
  return {
    type: types.GEOLOCATION_POSITION_ACQUIRED,
    data: ll
  }
}

/**
* Map Address Changed
*/
export function mapAddressChanged(address) {
  return {
    type: types.MAP_ADDRESS_CHANGED,
    data: address
  }
}




/**
* Geocode Given Location and dispatch MAP_ADDRESS_CHANGED action.
*/
function geocodeLocation(location, mainDispatch, fromGeoLocation) {
  geocoder.geocode({location}, (results, status) => {
    if (status === "OK") {
      const place = results[0]
      const address = {}

      var isBetweenAddress = -1
      isBetweenAddress = place.formatted_address.indexOf(" a ")
      if (isBetweenAddress === -1) {
        address.address = place.formatted_address
      } else {
        let street = place.formatted_address.substr(0, isBetweenAddress)
        let city = ""
        place.address_components.forEach(component => {
          if (component.types.indexOf("locality") !== -1) city = component.short_name
        })
        address.address = street + ", " + city
      }

      address.location = {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng()
      }
      address.fromGeoLocation = fromGeoLocation
      mainDispatch(mapAddressChanged(address))
    }
  })
}

/**
* Map Location Changed, geocode and send MAP_ADDRESS_CHANGED with geocoded result
*/
export function mapBoundsChanged(mapBounds, mainDispatch) {
  mainDispatch({
    type: types.MAP_BOUNDS_CHANGED,
    data: mapBounds.bounds
  })
  return dispatch => {
    geocodeLocation(mapBounds.center, mainDispatch)
  }
}

/**
* Address Text Changed
*/
export function addressTextChanged(address) {
  return {
    type: types.ADDRESS_TEXT_CHANGED,
    data: address
  }
}

/**
* SHOW_MAP_ADDRESS action
*/
export function showMapAddress() {
  return { type: types.SHOW_MAP_ADDRESS }
}

/**
* HIDE_MAP_ADDRESS action
*/
export function hideMapAddress() {
  return { type: types.HIDE_MAP_ADDRESS }
}

/**
* SHOW_ADDRESS_FORM action
*/
export function showAddressForm() {
  return { type: types.SHOW_ADDRESS_FORM }
}





/**
* CONSUMER_ADDRESS_CHANGED action
*/
export function consumerAddressChanged(consumerAddress, dispatch, pendingOrder, cart) {
  saveConsumerAddress(consumerAddress, dispatch, pendingOrder, cart)
  return {
    type: types.CONSUMER_ADDRESS_CHANGED,
    data: consumerAddress
  }
}

/**
* CONSUMER ADDRESS LOADED action
*/
export function consumerAddressesLoaded(consumerAddresses) {
  return {
    type: types.CONSUMER_ADDRESSES_LOADED,
    data: consumerAddresses
  }
}



/**
* SHOW_ADDRESS_LIST action
*/
export function showAddressList() {return {type: types.SHOW_ADDRESS_LIST}}

/**
* HIDE_ADDRESS_LIST action
*/
export function hideAddressList() {return {type: types.HIDE_ADDRESS_LIST}}



/**
* Select Payment Method action
*/
export function selectPaymentMethod(paymentMethod) {
  return {
    type: types.SELECT_PAYMENT_METHOD,
    data: paymentMethod
  }
}

/**
* Create New Address action
*/
export function createNewAddress() { return { type: types.CREATE_NEW_ADDRESS } }

/**
* Get Geolocation
*/
export function getGeoLocation(dispatch) {
  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(position => {
      const ll = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      }
      dispatch(geolocationPositionAcquired(ll, dispatch))
    })
  }
}

/**
* Convert Cart to Order
*/
function cartToOrder(cart, items) {
  return {
    items: items,
    comment: cart.comment,
    consumer: cart.consumer.rawParseObject,
    pointSale: cart.pointSale.rawParseObject,
    paymentMethod: cart.paymentMethod,
    consumerAddress: cart.consumerAddress.rawParseObject,
    total: cart.total,
    deliveryCost: cart.pointSale.deliveryCost,
    email: cart.consumer.email,
    name: cart.consumer.name,
    phone: cart.consumer.phone
  }
}

/**
* Create Order Action
*/
export function createOrder(cart, mainDispatch) {
  mainDispatch(push('/'))
  mainDispatch({type: types.CREATE_ORDER})
  const consumer = cart.consumerAddress.consumer

  //Go to Login route if cart has no consumer
  if (!consumer.objectId) {
    mainDispatch({type: types.HIDE_CART})
    mainDispatch({type: types.CREATE_ORDER_ERROR})
    return mainDispatch(push('/login'))
  }

  //Check that cart has at least 1 item.
  if (cart.items.length === 0) {
    mainDispatch({type: types.CREATE_ORDER_ERROR})
    return mainDispatch(showEmptyCartModal())
  }

  //If payment method isn't set, dispatch action to show payment method modal
  if (!cart.paymentMethod) {
    mainDispatch({type: types.CREATE_ORDER_ERROR})
    return mainDispatch(showPaymentNotSelectedModal())
  }

  //If cart total price is below point of sale minimum price dispatch action
  //to show minimum price modal
  if (cart.total < cart.pointSale.minOrderPrice) {
    mainDispatch({type: types.CREATE_ORDER_ERROR})
    return mainDispatch(cartTotalIsBelowMinimumPrice())
  }

  //If cart hasn't consumer address show list of address.
  if (!cart.consumerAddress.objectId) {
    mainDispatch({type: types.CREATE_ORDER_ERROR})
    return mainDispatch(showAddressList())
  }

  //Check if Point of Sale is open
  if (!cart.pointSaleIsOpen) {
    mainDispatch({type: types.CREATE_ORDER_ERROR})
    return mainDispatch(showPointSaleClosedModal())
  }
  //Check if is inside coverage
  if (cart.outOfCoverage) {
    mainDispatch({type: types.CREATE_ORDER_ERROR})
    return mainDispatch(showOufOfCoverageModal())
  }

  const items = []
  cart.items.forEach(item => {
    const orderItem = new OrderItem()
    orderItem.set('modifiers', [])
    orderItem.set('modifiersGroups', [])
    orderItem.set('product', item.product.rawParseObject)
    orderItem.set('amount', item.amount)
    orderItem.set('price', item.price)
    //Set OrderItemModifiers
    item.modifiers.forEach(modifierItem => {
      const m = new Modifier()
      m.id = modifierItem.modifier.objectId
      const i = new ModifierItem()
      i.id = modifierItem.modifierItem.objectId
      const orderItemModifier = new OrderItemModifier({
        modifier: m,
        modifierItem: i,
        price: modifierItem.price
      })
      orderItem.add('modifiers', orderItemModifier)
    })
    //Set Modifiers Group
    item.modifiersGroups.forEach(modifierGroupItem => {
      const g = new ModifierGroup()
      g.id = modifierGroupItem.group.objectId
      const orderItemModifierGroup = new OrderItemModifierGroup({
        group: g,
        items: []
      })
      modifierGroupItem.items.forEach(modifierItem => {
        const m = new Modifier()
        m.id = modifierItem.modifier.objectId
        const i = new ModifierItem()
        i.id = modifierItem.modifierItem.objectId
        orderItemModifierGroup.add('items', new OrderItemModifier({
          modifier: m,
          modifierItem: i,
          price: modifierItem.price
        }))
      })
      orderItem.add('modifiersGroups', orderItemModifierGroup)
    })
    items.push(orderItem)
  })

  const newOrder = new Order()
  newOrder.set(cartToOrder(cart, items))
  Parse.Object.saveAll(items).then(function () {
    return newOrder.save()
  }).then(order => {
    mainDispatch({type: types.ORDER_CREATED, data: order})
    mainDispatch(emptyCart())
    mainDispatch(loadConsumerOrders())
    mainDispatch(toggleCart(false))
  }).fail(e => {
    alert('Hubo un error al crear su pedido, por favor intenta nuevamente.')
  })
}

/**
* Change Cart Comment Action
*/
export function changeCartComment(comment) {
  return {
    type: types.CHANGE_CART_COMMENT,
    data: comment
  }
}

/**
* Show Payment not selected Modal action
*/
export function showPaymentNotSelectedModal() {
  return { type: types.PAYMENT_NOT_SELECTED }
}

/**
* Show Cart is Empty Modal
*/
export function showEmptyCartModal() {
  return { type: types.SHOW_EMPTY_CART_MODAL }
}
/**
* Hide Cart is Empty Modal
*/
export function closeCartIsEmptyModal() {
  return { type: types.HIDE_EMPTY_CART_MODAL }
}
/**
* Hide Payment not selected Modal action
*/
export function hidePaymentNotSelectedModal() {
  return { type: types.PAYMENT_SELECTED }
}

/**
* Action to show cart minimum price modal
*/
export function cartTotalIsBelowMinimumPrice() {
  return { type: types.CART_TOTAL_IS_BELOW_MIN_PRICE }
}

/**
* Action to hide cart minimum price modal
*/
export function hideOrderMinimumPriceModal() {
  return { type: types.CART_TOTAL_IS_ABOVE_MIN_PRICE }
}

/**
* Order Created Action
*/
export function orderCreated(order) {
  return {
    type: types.ORDER_CREATED,
    data: order
  }
}

export function unsetCurrentOrder() {
  return {type: types.UNSET_CURRENT_ORDER}
}

/**
* Load Orders from Parse calling 'orders' cloud function.
* It will dispatch CONSUMER_ORDERS_LOADED with ongoing and delivered orders.
*/
export function loadConsumerOrders() {
  return dispatch => {
    Parse.Cloud.run('orders', { businessId: BUSINESS_ID }).then(orders => {
      dispatch({
        type: types.CONSUMER_ORDERS_LOADED,
        data: orders
      })

      /*//Live Query for ongoing orders.
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
      */
    }).fail(e => {
      //TODO add log error
    })
  }
}

/**
* Set current order action
*/
export function setCurrentOrder(order) {
  return {
    type: types.SET_CURRENT_ORDER,
    data: order
  }
}

/**
* Load Cart by Id.
*/
export function loadCart(cartId) {
  return {type: 'NOTHING'}
  /* * /
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
  /* */
}

/**
* Close Point Sale Closed Modal
*/
export function hidePointSaleClosedModal() {
  return {type: types.HIDE_POINT_SALE_CLOSED_MODAL}
}

/**
* Open Point Sale Closed Modal
*/
export function showPointSaleClosedModal() {
  return {type: types.SHOW_POINT_SALE_CLOSED_MODAL}
}

export function hideProfile() {
  return {type: types.HIDE_PROFILE}
}

export function showProfile() {
  return {type: types.SHOW_PROFILE}
}

export function closeOutOfCoverageModal() {
  return {type: types.HIDE_OUT_OF_COVERAGE_MODAL}
}

export function showOufOfCoverageModal() {
  return {type: types.SHOW_OUT_OF_COVERAGE_MODAL}
}

export function removeItem(item) {
  return {type: types.CART_ITEM_REMOVE, data: item}
}

export function increaseItem(item) {
  return {type: types.CART_ITEM_INCREASE_AMOUNT, data: item}
}

export function decreaseItem(item) {
  return {type: types.CART_ITEM_DECREASE_AMOUNT, data: item}
}

export function toggleCart(isOpen) {
  return {type: types.TOGGLE_CART, data: isOpen}
}

export function rateOrder(orderId, score, comment) {
  return dispatch => {
    dispatch({type: types.RATING_ORDER})
    Parse.Cloud.run('rateOrder', {orderId, score, comment}).then(function () {
      dispatch({type: types.RATE_ORDER_SUCCESS})
      return dispatch(loadConsumerOrders())
    }).fail(function (e) {
      return {type: types.RATE_ORDER_ERROR, data: e}
    })
  }
}

export function showSiteMap () {
  return { type: types.SHOW_SITEMAP}
}

export function hideSiteMap () {
  return { type: types.HIDE_SITEMAP }
}

export function hideOutOfCoverageModal() {
  return { type: types.HIDE_OUT_OF_COVERAGE_MODAL }
}

/**
* Load Point of Sales of given businessId.
*/
export function loadPointSales () {
  const params = {businessId: BUSINESS_ID}
  return dispatch => {
    Parse.Cloud.run('getPointSales', params).then((results) => {
      dispatch({type: types.POINT_OF_SALES_LOADED, data: results})
    })
  }
}

/**
* Geolocation error.
*/
export function geolocationError() {
  return {type: types.GEOLOCATION_ERROR }
}

/**
* Hide Geolocation Error Modal.
*/
export function hideAddressSearchModal() {
  return {type: types.HIDE_GEOLOCATION_ERROR_MODAL }
}

/**
* Show Address Search Modal.
*/
export function showAddressSearchModal() {
  return {type: types.SHOW_ADDRESS_SEARCH_MODAL }
}


function renderMenu() {
    return {type: types.RENDER_MENU }
}