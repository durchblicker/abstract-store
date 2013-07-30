/*
** © 2013 by Philipp Dunkel. Licensed under MIT-License.
*/

module.exports = Bucket;

var Utils = require('./utils.js');
var Store = require('../index.js');

function Bucket(def, callback) {
  var stores = Object.keys(def).map(function(bucket) {
    return Pea(function(callback) {
      if (isStore(def[bucket])) return callback(null, { bucket:bucket, store:def[bucket] });
      Store(def[bucket].url, def[bucket].options, function(err, store) {
        if (err) return callback(err);
        callback(null, { bucket:bucket, store:store });
      });
    });
  });
  Pea.Soup.stir(stores).fail(callback).done(function(stores) {
    var store = Object.create(null, {
      stores:{ value:{} }
    });
    stores.forEach(function(item) {
      store.stores[item.bucket] = item.store;
    });
    store.transformKey = transform;
    Object.defineProperties(store, {
      'get':{ value:Utils.bind(get, store), enumerable:true },
      'put':{ value:Utils.bind(put, store), enumerable:true },
      'del':{ value:Utils.bind(del, store), enumerable:true },
      'key':{ value:Utils.bind(key, store), enumerable:true }
    });
    callback(null, store);
  });
}

function get(bucket, key, callback) {
  if (!this.stores[bucket] || ('function' !== typeof this.stores[bucket].get)) return setImmediate(function() { callback(new Error('invalid bucket: '+bucket)); });
  if ('function' === typeof this.stores[bucket].transformKey) key = this.stores[bucket].transformKey(this.transformKey(key),bucket);
  this.stores[bucket].get(key, callback);
}

function put(bucket, key, value, callback) {
  if (!this.stores[bucket] || ('function' !== typeof this.stores[bucket].put)) return setImmediate(function() { callback(new Error('invalid bucket: '+bucket)); });
  if ('function' === typeof this.stores[bucket].transformKey) key = this.stores[bucket].transformKey(this.transformKey(key),bucket);
  this.stores[bucket].put(key, value, callback);
}

function del(bucket, key, callback) {
  if (!this.stores[bucket] || ('function' !== typeof this.stores[bucket].del)) return setImmediate(function() { callback(new Error('invalid bucket: '+bucket)); });
  if ('function' === typeof this.stores[bucket].transformKey) key = this.stores[bucket].transformKey(this.transformKey(key),bucket);
  this.stores[bucket].del(key, callback);

}

function key(bucket, pre, callback) {
  if (!this.stores[bucket] || ('function' !== typeof this.stores[bucket].key)) return setImmediate(function() { callback(new Error('invalid bucket: '+bucket)); });
  if ('function' === typeof this.stores[bucket].transformKey) key = this.stores[bucket].transformKey(this.transformKey(key),bucket);
  this.stores[bucket].key(key, callback);
}

function transform(key) {
  return String(key || '');
}

function isStore(item) {
  if ('function' !== typeof item.get) return false;
  if ('function' !== typeof item.put) return false;
  if ('function' !== typeof item.del) return false;
  if ('function' !== typeof item.key) return false;

  return true;
}
