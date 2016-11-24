/* @flow */
/**
* Map ParseObject to JSON recursively
*/
//import Parse from 'parse'
import objectAssign from 'object-assign'

export function extractParseAttributes (object) {
  if (!(object instanceof Parse.Object)) {
      return object
  }
  const attributes = object.toJSON()
  let result = {}
  objectAssign(result, {id: object.objectId}, attributes)
  Object.keys(attributes).forEach(key => {
    if (result[key] && result[key].length && result[key] instanceof Array) {
      result[key] = result[key].map(o => extractParseAttributes(o))
    }
    if (result[key] instanceof Parse.Object && key != 'rawParseObject') {
      let parseObject = result[key]
      result[key] = extractParseAttributes(result[key])
      result[key].rawParseObject = parseObject
    }
    if (result[key] instanceof Parse.GeoPoint
      || (result[key] && result[key].__type == "GeoPoint")) {
      result[key] = {
        lat: result[key].latitude,
        lng: result[key].longitude
      }
    }
  })
  result.rawParseObject = object
  return result
}

export function unsetRawParseObjects (object) {
  if (!(object instanceof Parse.Object)) {
    return object
  }
  object.unset('rawParseObject')
  Object.keys(object.attributes).forEach(key => {
    if (object.get(key) instanceof Array) {
      const items = object.get(key)
      object.set(key, [])
      items.forEach(o => {
        unsetRawParseObjects(o)
        object.add(key, o)
      })
    }
    if (object.get(key) && object.get(key).rawParseObject) {
        object.set(key, object.get(key).rawParseObject)
        unsetRawParseObjects(object.get(key))
    }
  })
}
