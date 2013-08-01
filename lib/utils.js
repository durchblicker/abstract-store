/*
** © 2013 by Philipp Dunkel. Licensed under MIT-License.
*/

exports.bind = bind;
exports.common = require('./common.js');
exports.transformKey = transformKey;

function bind(fn, tp) {
  var sub = Array.prototype.slice.call(arguments, 2);
  return function bound() {
    var arg = Array.prototype.slice.call(arguments);
    return fn.apply(tp, sub.concat(arg));
  };
}

function transformKey(bucket, key, options) {
  if (!options) {
    options = key;
    key = bucket;
  }
  bucket = String(bucket || '');
  key = String(key || '');
  options = (('object' === typeof options) ? options : {}) || {};
  if (options.hashkey) key = SHA().update(key).digest('hex');
  if (options.prepend) key = [ bucket, key ].join(('string' === typeof options.prepend) ? options.prepend : '/');
  if (options.posthash) key = SHA().update(key).digest('hex');
  return key;
}
