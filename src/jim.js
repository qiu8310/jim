var JIM = require('./core.js'),
  _ = require('lodash');

var cap = function(str) { return str.charAt(0).toUpperCase() + str.substr(1); };
var registerTypes = function(cfg) {
  _.each(cfg.type, function(fn, key) {
    var aliases = _.map([].concat(cfg.alias[key] || []), cap);
    JIM.createType(cap(key), aliases, fn, cfg.opt[key] || {});
  })
};


// 先加载 filters
require('./filters/basic.js');



// 包含预定义的一些类型
registerTypes(require('./types/basic.js'));
registerTypes(require('./types/text.js'));





// var result = JIM.exec('@Word(en).repeat(10).join(" ")');
// console.log(result, typeof result);


module.exports = JIM;