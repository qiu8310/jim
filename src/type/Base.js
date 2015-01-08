var JIM = require('../lib/core'),
  _ = require('lodash'),
  H = require('../lib/Helper'),
  C = require('../config');


var createType = JIM.createType,
  Types = JIM.Types;

/**
 * positive: 返回 true 的概率，默认 0.5
 */
createType('Boolean', 'Bool', function (opts) {
  return H.prob(opts.positive);
});


/**
 * min: 最小的整数（包括）
 * max: 最大的整数（包括）
 */
createType('Integer', 'Int', function (opts) {
  return _.random(opts.min, opts.max);
}, { min: C.defaultIntegerMin, max: C.defaultIntegerMax});




/**
 * pools: lower/upper/number/symbol/alpha  可以同时指定多个，如果不存在，则为 pools 为其名称
 * 默认：alpha
 *
 */
createType('Character', 'Char', function(opts) {
  var pools = {
    lower: "abcdefghijklmnopqrstuvwxyz",
    upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    number: "0123456789",
    symbol: "!@#$%^&*()[]"
  };
  pools.alpha = pools.lower + pools.upper;

  var letters = _.reduce([].concat(opts.pools), function(sum, key) {
    return sum + (pools[key] || key);
  }, '');

  return letters.charAt(_.random(0, letters.length - 1));

}, {pools: ['alpha']});


/**
 * pools: 参数直接传递给 Character
 * length: 字符串长度
 * min/max: 字符串的最小及最大长度
 */
createType('String', 'Str', function(opts) {
  var count = opts.length || _.random(opts.min, opts.max);
  return Types.Char({pools: opts.pools}).repeat(count).result().join('');
}, {
  pools: 'lower',
  length: 0,
  min: C.defaultStringMin,
  max: C.defaultStringMax
});


/**
 * length 返回的 lorem 的长度
 * min/max 返回的 lorem 的最小及最大长度
 *
 * 默认使用 length，没用配置 length 则使用 min/max
 */
createType('Lorem', 'Ipsum', function(opts) {
  var count = opts.length || _.random(opts.min, opts.max);
  var ary = ['lorem', 'ipsum'];

  return _.times(count, function() { return _.sample(ary); }).join(' ');
}, {
  length: 0,
  min: C.defaultLoremMin,
  max: C.defaultLoremMax
});


createType('Domain', function() {
  return Types.String({min: 3, max: 8}).lower().result() + '.' + _.sample(C.rootDomains);
});



createType('Email', function(opts) {
  return Types.Username().lower().result().replace(' ', '') + '@' + Types.Domain().result();
});



/**
 * 自增 id
 *
 * key: 指定一个 key，关联当前 id，不同的 key 关联的 id 不一样
 */
createType('Id', (function() {
  var _map = {};
  return function(opts) {
    if (!(opts.key in _map)) {
      _map[opts.key] = 1;
    }
    return _map[opts.key]++;
  };
})(), {key: 'default'});



createType('Guid', function() {
  /**
   *	xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx, where each x is replaced with a random hexadecimal digit from 0 to f,
   *	and y is replaced with a random hexadecimal digit from 8 to b.
   */
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
    return v.toString(16);
  });
});



createType('ObjectId', function() {
  return Types.String({pools: '0123456789abcdef', length: 24}).result();
});