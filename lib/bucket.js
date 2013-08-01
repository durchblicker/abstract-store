/*
** © 2013 by Philipp Dunkel. Licensed under MIT-License.
*/

module.exports = Bucket;

var Utils = require('./utils.js');
var Store = require('../index.js');
var Pea = require('pea');
var SHA = require('crypto').createHash.bind(null, 'SHA1');

function Bucket(def, callback) {
  var stores = Object.keys(def).map(function(bucket) {
    return Pea(function(callback) {
      if (isStore(def[bucket])) return callback(null, { bucket:bucket, store:def[bucket] });
      Store(def[bucket].url, def[bucket].options, function(err, store) {
        if (err) return callback(err);
        callback(null, { bucket:bucket, store:store, options:def[bucket].bucket || {} });
      });
    });
  });
  Pea.Soup.stir(stores).fail(callback).done(function(stores) {
    stores = Array.prototype.concat.apply([], stores);
    var store = Object.create(null, {
      stores:{ value:{} }
    });
    stores.forEach(function(item) {
      store.stores[item.bucket] = { store:item.store, options:item.options };
    });
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
  var store = this.stores[bucket] || this.stores['default'];
  if (!store || !store.store || ('function' !== typeof store.store.get)) return setImmediate(function() { callback(new Error('invalid bucket: '+bucket)); });
  key = Utils.transformKey(bucket, key, store.options);
  store.store.get(key, callback);
}

function put(bucket, key, value, callback) {
  var store = this.stores[bucket] || this.stores['default'];
  if (!store || !store.store || ('function' !== typeof store.store.put)) return setImmediate(function() { callback(new Error('invalid bucket: '+bucket)); });
  key = Utils.transformKey(bucket, key, store.options);
  store.store.put(key, value, callback);
}

function del(bucket, key, callback) {
  var store = this.stores[bucket] || this.stores['default'];
  if (!store || !store.store || ('function' !== typeof store.store.del)) return setImmediate(function() { callback(new Error('invalid bucket: '+bucket)); });
  key = Utils.transformKey(bucket, key, store.options);
  store.store.del(key, callback);
}

function key(bucket, pre, callback) {
  var store = this.stores[bucket] || this.stores['default'];
  if (!store || !store.store || ('function' !== typeof store.store.key)) return setImmediate(function() { callback(new Error('invalid bucket: '+bucket)); });
  key = Utils.transformKey(bucket, key, store.options);
  store.store.key(key, callback);
}

function isStore(item) {
  if ('function' !== typeof item.get) return false;
  if ('function' !== typeof item.put) return false;
  if ('function' !== typeof item.del) return false;
  if ('function' !== typeof item.key) return false;

  return true;
}
