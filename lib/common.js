/*
** © 2013 by Philipp Dunkel. Licensed under MIT-License.
*/

module.exports = Common;

var Utils = require('./utils.js');

try {
  var Snappy = require('snappy');
} catch(ex) {}


function Common(obj, get, put, del, key) {
  Object.defineProperties(obj, {
    get:{ value:Utils.bind(caller, obj, get), enumerable:true, configurable:true },
    put:{ value:Utils.bind(caller, obj, put), enumerable:true, configurable:true },
    del:{ value:Utils.bind(caller, obj, del), enumerable:true, configurable:true },
    key:{ value:Utils.bind(caller, obj, key), enumerable:true, configurable:true },
    compress:{ value:compress },
    decompress:{ value:decompress },
    nocompress:{ value:nocompress },
    decompressor:{ value:decompressor }
  });
}

function compress(buffer, callback) {
  Snappy ? Snappy.compress(buffer, callback) : setImmediate(function() { callback(new Error('compression not available')); });
}

function decompress(buffer, callback) {
  Snappy ? Snappy.decompress(buffer, callback) : setImmediate(function() { callback(new Error('decompression not available')); });
}

function nocompress(buffer, callback) {
  setImmediate(function() { callback(null, buffer); });
}

function decompressor(buffer) {
  return (buffer.slice(0,1).toString('utf-8') === '{') ? decompress : nocompress;
}

function caller(fn, key) {
  var args = Array.prototype.slice.call(arguments, 2);
  return fn.apply(this, [ key ].concat(args));
}
