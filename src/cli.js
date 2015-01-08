/**
 * Usage:
 *  jim your_jim_string
 *
 */
var JIM = require('./jim'),
  fs = require('fs');

require('./type/user');

var content = fs.readFileSync('./src/example/my.jim');



content = JIM.parseContent(content.toString());

var result = JIM.exec(content);

console.log(result);
