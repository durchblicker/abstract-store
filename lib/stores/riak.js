/*
** © 2013 by Philipp Dunkel. Licensed under MIT-License.
*/

module.exports = Create;

var HTTP = require('http');
var HTTPS = require('https');
var Url = require('url');
var Pea = require('pea');
var Utils = require('../utils.js');
var Merge = Utils.bind(require('merge'), null, true);

HTTP.globalAgent.maxSockets = 4096;
HTTPS.globalAgent.maxSockets = 4096;

function Create(url, options, callback) {
  url = Url.parse(url, true);
  options = Merge({},options);
  options.bucket = options.bucket || url.hostname;
  options.secure = undefined === options.secure ? false : options.secure;
  options.host = options.host || url.hostname;
  options.host = Array.isArray(options.host) ? options.host : [ options.host ];
  options.port = options.port || url.port || 8098;
  var store = Object.create(null, {
    options:{ value: options },
    client: { value: (Array(5).join('0')+process.pid).slice(-5)+'-'+(Array(10).join('0')+Math.round(Math.random() * 1e9)).slice(-9)+'-'+(Array(10).join('0')+Date.now()).slice(-9) }
  });
  Object.defineProperties(store, {
    exec: { value:Utils.bind(exec, store) }
  });
  Utils.common(store, get, put, del, key);
  setImmediate(function() { callback(null, store); });
}

function get(key, callback) {
  key = Utils.transformKey(key, this.options);
  var store = this;
  var url = Url.parse((this.options.secure ? 'https://' : 'http://')+'riakhost:'+this.options.port+'/riak/'+this.options.bucket+'/'+key);
  url.method = 'GET';
  this.exec(url, null, function(err, res) {
    if (err) return callback(err);
    if (res.statusCode === 404) return callback(null);
    if (res.statusCode > 299) return callback(new Error('fail:'+res.statusCode));

    var dat=[], len=0;
    res.on('readable', function() {
      var chunk = res.read();
      if (!chunk) return;
      dat.push(chunk);
      len += chunk.length;
    });
    res.on('end', function() {
      dat = Buffer.concat(dat, len);
      store.decompressor(dat)(dat, function(err, dat) {
        try {
          dat = JSON.parse(dat.toString('utf-8'));
        } catch(ex) {
          return callback(ex);
        }
        if ('string' !== typeof dat.storage_type) return callback(null, dat);
        switch(dat.storage_type) {
          case 'string': return callback(null, dat.content);
          case 'buffer': return callback(null, new Buffer(dat.content, 'ascii'));
          default: return callback(new Error('illegal stored object'));
        }
      });
    });
    res.on('error', callback);
  });
}

function put(key, value, callback) {
  key = Utils.transformKey(key, this.options);
  var store = this;
  var url = Url.parse((this.options.secure ? 'https://' : 'http://')+'riakhost:'+this.options.port+'/riak/'+this.options.bucket+'/'+key);
  url.method = 'PUT';
  if (Buffer.isBuffer(value)) {
    value = { storage_type:'buffer', content:value.toString('ascii') };
  } else if ('string' === typeof value) {
    value = { storage_type:'string', content:value };
  }
  value = new Buffer(JSON.stringify(value).trim());
  store.exec(url, value, function(err, res) {
    if (err) return callback(err);
    callback((res.statusCode > 299) ? new Error('fail:'+res.statusCode) : null);
  });
}

function del(key, callback) {
  key = Utils.transformKey(key, this.options);
  var store = this;
  var url = Url.parse((this.options.secure ? 'https://' : 'http://')+'riakhost:'+this.options.port+'/riak/'+this.options.bucket+'/'+key);
  url.method = 'DELETE';
  this.exec(url, null, function(err, res) {
    if (res.statusCode === 404) return callback(null);
    callback((res.statusCode > 299) ? new Error('fail:'+res.statusCode) : null);
  });
}

function key(pre, callback) {
  pre = Utils.transformKey(pre, this.options);
  var data = {
    "inputs":{"bucket":this.options.bucket,"key_filters":[ [ "starts_with", pre ] ] },
    "query":[ {"reduce":{ "language":"erlang","module":"riak_kv_mapreduce","function":"reduce_identity" } } ]
  };
  data = new Buffer(JSON.stringify(data));
  var url = Url.parse((this.options.secure ? 'https://' : 'http://')+'riakhost:'+this.options.port+'/mapred');
  url.method = 'POST';
  this.exec(url, data, function(err, res) {
    if (err) return callback(err);
    if (res.statusCode > 299) return callback(new Error('fail:'+res.statusCode));
    var dat=[], len=0;
    res.on('readable', function() {
      var chunk = res.read();
      dat.push(chunk);
      len += chunk.length;
    });
    res.on('end', function() {
      dat = Buffer.concat(dat, len);
      try {
        dat = JSON.parse(dat.toString('utf-8'), dateRevive);
      } catch(ex) {
        return callback(ex);
      }
      callback(null, dat.map(function(item) { return item.pop(); }));
    });
    res.on('error', callback);
  });
}

function exec(url, data, callback) {
  var store = this;
  Pea.first(this.options.host, function(host, callback) {
    url = Merge(url, store.options);
    url.hostname = host;
    url.port = store.options.port;
    url.host = [ url.hostname, url.port ].join(':');
    url.headers = {
      'Host': url.hostname,
      'Connection': 'keep-alive',
      'X-Riak-ClientId': store.client
    };
    if (data) {
      url.headers['Content-Type'] = 'application/json';
      url.headers['Content-Length'] = data.length;
    }
    url.protocol = store.options.secure ? 'https:' : 'http:';
    delete url.href;
    delete url.pathname;
    delete url.bucket;
    var request = (store.options.secure?HTTPS:HTTP).request(url, function(res) { callback(null, res); });
    request.on('error', callback);
    data ? request.end(data) : request.end();
  }).done(function(res) {
    store.options.host = store.options.host.slice(store.options.host.indexOf(url.hostname)).concat(store.options.host.slice(0, store.options.host.indexOf(url.hostname)));
    callback(null, res);
  }).fail(callback);
}
