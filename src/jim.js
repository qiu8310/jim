var JIM = require('./lib/core');


// 先加载 Process，Type 中会调用 Process
require('./process/Base');


// 包含预定义的一些类型
require('./type/Base');
require('./type/User');




module.exports = JIM;