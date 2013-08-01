/*
** © 2013 by Philipp Dunkel. Licensed under MIT-License.
*/

module.exports = Create;

var Url = require('url');
var Levelup = require('levelup');
var Merge = require('merge').bind(null, true);

function Create(url, options, callback) {
  url = Url.parse(url);
  options = Merge({}, options);
  options.bucket = options.bucket || url.pathname;
  var store = Object.create(null, {
    options:{ value:options },
    client:{ value: levelup(options.bucket), configurable:true }
  });
  Utils.common(store, get, put, del, key);
  setImmediate(function() { callback(null, store); });
}

function get(key, callback) {
  key = Utils.transformKey(key, this.options);
  this.client.get(key, function(err, val) {
    if (err || !val) return callback(null, val);
    if ('string' === typeof val.storage_type) {
      switch(val.storage_type) {
        case 'string': return callback(null, val.content);
        case 'buffer': return callback(null, new Buffer(val.content, 'base64'));
        case 'json':
          try {
            val = JSON.parse(val.content);
          } catch(ex) {
            return callback(ex);
          }
          return callback(null, val);
        default: return callback(new Error('invalid storage type: '+val.storage_type));
      }
    }
    return callback(null, val);
  });
}

function put(key, value, callback) {
  key = Utils.transformKey(key, this.options);
  if ('string' === typeof value) {
    value = { storage_type:'string', content:value };
  } else if (Buffer.isBuffer(value)) {
    value = { storage_type:'buffer', content:value.toString('base64') };
  } else if ('object' === typeof value) {
    if (!this.options.keepJSON) {
      value = { storage_type:'json', content:JSON.stringify(value).trim() };
    }
  } else {
    return setImmediate(function() { callback(new Error('invalid data type: '+(typeof value))); });
  }
  this.client.put(key, value, callback);
}

function del(key, callback) {
  key = Utils.transformKey(key, this.options);
  this.client.del(key, function(err) {
    return callback();
  });
}

function key(pre, callback) {
  pre = Utils.transformKey(pre, this.options);
  var keys = [];
  this.client.createKeyStream({ start:pre }).on('data', function(key) {
    keys.push(key);
  }).on('end', function() {
    callback(null, keys);
  }).on('error', callback);
}

