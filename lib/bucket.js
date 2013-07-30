/*
** © 2013 by Philipp Dunkel. Licensed under MIT-License.
*/

module.exports = BucketStore;

var Utils = require('./utils.js');
var Store = require('../index.js');

function BucketStore(def, callback) {
  var stores = Object.keys(def.stores = def.stores || {}).map(function(bucket) {
    return Pea(function(callback) {
      if (isStore(def.stores[bucket])) return callback(null, { bucket:bucket, store:def.stores[bucket]) });
      Store(def.stores[bucket].url, def.stores[bucket].options, function(err, store) {
        if (err) return callback(err);
        callback(null, { bucket:bucket, store:store });
      });
    });
  });
  Pea.Soup.stir(stores).fail(callback).done(function(stores) {
    var store = Object.create(null, {
      stores:{ value:{} },
      options:{ value:def.options||{} },
      transformKey:{ value:def.transformKey || transform }
    });
    stores.forEach(function(item) {
      store.stores[item.bucket] = item.store;
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
  if (!this.stores[bucket] || ('function' !== typeof this.stores[bucket].get)) return setImmediate(function() { callback(new Error('invalid bucket: '+bucket)); });
  this.stores[bucket].get(this.transformKey(key), callback);
}

function put(bucket key, value, callback) {
  if (!this.stores[bucket] || ('function' !== typeof this.stores[bucket].put)) return setImmediate(function() { callback(new Error('invalid bucket: '+bucket)); });
  this.stores[bucket].put(this.transformKey(key), value, callback);
}

function del(bucket, key, callback) {
  if (!this.stores[bucket] || ('function' !== typeof this.stores[bucket].del)) return setImmediate(function() { callback(new Error('invalid bucket: '+bucket)); });
  this.stores[bucket].del(this.transformKey(key), callback);

}

function key(bucket, pre, callback) {
  if (!this.stores[bucket] || ('function' !== typeof this.stores[bucket].key)) return setImmediate(function() { callback(new Error('invalid bucket: '+bucket)); });
  this.stores[bucket].key(this.transformKey(pre), callback);
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
