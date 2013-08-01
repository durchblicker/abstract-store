/*
** © 2013 by Philipp Dunkel. Licensed under MIT-License.
*/

module.exports = Create;

var Url = require('url');
var Pea = require('pea');
var Utils = require('../utils');
var Store = require('../../index.js');
var Merge = require('merge').bind(null, true);

function Create(url, options, callback) {
  url = Url.parse(url);
  options = Merge({},options);
  options.stores = options.stores || [];
  options.stores = Array.isArray(options.stores) ? options.stores : [options.stores];

  Pea.map(options.stores, function(def, callback) {
    Store(def.url, def.options, callback);
  }).fail(callback).done(function(stores) {
    options.stores = stores;
    options.write = options.write || options.stores.length;
    options.write = Math.min(options.write, options.stores.length);
    var store = Object.create(null, {
      options:{ value:options }
    });
    Utils.common(store, get, put, del, key);
    callback(null, store);
  });
}

function get(key, callback) {
  key = Utils.transformKey(key, this.options);
  var getters = this.options.stores.map(function(store) {
    return Pea(function(callback) {
      store.get(key, function(err, val) {
        if (err || !val) return callback(err || new Error('not found'));
        callback(null, val);
      });
    });
  });
  Pea.Soup.first(getters).then(function(err, val) {
    callback(null, val);
  });
}

function put(key, value, callback) {
  key = Utils.transformKey(key, this.options);
  var setters = this.options.stores.slice(0, this.options.write).map(function(store) {
    return Pea(function(callback) {
      store.put(key, value, callback);
    });
  });
  Pea.Soup.stir(setters).then(function(err) {
    callback(null);
  });
}

function del(key, callback) {
  key = Utils.transformKey(key, this.options);
  var deleters = this.options.stores.slice(0, this.options.write).map(function(store) {
    return Pea(function(callback) {
      store.del(key, value, callback);
    });
  });
  Pea.Soup.stir(deleters).then(function(err) {
    callback(null);
  });
}

function key(pre, callback) {
  pre = Utils.transformKey(pre, this.options);
  var keyfind = this.options.stores.map(function(store) {
    return Pea(function(callback) {
      store.key(pre, function(err, val) {
        if (err) return callback(err);
        callback(null, Array.isArray(val) ? val : []);
      });
    });
  });
  Pea.Soup.stir(keyfind).then(function(err, vals) {
    var keys = {};
    vals.forEach(function(val) {
      val.forEach(function(item) { keys[item] = true; });
    });
    callback(null, Object.keys(keys).sort());
  });
}