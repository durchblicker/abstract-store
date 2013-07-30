/*
** © 2013 by Philipp Dunkel. Licensed under MIT-License.
*/

exports.bind = bind;
exports.common = require('./common.js');

function bind(fn, tp) {
  var sub = Array.prototype.slice.call(arguments, 2);
  return function bound() {
    var arg = Array.prototype.slice.call(arguments);
    return fn.apply(tp, sub.concat(arg));
  };
}
