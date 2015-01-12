var core= require('../core.js'),
  H = require('../lib/Helper.js'),
  def = require('elegant.def'),
  _ = require('lodash');

var createFilter = core.createFilter;



/**
 * 目前只有两类 hook: preGenerate, postResult(默认)
 *
 * preGenerate 类的 hook 会将生成随机数的函数传给 filter
 * postResult  类的 hook 会将上次的结果传给 filter
 */


var opt = {
  repeat: {hook: 'preGenerate'}
};

var map = {
  repeat: def(function(self) {
    /**
     * @defaults {min: 0, max: 10}
     *
     * @rule ( function genFn, int min, int max [, string join] ) -> *
     * @rule ( function genFn, int length [, string join] ) -> *
     * @rule ( function genFn [, string join] ) -> *
     */
    var count = ('length' in self) ? self.length : _.random(self.min, self.max);
    
    var result = _.times(count, function() { return self.genFn(); });

    // self.join 可能等于空字符串
    return ('join' in self) ? result.join(self.join) : result;
  }),

  String: {
    title: function(str) { return str.replace(/\b\w/g, function(letter) { return letter.toUpperCase(); }); },
    cap:   function(str) { return str.charAt(0).toUpperCase() + str.substr(1); },
    upper: function(str) { return str.toUpperCase(); },
    lower: function(str) { return str.toLowerCase(); }
  },
  Array: {},
  Object: {},
  Number: {},
  Boolean: {}
};









_.each(map, function(fnGroup, type) {
  var _opt = opt[type] || {};
  if (_.isPlainObject(fnGroup)) {
    _.each(fnGroup, function(fn, key) {
      createFilter([type, key].join('.'), fn, _opt[key] || {});
    });
  } else if (_.isFunction(fnGroup)) {
    createFilter(type, fnGroup, _opt);
  }
});


