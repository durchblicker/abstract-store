/*
** © 2013 by Philipp Dunkel. Licensed under MIT-License.
*/

module.exports = Create;
module.exports.register = Register;
module.exports.bucket = require('./lib/bucket.js');

var Fs = require('fs');
var Path = require('path');
var Url = require('url');

var Stores = {};

function Create(url, options, callback) {
  if (('function' === options) && !callback) {
    callback = options;
    options = {};
  }
  var urlobj = Url.parse(url, true);
  options = options || urlobj.query || {};

  var scheme = Stores[url.protocol.split(':').shift()];
  if (!scheme) return setImmediate(function() { callback(new Error('invalid scheme: '+urlobj.protocol)); });
  scheme(url, options, callback);
}

function Register(scheme, mod) {
  if (('string' !== typeof scheme) || ('function' !== typeof mod)) throw new Error('invalid module');
  scheme = scheme.split(':').shift();
  Stores[scheme] = mod;
}

Fs.readdirSync(Path.join(__dirname, 'lib', 'stores')).forEach(function(scheme) {
  if (!/\.js$/.test(scheme) || /^\./.test(scheme)) return;
  try {
    Register(scheme.split('.').shift(), module.exports[scheme.split('.').shift()] = require(Path.join(__dirname, 'lib', 'stores', scheme)));
  } catch(ex) {
    console.error(ex.stack);
  }
});
