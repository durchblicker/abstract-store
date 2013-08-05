/*
** © 2013 by Philipp Dunkel. Licensed under MIT-License.
*/

module.exports = Create;

var Url = require('url');
var Knox = require('knox');
var Utils = require('../utils.js');
var Merge = require('merge').bind(null, true);

require('http').globalAgent.maxSockets = 4096;
require('https').globalAgent.maxSockets = 4096;

function Create(url, options, callback) {
  url = Url.parse(url);
  options = Merge({},options);
  options.bucket = options.bucket || url.hostname;
  options.style = options.style || "virtualHosted";
  options.secure = undefined === options.secure ? false : options.secure;
  options.port = options.port || (options.secure ? 443 : 80);
  var store = Object.create(null, {
    options:{ value:options },
    client:{ value: Knox.createClient(options), configurable:true }
  });
  store.client.agent = /v0\.1\d/.test(process.version) ? undefined : store.client.agent;
  Utils.common(store, get, put, del, key);
  setImmediate(function() { callback(null, store); });
}

function get(key, callback) {
  key = Utils.transformKey(key, this.options);
  var store = this;
  this.client.get(key).on('error', callback).on('response', function(res) {
    if (res.statusCode === 404) return callback(null, null);
    if (res.statusCode !== 200) return callback(new Error('http-status: '+res.statusCode));
    res.on('error', callback);
    var dat = [], len=0;
    res.on('readable', function() {
      var chunk = res.read();
      if (!chunk) return;
      dat.push(chunk);
      len += chunk.length;
    });
    res.on('end', function() {
      dat = Buffer.concat(dat, len);
      var type = 'application/octet-stream';
      var decompress = store.nocompress;
      switch(res.headers['content-type']) {
        case 'application/x-snappy-text':
          decompress = store.decompress;
          type = 'text/plain';
          break;
        case 'application/x-snappy-binary':
          decompress = store.decompress;
          type = 'application/octet-stream';
          break;
        case 'application/x-snappy-json':
          decompress = store.decompress;
          type = 'application/json';
          break;
        default:
          type = res.headers['content-type'];
      }
      decompress(dat, function(err, dat) {
        switch(type) {
          case 'text/plain':
            dat = dat.toString('utf-8');
            break;
          case 'application/json':
            dat = dat.toString('utf-8');
            try {
              dat = JSON.parse(dat);
            } catch(ex) {
              return callback(ex);
            }
            break;
        }
        callback(null, dat);
      });
    });
  }).end();
}

function put(key, value, callback) {
  key = Utils.transformKey(key, this.options);
  var type, store = this;
  if ('string' === typeof value) {
    type = store.options.compress ? 'application/x-snappy-text' : 'text/plain';
    value = new Buffer(value);
  } else if(Buffer.isBuffer(value)) {
    type = store.options.compress ? 'application/x-snappy-binary' : 'application/octet-stream';
  } else if ('object' === typeof value) {
    type = store.options.compress ? 'application/x-snappy-json' : 'application/json';
    value = new Buffer(JSON.stringify(value).trim());
  } else {
    return callback(new Error('invalid value'));
  }
  (store.options.compress ? store.compress : store.nocompress)(value, function(err, value) {
    if (err) return callback(err);
    store.client.put(key,{
      'Content-Length': value.length,
      'Content-Type': type
    }).on('error', callback).on('response', function(res) {
      if (200 === res.statusCode) return callback(null);
      return callback(new Error('HTTP-Status: '+res.statusCode));
    }).end(value);
  });
}

function del(key, callback) {
  key = Utils.transformKey(key, this.options);
  this.client.del(key).on('error', callback).on('response', function(res){
    if (res.statusCode > 299) return callback(new Error('HTTP-Status: '+res.statusCode));
    callback(null);
  }).end();
}

function key(pre, callback) {
  pre = Utils.transformKey(pre, this.options);
  this.client.list({ prefix: pre }, function(err, data){
    if (err) return callback(err);
    if (!data || !data.Contents) return callback(new Error('missing data'));
    data = data.Contents.map(function(item) { return item.Key; });
    callback(null, data);
  }).end();
}
