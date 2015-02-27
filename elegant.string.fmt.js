
var fmt = (function() {

  var modifiers = {
    upper: function(str) { return str.toUpperCase(); },
    lower: function(str) { return str.toLowerCase(); },
    cap: function(str) { return str.charAt(0).toUpperCase() + str.slice(1); },
    title: function(str) { return str.replace(/\b\w/g, modifiers.cap); }
  },
    toString = Object.prototype.toString,
    slice = Array.prototype.slice,
    reNum = /^\d+$/,
    isNum = function(str) { return reNum.test(str);},
    reTag = /\{([^\}]+?)(\.\w+)?\}/g;

  /**
   *
   * @param str {string} string that need to format
   * @param obj {*} can be anything
   *
   * fmt('Hi {0}, my name is {1.cap}',  'Jana', 'anna judy')
   * // => Hi Jana, my name is Anna judy
   *
   * fmt('Hi {0.lower}, my name is {1}',  ['Jana', 'anna judy'])
   * // => Hi jana, my name is anna judy
   *
   * fmt('Hi {you}, my name is {my.upper}', {you: 'Jana', my: 'anna judy'})
   * // => Hi Jana, my name is ANNA JUDY
   *
   * fmt('Hi {0}, my name is {my.title}',  ['Jana'], {my: 'anna judy'})
   * // => Hi Jana, my name is Anna Judy
   *
   */
  function fmt(str, obj) {
    'use strict';

    var args = slice.call(arguments, 1), o = {}, a = [], i, arg, key;

    for (i = 0; i < args.length; i++) {
      arg = args[i];
      if ('[object Object]' === toString.call(arg)) {
        for (key in arg) {
          if (arg.hasOwnProperty(key)) {
            o[key] = arg[key];
          }
        }
      } else {
        a = a.concat(arg);
      }
    }

    return str.replace(reTag, function(_, id, modifier) {
      var ref = isNum(id) ? a : o,
        m = modifier && modifier.slice(1),
        rtn;
      if (id in ref) {
        rtn = String(ref[id]);
        if (m && (m in modifiers)) {
          rtn = modifiers[m](rtn);
        }
      }
      return rtn || _;
    });
  }

  return fmt;
})();


if (typeof module === 'object' && typeof module.exports === 'object') {
  module.exports = fmt;
}

